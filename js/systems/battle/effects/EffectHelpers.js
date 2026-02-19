/**
 * BattleEffectHelpers - 效果处理器共用辅助方法集合
 *
 * 职责：
 * - 提供属性阶段夹紧、概率骰子等基础工具
 * - 提供统一的回合事件追加入口（effect_applied / effect_tick / effect_expired / hp_change / pp_change / stat_change）
 * - 提供安全的伤害 / 回血 / 属性增减操作（含日志输出与事件写入）
 * - 被所有 effects/ 目录下的处理器文件依赖
 */

const BattleEffectHelpers = {
    /**
     * 将属性阶段值夹紧到 [-6, +6] 范围
     * @param {number} value - 原始阶段值
     * @returns {number} 夹紧后的值
     */
    clampStage(value) {
        return Math.max(-6, Math.min(6, value));
    },

    /**
     * 按百分比概率骰子判定
     * @param {number} chance - 成功概率（0~100）
     * @returns {boolean} 是否命中（chance >= 100 必定返回 true，<= 0 必定返回 false）
     */
    rollChance(chance) {
        if (!Number.isFinite(chance) || chance >= 100) {
            return true;
        }
        if (chance <= 0) {
            return false;
        }
        return Math.random() * 100 < chance;
    },

    /**
     * 从效果上下文中获取指定方精灵
     * @param {Object} context - 效果执行上下文
     * @param {string} side - 'player' 或 'enemy'
     * @returns {Elf} 精灵实例
     */
    getElfBySide(context, side) {
        return side === 'player' ? context.manager.playerElf : context.manager.enemyElf;
    },

    /**
     * 从效果上下文中获取指定方属性阶段对象
     * @param {Object} context - 效果执行上下文
     * @param {string} side - 'player' 或 'enemy'
     * @returns {Object} 属性阶段对象（atk / def / spAtk / spDef / spd / accuracy）
     */
    getStagesBySide(context, side) {
        return side === 'player' ? context.manager.playerStatStages : context.manager.enemyStatStages;
    },

    /**
     * 将效果目标标识（'self' / 'opponent'）解析为实际方（'player' / 'enemy'）
     * @param {Object} context - 效果执行上下文
     * @param {string} target - 'self' 或 'opponent'
     * @returns {string} 实际方标识
     */
    getSideByTarget(context, target) {
        return target === 'self' ? context.actorSide : context.targetSide;
    },

    /**
     * 向回合结果追加一个事件（含空值防御）
     * @param {Object} context - 效果执行上下文
     * @param {string} type - 事件类型（BattleManager.EVENT 枚举）
     * @param {Object} [payload={}] - 事件附加数据
     * @returns {Object|null} 追加的事件对象或 null
     */
    appendEvent(context, type, payload = {}) {
        if (!context || !context.manager || !context.result || typeof context.manager.appendTurnEvent !== 'function') {
            return null;
        }
        return context.manager.appendTurnEvent(context.result, type, payload);
    },

    /**
     * 追加效果施加事件（自动填充 actor / target / effectType）
     * @param {Object} context - 效果执行上下文
     * @param {Object} [payload={}] - 额外数据
     * @returns {Object|null} 事件对象
     */
    appendEffectApplied(context, payload = {}) {
        return this.appendEvent(context, BattleManager.EVENT.EFFECT_APPLIED, {
            actor: context.actorSide,
            target: context.targetSide,
            effectType: context.effectType,
            ...payload
        });
    },

    /**
     * 追加效果回合结算事件
     * @param {Object} context - 效果执行上下文
     * @param {Object} [payload={}] - 额外数据
     * @returns {Object|null} 事件对象
     */
    appendEffectTick(context, payload = {}) {
        return this.appendEvent(context, BattleManager.EVENT.EFFECT_TICK, {
            effectType: context.effectType,
            ...payload
        });
    },

    /**
     * 追加效果过期移除事件
     * @param {Object} context - 效果执行上下文
     * @param {Object} [payload={}] - 额外数据
     * @returns {Object|null} 事件对象
     */
    appendEffectExpired(context, payload = {}) {
        return this.appendEvent(context, BattleManager.EVENT.EFFECT_EXPIRED, {
            effectType: context.effectType,
            ...payload
        });
    },

    /**
     * 追加 HP 变化事件
     * @param {Object} context - 效果执行上下文
     * @param {string} side - 受影响方
     * @param {number} oldHp - 变化前 HP
     * @param {number} newHp - 变化后 HP
     * @param {string} reason - 变化原因
     * @param {Object} [extra={}] - 额外数据
     */
    appendHpChange(context, side, oldHp, newHp, reason, extra = {}) {
        this.appendEvent(context, BattleManager.EVENT.HP_CHANGE, {
            target: side,
            oldHp,
            newHp,
            delta: newHp - oldHp,
            reason,
            ...extra
        });
    },

    /**
     * 追加 PP 变化事件
     * @param {Object} context - 效果执行上下文
     * @param {string} side - 受影响方
     * @param {number} skillId - 技能 ID
     * @param {number} oldPP - 变化前 PP
     * @param {number} newPP - 变化后 PP
     * @param {string} reason - 变化原因
     * @param {Object} [extra={}] - 额外数据
     */
    appendPpChange(context, side, skillId, oldPP, newPP, reason, extra = {}) {
        this.appendEvent(context, BattleManager.EVENT.PP_CHANGE, {
            target: side,
            skillId,
            oldPP,
            newPP,
            delta: newPP - oldPP,
            reason,
            ...extra
        });
    },

    /**
     * 同步精灵实例数据到持久化层
     * @param {Elf} elf - 精灵实例
     */
    syncElf(elf) {
        if (elf && typeof elf._syncInstanceData === 'function') {
            elf._syncInstanceData();
        }
    },

    /**
     * 对指定方施加伤害（含夹紧、同步、事件写入与 runtime 伤害记录）
     * @param {Object} context - 效果执行上下文
     * @param {string} side - 受伤方
     * @param {number} amount - 伤害量（会向下取整并夹紧到 >= 0）
     * @param {string} reason - 伤害原因（如 'effect_damage' / 'dot'）
     * @param {Object} [extra={}] - 额外事件数据
     * @returns {number} 实际造成的伤害量
     */
    applyDamage(context, side, amount, reason, extra = {}) {
        const elf = this.getElfBySide(context, side);
        if (!elf || elf.isFainted()) {
            return 0;
        }

        const normalized = Math.max(0, Math.floor(amount || 0));
        if (normalized <= 0) {
            return 0;
        }

        const oldHp = elf.currentHp;
        elf.currentHp = Math.max(0, oldHp - normalized);
        this.syncElf(elf);

        const actual = oldHp - elf.currentHp;
        if (actual > 0) {
            this.appendHpChange(context, side, oldHp, elf.currentHp, reason, extra);
            if (context.runtime && typeof context.runtime.recordDamageTaken === 'function') {
                context.runtime.recordDamageTaken(context.manager, side, actual);
            }
        }

        return actual;
    },

    /**
     * 对指定方施加回血（含禁疗检查、夹紧、同步与事件写入）
     * @param {Object} context - 效果执行上下文
     * @param {string} side - 回血方
     * @param {number} amount - 回血量
     * @param {string} reason - 回血原因（如 'effect_heal' / 'regen'）
     * @param {Object} [extra={}] - 额外事件数据
     * @returns {number} 实际回复的 HP 量（禁疗时返回 0）
     */
    applyHeal(context, side, amount, reason, extra = {}) {
        const elf = this.getElfBySide(context, side);
        if (!elf || elf.isFainted()) {
            return 0;
        }

        const normalized = Math.max(0, Math.floor(amount || 0));
        if (normalized <= 0) {
            return 0;
        }

        if (context.runtime && typeof context.runtime.isNoHeal === 'function' && context.runtime.isNoHeal(context.manager, side)) {
            context.manager.log(`${elf.getDisplayName()} 处于禁疗状态，无法恢复体力！`);
            return 0;
        }

        const oldHp = elf.currentHp;
        const maxHp = elf.getMaxHp();
        elf.currentHp = Math.min(maxHp, oldHp + normalized);
        this.syncElf(elf);

        const actual = elf.currentHp - oldHp;
        if (actual > 0) {
            this.appendHpChange(context, side, oldHp, elf.currentHp, reason, extra);
        }
        return actual;
    },

    /**
     * 统计属性阶段中正值阶段的总和（用于"对方增益越多威力越高"类条件技能）
     * @param {Object} stages - 属性阶段对象
     * @returns {number} 正值阶段总和
     */
    countPositiveStages(stages) {
        if (!stages || typeof stages !== 'object') {
            return 0;
        }
        return Object.values(stages).reduce((sum, value) => {
            const numeric = Number(value) || 0;
            return numeric > 0 ? sum + numeric : sum;
        }, 0);
    },

    /**
     * 修改指定方的属性阶段并写入事件与日志
     * 包含白雾（mist）防降阶检查
     * @param {Object} context - 效果执行上下文
     * @param {string} side - 受影响方
     * @param {string} stat - 属性名（atk / def / spAtk / spDef / spd / accuracy）
     * @param {number} delta - 变化量（正=提升，负=降低）
     * @param {Object} [options={}] - 选项
     * @param {boolean} [options.respectMist=false] - 是否遵守白雾防降阶
     * @returns {{ applied: boolean, blocked: boolean, oldValue: number, newValue: number, appliedDelta?: number }}
     */
    applyStatChange(context, side, stat, delta, options = {}) {
        const stages = this.getStagesBySide(context, side);
        if (!stages || !Object.prototype.hasOwnProperty.call(stages, stat)) {
            return { applied: false, blocked: false, oldValue: 0, newValue: 0 };
        }

        if (
            delta < 0
            && options.respectMist
            && context.runtime
            && typeof context.runtime.hasMist === 'function'
            && context.runtime.hasMist(context.manager, side)
        ) {
            const elf = this.getElfBySide(context, side);
            context.manager.log(`${elf.getDisplayName()} 被白雾保护，能力不会下降！`);
            return { applied: false, blocked: true, oldValue: stages[stat], newValue: stages[stat] };
        }

        const oldValue = stages[stat];
        const nextValue = this.clampStage(oldValue + delta);
        if (nextValue === oldValue) {
            return { applied: false, blocked: false, oldValue, newValue: nextValue };
        }

        stages[stat] = nextValue;
        const appliedDelta = nextValue - oldValue;
        this.appendEvent(context, BattleManager.EVENT.STAT_CHANGE, {
            target: side,
            stat,
            stages: appliedDelta
        });

        const statNames = {
            atk: '攻击',
            def: '防御',
            spAtk: '特攻',
            spDef: '特防',
            spd: '速度',
            accuracy: '命中'
        };
        const label = statNames[stat] || stat;
        const actor = this.getElfBySide(context, side);
        const upDown = appliedDelta > 0 ? '提高' : '降低';
        const amount = Math.abs(appliedDelta);
        context.manager.log(`${actor.getDisplayName()} 的${label}${upDown}了${amount}级！`);

        return { applied: true, blocked: false, oldValue, newValue: nextValue, appliedDelta };
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleEffectHelpers', BattleEffectHelpers);
}

window.BattleEffectHelpers = BattleEffectHelpers;
