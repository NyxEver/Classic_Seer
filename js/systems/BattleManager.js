/**
 * BattleManager - 战斗门面管理器
 * 保留对外 API 与回合编排，将细节委托给 battle/manager 子模块。
 *
 * 职责：
 * - 持有双方精灵、属性阶段、效果容器等战斗核心状态
 * - 提供回合协议（创建/追加事件/终结）的门面入口
 * - 编排 executeTurn() 主流程：提交行动 → 解析 → 执行 → 后处理
 * - 委托子模块：BattleTurnProtocol / BattleActionResolver / BattleActionExecutor / BattleOutcomeFlow
 */

/**
 * 从 AppContext 或 window 获取依赖
 * @param {string} name - 依赖名称
 * @returns {*} 依赖对象，找不到时返回 null
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

/**
 * 强制获取依赖，缺失时抛错
 * @param {string} name - 依赖名称
 * @returns {*} 依赖对象
 * @throws {Error} 依赖不存在时抛出
 */
function requireBattleManagerModule(name) {
    const module = getBattleManagerDependency(name);
    if (!module) {
        throw new Error(`[BattleManager] Missing module: ${name}`);
    }
    return module;
}

class BattleManager {
    /** 回合阶段枚举 */
    static PHASE = {
        PLAYER_CHOOSE: 'PLAYER_CHOOSE',
        EXECUTE_TURN: 'EXECUTE_TURN',
        CHECK_RESULT: 'CHECK_RESULT',
        BATTLE_END: 'BATTLE_END'
    };

    /** 玩家行动类型枚举 */
    static ACTION = {
        SKILL: 'skill',
        ITEM: 'item_use',
        SWITCH: 'switch',
        ESCAPE: 'escape',
        CATCH: 'catch_attempt'
    };

    /** 回合事件类型枚举，用于统一回合结果协议 */
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

    /**
     * 构造战斗管理器实例
     * @param {Object} config - 战斗配置
     * @param {Elf} config.playerElf - 玩家当前出战精灵
     * @param {Elf} config.enemyElf - 敌方精灵
     * @param {string} [config.battleType='wild'] - 战斗类型（wild / trainer）
     * @param {boolean} [config.canEscape=true] - 是否允许逃跑
     * @param {boolean} [config.canCatch=true] - 是否允许捕捉（仅 wild 有效）
     * @param {Function} [config.onMessage] - 战斗日志回调
     * @param {Function} [config.onBattleEnd] - 战斗结束回调
     */
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

