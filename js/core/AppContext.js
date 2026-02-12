/**
 * AppContext - 全局依赖上下文
 * 统一管理核心单例，支持 Context 优先 + window 兼容回退。
 */
const AppContext = {
    _services: Object.create(null),

    /**
     * 注册依赖
     * @param {string} name
     * @param {*} service
     * @param {{ overwrite?: boolean }} options
     * @returns {boolean}
     */
    register(name, service, options = {}) {
        if (typeof name !== 'string' || !name) {
            console.error('[AppContext] register 失败：name 必须是非空字符串');
            return false;
        }

        const overwrite = options.overwrite !== false;
        const exists = Object.prototype.hasOwnProperty.call(this._services, name);
        if (exists && !overwrite) {
            return true;
        }

        this._services[name] = service;
        return true;
    },

    /**
     * 获取依赖（Context 优先，window 回退）
     * @param {string} name
     * @param {*} fallback
     * @returns {*}
     */
    get(name, fallback = null) {
        if (Object.prototype.hasOwnProperty.call(this._services, name)) {
            return this._services[name];
        }

        if (typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, name)) {
            return window[name];
        }

        return fallback;
    },

    /**
     * 是否存在依赖
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
        if (Object.prototype.hasOwnProperty.call(this._services, name)) {
            return true;
        }
        if (typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, name)) {
            return true;
        }
        return false;
    },

    /**
     * 注销依赖
     * @param {string} name
     */
    unregister(name) {
        if (Object.prototype.hasOwnProperty.call(this._services, name)) {
            delete this._services[name];
        }
    },

    /**
     * 将 window 上已有对象同步进 Context
     * @param {string} name
     * @returns {*}
     */
    syncFromWindow(name) {
        if (typeof window === 'undefined') {
            return null;
        }
        if (!Object.prototype.hasOwnProperty.call(window, name)) {
            return null;
        }

        this.register(name, window[name]);
        return window[name];
    }
};

window.AppContext = AppContext;
