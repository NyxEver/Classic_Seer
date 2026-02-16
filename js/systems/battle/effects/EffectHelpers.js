/**
 * BattleEffectHelpers - shared helper methods for effect handlers.
 */

const BattleEffectHelpers = {
    clampStage(value) {
        return Math.max(-6, Math.min(6, value));
    },

    rollChance(chance) {
        if (!Number.isFinite(chance) || chance >= 100) {
            return true;
        }
        if (chance <= 0) {
            return false;
        }
        return Math.random() * 100 < chance;
    },

    getElfBySide(context, side) {
        return side === 'player' ? context.manager.playerElf : context.manager.enemyElf;
    },

    getStagesBySide(context, side) {
        return side === 'player' ? context.manager.playerStatStages : context.manager.enemyStatStages;
    },

    getSideByTarget(context, target) {
        return target === 'self' ? context.actorSide : context.targetSide;
    },

    appendEvent(context, type, payload = {}) {
        if (!context || !context.manager || !context.result || typeof context.manager.appendTurnEvent !== 'function') {
            return null;
        }
        return context.manager.appendTurnEvent(context.result, type, payload);
    },

    appendEffectApplied(context, payload = {}) {
        return this.appendEvent(context, BattleManager.EVENT.EFFECT_APPLIED, {
            actor: context.actorSide,
            target: context.targetSide,
            effectType: context.effectType,
            ...payload
        });
    },

    appendEffectTick(context, payload = {}) {
        return this.appendEvent(context, BattleManager.EVENT.EFFECT_TICK, {
            effectType: context.effectType,
            ...payload
        });
    },

    appendEffectExpired(context, payload = {}) {
        return this.appendEvent(context, BattleManager.EVENT.EFFECT_EXPIRED, {
            effectType: context.effectType,
            ...payload
        });
    },

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

    syncElf(elf) {
        if (elf && typeof elf._syncInstanceData === 'function') {
            elf._syncInstanceData();
        }
    },

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

    countPositiveStages(stages) {
        if (!stages || typeof stages !== 'object') {
            return 0;
        }
        return Object.values(stages).reduce((sum, value) => {
            const numeric = Number(value) || 0;
            return numeric > 0 ? sum + numeric : sum;
        }, 0);
    },

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
