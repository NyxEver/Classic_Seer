const StatusSkillSealAndReducePPEffectHandler = {
    type: 'statusSkillSealAndReducePP',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applyStatusSkillSeal !== 'function') {
            return;
        }

        const effect = context.effect || {};
        const duration = Math.max(1, Math.floor(effect.duration || 1));
        const chance = Number.isFinite(effect.chance) ? effect.chance : 100;
        const ppReduceOnFirstStrike = Math.max(0, Math.floor(effect.ppReduceOnFirstStrike || 0));

        context.runtime.applyStatusSkillSeal(context.manager, context.targetSide, {
            duration,
            chance,
            ppReduceOnFirstStrike,
            casterSide: context.actorSide
        });

        context.manager.log(`${context.defender.getDisplayName()} 被施加了属性技封印效果！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.targetSide,
            duration,
            chance,
            ppReduceOnFirstStrike
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('statusSkillSealAndReducePP', StatusSkillSealAndReducePPEffectHandler);
}
