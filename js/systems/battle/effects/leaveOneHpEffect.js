/** 保留1HP效果处理器（濒死保护） */
const LeaveOneHpEffectHandler = {
    type: 'leaveOneHp',

    beforeDamage(context) {
        const effect = context.effect || {};
        const minHp = Math.max(0, Math.floor(effect.minimumTargetHp || 1));
        context.damagePlan.minimumTargetHp = minHp;
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('leaveOneHp', LeaveOneHpEffectHandler);
}
