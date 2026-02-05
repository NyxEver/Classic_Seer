/**
 * DataLoader - 数据加载器
 * 从全局 JavaScript 数据对象中加载数据（避免 CORS 问题）
 */

const DataLoader = {
    // 数据存储
    elves: null,
    skills: null,
    typeChart: null,
    typeNames: null,
    items: null,

    // 加载状态
    isLoaded: false,

    /**
     * 初始化数据加载器
     * 从全局定义的 JavaScript 数据对象中读取数据
     */
    init() {
        console.log('[DataLoader] 开始加载数据...');

        try {
            // 从全局对象读取精灵数据
            if (typeof ElvesData === 'undefined') {
                throw new Error('ElvesData 未定义，请确保 ElvesData.js 已加载');
            }
            this.elves = {};
            ElvesData.elves.forEach(elf => {
                this.elves[elf.id] = elf;
            });

            // 从全局对象读取技能数据
            if (typeof SkillsData === 'undefined') {
                throw new Error('SkillsData 未定义，请确保 SkillsData.js 已加载');
            }
            this.skills = {};
            SkillsData.skills.forEach(skill => {
                this.skills[skill.id] = skill;
            });

            // 从全局对象读取属性克制表
            if (typeof TypeChartData === 'undefined') {
                throw new Error('TypeChartData 未定义，请确保 TypeChartData.js 已加载');
            }
            this.typeChart = TypeChartData.typeChart;
            this.typeNames = TypeChartData.typeNames;

            // 从全局对象读取物品数据
            if (typeof ItemsData === 'undefined') {
                throw new Error('ItemsData 未定义，请确保 ItemsData.js 已加载');
            }
            this.items = {};
            ItemsData.items.forEach(item => {
                this.items[item.id] = item;
            });

            this.isLoaded = true;
            console.log('[DataLoader] 数据加载完成');
            console.log('[DataLoader] 精灵数据:', this.elves);
            console.log('[DataLoader] 技能数据:', this.skills);
            console.log('[DataLoader] 属性克制表:', this.typeChart);
            console.log('[DataLoader] 物品数据:', this.items);

            return true;

        } catch (error) {
            console.error('[DataLoader] 数据加载失败:', error);
            throw error;
        }
    },

    /**
     * 根据 ID 获取精灵基础数据
     * @param {number} elfId - 精灵 ID
     * @returns {Object|null} - 精灵数据或 null
     */
    getElf(elfId) {
        if (!this.isLoaded) {
            console.warn('[DataLoader] 数据尚未加载');
            return null;
        }
        return this.elves[elfId] || null;
    },

    /**
     * 根据 ID 获取技能数据
     * @param {number} skillId - 技能 ID
     * @returns {Object|null} - 技能数据或 null
     */
    getSkill(skillId) {
        if (!this.isLoaded) {
            console.warn('[DataLoader] 数据尚未加载');
            return null;
        }
        return this.skills[skillId] || null;
    },

    /**
     * 获取属性克制倍率
     * @param {string} attackType - 攻击方属性
     * @param {string} defenseType - 防御方属性
     * @returns {number} - 克制倍率 (2, 1, 0.5, 0)
     */
    getTypeEffectiveness(attackType, defenseType) {
        if (!this.isLoaded || !this.typeChart) {
            console.warn('[DataLoader] 数据尚未加载');
            return 1;
        }

        const attackTypeChart = this.typeChart[attackType];
        if (!attackTypeChart) {
            // 未定义的属性默认返回 1
            return 1;
        }

        // 如果防御属性未在克制表中定义，返回 1
        return attackTypeChart[defenseType] !== undefined ? attackTypeChart[defenseType] : 1;
    },

    /**
     * 获取属性中文名
     * @param {string} type - 属性英文名
     * @returns {string} - 属性中文名
     */
    getTypeName(type) {
        if (!this.typeNames) {
            return type;
        }
        return this.typeNames[type] || type;
    },

    /**
     * 根据 ID 获取物品数据
     * @param {number} itemId - 物品 ID
     * @returns {Object|null} - 物品数据或 null
     */
    getItem(itemId) {
        if (!this.isLoaded) {
            console.warn('[DataLoader] 数据尚未加载');
            return null;
        }
        return this.items[itemId] || null;
    }
};

// 导出为全局对象
window.DataLoader = DataLoader;
