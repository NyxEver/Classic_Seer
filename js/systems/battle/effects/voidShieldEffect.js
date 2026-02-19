/** 虚空护盾效果处理器（完全吸收伤害） */
const VoidShieldEffectHandler = {
    type: 'voidShield',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applyVoidShield !== 'function') {
            return;
        }

        const effect = context.effect || {};
        const duration = Math.max(1, Math.floor(effect.duration || 1));
        context.runtime.applyVoidShield(context.manager, context.actorSide, {
            duration,
            requiresFirstStrike: !!effect.requiresFirstStrike
        });

        context.manager.log(`${context.attacker.getDisplayName()} 进入虚无护盾状态！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.actorSide,
            duration,
            requiresFirstStrike: !!effect.requiresFirstStrike
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('voidShield', VoidShieldEffectHandler);
}
