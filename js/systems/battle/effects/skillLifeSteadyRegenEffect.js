/** 技能持续回复效果处理器 */
const SkillLifeSteadyRegenEffectHandler = {
    type: 'skillLifeSteadyRegen',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applySkillLifeSteadyRegen !== 'function') {
            return;
        }

        const effect = context.effect || {};
        const duration = Math.max(1, Math.floor(effect.duration || 1));
        const amount = Math.max(0, Math.floor(effect.amount || 0));
        context.runtime.applySkillLifeSteadyRegen(context.manager, context.actorSide, {
            duration,
            amount
        });

        context.manager.log(`${context.attacker.getDisplayName()} 获得了稳定生命回复状态！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.actorSide,
            duration,
            amount
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('skillLifeSteadyRegen', SkillLifeSteadyRegenEffectHandler);
}
