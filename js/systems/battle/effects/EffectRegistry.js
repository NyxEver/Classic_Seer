/**
 * BattleEffectRegistry - 战斗效果注册表
 *
 * 职责：
 * - 维护 effectType → handler 的映射
 * - 提供 register / get / has / run 统一接口
 * - 实际调度入口在 BattleActionExecutor
 */

const BattleEffectRegistry = {
    /** @type {Object.<string, Object>} 已注册处理器 */
    _handlers: Object.create(null),

    /**
     * 注册效果处理器
     * @param {string} type - 效果类型
     * @param {Object} handler - 处理器对象
     * @returns {boolean}
     */
    register(type, handler) {
        if (!type || typeof type !== 'string' || !handler || typeof handler !== 'object') {
            return false;
        }
        this._handlers[type] = handler;
        return true;
    },

    /**
     * 获取处理器
     * @param {string} type
     * @returns {Object|null}
     */
    get(type) {
        return this._handlers[type] || null;
    },

    /**
     * 检查是否已注册
     * @param {string} type
     * @returns {boolean}
     */
    has(type) {
        return !!this._handlers[type];
    },

    /**
     * 执行处理器的指定钩子
     * @param {string} type - 效果类型
     * @param {string} hook - 钩子名（如 'onHit'）
     * @param {Object} context - 效果上下文
     * @returns {{ handled: boolean, reason?: string }}
     */
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

    /**
     * 获取所有已注册的效果类型
     * @returns {string[]}
     */
    getRegisteredTypes() {
        return Object.keys(this._handlers);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleEffectRegistry', BattleEffectRegistry);
}

window.BattleEffectRegistry = BattleEffectRegistry;
