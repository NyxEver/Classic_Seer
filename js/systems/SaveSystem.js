/**
 * SaveSystem - 存档系统
 * 负责游戏数据的持久化存储（LocalStorage）
 */

const SaveSystem = {
    // LocalStorage 存储键名
    SAVE_KEY: 'seer_save_data',

    /**
     * 保存游戏数据到 LocalStorage
     * @param {Object} data - 要保存的游戏数据
     * @returns {boolean} - 保存是否成功
     */
    save(data) {
        try {
            if (data === null || data === undefined) {
                console.error('[SaveSystem] 无法保存空数据');
                return false;
            }

            const jsonString = JSON.stringify(data);
            localStorage.setItem(this.SAVE_KEY, jsonString);
            console.log('[SaveSystem] 存档保存成功');
            return true;

        } catch (error) {
            console.error('[SaveSystem] 存档保存失败:', error);
            return false;
        }
    },

    /**
     * 从 LocalStorage 读取存档
     * @returns {Object|null} - 存档数据或 null（无存档时）
     */
    load() {
        try {
            const jsonString = localStorage.getItem(this.SAVE_KEY);

            if (!jsonString) {
                console.log('[SaveSystem] 未找到存档');
                return null;
            }

            const data = JSON.parse(jsonString);
            console.log('[SaveSystem] 存档加载成功');
            return data;

        } catch (error) {
            console.error('[SaveSystem] 存档加载失败:', error);
            return null;
        }
    },

    /**
     * 检查是否存在存档
     * @returns {boolean} - 是否存在有效存档
     */
    hasSave() {
        try {
            const jsonString = localStorage.getItem(this.SAVE_KEY);
            if (!jsonString) {
                return false;
            }

            // 尝试解析确保存档有效
            JSON.parse(jsonString);
            return true;

        } catch (error) {
            console.warn('[SaveSystem] 存档无效:', error);
            return false;
        }
    },

    /**
     * 删除存档
     * @returns {boolean} - 删除是否成功
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            console.log('[SaveSystem] 存档已删除');
            return true;

        } catch (error) {
            console.error('[SaveSystem] 删除存档失败:', error);
            return false;
        }
    },

    /**
     * 获取存档时间戳
     * @returns {number|null} - 存档时间戳或 null
     */
    getSaveTimestamp() {
        const data = this.load();
        return data ? data.lastSaveTime : null;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('SaveSystem', SaveSystem);
}

// 导出为全局对象
window.SaveSystem = SaveSystem;
