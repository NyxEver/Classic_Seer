/** 清除目标增益效果处理器 */
const RemoveTargetBuffsEffectHandler = {
    type: 'removeTargetBuffs',

    onHit(context) {
        const stages = context.defenderStages;
        let changed = 0;

        Object.keys(stages).forEach((stat) => {
            const value = Number(stages[stat] || 0);
            if (value > 0) {
                stages[stat] = 0;
                context.manager.appendTurnEvent(context.result, BattleManager.EVENT.STAT_CHANGE, {
                    target: context.targetSide,
                    stat,
                    stages: -value
                });
                changed += 1;
            }
        });

        if (changed > 0) {
            context.manager.log(`${context.defender.getDisplayName()} 的能力提升被清除了！`);
            BattleEffectHelpers.appendEffectApplied(context, {
                side: context.targetSide,
                changedCount: changed
            });
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('removeTargetBuffs', RemoveTargetBuffsEffectHandler);
}
