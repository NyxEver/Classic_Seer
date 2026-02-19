/** 固定持续伤害（DOT）效果处理器 */
const DotFixedDamageEffectHandler = {
    type: 'dotFixedDamage',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applyDotFixedDamage !== 'function') {
            return;
        }

        const effect = context.effect || {};
        const duration = Math.max(1, Math.floor(effect.duration || 1));
        const amount = Math.max(0, Math.floor(effect.amount || 0));
        if (amount <= 0) {
            return;
        }

        context.runtime.applyDotFixedDamage(context.manager, context.targetSide, {
            duration,
            amount,
            sourceSide: context.actorSide
        });
        context.manager.log(`${context.defender.getDisplayName()} 被附加持续伤害效果！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.targetSide,
            duration,
            amount
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('dotFixedDamage', DotFixedDamageEffectHandler);
}
