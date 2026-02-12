/**
 * BattleManager - 战斗管理器
 * 管理战斗流程、回合执行和结果处理
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

class BattleManager {
    // 回合阶段常量
    static PHASE = {
        PLAYER_CHOOSE: 'PLAYER_CHOOSE',
        EXECUTE_TURN: 'EXECUTE_TURN',
        CHECK_RESULT: 'CHECK_RESULT',
        BATTLE_END: 'BATTLE_END'
    };

    // 行动类型
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
        STAT_CHANGE: 'stat_change'
    };

    /**
     * 构造函数
     * @param {Object} config - 战斗配置
     * @param {Elf} config.playerElf - 玩家精灵
     * @param {Elf} config.enemyElf - 敌方精灵
     * @param {string} config.battleType - 'wild' 或 'trainer'
     * @param {boolean} config.canEscape - 是否可逃跑
     * @param {boolean} config.canCatch - 是否可捕捉
     * @param {Function} config.onMessage - 消息回调
     * @param {Function} config.onBattleEnd - 战斗结束回调
     */
    constructor(config) {
        this.playerElf = config.playerElf;
        this.enemyElf = config.enemyElf;
        this.battleType = config.battleType || 'wild';
        this.canEscape = config.canEscape !== false;
        this.canCatch = config.canCatch !== false && this.battleType === 'wild';

        // 回调函数
        this.onMessage = config.onMessage || ((msg) => console.log(`[Battle] ${msg}`));
        this.onBattleEnd = config.onBattleEnd || (() => { });

        // 状态
        this.turnPhase = BattleManager.PHASE.PLAYER_CHOOSE;
        this.battleLog = [];
        this.turnCount = 0;
        this.escapeAttempts = 0;

        // 当前回合行动
        this.playerAction = null;
        this.enemyAction = null;

        // 属性等级变化 (-6 到 +6)
        this.playerStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };
        this.enemyStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };

        // 特殊状态（如玩水效果）
        this.playerEffects = {};
        this.enemyEffects = {};

        console.log('[BattleManager] 战斗初始化:', {
            player: this.playerElf.getDisplayName(),
            enemy: this.enemyElf.getDisplayName(),
            type: this.battleType
        });
    }

    /**
     * 获取当前阶段
     * @returns {string}
     */
    getPhase() {
        return this.turnPhase;
    }

    /**
     * 切换阶段
     * @param {string} phase
     */
    setPhase(phase) {
        console.log(`[BattleManager] 阶段切换: ${this.turnPhase} -> ${phase}`);
        this.turnPhase = phase;
    }

    /**
     * 添加战斗日志
     * @param {string} message
     */
    log(message) {
        this.battleLog.push(message);
        this.onMessage(message);
    }

    /**
     * 设置玩家行动
     * @param {string} action - 行动类型
     * @param {Object} data - 行动数据
     */
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
        if (!action || typeof action !== 'object') {
            return null;
        }
        return { ...action };
    }

    createTurnResult() {
        return {
            protocolVersion: 2,
            turn: this.turnCount,
            playerAction: this.cloneAction(this.playerAction),
            enemyAction: null,
            events: [],
            outcome: {
                status: 'continue',
                battleEnded: false,
                winner: null,
                needSwitch: false,
                escaped: false,
                captured: false,
                actionRejected: false,
                reason: null
            }
        };
    }

    appendTurnEvent(result, type, payload = {}) {
        const event = {
            type,
            turn: this.turnCount,
            index: result.events.length,
            ...payload
        };
        result.events.push(event);
        return event;
    }

    getLastEvent(result, type) {
        if (!result || !Array.isArray(result.events)) {
            return null;
        }
        for (let i = result.events.length - 1; i >= 0; i--) {
            if (result.events[i].type === type) {
                return result.events[i];
            }
        }
        return null;
    }

    finalizeTurnResult(result) {
        const outcome = result.outcome || {};

        result.battleEnded = outcome.battleEnded === true;
        result.winner = outcome.winner || null;
        result.needSwitch = outcome.needSwitch === true;
        result.escaped = outcome.escaped === true;
        result.captured = outcome.captured === true;
        result.actionRejected = outcome.actionRejected === true;

        const catchEvent = this.getLastEvent(result, BattleManager.EVENT.CATCH_RESULT);
        result.catchAttempt = !!catchEvent;
        result.catchResult = catchEvent ? (catchEvent.result || null) : null;

        const switchEvent = this.getLastEvent(result, BattleManager.EVENT.SWITCH_DONE);
        result.switched = !!switchEvent;

        return result;
    }

    markActionRejected(result, reason) {
        result.outcome.status = 'rejected';
        result.outcome.actionRejected = true;
        result.outcome.reason = reason || 'action_rejected';
    }

    markNeedSwitch(result, reason = 'need_switch') {
        result.outcome.status = 'need_switch';
        result.outcome.needSwitch = true;
        result.outcome.reason = reason;
    }

    markBattleEnd(result, payload = {}) {
        result.outcome.status = 'battle_end';
        result.outcome.battleEnded = true;
        if (payload.winner) {
            result.outcome.winner = payload.winner;
        }
        if (payload.reason) {
            result.outcome.reason = payload.reason;
        }
        if (payload.escaped) {
            result.outcome.escaped = true;
        }
        if (payload.captured) {
            result.outcome.captured = true;
        }
    }

    appendActionSubmittedEvent(result, actor, action) {
        this.appendTurnEvent(result, BattleManager.EVENT.ACTION_SUBMITTED, {
            actor,
            actionType: action ? action.type : null,
            action: this.cloneAction(action)
        });
    }

    prepareEnemyAction(result) {
        this.generateEnemyAction();
        result.enemyAction = this.cloneAction(this.enemyAction);
        this.appendActionSubmittedEvent(result, 'enemy', this.enemyAction);
    }

    appendBattleEndEvent(result, reason) {
        this.appendTurnEvent(result, BattleManager.EVENT.BATTLE_END, {
            winner: result.outcome.winner,
            escaped: result.outcome.escaped,
            captured: result.outcome.captured,
            reason: reason || result.outcome.reason || null
        });
    }

    /**
     * AI 生成敌方行动（随机选择技能）
     */
    generateEnemyAction() {
        const skills = this.enemyElf.getSkillDetails();
        const availableSkills = skills.filter(s => s.currentPP > 0);

        if (availableSkills.length === 0) {
            // 没有可用技能，使用挣扎（暂时用第一个技能）
            this.enemyAction = { type: BattleManager.ACTION.SKILL, skillId: skills[0].id };
        } else {
            // 随机选择一个技能
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            this.enemyAction = { type: BattleManager.ACTION.SKILL, skillId: randomSkill.id };
        }

        console.log('[BattleManager] 敌方行动:', this.enemyAction);
    }

    /**
     * 获取实际速度（考虑等级变化）
     * @param {Elf} elf
     * @param {Object} statStages
     * @returns {number}
     */
    getEffectiveSpeed(elf, statStages) {
        const battleEffects = getBattleManagerDependency('BattleEffects');
        if (!battleEffects) {
            return elf.getSpd();
        }
        return battleEffects.getEffectiveSpeed(elf, statStages);
    }

    /**
     * 获取属性等级对应的倍率
     * @param {number} stage - -6 到 +6
     * @returns {number}
     */
    getStatMultiplier(stage) {
        const battleEffects = getBattleManagerDependency('BattleEffects');
        if (!battleEffects) {
            return 1;
        }
        return battleEffects.getStatMultiplier(stage);
    }

    /**
     * 确定行动顺序
     * @returns {Array} - ['player', 'enemy'] 或 ['enemy', 'player']
     */
    determineOrder() {
        const battleEffects = getBattleManagerDependency('BattleEffects');
        if (!battleEffects) {
            return ['player', 'enemy'];
        }
        return battleEffects.determineOrder(this);
    }

    /**
     * 获取行动优先级
     * @param {Object} action
     * @returns {number}
     */
    getActionPriority(action) {
        const battleEffects = getBattleManagerDependency('BattleEffects');
        if (!battleEffects) {
            return 0;
        }
        return battleEffects.getActionPriority(action);
    }

    getActionItemId(action) {
        if (!action || typeof action !== 'object') {
            return null;
        }

        if (typeof action.itemId === 'number') {
            return action.itemId;
        }

        if (action.capsule && typeof action.capsule.id === 'number') {
            return action.capsule.id;
        }

        return null;
    }

    applyPlayerItem(itemId, result) {
        const itemBag = getBattleManagerDependency('ItemBag');
        const dataLoader = getBattleManagerDependency('DataLoader');
        const playerData = getBattleManagerDependency('PlayerData');

        if (!itemBag || !dataLoader || !playerData) {
            this.log('道具系统未就绪，无法使用道具。');
            return { applied: false, consumesTurn: false };
        }

        const itemData = dataLoader.getItem(itemId);
        if (!itemData) {
            this.log('该道具不存在，无法使用。');
            return { applied: false, consumesTurn: false };
        }

        if (!itemBag.has(itemId, 1)) {
            this.log(`${itemData.name} 数量不足！`);
            return { applied: false, consumesTurn: false };
        }

        if (itemData.type === 'capsule') {
            this.log('捕捉胶囊请使用捕捉指令。');
            return { applied: false, consumesTurn: false };
        }

        if (itemData.type === 'hpPotion') {
            const healAmount = itemData.effect ? (itemData.effect.hpRestore || 20) : 20;
            const maxHp = this.playerElf.getMaxHp();
            const oldHp = this.playerElf.currentHp;
            this.playerElf.currentHp = Math.min(maxHp, oldHp + healAmount);
            const healed = this.playerElf.currentHp - oldHp;

            if (healed <= 0) {
                this.log(`${this.playerElf.getDisplayName()} 的 HP 已满！`);
                return { applied: false, consumesTurn: false };
            }

            itemBag.remove(itemId, 1);
            this.playerElf._syncInstanceData();
            playerData.saveToStorage();

            this.log(`使用了 ${itemData.name}，恢复了 ${healed} HP！`);
            this.appendTurnEvent(result, BattleManager.EVENT.ITEM_USED, {
                actor: 'player',
                itemId,
                itemType: itemData.type,
                hpRecovered: healed
            });
            this.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                target: 'player',
                oldHp,
                newHp: this.playerElf.currentHp,
                delta: this.playerElf.currentHp - oldHp,
                reason: 'item_use',
                itemId
            });
            return { applied: true, consumesTurn: true };
        }

        if (itemData.type === 'ppPotion') {
            const restoreAmount = itemData.effect ? (itemData.effect.ppRestore || 5) : 5;
            const skills = this.playerElf.getSkillDetails();
            let restored = false;
            const restoredSkills = [];

            skills.forEach((skill) => {
                const currentPp = this.playerElf.skillPP[skill.id] || 0;
                if (currentPp < skill.pp) {
                    const nextPp = Math.min(skill.pp, currentPp + restoreAmount);
                    this.playerElf.skillPP[skill.id] = nextPp;
                    restoredSkills.push({
                        skillId: skill.id,
                        oldPP: currentPp,
                        newPP: nextPp,
                        delta: nextPp - currentPp
                    });
                    restored = true;
                }
            });

            if (!restored) {
                this.log('所有技能 PP 已满！');
                return { applied: false, consumesTurn: false };
            }

            itemBag.remove(itemId, 1);
            this.playerElf._syncInstanceData();
            playerData.saveToStorage();

            this.log(`使用了 ${itemData.name}，恢复了技能 PP！`);
            this.appendTurnEvent(result, BattleManager.EVENT.ITEM_USED, {
                actor: 'player',
                itemId,
                itemType: itemData.type,
                ppRestored: restoreAmount,
                restoredSkills
            });
            restoredSkills.forEach((entry) => {
                this.appendTurnEvent(result, BattleManager.EVENT.PP_CHANGE, {
                    target: 'player',
                    skillId: entry.skillId,
                    oldPP: entry.oldPP,
                    newPP: entry.newPP,
                    delta: entry.delta,
                    reason: 'item_use',
                    itemId
                });
            });
            return { applied: true, consumesTurn: true };
        }

        this.log('该道具当前无法在战斗中使用。');
        return { applied: false, consumesTurn: false };
    }

    /**
     * 执行回合
     * @returns {Promise<Object>} - 回合结果
     */
    async executeTurn() {
        this.turnCount++;
        this.setPhase(BattleManager.PHASE.EXECUTE_TURN);

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
                return this.finalizeTurnResult(result);
            }

            this.appendActionSubmittedEvent(result, 'player', this.playerAction);

            if (this.playerAction.type === BattleManager.ACTION.CATCH) {
                if (!this.canCatch) {
                    this.log('无法在此战斗中捕捉！');
                    this.markActionRejected(result, 'catch_not_allowed');
                } else {
                    const itemBag = getBattleManagerDependency('ItemBag');
                    const catchSystem = getBattleManagerDependency('CatchSystem');
                    const playerData = getBattleManagerDependency('PlayerData');
                    const dataLoader = getBattleManagerDependency('DataLoader');
                    const capsuleItemId = this.getActionItemId(this.playerAction);

                    if (!itemBag || !catchSystem || !playerData || !dataLoader) {
                        this.log('捕捉系统未就绪，无法使用胶囊。');
                        this.markActionRejected(result, 'catch_system_unavailable');
                    } else if (!capsuleItemId) {
                        this.log('未选择有效的捕捉胶囊。');
                        this.markActionRejected(result, 'invalid_capsule');
                    } else {
                        const capsule = dataLoader.getItem(capsuleItemId);
                        if (!capsule || capsule.type !== 'capsule') {
                            this.log('该道具不是可用的捕捉胶囊。');
                            this.markActionRejected(result, 'invalid_capsule_type');
                        } else if (!itemBag.has(capsuleItemId, 1)) {
                            this.log(`${capsule.name} 数量不足！`);
                            this.markActionRejected(result, 'capsule_insufficient');
                        } else {
                            itemBag.remove(capsuleItemId, 1);
                            this.log(`使用了 ${capsule.name}！`);
                            this.appendTurnEvent(result, BattleManager.EVENT.ITEM_USED, {
                                actor: 'player',
                                itemId: capsuleItemId,
                                itemType: 'capsule'
                            });

                            const catchResult = catchSystem.attemptCatch(this.enemyElf, capsule);
                            this.appendTurnEvent(result, BattleManager.EVENT.CATCH_RESULT, {
                                actor: 'player',
                                itemId: capsuleItemId,
                                success: !!catchResult.success,
                                result: catchResult
                            });

                            if (catchResult.success) {
                                catchSystem.addCapturedElf(this.enemyElf);
                                this.log(`成功捕捉了 ${this.enemyElf.getDisplayName()}！`);
                                this.markBattleEnd(result, {
                                    winner: 'player',
                                    reason: 'catch_success',
                                    captured: true
                                });
                                this.appendBattleEndEvent(result, 'catch_success');
                                this.setPhase(BattleManager.PHASE.BATTLE_END);
                                playerData.saveToStorage();
                            } else {
                                this.prepareEnemyAction(result);
                                await this.executeAction('enemy', result);
                            }
                        }
                    }
                }
            } else if (this.playerAction.type === BattleManager.ACTION.SWITCH) {
                this.appendTurnEvent(result, BattleManager.EVENT.SWITCH_DONE, {
                    actor: 'player',
                    elfIndex: this.playerAction.elfIndex
                });
                this.prepareEnemyAction(result);
                await this.executeAction('enemy', result);
            } else if (this.playerAction.type === BattleManager.ACTION.ITEM) {
                const itemId = this.getActionItemId(this.playerAction);
                const itemOutcome = this.applyPlayerItem(itemId, result);

                if (itemOutcome.applied && itemOutcome.consumesTurn) {
                    this.prepareEnemyAction(result);
                    await this.executeAction('enemy', result);
                } else {
                    this.markActionRejected(result, 'item_use_rejected');
                }
            } else if (this.playerAction.type === BattleManager.ACTION.ESCAPE) {
                const escaped = this.attemptEscape();
                this.appendTurnEvent(result, BattleManager.EVENT.ESCAPE_RESULT, {
                    actor: 'player',
                    success: escaped
                });

                if (escaped) {
                    this.log('成功逃跑了！');
                    this.markBattleEnd(result, {
                        reason: 'escape_success',
                        escaped: true
                    });
                    this.appendBattleEndEvent(result, 'escape_success');
                    this.setPhase(BattleManager.PHASE.BATTLE_END);
                } else {
                    this.log('逃跑失败！');
                    this.prepareEnemyAction(result);
                    await this.executeAction('enemy', result);
                }
            } else if (this.playerAction.type === BattleManager.ACTION.SKILL) {
                this.prepareEnemyAction(result);

                const order = this.determineOrder();
                console.log('[BattleManager] 行动顺序:', order);

                for (const actor of order) {
                    const targetFainted = await this.executeAction(actor, result);
                    if (targetFainted) {
                        break;
                    }
                }
            } else {
                this.log('未知行动类型，回合取消。');
                this.markActionRejected(result, 'unknown_action_type');
            }

            if (result.outcome.actionRejected) {
                this.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
                return this.finalizeTurnResult(result);
            }

            if (!result.outcome.battleEnded) {
                this.setPhase(BattleManager.PHASE.CHECK_RESULT);
                const checkResult = this.checkBattleEnd();

                if (checkResult.ended) {
                    this.markBattleEnd(result, {
                        winner: checkResult.winner,
                        reason: 'faint'
                    });
                    this.appendBattleEndEvent(result, 'faint');
                    this.setPhase(BattleManager.PHASE.BATTLE_END);

                    if (checkResult.winner === 'player') {
                        await this.handleVictory(result);
                    } else {
                        await this.handleDefeat(result);
                    }
                } else if (checkResult.needSwitch) {
                    this.markNeedSwitch(result, 'player_fainted_need_switch');
                    this.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
                } else {
                    this.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
                }
            }

            return this.finalizeTurnResult(result);
        } finally {
            this.playerAction = null;
            this.enemyAction = null;
        }
    }

    /**
     * 执行单个行动
     * @param {string} actor - 'player' 或 'enemy'
     * @param {Object} result - 回合结果对象
     * @returns {boolean} - 是否导致目标倒下
     */
    async executeAction(actor, result) {
        const isPlayer = actor === 'player';
        const action = isPlayer ? this.playerAction : this.enemyAction;
        const attacker = isPlayer ? this.playerElf : this.enemyElf;
        const defender = isPlayer ? this.enemyElf : this.playerElf;
        const attackerStages = isPlayer ? this.playerStatStages : this.enemyStatStages;
        const defenderStages = isPlayer ? this.enemyStatStages : this.playerStatStages;

        if (action.type === BattleManager.ACTION.SKILL) {
            const dataLoader = getBattleManagerDependency('DataLoader');
            const damageCalculator = getBattleManagerDependency('DamageCalculator');
            if (!dataLoader || !damageCalculator) {
                console.error('[BattleManager] DataLoader/DamageCalculator 未加载，无法执行技能');
                return false;
            }

            const skill = dataLoader.getSkill(action.skillId);
            if (!skill) {
                console.error('[BattleManager] 技能不存在:', action.skillId);
                return false;
            }

            // 消耗 PP
            const oldPP = attacker.skillPP[action.skillId] || 0;
            attacker.useSkill(action.skillId);
            const newPP = attacker.skillPP[action.skillId] || 0;
            this.appendTurnEvent(result, BattleManager.EVENT.PP_CHANGE, {
                target: actor,
                skillId: action.skillId,
                oldPP,
                newPP,
                delta: newPP - oldPP,
                reason: 'skill_cast'
            });

            // 显示使用技能消息
            this.log(`${attacker.getDisplayName()} 使用了 ${skill.name}！`);

            // 记录技能施放事件（场景层据此播放分类动画）
            this.appendTurnEvent(result, BattleManager.EVENT.SKILL_CAST, {
                actor: actor,
                target: isPlayer ? 'enemy' : 'player',
                skillId: skill.id,
                skillName: skill.name,
                skillType: skill.type,
                skillCategory: skill.category || 'status'
            });

            // 命中检定
            const hit = damageCalculator.checkHit(skill, -defenderStages.accuracy);
            if (!hit) {
                this.log('但是没有命中...');
                this.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                    actor: actor,
                    target: isPlayer ? 'enemy' : 'player',
                    skillId: skill.id,
                    skillName: skill.name
                });
                return false;
            }

            // 伤害计算（如果是攻击技能）
            if (skill.power > 0) {
                const damageResult = damageCalculator.calculate(attacker, defender, skill);

                // 属性克制提示
                const effectText = damageCalculator.getEffectivenessText(damageResult.effectiveness);
                if (effectText) {
                    this.log(effectText);
                }

                // 暴击提示
                if (damageResult.isCritical) {
                    this.log('暴击！');
                }

                // 造成伤害
                const oldHp = defender.currentHp;
                const fainted = defender.takeDamage(damageResult.damage);
                this.log(`${defender.getDisplayName()} 受到了 ${damageResult.damage} 点伤害！`);

                this.appendTurnEvent(result, BattleManager.EVENT.HIT, {
                    actor: actor,
                    target: isPlayer ? 'enemy' : 'player',
                    skillId: skill.id,
                    skillName: skill.name,
                    damage: damageResult.damage,
                    critical: damageResult.isCritical,
                    effectiveness: damageResult.effectiveness,
                    targetFainted: fainted
                });
                this.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                    target: isPlayer ? 'enemy' : 'player',
                    oldHp,
                    newHp: defender.currentHp,
                    delta: defender.currentHp - oldHp,
                    reason: 'damage',
                    by: actor,
                    skillId: skill.id
                });

                if (fainted) {
                    this.log(`${defender.getDisplayName()} 倒下了！`);
                    return true;
                }
            }

            // 处理技能效果
            if (skill.effect) {
                this.applySkillEffect(skill.effect, attacker, defender, attackerStages, defenderStages, result);
            }
        }

        return false;
    }

    /**
     * 应用技能效果
     */
    applySkillEffect(effect, attacker, defender, attackerStages, defenderStages, result) {
        const battleEffects = getBattleManagerDependency('BattleEffects');
        if (!battleEffects) {
            return;
        }

        battleEffects.applySkillEffect(effect, {
            attacker,
            defender,
            attackerStages,
            defenderStages,
            result,
            appendEvent: (type, payload) => this.appendTurnEvent(result, type, payload),
            log: (message) => this.log(message)
        });
    }

    /**
     * 尝试逃跑
     * @returns {boolean} - 是否成功
     */
    attemptEscape() {
        // 训练家战斗不可逃跑
        if (this.battleType === 'trainer' || !this.canEscape) {
            this.log('无法从训练家战斗中逃跑！');
            return false;
        }

        this.escapeAttempts++;

        // 计算逃跑成功率
        let escapeChance = 50; // 基础 50%

        const playerSpeed = this.getEffectiveSpeed(this.playerElf, this.playerStatStages);
        const enemySpeed = this.getEffectiveSpeed(this.enemyElf, this.enemyStatStages);

        if (playerSpeed > enemySpeed) {
            escapeChance += 20;
        } else if (playerSpeed < enemySpeed) {
            escapeChance -= 20;
        }

        // 每次逃跑尝试增加成功率
        escapeChance += (this.escapeAttempts - 1) * 10;

        // 限制范围
        escapeChance = Math.min(95, Math.max(5, escapeChance));

        const roll = Math.random() * 100;
        const success = roll < escapeChance;

        console.log(`[BattleManager] 逃跑检定: ${roll.toFixed(1)} < ${escapeChance}? ${success}`);

        return success;
    }

    /**
     * 检查战斗是否结束
     * @returns {Object} - { ended, winner, needSwitch }
     */
    checkBattleEnd() {
        const battleEffects = getBattleManagerDependency('BattleEffects');
        if (!battleEffects) {
            return { ended: false, winner: null, needSwitch: false };
        }
        return battleEffects.checkBattleEnd(this);
    }

    /**
     * 计算经验奖励
     * @returns {number}
     */
    calculateExpReward() {
        const battleEffects = getBattleManagerDependency('BattleEffects');
        if (!battleEffects) {
            return 0;
        }
        return battleEffects.calculateExpReward(this);
    }

    /**
     * 处理胜利
     * @param {Object} result
     */
    async handleVictory(result) {
        this.log('战斗胜利！');

        // 计算经验
        const expReward = this.calculateExpReward();
        this.log(`${this.playerElf.getDisplayName()} 获得了 ${expReward} 经验值！`);

        // 添加经验并处理升级
        const levelUpResults = this.playerElf.addExp(expReward);

        result.expGained = expReward;
        result.levelUps = levelUpResults;

        // 显示升级信息并检查进化
        let canEvolve = false;
        let evolveTo = null;
        let pendingSkills = [];  // 收集所有待学习的技能

        for (const levelUp of levelUpResults) {
            this.log(`${this.playerElf.getDisplayName()} 升级到 ${levelUp.newLevel} 级！`);
            for (const skillId of levelUp.newSkills) {
                const dataLoader = getBattleManagerDependency('DataLoader');
                const skill = dataLoader ? dataLoader.getSkill(skillId) : null;
                if (skill) {
                    this.log(`${this.playerElf.getDisplayName()} 学会了 ${skill.name}！`);
                }
            }

            // 收集待学习的技能（技能槽已满时）
            if (levelUp.pendingSkill) {
                pendingSkills.push(levelUp.pendingSkill);
            }

            // 检查是否可以进化（使用最后一次升级的信息）
            if (levelUp.canEvolve) {
                canEvolve = true;
                evolveTo = levelUp.evolveTo;
            }
        }

        // 【重要】使用持久化的待学习技能列表，而不仅是本次升级的
        // 这包括之前通过 DevMode 升级时添加的待学习技能
        pendingSkills = this.playerElf.getPendingSkills();
        if (pendingSkills.length > 0) {
            console.log(`[BattleManager] 发现 ${pendingSkills.length} 个待学习技能: ${pendingSkills.join(', ')}`);
        }

        // 【重要】即使没有升级，也检查当前精灵是否已经可以进化
        // 这处理了精灵在之前升级时已满足进化条件但未进化的情况
        if (!canEvolve && this.playerElf.checkEvolution()) {
            canEvolve = true;
            evolveTo = this.playerElf.evolvesTo;
            console.log(`[BattleManager] 检测到精灵已满足进化条件: ${this.playerElf.getDisplayName()} → ID ${evolveTo}`);
        }

        // 获取努力值
        this.playerElf.gainEVFromDefeat(this.enemyElf);

        // 通过事件总线通知任务系统
        const gameEvents = getBattleManagerDependency('GameEvents');
        if (gameEvents) {
            gameEvents.emit(gameEvents.EVENTS.QUEST_PROGRESS, {
                type: 'defeat',
                targetId: this.enemyElf.id,
                value: 1,
                source: 'BattleManager.handleVictory'
            });
        } else {
            console.warn('[BattleManager] GameEvents 未加载，任务进度事件未发出');
        }

        // 保存游戏
        const playerData = getBattleManagerDependency('PlayerData');
        if (playerData) {
            playerData.saveToStorage();
        }

        // 调用结束回调（包含进化信息和待学习技能）
        this.onBattleEnd({
            victory: true,
            expGained: expReward,
            levelUps: levelUpResults,
            canEvolve: canEvolve,
            evolveTo: evolveTo,
            pendingSkills: pendingSkills,  // 新增：待学习技能列表
            playerElf: this.playerElf  // 传递精灵实例用于进化场景
        });
    }

    /**
     * 处理失败
     * @param {Object} result
     */
    async handleDefeat(result) {
        this.log('战斗失败...');
        this.log(`${this.playerElf.getDisplayName()} 已无法战斗。`);

        // 调用结束回调
        this.onBattleEnd({
            victory: false
        });
    }
}

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleManager', BattleManager);
}

// 导出为全局对象
window.BattleManager = BattleManager;
