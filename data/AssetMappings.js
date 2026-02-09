/**
 * AssetMappings - 资源映射表
 * 管理游戏中所有资源的路径映射
 */

const AssetMappings = {
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
        10: 'pipi'           // 皮皮
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
            // 精灵刷新区域（左侧大区域）
            spawnZones: [
                { x: 80, y: 280, width: 400, height: 250 }
            ],
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
            // 精灵刷新区域（中部两处）
            spawnZones: [
                { x: 400, y: 150, width: 180, height: 120 },
                { x: 300, y: 380, width: 300, height: 150 }
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
            // 精灵刷新区域（左侧大区域）
            spawnZones: [
                { x: 50, y: 100, width: 350, height: 400 }
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
        // 'BattleScene': 'seer_battle_1'
    },

    /**
     * 获取精灵贴图 key
     * @param {number} elfId - 精灵 ID
     * @returns {string} 图片资源 key（用于 Phaser 加载）
     */
    getElfImageKey(elfId) {
        const name = this.elves[elfId];
        return name ? `elf_${name}` : null;
    },

    /**
     * 获取精灵贴图路径
     * @param {number} elfId - 精灵 ID
     * @returns {string} 图片文件路径
     */
    getElfImagePath(elfId) {
        const name = this.elves[elfId];
        return name ? `assets/images/elves/${name}.png` : null;
    },

    /**
     * 获取所有精灵资源列表（用于批量加载）
     * @returns {Array<{key: string, path: string}>} 资源列表
     */
    getAllElfAssets() {
        const assets = [];
        for (const [id, name] of Object.entries(this.elves)) {
            assets.push({
                key: `elf_${name}`,
                path: `assets/images/elves/${name}.png`
            });
        }
        return assets;
    }
};

window.AssetMappings = AssetMappings;
