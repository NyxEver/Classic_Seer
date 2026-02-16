const RecoilEffectHandler = {
    type: 'recoil',

    afterDamage(context) {
        const effect = context.effect || {};
        if (!Number.isFinite(context.damageDealt) || context.damageDealt <= 0) {
            return;
        }

        const ratio = Number.isFinite(effect.recoilRatio) ? effect.recoilRatio : 0;
        const recoil = Math.max(0, Math.floor(context.damageDealt * ratio));
        if (recoil <= 0) {
            return;
        }

        const dealt = BattleEffectHelpers.applyDamage(context, context.actorSide, recoil, 'effect_damage', {
            effectType: 'recoil'
        });
        if (dealt > 0) {
            context.manager.log(`${context.attacker.getDisplayName()} 受到了 ${dealt} 点反伤！`);
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('recoil', RecoilEffectHandler);
}
