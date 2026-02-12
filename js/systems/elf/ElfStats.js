/**
 * ElfStats - 精灵属性与努力值职责
 */

const ElfStats = {
    EV_SINGLE_MAX: 255,
    EV_TOTAL_MAX: 510,

    /**
     * 属性计算核心方法
     * 公式：floor((基础值 * 2 + 个体值 + floor(努力值 / 4)) * 等级 / 100 + 10 + 等级)
     * HP 有额外加 10，其他属性加 5
     * @param {Elf} elf
     * @param {string} stat
     * @param {boolean} isHp
     * @returns {number}
     */
    calculateStat(elf, stat, isHp = false) {
        const base = elf.baseStats[stat];
        const iv = elf.iv[stat];
        const ev = elf.ev[stat];

        return Math.floor(
            (base * 2 + iv + Math.floor(ev / 4)) * elf.level / 100 + (isHp ? 10 : 5) + elf.level
        );
    },

    /**
     * 获取努力值总和
     * @param {Elf} elf
     * @returns {number}
     */
    getTotalEV(elf) {
        return elf.ev.hp + elf.ev.atk + elf.ev.spAtk + elf.ev.def + elf.ev.spDef + elf.ev.spd;
    },

    /**
     * 增加努力值
     * @param {Elf} elf
     * @param {string} stat
     * @param {number} amount
     * @returns {number}
     */
    addEV(elf, stat, amount) {
        const currentTotal = this.getTotalEV(elf);
        const currentStat = elf.ev[stat];
        let canAdd = amount;

        if (currentStat + canAdd > this.EV_SINGLE_MAX) {
            canAdd = this.EV_SINGLE_MAX - currentStat;
        }

        if (currentTotal + canAdd > this.EV_TOTAL_MAX) {
            canAdd = this.EV_TOTAL_MAX - currentTotal;
        }

        if (canAdd > 0) {
            elf.ev[stat] += canAdd;
            elf._syncInstanceData();
            console.log(`[Elf] ${elf.getDisplayName()} ${stat} EV +${canAdd} (现在: ${elf.ev[stat]})`);
        }

        return canAdd;
    },

    /**
     * 从击败的精灵获取努力值
     * @param {Elf} elf
     * @param {Object} defeatedElf
     */
    gainEVFromDefeat(elf, defeatedElf) {
        const evYield = defeatedElf.evYield;
        if (!evYield) {
            return;
        }

        const stats = ['hp', 'atk', 'spAtk', 'def', 'spDef', 'spd'];
        stats.forEach((stat) => {
            if (evYield[stat] > 0) {
                this.addEV(elf, stat, evYield[stat]);
            }
        });
    },

    /**
     * 获取完整属性信息（用于 UI）
     * @param {Elf} elf
     * @returns {Object}
     */
    getStats(elf) {
        return {
            hp: this.calculateStat(elf, 'hp', true),
            currentHp: elf.currentHp,
            atk: this.calculateStat(elf, 'atk'),
            spAtk: this.calculateStat(elf, 'spAtk'),
            def: this.calculateStat(elf, 'def'),
            spDef: this.calculateStat(elf, 'spDef'),
            spd: this.calculateStat(elf, 'spd')
        };
    }
};

window.ElfStats = ElfStats;
