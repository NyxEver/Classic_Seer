/** 自身属性技能免疫效果处理器 */
const SelfStatusSkillImmuneEffectHandler = {
    type: 'selfStatusSkillImmune',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.applyStatusSkillImmune !== 'function') {
            return;
        }

        const duration = Math.max(1, Math.floor((context.effect && context.effect.duration) || 1));
        context.runtime.applyStatusSkillImmune(context.manager, context.actorSide, {
            duration
        });
        context.manager.log(`${context.attacker.getDisplayName()} 获得了属性技能免疫！`);
        BattleEffectHelpers.appendEffectApplied(context, {
            side: context.actorSide,
            duration
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('selfStatusSkillImmune', SelfStatusSkillImmuneEffectHandler);
}
