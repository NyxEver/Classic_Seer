/**
 * BattleManager - 战斗门面管理器
 * 保留对外 API 与回合编排，将细节委托给 battle/manager 子模块。
 */

function getBattleManagerDependency(name) {
    if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
        const dep = AppContext.get(name, null);
        if (dep) {
            return dep;
        }
    }
    if (typeof window !== 'undefined') {
        return window[name] || null;
    }
    return null;
}

function requireBattleManagerModule(name) {
    const module = getBattleManagerDependency(name);
    if (!module) {
        throw new Error(`[BattleManager] Missing module: ${name}`);
    }
    return module;
}

class BattleManager {
    static PHASE = {
        PLAYER_CHOOSE: 'PLAYER_CHOOSE',
        EXECUTE_TURN: 'EXECUTE_TURN',
        CHECK_RESULT: 'CHECK_RESULT',
        BATTLE_END: 'BATTLE_END'
    };

    static ACTION = {
        SKILL: 'skill',
        ITEM: 'item_use',
        SWITCH: 'switch',
        ESCAPE: 'escape',
        CATCH: 'catch_attempt'
    };

    static EVENT = {
        TURN_START: 'turn_start',
        ACTION_SUBMITTED: 'action_submitted',
        SKILL_CAST: 'skill_cast',
        HIT: 'hit',
        MISS: 'miss',
        HP_CHANGE: 'hp_change',
        PP_CHANGE: 'pp_change',
        ITEM_USED: 'item_used',
        CATCH_RESULT: 'catch_result',
        ESCAPE_RESULT: 'escape_result',
        SWITCH_DONE: 'switch_done',
        BATTLE_END: 'battle_end',
        STAT_CHANGE: 'stat_change',
        STATUS_APPLIED: 'status_applied',
        STATUS_REMOVED: 'status_removed',
        STATUS_DAMAGE: 'status_damage',
        ACTION_BLOCKED: 'action_blocked',
        EFFECT_APPLIED: 'effect_applied',
        EFFECT_TICK: 'effect_tick',
        EFFECT_EXPIRED: 'effect_expired'
    };

