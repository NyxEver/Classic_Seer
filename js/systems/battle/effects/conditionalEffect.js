const ConditionalEffectHandler = {
    type: 'conditional',

    beforeDamage(context) {
        const effect = context.effect || {};
        const condition = effect.condition;

        if (condition === 'targetHpBelow50') {
            const maxHp = context.defender.getMaxHp();
            if (context.defender.currentHp <= maxHp * 0.5) {
                context.damagePlan.power = Math.max(0, Math.floor(context.damagePlan.power * 2));
                context.manager.log('条件满足，技能威力翻倍！');
                BattleEffectHelpers.appendEffectApplied(context, {
                    side: context.targetSide,
                    condition
                });
            }
            return;
        }

        if (condition === 'targetBuffed') {
            const positiveTotal = BattleEffectHelpers.countPositiveStages(context.defenderStages);
            if (positiveTotal > 0) {
                const bonus = Number(effect.bonusPowerPerStage || 0);
                context.damagePlan.power = Math.max(0, Math.floor(context.skill.power + positiveTotal * bonus));
                context.manager.log(`目标能力提升总计 ${positiveTotal} 级，技能威力提高到 ${context.damagePlan.power}！`);
                BattleEffectHelpers.appendEffectApplied(context, {
                    side: context.targetSide,
                    condition,
                    positiveTotal,
                    power: context.damagePlan.power
                });
            }
        }
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('conditional', ConditionalEffectHandler);
}
