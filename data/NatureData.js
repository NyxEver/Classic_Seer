/**
 * NatureData - 性格数据
 * 25 种性格对五项属性产生 +10% 或 -10% 修正
 */

const NatureData = {
    natures: [
        // ============================================
        // 攻击提升性格（up: atk）
        // ============================================
        { name: '孤独', up: 'atk', down: 'def' },
        { name: '勇敢', up: 'atk', down: 'spd' },
        { name: '固执', up: 'atk', down: 'spAtk' },

        // ============================================
        // 防御提升性格（up: def）
        // ============================================
        { name: '调皮', up: 'def', down: 'spAtk' },
        { name: '大胆', up: 'def', down: 'atk' },
        { name: '无虑', up: 'def', down: 'spDef' },
        { name: '悠闲', up: 'def', down: 'spd' },
        { name: '顽皮', up: 'def', down: 'spAtk' },

        // ============================================
        // 特攻提升性格（up: spAtk）
        // ============================================
        { name: '保守', up: 'spAtk', down: 'atk' },
        { name: '马虎', up: 'spAtk', down: 'spDef' },
        { name: '稳重', up: 'spAtk', down: 'def' },
        { name: '冷静', up: 'spAtk', down: 'spd' },

        // ============================================
        // 特防提升性格（up: spDef）
        // ============================================
        { name: '沉着', up: 'spDef', down: 'atk' },
        { name: '狂妄', up: 'spDef', down: 'spd' },
        { name: '温顺', up: 'spDef', down: 'def' },
        { name: '慎重', up: 'spDef', down: 'spAtk' },

        // ============================================
        // 速度提升性格（up: spd）
        // ============================================
        { name: '胆小', up: 'spd', down: 'atk' },
        { name: '急躁', up: 'spd', down: 'def' },
        { name: '天真', up: 'spd', down: 'spAtk' },
        { name: '开朗', up: 'spd', down: 'spAtk' },

        // ============================================
        // 平衡型性格（无增减）
        // ============================================
        { name: '认真', up: null, down: null },
        { name: '坦率', up: null, down: null },
        { name: '实干', up: null, down: null },
        { name: '害羞', up: null, down: null },
        { name: '浮躁', up: null, down: null }
    ],

    /**
     * 获取性格修正系数
     * @param {string} natureName 性格名
     * @param {string} stat 属性字段名（atk/def/spAtk/spDef/spd）
     * @returns {number} 修正系数（1.1/0.9/1.0）
     */
    getModifier(natureName, stat) {
        const nature = this.getNature(natureName);
        if (!nature) {
            return 1.0;
        }

        if (nature.up === stat) {
            return 1.1;
        }
        if (nature.down === stat) {
            return 0.9;
        }
        return 1.0;
    },

    /**
     * 随机获取一个性格名
     * @returns {string} 性格名
     */
    getRandomNature() {
        const index = Math.floor(Math.random() * this.natures.length);
        return this.natures[index].name;
    },

    /**
     * 获取性格配置对象
     * @param {string} natureName 性格名
     * @returns {Object|null} 性格配置对象或 null
     */
    getNature(natureName) {
        for (let i = 0; i < this.natures.length; i++) {
            if (this.natures[i].name === natureName) {
                return this.natures[i];
            }
        }
        return null;
    }
};

window.NatureData = NatureData;

if (typeof AppContext !== 'undefined' && AppContext.register) {
    AppContext.register('NatureData', NatureData);
}
