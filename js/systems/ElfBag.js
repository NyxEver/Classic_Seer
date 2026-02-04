/**
 * ElfBag - 精灵背包管理器
 * 管理玩家拥有的所有精灵
 */

const ElfBag = {
    /**
     * 获取所有精灵实例（Elf 对象数组）
     * @returns {Array<Elf>}
     */
    getAll() {
        if (!PlayerData.elves || PlayerData.elves.length === 0) {
            return [];
        }

        return PlayerData.elves.map(instanceData => {
            return Elf.create(instanceData.elfId, instanceData);
        }).filter(elf => elf !== null);
    },

    /**
     * 获取精灵数量
     * @returns {number}
     */
    getCount() {
        return PlayerData.elves ? PlayerData.elves.length : 0;
    },

    /**
     * 获取指定位置的精灵
     * @param {number} index - 索引位置
     * @returns {Elf|null}
     */
    getByIndex(index) {
        if (!PlayerData.elves || index < 0 || index >= PlayerData.elves.length) {
            console.warn(`[ElfBag] 无效的索引: ${index}`);
            return null;
        }

        const instanceData = PlayerData.elves[index];
        return Elf.create(instanceData.elfId, instanceData);
    },

    /**
     * 添加新精灵到背包
     * @param {number} elfId - 精灵 ID
     * @param {number} level - 等级
     * @param {string} nickname - 昵称（可选）
     * @returns {boolean} - 添加是否成功
     */
    add(elfId, level, nickname = null) {
        const result = PlayerData.addElf(elfId, level, nickname);
        if (result) {
            console.log(`[ElfBag] 添加精灵成功: ID=${elfId}, 等级=${level}`);
        }
        return result;
    },

    /**
     * 从捕获的 Elf 实例添加到背包
     * @param {Elf} elf - 捕获的精灵实例
     * @param {string} nickname - 昵称（可选）
     * @returns {boolean}
     */
    addFromCapture(elf, nickname = null) {
        const instanceData = {
            elfId: elf.id,
            nickname: nickname,
            level: elf.level,
            exp: elf.exp,
            currentHp: elf.currentHp,
            skills: elf.skills.slice(),
            skillPP: { ...elf.skillPP },
            iv: { ...elf.iv },
            ev: { ...elf.ev }
        };

        PlayerData.elves.push(instanceData);
        console.log(`[ElfBag] 捕获精灵添加成功: ${elf.getDisplayName()}`);
        return true;
    },

    /**
     * 移除指定位置的精灵
     * @param {number} index - 索引位置
     * @returns {boolean} - 移除是否成功
     */
    remove(index) {
        if (!PlayerData.elves || index < 0 || index >= PlayerData.elves.length) {
            console.warn(`[ElfBag] 无法移除，无效的索引: ${index}`);
            return false;
        }

        // 不能移除最后一只精灵
        if (PlayerData.elves.length <= 1) {
            console.warn('[ElfBag] 不能移除最后一只精灵');
            return false;
        }

        const removed = PlayerData.elves.splice(index, 1);
        console.log(`[ElfBag] 移除精灵成功: 索引=${index}`);
        return true;
    },

    /**
     * 交换两只精灵的位置
     * @param {number} index1 - 第一个索引
     * @param {number} index2 - 第二个索引
     * @returns {boolean} - 交换是否成功
     */
    swap(index1, index2) {
        if (!PlayerData.elves) return false;

        if (index1 < 0 || index1 >= PlayerData.elves.length ||
            index2 < 0 || index2 >= PlayerData.elves.length) {
            console.warn(`[ElfBag] 无效的交换索引: ${index1}, ${index2}`);
            return false;
        }

        if (index1 === index2) return true;

        const temp = PlayerData.elves[index1];
        PlayerData.elves[index1] = PlayerData.elves[index2];
        PlayerData.elves[index2] = temp;

        console.log(`[ElfBag] 交换精灵位置: ${index1} <-> ${index2}`);
        return true;
    },

    /**
     * 获取第一只 HP > 0 的精灵
     * @returns {Elf|null}
     */
    getFirstAvailable() {
        if (!PlayerData.elves || PlayerData.elves.length === 0) {
            return null;
        }

        for (let i = 0; i < PlayerData.elves.length; i++) {
            const instanceData = PlayerData.elves[i];
            if (instanceData.currentHp > 0) {
                return Elf.create(instanceData.elfId, instanceData);
            }
        }
        return null;
    },

    /**
     * 获取第一只 HP > 0 的精灵的索引
     * @returns {number} - 索引，-1 表示没有可用精灵
     */
    getFirstAvailableIndex() {
        if (!PlayerData.elves) return -1;

        for (let i = 0; i < PlayerData.elves.length; i++) {
            if (PlayerData.elves[i].currentHp > 0) {
                return i;
            }
        }
        return -1;
    },

    /**
     * 检查是否所有精灵都倒下
     * @returns {boolean}
     */
    allFainted() {
        if (!PlayerData.elves || PlayerData.elves.length === 0) {
            return true;
        }

        return PlayerData.elves.every(instanceData => instanceData.currentHp <= 0);
    },

    /**
     * 恢复所有精灵的 HP 和 PP
     */
    healAll() {
        if (!PlayerData.elves) return;

        PlayerData.elves.forEach(instanceData => {
            const elf = Elf.create(instanceData.elfId, instanceData);
            if (elf) {
                elf.currentHp = elf.getMaxHp();
                elf.restorePP();
                elf._syncInstanceData();
            }
        });
        console.log('[ElfBag] 所有精灵已恢复');
    },

    /**
     * 获取队伍状态摘要
     * @returns {Object}
     */
    getTeamStatus() {
        const elves = this.getAll();
        const total = elves.length;
        const healthy = elves.filter(e => e.currentHp > 0).length;
        const fainted = total - healthy;

        return {
            total,
            healthy,
            fainted,
            allFainted: healthy === 0
        };
    }
};

// 导出为全局对象
window.ElfBag = ElfBag;
