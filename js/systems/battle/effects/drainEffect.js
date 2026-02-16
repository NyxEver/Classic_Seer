const DrainEffectHandler = {
    type: 'drain',

    afterDamage(context) {
        if (!Number.isFinite(context.damageDealt) || context.damageDealt <= 0) {
            return;
        }

        const effect = context.effect || {};
        const ratio = Number.isFinite(effect.drainRatio) ? effect.drainRatio : 0.5;
        const heal = Math.max(0, Math.floor(context.damageDealt * ratio));
        if (heal <= 0) {
            return;
        }

        const restored = BattleEffectHelpers.applyHeal(context, context.actorSide, heal, 'effect_heal', {
            effectType: 'drain'
        });

        if (restored > 0) {
            context.manager.log(`${context.attacker.getDisplayName()} 吸收了 ${restored} 点体力！`);
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('drain', DrainEffectHandler);
}
