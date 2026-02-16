const SelfExhaustedEffectHandler = {
    type: 'selfExhausted',

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
                target: 'self',
                chance: 100
            },
            effectType: 'selfExhausted'
        };
        statusHandler.onHit(proxyContext);
    }
};

if (typeof BattleEffectRegistry !== 'undefined' && BattleEffectRegistry) {
    BattleEffectRegistry.register('selfExhausted', SelfExhaustedEffectHandler);
}