        /** 玩家属性阶段增减值（-6 ~ +6） */
        this.playerStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };
        /** 敌方属性阶段增减值（-6 ~ +6） */
        this.enemyStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };

        /** 玩家效果容器，由 BattleEffectRuntime 管理 */
        this.playerEffects = {};
        /** 敌方效果容器，由 BattleEffectRuntime 管理 */
        this.enemyEffects = {};

        console.log('[BattleManager] 战斗初始化:', {
            player: this.playerElf.getDisplayName(),
            enemy: this.enemyElf.getDisplayName(),
            type: this.battleType
        });
    }

    /**
     * 获取依赖（Context 优先，window 回退）
     * @param {string} name - 依赖名称
     * @returns {*} 依赖对象或 null
     */
    getDependency(name) {
        return getBattleManagerDependency(name);
    }

    /**
     * 获取当前回合阶段
     * @returns {string} PHASE 枚举值
     */
    getPhase() {
        return this.turnPhase;
    }

    /**
     * 设置回合阶段并输出日志
     * @param {string} phase - PHASE 枚举值
     */
    setPhase(phase) {
        console.log(`[BattleManager] 阶段切换: ${this.turnPhase} -> ${phase}`);
        this.turnPhase = phase;
    }

    /**
     * 写入战斗日志并触发消息回调
     * @param {string} message - 日志内容
     */
    log(message) {
        this.battleLog.push(message);
        this.onMessage(message);
    }

    /**
     * 设置玩家本回合行动
     * @param {string} action - 行动类型原始值（会被归一化）
     * @param {Object} [data={}] - 附加数据（如 skillId / itemId）
     */
    setPlayerAction(action, data = {}) {
        const normalizedType = this.normalizeActionType(action);
        this.playerAction = { type: normalizedType, ...data };
        console.log('[BattleManager] 玩家行动:', this.playerAction);
    }

    /**
     * 将行动类型原始值归一化为 ACTION 枚举
     * @param {string} action - 原始行动字符串
     * @returns {string} 归一化后的 ACTION 枚举值
     */
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

    /**
     * 深拷贝行动对象（委托 BattleTurnProtocol）
     * @param {Object} action - 行动对象
     * @returns {Object} 拷贝后的行动对象
     */
    cloneAction(action) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.cloneAction(action);
    }

    /**
     * 创建空的回合结果对象（委托 BattleTurnProtocol）
     * @returns {Object} 包含 protocolVersion / turn / events / outcome 的结果壳
     */
    createTurnResult() {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.createTurnResult(this);
    }

    /**
     * 向回合结果追加一个事件
     * @param {Object} result - 回合结果对象
     * @param {string} type - EVENT 枚举值
     * @param {Object} [payload={}] - 事件附加数据
     * @returns {Object} 追加的事件对象
     */
    appendTurnEvent(result, type, payload = {}) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.appendTurnEvent(this, result, type, payload);
    }

    /**
     * 获取回合结果中指定类型的最后一个事件
     * @param {Object} result - 回合结果对象
     * @param {string} type - EVENT 枚举值
     * @returns {Object|undefined} 事件对象或 undefined
     */
    getLastEvent(result, type) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.getLastEvent(result, type);
    }

    /**
     * 终结回合结果：回填 outcome 兼容字段
     * @param {Object} result - 回合结果对象
     * @returns {Object} 终结后的结果对象
     */
    finalizeTurnResult(result) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        return protocol.finalizeTurnResult(result);
    }

    /**
     * 终结回合结果并在战斗结束时清理 runtime
     * @param {Object} result - 回合结果对象
     * @returns {Object} 终结后的结果对象
     */
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

    /**
     * 在回合结果中标记行动被拒绝
     * @param {Object} result - 回合结果对象
     * @param {string} reason - 拒绝原因
     */
    markActionRejected(result, reason) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.markActionRejected(result, reason);
    }

    /**
     * 在回合结果中标记需要强制换宠
     * @param {Object} result - 回合结果对象
     * @param {string} [reason='need_switch'] - 换宠原因
     */
    markNeedSwitch(result, reason = 'need_switch') {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.markNeedSwitch(result, reason);
    }

    /**
     * 在回合结果中标记战斗结束
     * @param {Object} result - 回合结果对象
     * @param {Object} [payload={}] - 结束附加信息（winner / escaped / captured 等）
     */
    markBattleEnd(result, payload = {}) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.markBattleEnd(result, payload);
    }

    /**
     * 追加行动提交事件
     * @param {Object} result - 回合结果对象
     * @param {string} actor - 行动方（'player' / 'enemy'）
     * @param {Object} action - 行动对象
     */
    appendActionSubmittedEvent(result, actor, action) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.appendActionSubmittedEvent(this, result, actor, action);
    }

    /**
     * 追加战斗结束事件
     * @param {Object} result - 回合结果对象
     * @param {string} reason - 结束原因
     */
    appendBattleEndEvent(result, reason) {
        const protocol = requireBattleManagerModule('BattleTurnProtocol');
        protocol.appendBattleEndEvent(this, result, reason);
    }

    /**
     * 为敌方生成随机技能行动（优先选择有 PP 的技能）
     */
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

    /**
     * 获取精灵的有效速度（含属性阶段修正）
     * @param {Elf} elf - 精灵实例
     * @param {Object} statStages - 属性阶段对象
     * @returns {number} 有效速度值
     */
    getEffectiveSpeed(elf, statStages) {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return elf.getSpd();
        }
        return battleEffects.getEffectiveSpeed(elf, statStages);
    }

    /**
     * 获取属性阶段倍率
     * @param {number} stage - 阶段值（-6 ~ +6）
     * @returns {number} 倍率值
     */
    getStatMultiplier(stage) {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return 1;
        }
        return battleEffects.getStatMultiplier(stage);
    }

    /**
     * 判定双方行动顺序（含速度、优先级与 runtime 加成）
     * @returns {string[]} 行动顺序数组，如 ['player', 'enemy']
     */
    determineOrder() {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return ['player', 'enemy'];
        }
        return battleEffects.determineOrder(this);
    }

    /**
     * 获取行动类型的优先级数值
     * @param {Object} action - 行动对象
     * @returns {number} 优先级（数值越大越先行动）
     */
    getActionPriority(action) {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return 0;
        }
        return battleEffects.getActionPriority(action);
    }

    /**
     * 从行动对象中提取道具 ID（委托 BattleActionResolver）
     * @param {Object} action - 行动对象
     * @returns {number|null} 道具 ID
     */
    getActionItemId(action) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        return resolver.getActionItemId(this, action);
    }

    /**
     * 执行玩家使用道具（HP/PP 药剂消耗与结算，委托 BattleActionResolver）
     * @param {number} itemId - 道具 ID
     * @param {Object} result - 回合结果对象
     */
    applyPlayerItem(itemId, result) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        return resolver.applyPlayerItem(this, itemId, result);
    }

    /**
     * 准备敌方行动（在玩家行动解析后调用，委托 BattleActionResolver）
     * @param {Object} result - 回合结果对象
     */
    prepareEnemyAction(result) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        return resolver.prepareEnemyAction(this, result);
    }

    /**
     * 解析并执行主行动分支（技能/道具/捕捉/逃跑/换宠，委托 BattleActionResolver）
     * @param {Object} result - 回合结果对象
     */
    async resolvePrimaryAction(result) {
        const resolver = requireBattleManagerModule('BattleActionResolver');
        await resolver.resolvePrimaryAction(this, result);
    }

    /**
     * 执行单方行动（技能释放、PP 扣减、伤害计算、效果触发，委托 BattleActionExecutor）
     * @param {string} actor - 行动方（'player' / 'enemy'）
     * @param {Object} result - 回合结果对象
     */
    async executeAction(actor, result) {
        const executor = requireBattleManagerModule('BattleActionExecutor');
        return executor.executeAction(this, actor, result);
    }

    /**
     * 应用技能附带效果（属性增减、状态施加等，委托 BattleActionExecutor）
     * @param {Object} effect - 效果描述对象
     * @param {Elf} attacker - 攻击方精灵
     * @param {Elf} defender - 防御方精灵
     * @param {Object} attackerStages - 攻击方属性阶段
     * @param {Object} defenderStages - 防御方属性阶段
     * @param {Object} result - 回合结果对象
     */
    applySkillEffect(effect, attacker, defender, attackerStages, defenderStages, result) {
        const executor = requireBattleManagerModule('BattleActionExecutor');
        return executor.applySkillEffect(this, effect, attacker, defender, attackerStages, defenderStages, result);
    }

    /**
     * 尝试逃跑
     * 成功率基于双方速度差、累计逃跑次数，范围 5%~95%
     * @returns {boolean} 是否逃跑成功
     */
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

    /**
     * 检查战斗是否结束（委托 BattleEffects）
     * @returns {{ ended: boolean, winner: string|null, needSwitch: boolean }}
     */
    checkBattleEnd() {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return { ended: false, winner: null, needSwitch: false };
        }
        return battleEffects.checkBattleEnd(this);
    }

    /**
     * 计算击败敌方获得的经验奖励（委托 BattleEffects）
     * @returns {number} 经验值
     */
    calculateExpReward() {
        const battleEffects = this.getDependency('BattleEffects');
        if (!battleEffects) {
            return 0;
        }
        return battleEffects.calculateExpReward(this);
    }

    /**
     * 回合末结算异常状态与 runtime 效果
     * 处理顺序：StatusEffect.tickTurnEnd → BattleEffectRuntime.tickTurnEnd
     * @param {Object} result - 回合结果对象
     */
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

    /**
     * 回合后处理（胜负判定、经验/升级/进化待处理，委托 BattleOutcomeFlow）
     * @param {Object} result - 回合结果对象
     */
    async processAfterActions(result) {
        const outcomeFlow = requireBattleManagerModule('BattleOutcomeFlow');
        await outcomeFlow.processAfterActions(this, result);
    }

    /**
     * 处理胜利结算（经验分配、升级检查、任务事件，委托 BattleOutcomeFlow）
     * @param {Object} result - 回合结果对象
     */
    async handleVictory(result) {
        const outcomeFlow = requireBattleManagerModule('BattleOutcomeFlow');
        await outcomeFlow.handleVictory(this, result);
    }

    /**
     * 处理战败结算（委托 BattleOutcomeFlow）
     * @param {Object} result - 回合结果对象
     */
    async handleDefeat(result) {
        const outcomeFlow = requireBattleManagerModule('BattleOutcomeFlow');
        await outcomeFlow.handleDefeat(this, result);
    }

    /**
     * 执行一个完整回合
     * 流程：重置 runtime → 创建结果 → 提交行动 → 解析主行动 →
     *       后处理（胜负/经验/进化） → 终结结果并清理
     * @returns {Object} 终结后的回合结果对象（protocolVersion=2）
     */
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
