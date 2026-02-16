const MultiStatChangeEffectHandler = {
    type: 'multiStatChange',

    onHit(context) {
        const effect = context.effect || {};
        if (!BattleEffectHelpers.rollChance(effect.chance)) {
            return;
        }

        const changes = Array.isArray(effect.changes) ? effect.changes : [];
        if (changes.length === 0) {
            return;
        }

        const side = BattleEffectHelpers.getSideByTarget(context, effect.target);
        let changed = 0;

        changes.forEach((item) => {
            if (!item || typeof item !== 'object') {
                return;
            }
            const stat = item.stat;
            const delta = Number(item.stages || 0);
            if (!stat || !Number.isFinite(delta) || delta === 0) {
                return;
            }

            const outcome = BattleEffectHelpers.applyStatChange(context, side, stat, delta, {
                respectMist: true
            });
            if (outcome.applied) {
                changed += 1;
            }
        });

        if (changed > 0) {
            BattleEffectHelpers.appendEffectApplied(context, {
                side,
                changedCount: changed
            });
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('multiStatChange', MultiStatChangeEffectHandler);
}
