const FieldEffectEffectHandler = {
    type: 'fieldEffect',

    onHit(context) {
        if (!context.runtime || typeof context.runtime.setFieldEffect !== 'function') {
            return;
        }

        const effect = context.effect || {};
        const effectName = effect.effectName;
        if (!effectName) {
            return;
        }

        const side = BattleEffectHelpers.getSideByTarget(context, effect.target || 'self');
        const duration = Math.max(1, Math.floor(effect.duration || 1));
        context.runtime.setFieldEffect(context.manager, side, effectName, duration);

        if (effectName === 'waterSport') {
            context.manager.log('战场被水幕覆盖，火系伤害下降！');
        } else if (effectName === 'mist') {
            context.manager.log('白雾笼罩己方，能力下降将被阻止！');
        } else {
            context.manager.log(`场地效果 ${effectName} 生效。`);
        }

        BattleEffectHelpers.appendEffectApplied(context, {
            side,
            effectName,
            duration
        });
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('fieldEffect', FieldEffectEffectHandler);
}
