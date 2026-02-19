/** 防护效果处理器（格挡攻击） */
const ProtectEffectHandler = {
    type: 'protect',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applyProtect !== 'function') {
            return;
        }

        const duration = Math.max(1, Math.floor((context.effect && context.effect.duration) || 1));
        context.runtime.applyProtect(context.manager, context.actorSide, duration);
        context.manager.log(`${context.attacker.getDisplayName()} 展开了防护！`);

        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.actorSide,
            duration
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('protect', ProtectEffectHandler);
}
