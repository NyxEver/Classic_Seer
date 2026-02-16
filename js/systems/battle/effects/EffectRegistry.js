/**
 * BattleEffectRegistry - effect type registry.
 * Dispatcher entry stays in BattleActionExecutor.
 */

const BattleEffectRegistry = {
    _handlers: Object.create(null),

    register(type, handler) {
        if (!type || typeof type !== 'string' || !handler || typeof handler !== 'object') {
            return false;
        }
        this._handlers[type] = handler;
        return true;
    },

    get(type) {
        return this._handlers[type] || null;
    },

    has(type) {
        return !!this._handlers[type];
    },

    run(type, hook, context) {
        const handler = this.get(type);
        if (!handler) {
            return { handled: false, reason: 'missing_handler' };
        }
        const fn = handler[hook];
        if (typeof fn !== 'function') {
            return { handled: false, reason: 'missing_hook' };
        }
        const output = fn.call(handler, context);
        return output || { handled: true };
    },

    getRegisteredTypes() {
        return Object.keys(this._handlers);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleEffectRegistry', BattleEffectRegistry);
}

window.BattleEffectRegistry = BattleEffectRegistry;
