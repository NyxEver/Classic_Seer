const StatChangeEffectHandler = {
    type: 'statChange',

    onHit(context) {
        const effect = context.effect || {};
        if (!BattleEffectHelpers.rollChance(effect.chance)) {
            return;
        }

        const side = BattleEffectHelpers.getSideByTarget(context, effect.target);
        const stat = effect.stat;
        const stages = Number(effect.stages || 0);
        if (!stat || !Number.isFinite(stages) || stages === 0) {
            return;
        }

        const outcome = BattleEffectHelpers.applyStatChange(context, side, stat, stages, {
            respectMist: true
        });

        if (outcome.applied) {
            BattleEffectHelpers.appendEffectApplied(context, {
                side,
                stat,
                stages: outcome.appliedDelta
            });
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('statChange', StatChangeEffectHandler);
}
