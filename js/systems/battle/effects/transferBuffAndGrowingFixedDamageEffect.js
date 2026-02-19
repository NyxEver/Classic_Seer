/** 转移增益并累积固伤效果处理器 */
const TransferBuffAndGrowingFixedDamageEffectHandler = {
    type: 'transferBuffAndGrowingFixedDamage',

    afterDamage(context) {
        const attackerStages = context.attackerStages;
        const defenderStages = context.defenderStages;
        let transferred = 0;

        Object.keys(defenderStages).forEach((stat) => {
            const defenderValue = Number(defenderStages[stat] || 0);
            if (defenderValue <= 0) {
                return;
            }

            const oldAttacker = Number(attackerStages[stat] || 0);
            const newAttacker = BattleEffectHelpers.clampStage(oldAttacker + defenderValue);
            const actualGain = newAttacker - oldAttacker;
            if (actualGain > 0) {
                attackerStages[stat] = newAttacker;
                context.manager.appendTurnEvent(context.result, BattleManager.EVENT.STAT_CHANGE, {
                    target: context.actorSide,
                    stat,
                    stages: actualGain
                });
            }

            defenderStages[stat] = 0;
            context.manager.appendTurnEvent(context.result, BattleManager.EVENT.STAT_CHANGE, {
                target: context.targetSide,
                stat,
                stages: -defenderValue
            });
            transferred += defenderValue;
        });

        if (transferred > 0) {
            context.manager.log(`${context.attacker.getDisplayName()} 转移了对手的强化能力！`);
        }

        if (!context.runtime || typeof context.runtime.incrementGrowingFixedDamage !== 'function') {
            return;
        }

        const maxDamage = Math.max(40, Math.floor((context.effect && context.effect.maxFixedDamage) || 400));
        const fixedDamage = context.runtime.incrementGrowingFixedDamage(
            context.manager,
            context.attacker,
            40,
            maxDamage
        );

        if (!context.defender.isFainted() && fixedDamage > 0) {
            const dealt = BattleEffectHelpers.applyDamage(context, context.targetSide, fixedDamage, 'effect_damage', {
                effectType: 'transferBuffAndGrowingFixedDamage'
            });
            if (dealt > 0) {
                context.manager.log(`${context.defender.getDisplayName()} 额外受到了 ${dealt} 点递增固定伤害！`);
            }
        }

        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.targetSide,
            transferred,
            fixedDamage
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('transferBuffAndGrowingFixedDamage', TransferBuffAndGrowingFixedDamageEffectHandler);
}
