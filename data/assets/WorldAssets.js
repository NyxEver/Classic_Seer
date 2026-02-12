/**
 * WorldAssets - 场景与外场精灵资源子映射
 */

const WorldAssets = {
    /**
     * 场景外静态精灵图（背包/非战斗展示）
     * key: 精灵 ID
     * value: 资源 key
     */
    externalStill: {
        1: 'ext_still_001',
        2: 'ext_still_002',
        3: 'ext_still_003',
        4: 'ext_still_004',
        5: 'ext_still_005',
        6: 'ext_still_006',
        7: 'ext_still_007',
        8: 'ext_still_008',
        9: 'ext_still_009',
        10: 'ext_still_010',
        11: 'ext_still_011',
        12: 'ext_still_012',
        16: 'ext_still_016',
        17: 'ext_still_017',
        18: 'ext_still_018',
        46: 'ext_still_046',
        47: 'ext_still_047',
        300: 'ext_still_300'
    },

    /**
     * 场景外静态精灵图路径映射
     * key: 资源 key
     * value: 图片路径
     */
    externalStillPaths: {
        ext_still_001: 'assets/images/elves/external_scene/still/001/bubuzhongzi.png',
        ext_still_002: 'assets/images/elves/external_scene/still/002/bubucao.png',
        ext_still_003: 'assets/images/elves/external_scene/still/003/bubuhua.png',
        ext_still_004: 'assets/images/elves/external_scene/still/004/yiyou.png',
        ext_still_005: 'assets/images/elves/external_scene/still/005/youlian.png',
        ext_still_006: 'assets/images/elves/external_scene/still/006/balusi.png',
        ext_still_007: 'assets/images/elves/external_scene/still/007/xiaohuohou.png',
        ext_still_008: 'assets/images/elves/external_scene/still/008/liehuohou.png',
        ext_still_009: 'assets/images/elves/external_scene/still/009/lieyanxingxing.png',
        ext_still_010: 'assets/images/elves/external_scene/still/010/pipi.png',
        ext_still_011: 'assets/images/elves/external_scene/still/011/bibuo.png',
        ext_still_012: 'assets/images/elves/external_scene/still/012/bokeer.png',
        ext_still_016: 'assets/images/elves/external_scene/still/016/xianrenqiu.png',
        ext_still_017: 'assets/images/elves/external_scene/still/017/xianrenzhang.png',
        ext_still_018: 'assets/images/elves/external_scene/still/018/juxingxianrenzhang.png',
        ext_still_046: 'assets/images/elves/external_scene/still/046/xiaomogu.png',
        ext_still_047: 'assets/images/elves/external_scene/still/047/moguguai.png',
        ext_still_300: 'assets/images/elves/external_scene/still/300/puni.png'
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
            left: ['ext_dyn_047_right'],
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
            entryPoint: { x: 850, y: 180 },
            wildElfPool: [10],
            spawnAreas: [
                { type: 'ellipse', x: 390, y: 450, radiusX: 320, radiusY: 150 }
            ],
            spawnCountRange: [3, 4],
            spawnMinDistance: 80,
            wildMoveRadius: { x: 90, y: 60 },
            hotspots: [
                {
                    type: 'scene',
                    arrow: 'left',
                    targetScene: 2,
                    x: 30,
                    y: 450,
                    width: 80,
                    height: 60,
                    label: '克洛斯星沼泽'
                }
            ]
        },
        2: {
            background: 'bg_klose_2',
            entryPoint: { x: 920, y: 350 },
            wildElfPool: [16],
            spawnAreas: [
                { type: 'rect', x: 400, y: 150, width: 180, height: 120 },
                { type: 'rect', x: 300, y: 380, width: 300, height: 150 }
            ],
            spawnCountRange: [3, 4],
            spawnMinDistance: 70,
            wildMoveRadius: { x: 80, y: 60 },
            hotspots: [
                {
                    type: 'scene',
                    arrow: 'left',
                    targetScene: 3,
                    x: 60,
                    y: 200,
                    width: 100,
                    height: 180,
                    label: '克洛斯星林间'
                },
                {
                    type: 'entry',
                    arrow: 'right',
                    targetScene: 1,
                    targetEntry: { x: 30, y: 480 },
                    x: 880,
                    y: 280,
                    width: 120,
                    height: 180,
                    label: '克洛斯星'
                }
            ]
        },
        3: {
            background: 'bg_klose_3',
            entryPoint: { x: 880, y: 100 },
            wildElfPool: [47],
            spawnAreas: [
                { type: 'rect', x: 50, y: 100, width: 350, height: 400 }
            ],
            spawnCountRange: [1, 1],
            wildMoveRadius: { x: 60, y: 40 },
            hotspots: [
                {
                    type: 'entry',
                    arrow: 'right',
                    targetScene: 2,
                    targetEntry: { x: 100, y: 280 },
                    x: 830,
                    y: 50,
                    width: 150,
                    height: 150,
                    label: '克洛斯星沼泽'
                }
            ]
        }
    }
};

window.WorldAssets = WorldAssets;
