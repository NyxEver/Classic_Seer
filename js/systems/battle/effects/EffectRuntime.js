/**
 * BattleEffectRuntime - 战斗级效果运行时状态管理器
 *
 * 职责：
 * - 管理双方的限时效果（protect / voidShield / regen / seal 等）
 * - 管理场地效果（waterSport / mist）
 * - 管理复合增益（immuneDamage / guaranteedFirstStrike / damageMultiplier）
 * - 追踪本回合伤害、行动顺序与递增固伤计数
 * - 提供回合重置与战斗结束清理
 *
 * 使用 manager.playerEffects / manager.enemyEffects 作为双方容器。
 */

/**
 * 创建复合增益初始状态
 * @returns {Object} 含 immuneDamage / regen / guaranteedFirstStrike / damageMultiplier / enemyTypePriorityBonus 的空壳
 */
function createCompositeState() {
    return {
        immuneDamage: null,
        regen: null,
        guaranteedFirstStrike: null,
        damageMultiplier: null,
        enemyTypePriorityBonus: null
    };
}

/**
 * 创建单方效果容器初始状态
 * @returns {Object} 含场地效果、限时效果槽位与本回合统计的完整对象
 */
function createSideState() {
    return {
        __runtimeState: true,
        fieldEffects: {
            waterSport: null,
            mist: null
        },
        protect: null,
        voidShield: null,
        skillLifeSteadyRegen: null,
        statusSkillImmune: null,
        dotFixedDamage: null,
        guaranteedCrit: null,
        statusSkillSeal: null,
        noHeal: null,
        parasitism: null,
        compositeBuff: createCompositeState(),
        round: {
            damageTaken: 0
        }
    };
}

/**
 * 将 payload 包装为带倒计时的限时效果
 * @param {Object} payload - 效果数据
 * @param {number} duration - 持续回合数
 * @returns {Object} 含 remainingTurns 的效果对象
 */
function cloneTimed(payload, duration) {
    return {
        ...payload,
        remainingTurns: Math.max(1, Math.floor(duration || 1))
    };
}

