/**
 * UIAssets - UI 图标资源子映射
 */

const UIAssets = {
    /**
     * 物品图标映射
     * key: 物品 ID
     * value: 图片资源名称（不含路径和扩展名）
     */
    items: {
        1: 'basic_capsule',
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
        spirit: '30px-spirit',
        status: '30px-status'
    },

    /**
     * 异常状态图标映射
     * key: 状态类型
     * value: 图标文件名（不含路径和扩展名）
     */
    statusIcons: {
        frostbite: 'dongshang',
        fear: 'haipa',
        paralysis: 'mabi',
        exhausted: 'pibei',
        burn: 'shaoshang',
        sleep: 'shuimian',
        poison: 'zhongdu'
    }
};

window.UIAssets = UIAssets;
