/** 复合增益效果处理器（免伤/回血/先手/伤害倍率） */
const CompositeBuffEffectHandler = {
    type: 'compositeBuff',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applyCompositeBuff !== 'function') {
            return;
        }

        context.runtime.applyCompositeBuff(context.manager, context.actorSide, context.effect || {});
        context.manager.log(`${context.attacker.getDisplayName()} 获得了复合强化效果！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.actorSide
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('compositeBuff', CompositeBuffEffectHandler);
}
