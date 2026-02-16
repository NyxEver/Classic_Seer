const FixedDamageBonusEffectHandler = {
    type: 'fixedDamageBonus',

    afterDamage(context) {
        const effect = context.effect || {};
        const amount = Math.max(0, Math.floor(effect.amount || 0));
        if (amount <= 0 || context.defender.isFainted()) {
            return;
        }

        const dealt = BattleEffectHelpers.applyDamage(context, context.targetSide, amount, 'effect_damage', {
            effectType: 'fixedDamageBonus'
        });
        if (dealt > 0) {
            context.manager.log(`${context.defender.getDisplayName()} 额外受到了 ${dealt} 点固定伤害！`);
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('fixedDamageBonus', FixedDamageBonusEffectHandler);
}
