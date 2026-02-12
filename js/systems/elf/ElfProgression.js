/**
 * ElfProgression - 精灵成长职责（经验、升级、进化、学技）
 */

const ElfProgression = {
    /**
     * 获取升到下一级所需经验值
     * @param {Elf} elf
     * @param {number} maxLevel
     * @returns {number}
     */
    getExpToNextLevel(elf, maxLevel) {
        if (elf.level >= maxLevel) {
            return 0;
        }
        return elf.level * 100;
    },

    /**
     * 检查是否可以升级
     * @param {Elf} elf
     * @param {number} maxLevel
     * @returns {boolean}
     */
    canLevelUp(elf, maxLevel) {
        if (elf.level >= maxLevel) {
            return false;
        }
        return elf.exp >= this.getExpToNextLevel(elf, maxLevel);
    },

    /**
     * 检查是否可进化
     * @param {Elf} elf
     * @returns {boolean}
     */
    checkEvolution(elf) {
        if (!elf.evolvesTo || !elf.evolutionLevel) {
            return false;
        }
        return elf.level >= elf.evolutionLevel;
    },

    /**
     * 执行升级
     * @param {Elf} elf
     * @param {number} maxLevel
     * @returns {Object|null}
     */
    levelUp(elf, maxLevel) {
        if (!this.canLevelUp(elf, maxLevel)) {
            return null;
        }

        const expNeeded = this.getExpToNextLevel(elf, maxLevel);
        elf.exp -= expNeeded;
        elf.level += 1;
        if (elf.level > maxLevel) {
            elf.level = maxLevel;
        }

        if (elf.level >= maxLevel) {
            elf.exp = 0;
        }

        // 与重构前一致：升级后补满 HP
        elf.currentHp = elf.getMaxHp();

        const levelUpInfo = {
            newLevel: elf.level,
            newSkills: [],
            canEvolve: false,
            evolveTo: null
        };

        if (this.checkEvolution(elf)) {
            levelUpInfo.canEvolve = true;
            levelUpInfo.evolveTo = elf.evolvesTo;
            console.log(`[Elf] ${elf.getDisplayName()} 可以进化！目标 ID: ${elf.evolvesTo}`);
        }

        elf.learnableSkills.forEach((skillInfo) => {
            if (skillInfo.learnLevel === elf.level) {
                if (elf.skills.length < 4) {
                    elf.skills.push(skillInfo.skillId);
                    const skillData = DataLoader.getSkill(skillInfo.skillId);
                    if (skillData) {
                        elf.skillPP[skillInfo.skillId] = skillData.pp;
                    }
                    levelUpInfo.newSkills.push(skillInfo.skillId);
                    console.log(`[Elf] ${elf.getDisplayName()} 学会了新技能: ${skillData ? skillData.name : skillInfo.skillId}`);
                } else {
                    levelUpInfo.pendingSkill = skillInfo.skillId;
                    elf.pendingSkills.push(skillInfo.skillId);
                    console.log(`[Elf] ${elf.getDisplayName()} 可以学习新技能但技能槽已满，已加入待学习列表`);
                }
            }
        });

        elf._syncInstanceData();
        console.log(`[Elf] ${elf.getDisplayName()} 升级到 ${elf.level} 级！`);
        return levelUpInfo;
    },

    /**
     * 执行进化
     * @param {Elf} elf
     * @returns {Object|null}
     */
    evolve(elf) {
        if (!this.checkEvolution(elf)) {
            console.warn('[Elf] 无法进化：条件不满足');
            return null;
        }

        const newElfData = DataLoader.getElf(elf.evolvesTo);
        if (!newElfData) {
            console.error(`[Elf] 进化失败：找不到目标精灵 ID=${elf.evolvesTo}`);
            return null;
        }

        const oldName = elf.name;
        const oldId = elf.id;

        elf.id = newElfData.id;
        elf.name = newElfData.name;
        elf.type = newElfData.type;
        elf.baseStats = newElfData.baseStats;
        elf.learnableSkills = newElfData.learnableSkills;
        elf.evolutionLevel = newElfData.evolveLevel;
        elf.evolvesTo = newElfData.evolveTo;
        elf.evolutionChainId = newElfData.evolutionChainId;
        elf.catchRate = newElfData.catchRate;
        elf.evYield = newElfData.evYield;

        elf._instanceData.elfId = newElfData.id;

        // 与重构前一致：按当前实现计算比例
        const hpRatio = elf.currentHp / elf.getMaxHp();
        const newMaxHp = elf.getMaxHp();
        elf.currentHp = Math.ceil(newMaxHp * hpRatio);
        if (elf.currentHp > newMaxHp) {
            elf.currentHp = newMaxHp;
        }

        elf._syncInstanceData();

        console.log(`[Elf] 进化完成：${oldName} → ${elf.name}`);

        if (typeof PlayerData !== 'undefined') {
            PlayerData.markCaught(elf.id);
        }

        return {
            oldId: oldId,
            oldName: oldName,
            newId: elf.id,
            newName: elf.name
        };
    },

    /**
     * 添加经验并处理连升
     * @param {Elf} elf
     * @param {number} amount
     * @param {number} maxLevel
     * @returns {Array}
     */
    addExp(elf, amount, maxLevel) {
        console.log(`[Elf] ${elf.getDisplayName()} 获得 ${amount} 经验 (当前: ${elf.exp})`);

        if (elf.level >= maxLevel) {
            elf.exp = 0;
            elf._syncInstanceData();
            return [];
        }

        elf.exp += amount;

        const levelUpResults = [];
        while (this.canLevelUp(elf, maxLevel)) {
            const result = this.levelUp(elf, maxLevel);
            if (result) {
                levelUpResults.push(result);
                if (typeof QuestManager !== 'undefined') {
                    QuestManager.updateProgress('levelUp', elf.id, result.newLevel);
                }
            }

            if (elf.level >= maxLevel) {
                elf.exp = 0;
                break;
            }
        }

        elf._syncInstanceData();
        return levelUpResults;
    }
};

window.ElfProgression = ElfProgression;
