/** 清除回合效果处理器（禁回复/增益/吸取） */
const PurgeRoundEffectNoHealAndBoostAndDrainEffectHandler = {
    type: 'purgeRoundEffectNoHealAndBoostAndDrain',

    afterDamage(context) {
        if (!context.runtime) {
            return;
        }

        const effect = context.effect || {};

        if (typeof context.runtime.clearRoundEffects === 'function') {
            context.runtime.clearRoundEffects(context.manager);
            context.manager.log('回合类持续效果被清除！');
        }

        if (typeof context.runtime.applyNoHeal === 'function' && effect.noHealDuration) {
            context.runtime.applyNoHeal(context.manager, context.targetSide, {
                duration: Math.max(1, Math.floor(effect.noHealDuration))
            });
            context.manager.log(`${context.defender.getDisplayName()} 进入禁疗状态！`);
        }

        const selfBoost = effect.selfBoost && typeof effect.selfBoost === 'object' ? effect.selfBoost : null;
        if (selfBoost) {
            Object.keys(selfBoost).forEach((stat) => {
                const delta = Number(selfBoost[stat] || 0);
                if (!Number.isFinite(delta) || delta === 0) {
                    return;
                }
                BattleEffectHelpers.applyStatChange(context, context.actorSide, stat, delta, {
                    respectMist: false
                });
            });
        }

        const maxDrain = Math.max(0, Math.floor(effect.maxDrain || 0));
        if (!context.defender.isFainted() && maxDrain > 0) {
            const drain = Math.min(maxDrain, context.defender.currentHp);
            const dealt = BattleEffectHelpers.applyDamage(context, context.targetSide, drain, 'effect_damage', {
                effectType: 'purgeRoundEffectNoHealAndBoostAndDrain'
            });
            if (dealt > 0) {
                const healed = BattleEffectHelpers.applyHeal(context, context.actorSide, dealt, 'effect_heal', {
                    effectType: 'purgeRoundEffectNoHealAndBoostAndDrain'
                });
                if (healed > 0) {
                    context.manager.log(`${context.attacker.getDisplayName()} 吸取了 ${healed} 点体力！`);
                }
            }
        }

        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.targetSide
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('purgeRoundEffectNoHealAndBoostAndDrain', PurgeRoundEffectNoHealAndBoostAndDrainEffectHandler);
}
