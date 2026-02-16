/**
 * BattleActionExecutorSupport - shared helpers for BattleActionExecutor.
 */

const BATTLE_EFFECT_MISSING_WARN = new Set();

const BattleActionExecutorSupport = {
    warnMissingEffect(type) {
        if (!type || BATTLE_EFFECT_MISSING_WARN.has(type)) {
            return;
        }
        BATTLE_EFFECT_MISSING_WARN.add(type);
        console.error(`[BattleActionExecutor] 未注册 effect handler: ${type}`);
    },

    runEffectHook(manager, effectType, hookName, context) {
        if (!effectType) {
            return { handled: false, reason: 'no_effect' };
        }

        const registry = manager.getDependency('BattleEffectRegistry');
        if (!registry || typeof registry.run !== 'function') {
            console.error('[BattleActionExecutor] BattleEffectRegistry 未加载');
            return { handled: false, reason: 'missing_registry' };
        }

        if (!registry.has(effectType)) {
            this.warnMissingEffect(effectType);
            return { handled: false, reason: 'missing_handler' };
        }

        try {
            return registry.run(effectType, hookName, context);
        } catch (error) {
            console.error(`[BattleActionExecutor] effect=${effectType} hook=${hookName} 执行失败:`, error);
            return { handled: false, reason: 'hook_error', error };
        }
    },

    tryWakeByHit(manager, defender, defenderSide, result) {
        const statusEffect = manager.getDependency('StatusEffect');
        if (!statusEffect || typeof statusEffect.onHitTarget !== 'function') {
            return;
        }

        const wakeResult = statusEffect.onHitTarget(defender, manager.turnCount);
        if (wakeResult && wakeResult.removed) {
            const wakeStatusName = statusEffect.getStatusName(wakeResult.statusType);
            manager.log(`${defender.getDisplayName()} 受击后从${wakeStatusName}状态中恢复了！`);
            manager.appendTurnEvent(result, BattleManager.EVENT.STATUS_REMOVED, {
                target: defenderSide,
                status: wakeResult.statusType,
                reason: 'hit_wake'
            });
        }
    },

    shouldBlockByVoidShield(runtime, manager, actorSide, defenderSide, skill) {
        if (!runtime || !skill || !skill.category || typeof runtime.getTimedEffect !== 'function') {
            return false;
        }

        const shield = runtime.getTimedEffect(manager, defenderSide, 'voidShield');
        if (!shield) {
            return false;
        }

        if (shield.requiresFirstStrike && typeof runtime.isFirstActor === 'function') {
            if (!runtime.isFirstActor(manager, defenderSide)) {
                return false;
            }
        }

        return actorSide !== defenderSide;
    },

    applyStatusSkillSealPenalty(runtime, manager, actorSide, attacker, actionSkillId, result) {
        if (!runtime || typeof runtime.getStatusSkillSeal !== 'function') {
            return;
        }

        const seal = runtime.getStatusSkillSeal(manager, actorSide);
        if (!seal) {
            return;
        }

        if (seal.ppReduceOnFirstStrike <= 0 || !seal.casterSide) {
            return;
        }

        if (typeof runtime.isFirstActor === 'function' && !runtime.isFirstActor(manager, seal.casterSide)) {
            return;
        }

        const oldPP = attacker.skillPP[actionSkillId] || 0;
        const newPP = Math.max(0, oldPP - seal.ppReduceOnFirstStrike);
        if (newPP === oldPP) {
            return;
        }

        attacker.skillPP[actionSkillId] = newPP;
        if (typeof attacker._syncInstanceData === 'function') {
            attacker._syncInstanceData();
        }

        manager.appendTurnEvent(result, BattleManager.EVENT.PP_CHANGE, {
            target: actorSide,
            skillId: actionSkillId,
            oldPP,
            newPP,
            delta: newPP - oldPP,
            reason: 'status_skill_seal'
        });
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleActionExecutorSupport', BattleActionExecutorSupport);
}

window.BattleActionExecutorSupport = BattleActionExecutorSupport;
