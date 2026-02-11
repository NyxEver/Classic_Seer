/**
 * AssetMappings - 资源映射表
 * 管理游戏中所有资源的路径映射
 */

const AssetMappings = {
    /**
     * 精灵贴图总开关
     * false: 全局使用无贴图后备显示（圆形/文字/剪影）
     */
    elfSpritesEnabled: false,

    /**
     * 精灵贴图映射
     * key: 精灵 ID
     * value: 图片资源名称（不含路径和扩展名）
     */
    elves: {
        1: 'bubuzhongzi',    // 布布种子
        2: 'bubucao',        // 布布草
        3: 'bubuhua',        // 布布花
        4: 'yiyou',          // 伊优
        5: 'youlian',        // 尤里安
        6: 'balusi',         // 巴鲁斯
        7: 'xiaohuohou',     // 小火猴
        8: 'liehuohou',      // 烈火猴
        9: 'lieyanxingxing', // 烈焰猩猩
        10: 'pipi',          // 皮皮
        300: 'puni'          // 谱尼
    },

    /**
     * 战斗精灵动画图集路径（Phaser atlas）
     * key: 纹理 key
     * value: { texture, atlas }
     */
    battleAtlases: {
        btl_001_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/001/bubuzhongzi_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/001/bubuzhongzi_still.json'
        },
        btl_001_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/001/bubuzhongzi_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/001/bubuzhongzi_hit.json'
        },

        btl_002_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/002/bubucao_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/002/bubucao_still.json'
        },
        btl_002_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/002/bubucao_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/002/bubucao_hit.json'
        },

        btl_003_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/003/bubuhua_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/003/bubuhua_still.json'
        },
        btl_003_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/003/bubuhua_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/003/bubuhua_hit.json'
        }
    },

    /**
     * 战斗动画分组映射
     * clipType: still / hit
     */
    battleClips: {
        1: {
            still: ['btl_001_still'],
            hit: ['btl_001_hit']
        },
        2: {
            still: ['btl_002_still'],
            hit: ['btl_002_hit']
        },
        3: {
            still: ['btl_003_still'],
            hit: ['btl_003_hit']
        }
    },

    /**
     * 场景外静态精灵图（背包/非战斗展示）
     * key: 精灵 ID
     * value: 资源 key
     */
    externalStill: {
        1: 'ext_still_001',
        2: 'ext_still_002',
        3: 'ext_still_003',
        10: 'ext_still_010',
        16: 'ext_still_016'
    },

    /**
     * 场景外动态图集（野外行走）
     * key: 纹理 key
     * value: { texture, atlas }
     */
    externalDynamicAtlases: {
        ext_dyn_010_front: {
            texture: 'assets/images/elves/external_scene/dynamic/010/front/pipi_front.png',
            atlas: 'assets/images/elves/external_scene/dynamic/010/front/pipi_front.json'
        },
        ext_dyn_010_back: {
            texture: 'assets/images/elves/external_scene/dynamic/010/back/pipi_back.png',
            atlas: 'assets/images/elves/external_scene/dynamic/010/back/pipi_back.json'
        },
        ext_dyn_010_left: {
            texture: 'assets/images/elves/external_scene/dynamic/010/rear_left/pipi_rear_left.png',
            atlas: 'assets/images/elves/external_scene/dynamic/010/rear_left/pipi_rear_left.json'
        },
        ext_dyn_010_right: {
            texture: 'assets/images/elves/external_scene/dynamic/010/right_side/pipi_right_side.png',
            atlas: 'assets/images/elves/external_scene/dynamic/010/right_side/pipi_right_side.json'
        },

        ext_dyn_016_front: {
            texture: 'assets/images/elves/external_scene/dynamic/016/front/xianrenqiu_front.png',
            atlas: 'assets/images/elves/external_scene/dynamic/016/front/xianrenqiu_front.json'
        },
        ext_dyn_016_back: {
            texture: 'assets/images/elves/external_scene/dynamic/016/back/xianrenqiu_back.png',
            atlas: 'assets/images/elves/external_scene/dynamic/016/back/xianrenqiu_back.json'
        },
        ext_dyn_016_left: {
            texture: 'assets/images/elves/external_scene/dynamic/016/left_side/xianrenqiu_left_side.png',
            atlas: 'assets/images/elves/external_scene/dynamic/016/left_side/xianrenqiu_left_side.json'
        },
        ext_dyn_016_right: {
            texture: 'assets/images/elves/external_scene/dynamic/016/rear_right/xianrenqiu_rear_right.png',
            atlas: 'assets/images/elves/external_scene/dynamic/016/rear_right/xianrenqiu_rear_right.json'
        },

        ext_dyn_047_front: {
            texture: 'assets/images/elves/external_scene/dynamic/047/front/moguguai_front.png',
            atlas: 'assets/images/elves/external_scene/dynamic/047/front/moguguai_front.json'
        },
        ext_dyn_047_back: {
            texture: 'assets/images/elves/external_scene/dynamic/047/back/moguguai_back.png',
            atlas: 'assets/images/elves/external_scene/dynamic/047/back/moguguai_back.json'
        },
        ext_dyn_047_left: {
            texture: 'assets/images/elves/external_scene/dynamic/047/rear_right/moguguai_rear_right.png',
            atlas: 'assets/images/elves/external_scene/dynamic/047/rear_right/moguguai_rear_right.json'
        },
        ext_dyn_047_right: {
            texture: 'assets/images/elves/external_scene/dynamic/047/right_side/moguguai_right_side.png',
            atlas: 'assets/images/elves/external_scene/dynamic/047/right_side/moguguai_right_side.json'
        }
    },

    /**
     * 场景外动态方向映射（四方向统一入口）
     */
    externalDynamicClips: {
        10: {
            front: ['ext_dyn_010_front'],
            back: ['ext_dyn_010_back'],
            left: ['ext_dyn_010_left'],
            right: ['ext_dyn_010_right']
        },
        16: {
            front: ['ext_dyn_016_front'],
            back: ['ext_dyn_016_back'],
            left: ['ext_dyn_016_left'],
            right: ['ext_dyn_016_right']
        },
        47: {
            front: ['ext_dyn_047_front'],
            back: ['ext_dyn_047_back'],
            left: ['ext_dyn_047_left'],
            right: ['ext_dyn_047_right']
        }
    },

    /**
     * 克洛斯星场景配置
     * 包含每个子场景的背景、入口点、精灵刷新区域、传送热点
     */
    kloseScenes: {
        1: {
            background: 'bg_klose_1',
            // 玩家入口位置（右上平台）
            entryPoint: { x: 850, y: 180 },
            // 当前场景可刷新精灵
            wildElfPool: [10],
            // 精灵刷新区域（白圈主战斗台，椭圆）
            spawnAreas: [
                { type: 'ellipse', x: 390, y: 450, radiusX: 320, radiusY: 150 }
            ],
            // 同屏刷新数量
            spawnCountRange: [3, 4],
            // 刷新点最小间距（避免扎堆）
            spawnMinDistance: 80,
            // 野生精灵游走半径（相对出生点）
            wildMoveRadius: { x: 90, y: 60 },
            // 传送热点
            hotspots: [
                {
                    type: 'scene',
                    arrow: 'left',  // 左箭头示意进入
                    targetScene: 2,
                    x: 30, y: 450,
                    width: 80, height: 60,
                    label: '克洛斯星沼泽'
                }
            ]
        },
        2: {
            background: 'bg_klose_2',
            // 玩家入口位置（右侧）
            entryPoint: { x: 920, y: 350 },
            // 暂未配置刷新精灵
            wildElfPool: [],
            // 精灵刷新区域（中部两处）
            spawnAreas: [
                { type: 'rect', x: 400, y: 150, width: 180, height: 120 },
                { type: 'rect', x: 300, y: 380, width: 300, height: 150 }
            ],
            // 传送热点
            hotspots: [
                {
                    type: 'scene',
                    arrow: 'left',  // 左箭头示意进入
                    targetScene: 3,
                    x: 60, y: 200,
                    width: 100, height: 180,
                    label: '克洛斯星林间'
                },
                {
                    type: 'entry',
                    arrow: 'right',  // 右箭头示意返回
                    targetScene: 1,
                    targetEntry: { x: 30, y: 480 },
                    x: 880, y: 280,
                    width: 120, height: 180,
                    label: '克洛斯星'
                }
            ]
        },
        3: {
            background: 'bg_klose_3',
            // 玩家入口位置（右上）
            entryPoint: { x: 880, y: 100 },
            // 暂未配置刷新精灵
            wildElfPool: [],
            // 精灵刷新区域（左侧大区域）
            spawnAreas: [
                { type: 'rect', x: 50, y: 100, width: 350, height: 400 }
            ],
            // 传送热点
            hotspots: [
                {
                    type: 'entry',
                    arrow: 'right',  // 右箭头示意返回
                    targetScene: 2,
                    targetEntry: { x: 100, y: 280 },
                    x: 830, y: 50,
                    width: 150, height: 150,
                    label: '克洛斯星沼泽'
                }
            ]
        }
    },

    /**
     * 背景音乐映射（预留）
     * key: 场景 key
     * value: BGM 音频名称
     */
    bgm: {
        BattleScene: 'seer_battle_1'
    },

    /**
     * 物品图标映射
     * key: 物品 ID
     * value: 图片资源名称（不含路径和扩展名）
     */
    items: {
        1: 'basic_capsule',
        // 当前仅提供 basic_capsule 素材，先复用
        4: 'basic_capsule',
        7: 'basic_capsule',
        2: 'basic_hpPotion',
        5: 'intermediate_hpPotion',
        8: 'advanced_hpPotion',
        3: 'basic_ppPotion',
        6: 'intermediate_ppPotion',
        9: 'advanced_ppPotion'
    },

    /**
     * 属性图标映射（全属性图标）
     * key: 属性英文名
     * value: 图标文件名（不含路径和扩展名）
     */
    typeIcons: {
        water: '30px-water',
        fire: '30px-fire',
        grass: '30px-grass',
        flying: '30px-flying',
        electric: '30px-electric',
        ground: '30px-ground',
        ice: '30px-ice',
        mechanical: '30px-mechanical',
        normal: '30px-normal',
        psychic: '30px-psychic',
        battle: '30px-battle',
        light: '30px-light',
        shadow: '30px-shadow',
        mystery: '30px-mystery',
        dragon: '30px-dragon',
        spirit: '30px-spirit'
    },

    /**
     * 获取精灵贴图 key
     * @param {number} elfId - 精灵 ID
     * @returns {string} 图片资源 key（用于 Phaser 加载）
     */
    getElfImageKey(elfId) {
        if (!this.elfSpritesEnabled) return null;
        const name = this.elves[elfId];
        return name ? `elf_${name}` : null;
    },

    /**
     * 获取精灵贴图路径
     * @param {number} elfId - 精灵 ID
     * @returns {string} 图片文件路径
     */
    getElfImagePath(elfId) {
        if (!this.elfSpritesEnabled) return null;
        const name = this.elves[elfId];
        return name ? `assets/images/elves/${name}.png` : null;
    },

    /**
     * 获取所有精灵资源列表（用于批量加载）
     * @returns {Array<{key: string, path: string}>} 资源列表
     */
    getAllElfAssets() {
        if (!this.elfSpritesEnabled) return [];
        const assets = [];
        for (const [id, name] of Object.entries(this.elves)) {
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
        const pathMap = {
            ext_still_001: 'assets/images/elves/external_scene/still/001/bubuzhongzi.png',
            ext_still_002: 'assets/images/elves/external_scene/still/002/bubucao.png',
            ext_still_003: 'assets/images/elves/external_scene/still/003/bubuhua.png',
            ext_still_010: 'assets/images/elves/external_scene/still/010/pipi.png',
            ext_still_016: 'assets/images/elves/external_scene/still/016/xianrenqiu.png'
        };

        for (const [key, path] of Object.entries(pathMap)) {
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
     * @returns {Array<{key: string, path: string}>}
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

window.AssetMappings = AssetMappings;
