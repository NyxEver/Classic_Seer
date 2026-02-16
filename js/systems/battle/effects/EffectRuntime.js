/**
 * BattleEffectRuntime - battle-scoped runtime state for timed effects.
 * Uses manager.playerEffects/enemyEffects as side containers.
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

function cloneTimed(payload, duration) {
    return {
        ...payload,
        remainingTurns: Math.max(1, Math.floor(duration || 1))
    };
}

const BattleEffectRuntime = {
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

    getSideState(manager, side) {
        this.ensure(manager);
        return side === 'player' ? manager.playerEffects : manager.enemyEffects;
    },

    getOppositeSide(side) {
        return side === 'player' ? 'enemy' : 'player';
    },

    getElfBySide(manager, side) {
        return side === 'player' ? manager.playerElf : manager.enemyElf;
    },

    setTimedEffect(manager, side, slot, payload, duration) {
        const state = this.getSideState(manager, side);
        state[slot] = cloneTimed(payload || {}, duration);
        return state[slot];
    },

    getTimedEffect(manager, side, slot) {
        const state = this.getSideState(manager, side);
        const value = state[slot];
        if (!value || !Number.isFinite(value.remainingTurns) || value.remainingTurns <= 0) {
            return null;
        }
        return value;
    },

    clearTimedEffect(manager, side, slot) {
        const state = this.getSideState(manager, side);
        state[slot] = null;
    },

    setFieldEffect(manager, side, effectName, duration) {
        const state = this.getSideState(manager, side);
        if (!state.fieldEffects[effectName]) {
            state.fieldEffects[effectName] = cloneTimed({}, duration);
        } else {
            state.fieldEffects[effectName].remainingTurns = Math.max(1, Math.floor(duration || 1));
        }
        return state.fieldEffects[effectName];
    },

    hasFieldEffect(manager, side, effectName) {
        const state = this.getSideState(manager, side);
        const effect = state.fieldEffects[effectName];
        return !!(effect && effect.remainingTurns > 0);
    },

    hasWaterSport(manager, side) {
        return this.hasFieldEffect(manager, side, 'waterSport');
    },

    hasMist(manager, side) {
        return this.hasFieldEffect(manager, side, 'mist');
    },

    applyProtect(manager, side, duration) {
        return this.setTimedEffect(manager, side, 'protect', {}, duration || 1);
    },

    consumeProtect(manager, side) {
        const effect = this.getTimedEffect(manager, side, 'protect');
        if (!effect) {
            return false;
        }
        this.clearTimedEffect(manager, side, 'protect');
        return true;
    },

    applyVoidShield(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'voidShield', {
            requiresFirstStrike: !!payload.requiresFirstStrike
        }, payload.duration || 1);
    },

    applySkillLifeSteadyRegen(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'skillLifeSteadyRegen', {
            amount: Math.max(0, Math.floor(payload.amount || 0))
        }, payload.duration || 1);
    },

    applyStatusSkillImmune(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'statusSkillImmune', {}, payload.duration || 1);
    },

    applyDotFixedDamage(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'dotFixedDamage', {
            amount: Math.max(0, Math.floor(payload.amount || 0)),
            sourceSide: payload.sourceSide || this.getOppositeSide(side)
        }, payload.duration || 1);
    },

    applyGuaranteedCrit(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'guaranteedCrit', {}, payload.duration || 1);
    },

    applyStatusSkillSeal(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'statusSkillSeal', {
            chance: Number.isFinite(payload.chance) ? payload.chance : 100,
            ppReduceOnFirstStrike: Math.max(0, Math.floor(payload.ppReduceOnFirstStrike || 0)),
            casterSide: payload.casterSide || this.getOppositeSide(side)
        }, payload.duration || 1);
    },

    applyNoHeal(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'noHeal', {}, payload.duration || 1);
    },

    applyParasitism(manager, side, payload) {
        return this.setTimedEffect(manager, side, 'parasitism', {
            healRatio: Number.isFinite(payload.healRatio) ? payload.healRatio : 0.125,
            sourceSide: payload.sourceSide || this.getOppositeSide(side)
        }, payload.duration || 5);
    },

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

    hasImmuneDamage(manager, side) {
        const state = this.getSideState(manager, side);
        return !!(state.compositeBuff.immuneDamage && state.compositeBuff.immuneDamage.remainingTurns > 0);
    },

    getDamageMultiplier(manager, side) {
        const state = this.getSideState(manager, side);
        if (state.compositeBuff.damageMultiplier && state.compositeBuff.damageMultiplier.remainingTurns > 0) {
            return Number(state.compositeBuff.damageMultiplier.multiplier) || 1;
        }
        return 1;
    },

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

    getStatusSkillSeal(manager, side) {
        return this.getTimedEffect(manager, side, 'statusSkillSeal');
    },

    isNoHeal(manager, side) {
        return !!this.getTimedEffect(manager, side, 'noHeal');
    },

    isStatusSkillImmune(manager, side) {
        return !!this.getTimedEffect(manager, side, 'statusSkillImmune');
    },

    isGuaranteedCrit(manager, side) {
        return !!this.getTimedEffect(manager, side, 'guaranteedCrit');
    },

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

    incrementGrowingFixedDamage(manager, casterElf, step, maxValue) {
        const runtime = this.ensure(manager);
        const key = this.getCasterKey(manager, casterElf);
        const current = runtime.transferCounterByCaster[key] || 0;
        const next = Math.min(Math.max(0, maxValue || 400), current + Math.max(1, step || 40));
        runtime.transferCounterByCaster[key] = next;
        return next;
    },

    resetRoundState(manager) {
        this.getSideState(manager, 'player').round.damageTaken = 0;
        this.getSideState(manager, 'enemy').round.damageTaken = 0;
    },

    recordDamageTaken(manager, side, amount) {
        const state = this.getSideState(manager, side);
        state.round.damageTaken += Math.max(0, Math.floor(amount || 0));
    },

    getDamageTaken(manager, side) {
        return this.getSideState(manager, side).round.damageTaken || 0;
    },

    recordTurnOrder(manager, order) {
        const runtime = this.ensure(manager);
        runtime.turnOrder = Array.isArray(order) ? order.slice() : [];
        runtime.actionIndexBySide = Object.create(null);
        runtime.turnOrder.forEach((side, index) => {
            runtime.actionIndexBySide[side] = index;
        });
    },

    isFirstActor(manager, side) {
        const runtime = this.ensure(manager);
        return runtime.actionIndexBySide[side] === 0;
    },

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
