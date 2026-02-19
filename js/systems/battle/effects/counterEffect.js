/** 反击效果处理器 */
const CounterEffectHandler = {
    type: 'counter',

    beforeDamage(context) {
        const effect = context.effect || {};
        if (!context.runtime || typeof context.runtime.getDamageTaken !== 'function') {
            context.damagePlan.cancelDamage = true;
            return;
        }

        const taken = context.runtime.getDamageTaken(context.manager, context.actorSide);
        if (!Number.isFinite(taken) || taken <= 0) {
            context.manager.log(`${context.attacker.getDisplayName()} 本回合未受到伤害，反制失败！`);
            context.damagePlan.cancelDamage = true;
            return;
        }

        const multiplier = Number.isFinite(effect.multiplier) ? effect.multiplier : 2;
        context.damagePlan.customDamage = Math.max(0, Math.floor(taken * multiplier));
        context.damagePlan.forceNeutralHit = true;
        context.manager.log(`${context.attacker.getDisplayName()} 发动反制，准备返还 ${context.damagePlan.customDamage} 点伤害！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.targetSide,
            reflectedDamage: context.damagePlan.customDamage
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('counter', CounterEffectHandler);
}
