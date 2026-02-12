/**
 * GameEvents - 全局事件总线
 * 统一管理跨系统事件通信（emit/on/off）
 */
const GameEvents = {
    EVENTS: {
        QUEST_PROGRESS: 'quest:progress'
    },

    _listeners: new Map(),

    /**
     * 订阅事件
     * @param {string} eventName
     * @param {Function} handler
     * @returns {Function} 取消订阅函数
     */
    on(eventName, handler) {
        if (typeof eventName !== 'string' || !eventName) {
            console.error('[GameEvents] 无效事件名:', eventName);
            return () => {};
        }
        if (typeof handler !== 'function') {
            console.error('[GameEvents] 监听器必须是函数');
            return () => {};
        }

        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, new Set());
        }

        const eventSet = this._listeners.get(eventName);
        eventSet.add(handler);

        return () => this.off(eventName, handler);
    },

    /**
     * 取消订阅
     * @param {string} eventName
     * @param {Function} handler
     */
    off(eventName, handler) {
        const eventSet = this._listeners.get(eventName);
        if (!eventSet) {
            return;
        }

        eventSet.delete(handler);
        if (eventSet.size === 0) {
            this._listeners.delete(eventName);
        }
    },

    /**
     * 发射事件
     * @param {string} eventName
     * @param {Object} payload
     */
    emit(eventName, payload = {}) {
        const eventSet = this._listeners.get(eventName);
        if (!eventSet || eventSet.size === 0) {
            return;
        }

        eventSet.forEach((handler) => {
            try {
                handler(payload);
            } catch (error) {
                console.error(`[GameEvents] 事件处理异常: ${eventName}`, error);
            }
        });
    },

    /**
     * 获取监听数量（用于排查重复注册）
     * @param {string} eventName
     * @returns {number}
     */
    listenerCount(eventName) {
        const eventSet = this._listeners.get(eventName);
        return eventSet ? eventSet.size : 0;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('GameEvents', GameEvents);
}

window.GameEvents = GameEvents;
