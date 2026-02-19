/** 回复体力效果处理器 */
const HealEffectHandler = {
    type: 'heal',

    onHit(context) {
        const effect = context.effect || {};
        const ratio = Number.isFinite(effect.healRatio) ? effect.healRatio : 0;
        if (ratio <= 0) {
            return;
        }

        const heal = Math.max(1, Math.floor(context.attacker.getMaxHp() * ratio));
        const restored = BattleEffectHelpers.applyHeal(context, context.actorSide, heal, 'effect_heal', {
            effectType: 'heal'
        });

        if (restored > 0) {
            context.manager.log(`${context.attacker.getDisplayName()} 恢复了 ${restored} 点体力！`);
            BattleEffectHelpers.appendEffectApplied(context, {
                side: context.actorSide,
                amount: restored
            });
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('heal', HealEffectHandler);
}
