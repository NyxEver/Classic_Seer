const ReduceTargetHpByMaxRatioEffectHandler = {
    type: 'reduceTargetHpByMaxRatio',

    afterDamage(context) {
        const effect = context.effect || {};
        const ratio = Number.isFinite(effect.ratio) ? effect.ratio : 0;
        if (ratio <= 0 || context.defender.isFainted()) {
            return;
        }

        const extraDamage = Math.max(0, Math.floor(context.defender.getMaxHp() * ratio));
        if (extraDamage <= 0) {
            return;
        }

        const dealt = BattleEffectHelpers.applyDamage(context, context.targetSide, extraDamage, 'effect_damage', {
            effectType: 'reduceTargetHpByMaxRatio'
        });
        if (dealt > 0) {
            context.manager.log(`${context.defender.getDisplayName()} 额外损失了 ${dealt} 点体力！`);
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('reduceTargetHpByMaxRatio', ReduceTargetHpByMaxRatioEffectHandler);
}