    constructor(config) {
        this.playerElf = config.playerElf;
        this.enemyElf = config.enemyElf;
        this.battleType = config.battleType || 'wild';
        this.canEscape = config.canEscape !== false;
        this.canCatch = config.canCatch !== false && this.battleType === 'wild';

        this.onMessage = config.onMessage || ((msg) => console.log(`[Battle] ${msg}`));
        this.onBattleEnd = config.onBattleEnd || (() => { });

        this.turnPhase = BattleManager.PHASE.PLAYER_CHOOSE;
        this.battleLog = [];
        this.turnCount = 0;
        this.escapeAttempts = 0;

        this.playerAction = null;
        this.enemyAction = null;

        this.playerStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };
        this.enemyStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };

        this.playerEffects = {};
        this.enemyEffects = {};

        console.log('[BattleManager] 战斗初始化:', {
            player: this.playerElf.getDisplayName(),
            enemy: this.enemyElf.getDisplayName(),
            type: this.battleType
        });
    }

    getDependency(name) {
        return getBattleManagerDependency(name);
    }

    getPhase() {
        return this.turnPhase;
    }

    setPhase(phase) {
        console.log(`[BattleManager] 阶段切换: ${this.turnPhase} -> ${phase}`);
        this.turnPhase = phase;
    }

    log(message) {
        this.battleLog.push(message);
        this.onMessage(message);
    }

    setPlayerAction(action, data = {}) {
        const normalizedType = this.normalizeActionType(action);
        this.playerAction = { type: normalizedType, ...data };
        console.log('[BattleManager] 玩家行动:', this.playerAction);
    }

    normalizeActionType(action) {
        switch (action) {
            case 'skill':
                return BattleManager.ACTION.SKILL;
            case 'item':
            case 'item_use':
                return BattleManager.ACTION.ITEM;
            case 'catch':
            case 'catch_attempt':
                return BattleManager.ACTION.CATCH;
            case 'switch':
                return BattleManager.ACTION.SWITCH;
            case 'escape':
                return BattleManager.ACTION.ESCAPE;
            default:
                return action;
        }
    }

    cloneAction(action) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.cloneAction(action);
    }

    createTurnResult() {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.createTurnResult(this);
    }

    appendTurnEvent(result, type, payload = {}) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.appendTurnEvent(this, result, type, payload);
    }

    getLastEvent(result, type) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.getLastEvent(result, type);
    }

    finalizeTurnResult(result) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.finalizeTurnResult(result);
    }

    finalizeAndCleanup(result) {
        const finalized = this.finalizeTurnResult(result);
        if (finalized && finalized.outcome && finalized.outcome.battleEnded) {
            const runtime = this.getDependency('BattleEffectRuntime');
            if (runtime && typeof runtime.onBattleEnd === 'function') {
                runtime.onBattleEnd(this);
            }
        }
        return finalized;
    }

    markActionRejected(result, reason) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.markActionRejected(result, reason);
    }

    markNeedSwitch(result, reason = 'need_switch') {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.markNeedSwitch(result, reason);
    }

    markBattleEnd(result, payload = {}) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.markBattleEnd(result, payload);
    }

    appendActionSubmittedEvent(result, actor, action) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.appendActionSubmittedEvent(this, result, actor, action);
    }

    appendBattleEndEvent(result, reason) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.appendBattleEndEvent(this, result, reason);
    }

    generateEnemyAction() {
        const skills = this.enemyElf.getSkillDetails();
        const availableSkills = skills.filter((skill) => skill.currentPP > 0);

        if (availableSkills.length === 0) {
            this.enemyAction = { type: BattleManager.ACTION.SKILL, skillId: skills[0].id };
        } else {
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            this.enemyAction = { type: BattleManager.ACTION.SKILL, skillId: randomSkill.id };
        }

        console.log('[BattleManager] 敌方行动:', this.enemyAction);
    }

    getEffectiveSpeed(elf, statStages) {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return elf.getSpd();
        }
        return battleEffects.getEffectiveSpeed(elf, statStages);
    }

    getStatMultiplier(stage) {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return 1;
        }
        return battleEffects.getStatMultiplier(stage);
    }

    determineOrder() {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return ['player', 'enemy'];
        }
        return battleEffects.determineOrder(this);
    }

    getActionPriority(action) {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return 0;
        }
        return battleEffects.getActionPriority(action);
    }

    getActionItemId(action) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        return resolver.getActionItemId(this, action);
    }

    applyPlayerItem(itemId, result) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        return resolver.applyPlayerItem(this, itemId, result);
    }

    prepareEnemyAction(result) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        return resolver.prepareEnemyAction(this, result);
    }

    async resolvePrimaryAction(result) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        await resolver.resolvePrimaryAction(this, result);
    }

    async executeAction(actor, result) {
        const executor = requireBattleManagerModule('BattleActionExecutor');
        return executor.executeAction(this, actor, result);
    }

    applySkillEffect(effect, attacker, defender, attackerStages, defenderStages, result) {
        const executor = requireBattleManagerModule('BattleActionExecutor');
        return executor.applySkillEffect(this, effect, attacker, defender, attackerStages, defenderStages, result);
    }

    attemptEscape() {
        if (this.battleType === 'trainer' || !this.canEscape) {
            this.log('无法从训练家战斗中逃跑！');
            return false;
        }

        this.escapeAttempts++;

        let escapeChance = 50;

        const playerSpeed = this.getEffectiveSpeed(this.playerElf, this.playerStatStages);
        const enemySpeed = this.getEffectiveSpeed(this.enemyElf, this.enemyStatStages);

        if (playerSpeed > enemySpeed) {
            escapeChance += 20;
        } else if (playerSpeed < enemySpeed) {
            escapeChance -= 20;
        }

        escapeChance += (this.escapeAttempts - 1) * 10;
        escapeChance = Math.min(95, Math.max(5, escapeChance));

        const roll = Math.random() * 100;
        const success = roll < escapeChance;

        console.log(`[BattleManager] 逃跑检定: ${roll.toFixed(1)} < ${escapeChance}? ${success}`);
        return success;
    }

    checkBattleEnd() {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return { ended: false, winner: null, needSwitch: false };
        }
        return battleEffects.checkBattleEnd(this);
    }

    calculateExpReward() {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return 0;
        }
        return battleEffects.calculateExpReward(this);
    }

    applyEndTurnStatusEffects(result) {
        const statusEffect = this.getDependency('StatusEffect');
        if (!statusEffect || typeof statusEffect.tickTurnEnd !== 'function') {
            const runtimeOnly = this.getDependency('BattleEffectRuntime');
            if (runtimeOnly && typeof runtimeOnly.tickTurnEnd === 'function') {
                runtimeOnly.tickTurnEnd(this, result);
            }
            return;
        }

        const targets = [
            { side: 'player', elf: this.playerElf },
            { side: 'enemy', elf: this.enemyElf }
        ];

        targets.forEach((entry) => {
            if (!entry.elf || entry.elf.isFainted()) {
                return;
            }

            const tickResult = statusEffect.tickTurnEnd(entry.elf);

            (tickResult.damages || []).forEach((damageInfo) => {
                this.log(`${entry.elf.getDisplayName()} 受到${statusEffect.getStatusName(damageInfo.statusType)}影响，损失了 ${damageInfo.damage} 点体力！`);
                this.appendTurnEvent(result, BattleManager.EVENT.STATUS_DAMAGE, {
                    target: entry.side,
                    status: damageInfo.statusType,
                    damage: damageInfo.damage,
                    oldHp: damageInfo.oldHp,
                    newHp: damageInfo.newHp
                });
                this.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                    target: entry.side,
                    oldHp: damageInfo.oldHp,
                    newHp: damageInfo.newHp,
                    delta: damageInfo.newHp - damageInfo.oldHp,
                    reason: 'status_damage',
                    status: damageInfo.statusType
                });
            });

            (tickResult.endedStatuses || []).forEach((statusType) => {
                this.log(`${entry.elf.getDisplayName()} 的${statusEffect.getStatusName(statusType)}状态解除了。`);
                this.appendTurnEvent(result, BattleManager.EVENT.STATUS_REMOVED, {
                    target: entry.side,
                    status: statusType,
                    reason: 'duration_end'
                });
            });
        });

        const runtime = this.getDependency('BattleEffectRuntime');
        if (runtime && typeof runtime.tickTurnEnd === 'function') {
            runtime.tickTurnEnd(this, result);
        }
    }

    async processAfterActions(result) {
        const outcomeFlow = requireBattleManagerModule('BattleOutcomeFlow');
        await outcomeFlow.processAfterActions(this, result);
    }

    async handleVictory(result) {
        const outcomeFlow = requireBattleManagerModule('BattleOutcomeFlow');
        await outcomeFlow.handleVictory(this, result);
    }

    async handleDefeat(result) {
        const outcomeFlow = requireBattleManagerModule('BattleOutcomeFlow');
        await outcomeFlow.handleDefeat(this, result);
    }

    async executeTurn() {
        this.turnCount++;
        this.setPhase(BattleManager.PHASE.EXECUTE_TURN);

        const runtime = this.getDependency('BattleEffectRuntime');
        if (runtime && typeof runtime.resetRoundState === 'function') {
            runtime.resetRoundState(this);
        }

        const result = this.createTurnResult();
        this.appendTurnEvent(result, BattleManager.EVENT.TURN_START, {
            phase: this.turnPhase,
            playerHp: this.playerElf.currentHp,
            enemyHp: this.enemyElf.currentHp
        });

        try {
            if (!this.playerAction || !this.playerAction.type) {
                this.log('本回合未提交有效行动。');
                this.markActionRejected(result, 'invalid_player_action');
                this.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
                return this.finalizeAndCleanup(result);
            }

            this.appendActionSubmittedEvent(result, 'player', this.playerAction);
            await this.resolvePrimaryAction(result);

            if (result.outcome.actionRejected) {
                this.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
                return this.finalizeAndCleanup(result);
            }

            if (!result.outcome.battleEnded) {
                await this.processAfterActions(result);
            }

            return this.finalizeAndCleanup(result);
        } finally {
            this.playerAction = null;
            this.enemyAction = null;
        }
    }
}

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleManager', BattleManager);
}

window.BattleManager = BattleManager;
