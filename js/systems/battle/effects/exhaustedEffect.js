const ExhaustedEffectHandler = {
    type: 'exhausted',

    onHit(context) {
        const statusHandler = (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry)
            ? BattleEffectRegistry.get('status')
            : null;
        if (!statusHandler || typeof statusHandler.onHit !== 'function') {
            return;
        }

        const proxyContext = {
            ...context,
            effect: {
                ...context.effect,
                type: 'status',
                status: 'exhausted',
                target: context.effect && context.effect.target ? context.effect.target : 'enemy',
                chance: Number.isFinite(context.effect && context.effect.chance) ? context.effect.chance : 100
            },
            effectType: 'exhausted'
        };
        statusHandler.onHit(proxyContext);
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('exhausted', ExhaustedEffectHandler);
}