const BattleEffectRuntime = {
    /**
     * 确保 manager 上的效果容器与 runtime 元数据已初始化
     * @param {BattleManager} manager - 战斗管理器实例
     * @returns {Object} manager._battleEffectRuntime 元数据对象
     */
    ensure(manager) {
        if (!manager.playerEffects || manager.playerEffects.__runtimeState !== true) {
            manager.playerEffects = createSideState();
        }
        if (!manager.enemyEffects || manager.enemyEffects.__runtimeState !== true) {
            manager.enemyEffects = createSideState();
        }

        if (!manager._battleEffectRuntime || typeof manager._battleEffectRuntime !== 'object') {
            manager._battleEffectRuntime = {
                turnOrder: [],
                actionIndexBySide: Object.create(null),
                transferCounterByCaster: Object.create(null),
                casterIdSeed: 0
            };
        }

        return manager._battleEffectRuntime;
    },

    /**
     * 获取指定方的效果容器
     * @param {BattleManager} manager - 战斗管理器实例
     * @param {string} side - 'player' 或 'enemy'
     * @returns {Object} 该方的 SideState 对象
     */
    getSideState(manager, side) {
        this.ensure(manager);
        return side === 'player' ? manager.playerEffects : manager.enemyEffects;
    },

    /**
     * 返回对方标识
     * @param {string} side - 'player' 或 'enemy'
     * @returns {string} 对方标识
     */
    getOppositeSide(side) {
        return side === 'player' ? 'enemy' : 'player';
    },

    /**
     * 获取指定方的精灵实例
     * @param {BattleManager} manager - 战斗管理器实例
     * @param {string} side - 'player' 或 'enemy'
     * @returns {Elf} 精灵实例
     */
    getElfBySide(manager, side) {
        return side === 'player' ? manager.playerElf : manager.enemyElf;
    },

    /**
     * 设置限时效果到指定槽位
     * @param {BattleManager} manager - 战斗管理器实例
     * @param {string} side - 'player' 或 'enemy'
     * @param {string} slot - 效果槽位名（如 'protect'、'voidShield'）
     * @param {Object} payload - 效果数据
     * @param {number} duration - 持续回合数
     * @returns {Object} 设置后的效果对象
     */
    setTimedEffect(manager, side, slot, payload, duration) {
        const state = this.getSideState(manager, side);
        state[slot] = cloneTimed(payload || {}, duration);
        return state[slot];
    },

    /**
     * 获取指定槽位的限时效果（已过期返回 null）
     * @param {BattleManager} manager - 战斗管理器实例
     * @param {string} side - 'player' 或 'enemy'
     * @param {string} slot - 效果槽位名
     * @returns {Object|null} 效果对象或 null
     */
    getTimedEffect(manager, side, slot) {
        const state = this.getSideState(manager, side);
        const value = state[slot];
        if (!value || !Number.isFinite(value.remainingTurns) || value.remainingTurns <= 0) {
            return null;
        }
        return value;
    },

    /**
     * 清除指定槽位的限时效果
     * @param {BattleManager} manager - 战斗管理器实例
     * @param {string} side - 'player' 或 'enemy'
     * @param {string} slot - 效果槽位名
     */
    clearTimedEffect(manager, side, slot) {
        const state = this.getSideState(manager, side);
        state[slot] = null;
    },

    /**
     * 设置场地效果（如已存在则刷新持续回合）
     * @param {BattleManager} manager - 战斗管理器实例
     * @param {string} side - 'player' 或 'enemy'
     * @param {string} effectName - 场地效果名（'waterSport' / 'mist'）
     * @param {number} duration - 持续回合数
     * @returns {Object} 场地效果对象
     */
    setFieldEffect(manager, side, effectName, duration) {
        const state = this.getSideState(manager, side);
        if (!state.fieldEffects[effectName]) {
            state.fieldEffects[effectName] = cloneTimed({}, duration);
        } else {
            state.fieldEffects[effectName].remainingTurns = Math.max(1, Math.floor(duration || 1));
        }
        return state.fieldEffects[effectName];
    },

    /**
     * 检查指定方是否存在某场地效果
     * @param {BattleManager} manager - 战斗管理器实例
     * @param {string} side - 'player' 或 'enemy'
     * @param {string} effectName - 场地效果名
     * @returns {boolean}
     */
    hasFieldEffect(manager, side, effectName) {
        const state = this.getSideState(manager, side);
        const effect = state.fieldEffects[effectName];
        return !!(effect && effect.remainingTurns > 0);
    },

    /**
     * 检查是否存在玩水效果（火系威力减半）
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean}
     */
    hasWaterSport(manager, side) {
        return this.hasFieldEffect(manager, side, 'waterSport');
    },

    /**
     * 检查是否存在白雾效果（阻止能力下降）
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean}
     */
    hasMist(manager, side) {
        return this.hasFieldEffect(manager, side, 'mist');
    },

    /**
     * 施加守护效果（单回合抵挡攻击）
     * @param {BattleManager} manager
     * @param {string} side
     * @param {number} [duration=1] - 持续回合数
     * @returns {Object} 效果对象
     */
    applyProtect(manager, side, duration) {
        return this.setTimedEffect(manager, side, 'protect', {}, duration || 1);
    },

    /**
     * 消耗守护效果（抵挡一次攻击后移除）
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean} 是否成功消耗（false 表示无守护可消耗）
     */
    consumeProtect(manager, side) {
        const effect = this.getTimedEffect(manager, side, 'protect');
        if (!effect) {
            return false;
        }
        this.clearTimedEffect(manager, side, 'protect');
        return true;
    },

    /**
     * 施加虚无护盾（可配置是否要求先手才生效）
     * @param {BattleManager} manager
     * @param {string} side
     * @param {Object} payload - { requiresFirstStrike: boolean, duration: number }
     * @returns {Object} 效果对象
     */
    applyVoidShield(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'voidShield', {
            requiresFirstStrike: !!payload.requiresFirstStrike
        }, payload.duration || 1);
    },

    /**
     * 施加技能恢复效果（每回合固定回血）
     * @param {BattleManager} manager
     * @param {string} side
     * @param {Object} payload - { amount: number, duration: number }
     * @returns {Object} 效果对象
     */
    applySkillLifeSteadyRegen(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'skillLifeSteadyRegen', {
            amount: Math.max(0, Math.floor(payload.amount || 0))
        }, payload.duration || 1);
    },

    /**
     * 施加状态技免疫（免疫对方状态类技能）
     * @param {BattleManager} manager
     * @param {string} side
     * @param {Object} payload - { duration: number }
     * @returns {Object} 效果对象
     */
    applyStatusSkillImmune(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'statusSkillImmune', {}, payload.duration || 1);
    },

    /**
     * 施加固定伤害 DOT（每回合结算固定伤害）
     * @param {BattleManager} manager
     * @param {string} side - 受 DOT 影响的一方
     * @param {Object} payload - { amount: number, sourceSide?: string, duration: number }
     * @returns {Object} 效果对象
     */
    applyDotFixedDamage(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'dotFixedDamage', {
            amount: Math.max(0, Math.floor(payload.amount || 0)),
            sourceSide: payload.sourceSide || this.getOppositeSide(side)
        }, payload.duration || 1);
    },

    /**
     * 施加必暴击效果
     * @param {BattleManager} manager
     * @param {string} side
     * @param {Object} payload - { duration: number }
     * @returns {Object} 效果对象
     */
    applyGuaranteedCrit(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'guaranteedCrit', {}, payload.duration || 1);
    },

    /**
     * 施加状态技封印（一定概率封印对手状态技并在先手时扣除 PP）
     * @param {BattleManager} manager
     * @param {string} side - 被封印的一方
     * @param {Object} payload - { chance: number, ppReduceOnFirstStrike: number, casterSide?: string, duration: number }
     * @returns {Object} 效果对象
     */
    applyStatusSkillSeal(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'statusSkillSeal', {
            chance: Number.isFinite(payload.chance) ? payload.chance : 100,
            ppReduceOnFirstStrike: Math.max(0, Math.floor(payload.ppReduceOnFirstStrike || 0)),
            casterSide: payload.casterSide || this.getOppositeSide(side)
        }, payload.duration || 1);
    },

    /**
     * 施加禁疗效果（阻止 HP 回复）
     * @param {BattleManager} manager
     * @param {string} side
     * @param {Object} payload - { duration: number }
     * @returns {Object} 效果对象
     */
    applyNoHeal(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'noHeal', {}, payload.duration || 1);
    },

    /**
     * 施加寄生效果（每回合按比例吸取 HP 回复施法方）
     * @param {BattleManager} manager
     * @param {string} side - 被寄生的一方
     * @param {Object} payload - { healRatio?: number, sourceSide?: string, duration?: number }
     * @returns {Object} 效果对象
     */
    applyParasitism(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'parasitism', {
            healRatio: Number.isFinite(payload.healRatio) ? payload.healRatio : 0.125,
            sourceSide: payload.sourceSide || this.getOppositeSide(side)
        }, payload.duration || 5);
    },

    /**
     * 施加复合增益（可同时包含免伤、回血、必先手、伤害倍率、属性优先级加成）
     * @param {BattleManager} manager
     * @param {string} side
     * @param {Object} payload - 复合增益配置
     * @param {number} [payload.immuneDamageDuration] - 免伤持续回合
     * @param {number} [payload.regenDuration] - 回血持续回合
     * @param {number} [payload.regenRatio] - 每回合回血比例
     * @param {number} [payload.guaranteedFirstStrikeDuration] - 必先手持续回合
     * @param {number} [payload.damageMultiplierDuration] - 伤害倍率持续回合
     * @param {number} [payload.damageMultiplier] - 伤害倍率值
     * @param {number|Object} [payload.enemyTypePriorityBonus] - 对特定属性精灵的优先级加成
     */
    applyCompositeBuff(manager, side, payload) {
        const state = this.getSideState(manager, side);
        if (payload.immuneDamageDuration) {
            state.compositeBuff.immuneDamage = cloneTimed({}, payload.immuneDamageDuration);
        }
        if (payload.regenDuration && Number.isFinite(payload.regenRatio)) {
            state.compositeBuff.regen = cloneTimed({ ratio: payload.regenRatio }, payload.regenDuration);
        }
        if (payload.guaranteedFirstStrikeDuration) {
            state.compositeBuff.guaranteedFirstStrike = cloneTimed({}, payload.guaranteedFirstStrikeDuration);
        }
        if (payload.damageMultiplierDuration && Number.isFinite(payload.damageMultiplier)) {
            state.compositeBuff.damageMultiplier = cloneTimed({ multiplier: payload.damageMultiplier }, payload.damageMultiplierDuration);
        }
        if (payload.enemyTypePriorityBonus !== undefined) {
            state.compositeBuff.enemyTypePriorityBonus = payload.enemyTypePriorityBonus;
        }
    },

    /**
     * 检查是否处于免伤状态
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean}
     */
    hasImmuneDamage(manager, side) {
        const state = this.getSideState(manager, side);
        return !!(state.compositeBuff.immuneDamage && state.compositeBuff.immuneDamage.remainingTurns > 0);
    },

    /**
     * 获取当前伤害倍率（无增益时返回 1）
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {number} 伤害倍率
     */
    getDamageMultiplier(manager, side) {
        const state = this.getSideState(manager, side);
        if (state.compositeBuff.damageMultiplier && state.compositeBuff.damageMultiplier.remainingTurns > 0) {
            return Number(state.compositeBuff.damageMultiplier.multiplier) || 1;
        }
        return 1;
    },

    /**
     * 获取行动优先级加成（含必先手 +1000 与属性克制加成）
     * @param {BattleManager} manager
     * @param {string} side
     * @param {Elf} opponentElf - 对方精灵（用于属性类型匹配）
     * @returns {number} 优先级加成总值
     */
    getPriorityBonus(manager, side, opponentElf) {
        const state = this.getSideState(manager, side);
        let bonus = 0;
        if (state.compositeBuff.guaranteedFirstStrike && state.compositeBuff.guaranteedFirstStrike.remainingTurns > 0) {
            bonus += 1000;
        }

        const typeBonus = state.compositeBuff.enemyTypePriorityBonus;
        if (typeof typeBonus === 'number') {
            bonus += typeBonus;
        } else if (
            typeBonus
            && typeof typeBonus === 'object'
            && Array.isArray(typeBonus.types)
            && opponentElf
            && typeBonus.types.includes(opponentElf.type)
        ) {
            bonus += Number(typeBonus.amount || 0);
        }
        return bonus;
    },

    /**
     * 获取状态技封印效果数据
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {Object|null} 封印效果或 null
     */
    getStatusSkillSeal(manager, side) {
        return this.getTimedEffect(manager, side, 'statusSkillSeal');
    },

    /**
     * 检查是否处于禁疗状态
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean}
     */
    isNoHeal(manager, side) {
        return !!this.getTimedEffect(manager, side, 'noHeal');
    },

    /**
     * 检查是否处于状态技免疫
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean}
     */
    isStatusSkillImmune(manager, side) {
        return !!this.getTimedEffect(manager, side, 'statusSkillImmune');
    },

    /**
     * 检查是否处于必暴击状态
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean}
     */
    isGuaranteedCrit(manager, side) {
        return !!this.getTimedEffect(manager, side, 'guaranteedCrit');
    },

    /**
     * 获取施法者的唯一键（用于按施法者追踪递增固伤计数）
     * 首次调用时为精灵实例分配自增 ID（战斗内唯一）
     * @param {BattleManager} manager
     * @param {Elf} casterElf - 施法者精灵
     * @returns {string} 施法者唯一键
     */
    getCasterKey(manager, casterElf) {
        const runtime = this.ensure(manager);
        if (!casterElf || typeof casterElf !== 'object') {
            return 'unknown';
        }
        if (!casterElf._battleEffectCasterKey) {
            runtime.casterIdSeed += 1;
            casterElf._battleEffectCasterKey = `caster_${runtime.casterIdSeed}`;
        }
        return casterElf._battleEffectCasterKey;
    },

    /**
     * 递增式固定伤害计数（每次施放增加 step，不超过 maxValue）
     * @param {BattleManager} manager
     * @param {Elf} casterElf - 施法者
     * @param {number} [step=40] - 每次递增量
     * @param {number} [maxValue=400] - 上限值
     * @returns {number} 递增后的当前值
     */
    incrementGrowingFixedDamage(manager, casterElf, step, maxValue) {
        const runtime = this.ensure(manager);
        const key = this.getCasterKey(manager, casterElf);
        const current = runtime.transferCounterByCaster[key] || 0;
        const next = Math.min(Math.max(0, maxValue || 400), current + Math.max(1, step || 40));
        runtime.transferCounterByCaster[key] = next;
        return next;
    },

    /**
     * 重置双方本回合伤害统计（每回合开始时调用）
     * @param {BattleManager} manager
     */
    resetRoundState(manager) {
        this.getSideState(manager, 'player').round.damageTaken = 0;
        this.getSideState(manager, 'enemy').round.damageTaken = 0;
    },

    /**
     * 记录本回合受到的伤害值
     * @param {BattleManager} manager
     * @param {string} side
     * @param {number} amount - 伤害量
     */
    recordDamageTaken(manager, side, amount) {
        const state = this.getSideState(manager, side);
        state.round.damageTaken += Math.max(0, Math.floor(amount || 0));
    },

    /**
     * 获取本回合已受到的伤害总量
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {number}
     */
    getDamageTaken(manager, side) {
        return this.getSideState(manager, side).round.damageTaken || 0;
    },

    /**
     * 记录本回合行动顺序（供 isFirstActor 查询）
     * @param {BattleManager} manager
     * @param {string[]} order - 行动顺序数组，如 ['player', 'enemy']
     */
    recordTurnOrder(manager, order) {
        const runtime = this.ensure(manager);
        runtime.turnOrder = Array.isArray(order) ? order.slice() : [];
        runtime.actionIndexBySide = Object.create(null);
        runtime.turnOrder.forEach((side, index) => {
            runtime.actionIndexBySide[side] = index;
        });
    },

    /**
     * 检查指定方是否为本回合先手
     * @param {BattleManager} manager
     * @param {string} side
     * @returns {boolean}
     */
    isFirstActor(manager, side) {
        const runtime = this.ensure(manager);
        return runtime.actionIndexBySide[side] === 0;
    },

    /**
     * 清除双方所有限时效果（不含持久状态异常，由 StatusEffect 管理）
     * @param {BattleManager} manager
     */
    clearRoundEffects(manager) {
        const clearSide = (side) => {
            const state = this.getSideState(manager, side);
            state.fieldEffects.waterSport = null;
            state.fieldEffects.mist = null;
            state.protect = null;
            state.voidShield = null;
            state.skillLifeSteadyRegen = null;
            state.statusSkillImmune = null;
            state.dotFixedDamage = null;
            state.guaranteedCrit = null;
            state.statusSkillSeal = null;
            state.parasitism = null;
            state.compositeBuff = createCompositeState();
        };

        clearSide('player');
        clearSide('enemy');
    },

    /**
     * 战斗结束时清理所有 runtime 状态
     * 重置双方效果容器、行动顺序与递增固伤计数
     * @param {BattleManager} manager
     */
    onBattleEnd(manager) {
        this.ensure(manager);
        manager.playerEffects = createSideState();
        manager.enemyEffects = createSideState();
        manager._battleEffectRuntime.turnOrder = [];
        manager._battleEffectRuntime.actionIndexBySide = Object.create(null);
        manager._battleEffectRuntime.transferCounterByCaster = Object.create(null);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleEffectRuntime', BattleEffectRuntime);
}

window.BattleEffectRuntime = BattleEffectRuntime;
