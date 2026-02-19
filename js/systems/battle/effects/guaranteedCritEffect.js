/** 必定暴击效果处理器 */
const GuaranteedCritEffectHandler = {
    type: 'guaranteedCrit',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applyGuaranteedCrit !== 'function') {
            return;
        }

        const duration = Math.max(1, Math.floor((context.effect && context.effect.duration) || 1));
        context.runtime.applyGuaranteedCrit(context.manager, context.actorSide, {
            duration
        });
        context.manager.log(`${context.attacker.getDisplayName()} 进入了必定暴击状态！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.actorSide,
            duration
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('guaranteedCrit', GuaranteedCritEffectHandler);
}
