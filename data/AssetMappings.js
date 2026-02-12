/**
 * AssetMappings - 资源映射聚合兼容层
 * 仍保持原 AssetMappings.* API，内部聚合 data/assets/* 子映射。
 */

const battleAssets = window.BattleAssets || {};
const worldAssets = window.WorldAssets || {};
const uiAssets = window.UIAssets || {};
const audioAssets = window.AudioAssets || {};

const AssetMappings = {
    get elfSpritesEnabled() {
        return !!battleAssets.elfSpritesEnabled;
    },

    set elfSpritesEnabled(value) {
        battleAssets.elfSpritesEnabled = !!value;
    },

    elves: battleAssets.elves || {},
    battleAtlases: battleAssets.battleAtlases || {},
    battleClips: battleAssets.battleClips || {},

    externalStill: worldAssets.externalStill || {},
    externalStillPaths: worldAssets.externalStillPaths || {},
    externalDynamicAtlases: worldAssets.externalDynamicAtlases || {},
    externalDynamicClips: worldAssets.externalDynamicClips || {},
    kloseScenes: worldAssets.kloseScenes || {},

    bgm: audioAssets.bgm || {},

    items: uiAssets.items || {},
    typeIcons: uiAssets.typeIcons || {},

    /**
     * 获取精灵贴图 key
     * @param {number} elfId - 精灵 ID
     * @returns {string|null}
     */
    getElfImageKey(elfId) {
        if (!this.elfSpritesEnabled) return null;
        const name = this.elves[elfId];
        return name ? `elf_${name}` : null;
    },

    /**
     * 获取精灵贴图路径
     * @param {number} elfId - 精灵 ID
     * @returns {string|null}
     */
    getElfImagePath(elfId) {
        if (!this.elfSpritesEnabled) return null;
        const name = this.elves[elfId];
        return name ? `assets/images/elves/${name}.png` : null;
    },

    /**
     * 获取所有精灵资源列表（用于批量加载）
     * @returns {Array<{key: string, path: string}>}
     */
    getAllElfAssets() {
        if (!this.elfSpritesEnabled) return [];

        const assets = [];
        for (const name of Object.values(this.elves)) {
            assets.push({
                key: `elf_${name}`,
                path: `assets/images/elves/${name}.png`
            });
        }
        return assets;
    },

    /**
     * 获取指定精灵的战斗动画资源 key 列表
     * @param {number} elfId - 精灵 ID
     * @param {string} clipType - still / hit
     * @returns {string[]}
     */
    getBattleClipKeys(elfId, clipType) {
        const clipMap = this.battleClips[elfId];
        if (!clipMap) return [];
        const keys = clipMap[clipType];
        return Array.isArray(keys) ? keys : [];
    },

    /**
     * 获取所有战斗动画图集资源（用于批量 preload）
     * @returns {Array<{key: string, texturePath: string, atlasPath: string}>}
     */
    getAllBattleAtlases() {
        const assets = [];
        for (const [key, value] of Object.entries(this.battleAtlases)) {
            if (!value || !value.texture || !value.atlas) continue;
            assets.push({
                key,
                texturePath: value.texture,
                atlasPath: value.atlas
            });
        }
        return assets;
    },

    /**
     * 获取场景外静态精灵图 key
     * @param {number} elfId
     * @returns {string|null}
     */
    getExternalStillKey(elfId) {
        return this.externalStill[elfId] || null;
    },

    /**
     * 获取场景外静态精灵图资源列表
     * @returns {Array<{key: string, path: string}>}
     */
    getAllExternalStillAssets() {
        const assets = [];
        for (const [key, path] of Object.entries(this.externalStillPaths)) {
            assets.push({ key, path });
        }
        return assets;
    },

    /**
     * 获取场景外动态方向图集 key 列表
     * @param {number} elfId
     * @param {string} direction - front / back / left / right
     * @returns {string[]}
     */
    getExternalDynamicKeys(elfId, direction) {
        const clipMap = this.externalDynamicClips[elfId];
        if (!clipMap) return [];

        const preferred = Array.isArray(clipMap[direction]) ? clipMap[direction] : [];
        if (preferred.length) return preferred;

        const fallbackOrder = ['front', 'back', 'left', 'right'];
        for (const dir of fallbackOrder) {
            const keys = clipMap[dir];
            if (Array.isArray(keys) && keys.length) return keys;
        }
        return [];
    },

    /**
     * 获取所有场景外动态图集资源列表
     * @returns {Array<{key: string, texturePath: string, atlasPath: string}>}
     */
    getAllExternalDynamicAtlases() {
        const assets = [];
        for (const [key, value] of Object.entries(this.externalDynamicAtlases)) {
            if (!value || !value.texture || !value.atlas) continue;
            assets.push({
                key,
                texturePath: value.texture,
                atlasPath: value.atlas
            });
        }
        return assets;
    },

    /**
     * 获取场景 BGM 资源 key
     * @param {string} sceneKey - 场景 key
     * @returns {string|null}
     */
    getBgmKey(sceneKey) {
        const name = this.bgm[sceneKey];
        return name ? `bgm_${name}` : null;
    },

    /**
     * 获取场景 BGM 路径
     * @param {string} sceneKey - 场景 key
     * @returns {string|null}
     */
    getBgmPath(sceneKey) {
        const name = this.bgm[sceneKey];
        return name ? `assets/audio/bgm/${name}.mp3` : null;
    },

    /**
     * 获取所有 BGM 资源列表（用于批量加载）
     * @returns {Array<{key: string, path: string}>}
     */
    getAllBgmAssets() {
        const assets = [];
        for (const name of Object.values(this.bgm)) {
            assets.push({
                key: `bgm_${name}`,
                path: `assets/audio/bgm/${name}.mp3`
            });
        }
        return assets;
    },

    /**
     * 获取物品图标资源 key
     * @param {number} itemId - 物品 ID
     * @returns {string|null}
     */
    getItemImageKey(itemId) {
        const name = this.items[itemId];
        return name ? `item_${name}` : null;
    },

    /**
     * 获取物品图标路径
     * @param {number} itemId - 物品 ID
     * @returns {string|null}
     */
    getItemImagePath(itemId) {
        const name = this.items[itemId];
        return name ? `assets/images/items/${name}.png` : null;
    },

    /**
     * 获取所有物品图标资源列表（用于批量加载）
     * @returns {Array<{key: string, path: string}>}
     */
    getAllItemAssets() {
        const assets = [];
        const loadedNames = new Set();
        for (const name of Object.values(this.items)) {
            if (loadedNames.has(name)) continue;
            loadedNames.add(name);
            assets.push({
                key: `item_${name}`,
                path: `assets/images/items/${name}.png`
            });
        }
        return assets;
    },

    /**
     * 获取属性图标 key
     * @param {string} type - 属性名（英文）
     * @returns {string|null}
     */
    getTypeIconKey(type) {
        const name = this.typeIcons[type];
        return name ? `type_${name}` : null;
    },

    /**
     * 获取属性图标路径
     * @param {string} type - 属性名（英文）
     * @returns {string|null}
     */
    getTypeIconPath(type) {
        const name = this.typeIcons[type];
        return name ? `assets/images/ui/icons/type/${name}.png` : null;
    },

    /**
     * 是否存在该属性图标
     * @param {string} type - 属性名（英文）
     * @returns {boolean}
     */
    hasTypeIcon(type) {
        return !!this.typeIcons[type];
    },

    /**
     * 获取所有属性图标资源列表（用于批量加载）
     * @returns {Array<{type: string, key: string, path: string}>}
     */
    getAllTypeIconAssets() {
        const assets = [];
        for (const [type, name] of Object.entries(this.typeIcons)) {
            assets.push({
                type,
                key: `type_${name}`,
                path: `assets/images/ui/icons/type/${name}.png`
            });
        }
        return assets;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('AssetMappings', AssetMappings);
}

window.AssetMappings = AssetMappings;
