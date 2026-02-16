const ClearSelfDebuffsEffectHandler = {
    type: 'clearSelfDebuffs',

    onHit(context) {
        const stages = context.attackerStages;
        let changed = 0;

        Object.keys(stages).forEach((stat) => {
            const value = Number(stages[stat] || 0);
            if (value < 0) {
                stages[stat] = 0;
                context.manager.appendTurnEvent(context.result, BattleManager.EVENT.STAT_CHANGE, {
                    target: context.actorSide,
                    stat,
                    stages: -value
                });
                changed += 1;
            }
        });

        if (changed > 0) {
            context.manager.log(`${context.attacker.getDisplayName()} 的能力下降状态被清除了！`);
            BattleEffectHelpers.appendEffectApplied(context, {
                side: context.actorSide,
                changedCount: changed
            });
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('clearSelfDebuffs', ClearSelfDebuffsEffectHandler);
}
