/**
 * BattleAssets - 战斗相关资源子映射
 */

const BattleAssets = {
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
        1: 'bubuzhongzi',
        2: 'bubucao',
        3: 'bubuhua',
        4: 'yiyou',
        5: 'youlian',
        6: 'balusi',
        7: 'xiaohuohou',
        8: 'liehuohou',
        9: 'lieyanxingxing',
        10: 'pipi',
        11: 'bibuo',
        12: 'bokeer',
        16: 'xianrenqiu',
        17: 'xianrenzhang',
        18: 'juxingxianrenzhang',
        46: 'xiaomogu',
        47: 'moguguai',
        300: 'puni'
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
        },

        btl_004_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/004/yiyou_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/004/yiyou_still.json'
        },
        btl_004_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/004/yiyou_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/004/yiyou_hit.json'
        },

        btl_005_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/005/youlian_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/005/youlian_still.json'
        },
        btl_005_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/005/youlian_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/005/youlian_hit.json'
        },

        btl_006_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/006/balusi_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/006/balusi_still.json'
        },
        btl_006_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/006/balusi_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/006/balusi_hit.json'
        },

        btl_007_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/007/xiaohuohou_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/007/xiaohuohou_still.json'
        },
        btl_007_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/007/xiaohuohou_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/007/xiaohuohou_hit.json'
        },

        btl_008_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/008/liehuohou_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/008/liehuohou_still.json'
        },
        btl_008_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/008/liehuohou_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/008/liehuohou_hit.json'
        },

        btl_009_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/009/lieyanxingxing_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/009/lieyanxingxing_still.json'
        },
        btl_009_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/009/lieyanxingxing_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/009/lieyanxingxing_hit.json'
        },

        btl_010_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/010/pipi_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/010/pipi_still.json'
        },
        btl_010_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/010/pipi_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/010/pipi_hit.json'
        },

        btl_011_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/011/bibuo_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/011/bibuo_still.json'
        },
        btl_011_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/011/bibuo_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/011/bibuo_hit.json'
        },

        btl_012_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/012/bokeer_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/012/bokeer_still.json'
        },
        btl_012_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/012/bokeer_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/012/bokeer_hit.json'
        },

        btl_016_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/016/xianrenqiu_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/016/xianrenqiu_still.json'
        },
        btl_016_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/016/xianrenqiu_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/016/xianrenqiu_hit.json'
        },

        btl_017_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/017/xianrenzhang_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/017/xianrenzhang_still.json'
        },
        btl_017_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/017/xianrenzhang_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/017/xianrenzhang_hit.json'
        },

        btl_018_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/018/juxingxianrenzhang_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/018/juxingxianrenzhang_still.json'
        },
        btl_018_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/018/juxingxianrenzhang_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/018/juxingxianrenzhang_hit.json'
        },

        btl_046_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/046/xiaomogu_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/046/xiaomogu_still.json'
        },
        btl_046_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/046/xiaomogu_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/046/xiaomogu_hit.json'
        },

        btl_047_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/047/moguguai_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/047/moguguai_still.json'
        },
        btl_047_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/047/moguguai_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/047/moguguai_hit.json'
        },

        btl_300_still: {
            texture: 'assets/images/elves/fighting_scene/01_still/300/puni_still.png',
            atlas: 'assets/images/elves/fighting_scene/01_still/300/puni_still.json'
        },
        btl_300_hit: {
            texture: 'assets/images/elves/fighting_scene/05_hit/300/puni_hit.png',
            atlas: 'assets/images/elves/fighting_scene/05_hit/300/puni_hit.json'
        }
    },

    /**
     * 战斗动画分组映射
     * clipType: still / hit
     */
    battleClips: {
        1: { still: ['btl_001_still'], hit: ['btl_001_hit'] },
        2: { still: ['btl_002_still'], hit: ['btl_002_hit'] },
        3: { still: ['btl_003_still'], hit: ['btl_003_hit'] },
        4: { still: ['btl_004_still'], hit: ['btl_004_hit'] },
        5: { still: ['btl_005_still'], hit: ['btl_005_hit'] },
        6: { still: ['btl_006_still'], hit: ['btl_006_hit'] },
        7: { still: ['btl_007_still'], hit: ['btl_007_hit'] },
        8: { still: ['btl_008_still'], hit: ['btl_008_hit'] },
        9: { still: ['btl_009_still'], hit: ['btl_009_hit'] },
        10: { still: ['btl_010_still'], hit: ['btl_010_hit'] },
        11: { still: ['btl_011_still'], hit: ['btl_011_hit'] },
        12: { still: ['btl_012_still'], hit: ['btl_012_hit'] },
        16: { still: ['btl_016_still'], hit: ['btl_016_hit'] },
        17: { still: ['btl_017_still'], hit: ['btl_017_hit'] },
        18: { still: ['btl_018_still'], hit: ['btl_018_hit'] },
        46: { still: ['btl_046_still'], hit: ['btl_046_hit'] },
        47: { still: ['btl_047_still'], hit: ['btl_047_hit'] },
        300: { still: ['btl_300_still'], hit: ['btl_300_hit'] }
    }
};

window.BattleAssets = BattleAssets;
