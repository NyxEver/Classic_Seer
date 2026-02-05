/**
 * ItemBag - 物品背包管理器
 * 管理玩家的物品存储与使用
 */

const ItemBag = {
    /**
     * 获取所有物品及数量
     * @returns {Object} - 物品 ID 与数量的映射 {itemId: count}
     */
    getAll() {
        return PlayerData.items || {};
    },

    /**
     * 获取指定物品数量
     * @param {number} itemId - 物品 ID
     * @returns {number} - 物品数量
     */
    getCount(itemId) {
        const items = this.getAll();
        return items[itemId] || 0;
    },

    /**
     * 添加物品
     * @param {number} itemId - 物品 ID
     * @param {number} count - 添加数量（默认 1）
     */
    add(itemId, count = 1) {
        PlayerData.addItem(itemId, count);
    },

    /**
     * 移除物品
     * @param {number} itemId - 物品 ID
     * @param {number} count - 移除数量（默认 1）
     * @returns {boolean} - 是否成功移除
     */
    remove(itemId, count = 1) {
        return PlayerData.useItem(itemId, count);
    },

    /**
     * 检查是否拥有足够物品
     * @param {number} itemId - 物品 ID
     * @param {number} count - 需要的数量（默认 1）
     * @returns {boolean} - 是否拥有足够数量
     */
    has(itemId, count = 1) {
        return this.getCount(itemId) >= count;
    },

    /**
     * 获取指定类型的所有物品
     * @param {string} type - 物品类型 (capsule, hpPotion, ppPotion, material)
     * @returns {Array} - 物品列表 [{itemData, count}]
     */
    getByType(type) {
        const items = this.getAll();
        const result = [];

        for (const itemId in items) {
            const count = items[itemId];
            if (count > 0) {
                const itemData = DataLoader.getItem(parseInt(itemId));
                if (itemData && itemData.type === type) {
                    result.push({
                        itemData: itemData,
                        count: count
                    });
                }
            }
        }

        return result;
    },

    /**
     * 获取所有胶囊
     * @returns {Array} - 胶囊列表
     */
    getCapsules() {
        return this.getByType('capsule');
    },

    /**
     * 获取所有体力药剂
     * @returns {Array} - 体力药剂列表
     */
    getHpPotions() {
        return this.getByType('hpPotion');
    },

    /**
     * 获取所有活力药剂
     * @returns {Array} - 活力药剂列表
     */
    getPpPotions() {
        return this.getByType('ppPotion');
    }
};

// 导出为全局对象
window.ItemBag = ItemBag;
