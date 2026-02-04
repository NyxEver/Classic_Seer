/**
 * Elf - 精灵类
 * 结合基础数据和实例数据，提供属性计算和状态管理
 */

class Elf {
    /**
     * 构造函数
     * @param {Object} elfData - 来自 ElvesData 的基础数据
     * @param {Object} instanceData - 来自玩家存档的实例数据
     */
    constructor(elfData, instanceData) {
        // 基础数据（来自 ElvesData）
        this.id = elfData.id;
        this.name = elfData.name;
        this.type = elfData.type;
        this.baseStats = elfData.baseStats;
        this.learnableSkills = elfData.learnableSkills;
        this.evolutionLevel = elfData.evolutionLevel;
        this.evolvesTo = elfData.evolvesTo;
        this.catchRate = elfData.catchRate;
        this.evYield = elfData.evYield;

        // 实例数据（来自玩家存档）
        this.nickname = instanceData.nickname;
        this.level = instanceData.level;
        this.exp = instanceData.exp;
        this.currentHp = instanceData.currentHp;
        this.skills = instanceData.skills || [];
        this.skillPP = instanceData.skillPP || {};
        this.iv = instanceData.iv;
        this.ev = instanceData.ev;

        // 保持对原始实例数据的引用，用于同步更新
        this._instanceData = instanceData;
    }

    /**
     * 获取显示名称（优先昵称）
     * @returns {string}
     */
    getDisplayName() {
        return this.nickname || this.name;
    }

    /**
     * 属性计算核心方法
     * 公式：floor((基础值 * 2 + 个体值 + floor(努力值 / 4)) * 等级 / 100 + 10 + 等级)
     * HP 有额外加 10，其他属性加 5
     * @param {string} stat - 属性名
     * @param {boolean} isHp - 是否为 HP
     * @returns {number}
     */
    _calculateStat(stat, isHp = false) {
        const base = this.baseStats[stat];
        const iv = this.iv[stat];
        const ev = this.ev[stat];

        const statValue = Math.floor(
            (base * 2 + iv + Math.floor(ev / 4)) * this.level / 100 + (isHp ? 10 : 5) + this.level
        );

        return statValue;
    }

    /**
     * 获取最大 HP
     * @returns {number}
     */
    getMaxHp() {
        return this._calculateStat('hp', true);
    }

    /**
     * 获取攻击力
     * @returns {number}
     */
    getAtk() {
        return this._calculateStat('atk');
    }

    /**
     * 获取特攻
     * @returns {number}
     */
    getSpAtk() {
        return this._calculateStat('spAtk');
    }

    /**
     * 获取防御
     * @returns {number}
     */
    getDef() {
        return this._calculateStat('def');
    }

    /**
     * 获取特防
     * @returns {number}
     */
    getSpDef() {
        return this._calculateStat('spDef');
    }

    /**
     * 获取速度
     * @returns {number}
     */
    getSpd() {
        return this._calculateStat('spd');
    }

    /**
     * 获取努力值总和
     * @returns {number}
     */
    getTotalEV() {
        return this.ev.hp + this.ev.atk + this.ev.spAtk +
            this.ev.def + this.ev.spDef + this.ev.spd;
    }

    /**
     * 增加努力值
     * @param {string} stat - 属性名 (hp/atk/spAtk/def/spDef/spd)
     * @param {number} amount - 增加量
     * @returns {number} - 实际增加的量
     */
    addEV(stat, amount) {
        const EV_SINGLE_MAX = 255;
        const EV_TOTAL_MAX = 510;

        const currentTotal = this.getTotalEV();
        const currentStat = this.ev[stat];

        // 计算可增加的量
        let canAdd = amount;

        // 检查单项上限
        if (currentStat + canAdd > EV_SINGLE_MAX) {
            canAdd = EV_SINGLE_MAX - currentStat;
        }

        // 检查总和上限
        if (currentTotal + canAdd > EV_TOTAL_MAX) {
            canAdd = EV_TOTAL_MAX - currentTotal;
        }

        if (canAdd > 0) {
            this.ev[stat] += canAdd;
            this._syncInstanceData();
            console.log(`[Elf] ${this.getDisplayName()} ${stat} EV +${canAdd} (现在: ${this.ev[stat]})`);
        }

        return canAdd;
    }

    /**
     * 从击败的精灵获取努力值
     * @param {Object} defeatedElf - 被击败精灵的 Elf 实例或 elfData
     */
    gainEVFromDefeat(defeatedElf) {
        const evYield = defeatedElf.evYield;
        if (!evYield) return;

        const stats = ['hp', 'atk', 'spAtk', 'def', 'spDef', 'spd'];
        stats.forEach(stat => {
            if (evYield[stat] > 0) {
                this.addEV(stat, evYield[stat]);
            }
        });
    }

    /**
     * 获取升到下一级所需经验值
     * 公式：当前等级 * 100
     * @returns {number}
     */
    getExpToNextLevel() {
        return this.level * 100;
    }

    /**
     * 检查是否可以升级
     * @returns {boolean}
     */
    canLevelUp() {
        return this.exp >= this.getExpToNextLevel();
    }

    /**
     * 执行升级
     * @returns {Object|null} - 升级信息，包含是否学会新技能
     */
    levelUp() {
        if (!this.canLevelUp()) {
            return null;
        }

        const expNeeded = this.getExpToNextLevel();
        this.exp -= expNeeded;
        this.level += 1;

        // 升级后提升 HP（保持相同 HP 百分比或补满）
        const oldMaxHp = this._instanceData.currentHp; // 之前的 currentHp
        const newMaxHp = this.getMaxHp();

        // 简单起见，升级后完全恢复 HP
        this.currentHp = newMaxHp;

        const levelUpInfo = {
            newLevel: this.level,
            newSkills: []
        };

        // 检查是否学会新技能
        this.learnableSkills.forEach(skillInfo => {
            if (skillInfo.learnLevel === this.level) {
                // 检查技能槽是否已满
                if (this.skills.length < 4) {
                    this.skills.push(skillInfo.skillId);
                    // 初始化 PP
                    const skillData = DataLoader.getSkill(skillInfo.skillId);
                    if (skillData) {
                        this.skillPP[skillInfo.skillId] = skillData.pp;
                    }
                    levelUpInfo.newSkills.push(skillInfo.skillId);
                    console.log(`[Elf] ${this.getDisplayName()} 学会了新技能: ${skillData ? skillData.name : skillInfo.skillId}`);
                } else {
                    // 技能槽已满，需要提示玩家选择替换（后续实现）
                    levelUpInfo.pendingSkill = skillInfo.skillId;
                    console.log(`[Elf] ${this.getDisplayName()} 可以学习新技能但技能槽已满`);
                }
            }
        });

        this._syncInstanceData();
        console.log(`[Elf] ${this.getDisplayName()} 升级到 ${this.level} 级！`);

        return levelUpInfo;
    }

    /**
     * 添加经验值，处理升级逻辑
     * @param {number} amount - 经验值
     * @returns {Array} - 升级信息数组（可能连续升级）
     */
    addExp(amount) {
        console.log(`[Elf] ${this.getDisplayName()} 获得 ${amount} 经验 (当前: ${this.exp})`);
        this.exp += amount;

        const levelUpResults = [];

        // 处理可能的连续升级
        while (this.canLevelUp()) {
            const result = this.levelUp();
            if (result) {
                levelUpResults.push(result);
            }
        }

        this._syncInstanceData();
        return levelUpResults;
    }

    /**
     * 受到伤害
     * @param {number} damage - 伤害值
     * @returns {boolean} - 是否倒下
     */
    takeDamage(damage) {
        this.currentHp = Math.max(0, this.currentHp - damage);
        this._syncInstanceData();
        console.log(`[Elf] ${this.getDisplayName()} 受到 ${damage} 伤害，剩余 HP: ${this.currentHp}/${this.getMaxHp()}`);
        return this.isFainted();
    }

    /**
     * 恢复 HP
     * @param {number} amount - 恢复量
     */
    heal(amount) {
        const maxHp = this.getMaxHp();
        const oldHp = this.currentHp;
        this.currentHp = Math.min(maxHp, this.currentHp + amount);
        this._syncInstanceData();
        console.log(`[Elf] ${this.getDisplayName()} 恢复 ${this.currentHp - oldHp} HP (${this.currentHp}/${maxHp})`);
    }

    /**
     * 检查是否倒下
     * @returns {boolean}
     */
    isFainted() {
        return this.currentHp <= 0;
    }

    /**
     * 获取 HP 百分比
     * @returns {number} - 0-100 的百分比
     */
    getHpPercent() {
        return Math.floor((this.currentHp / this.getMaxHp()) * 100);
    }

    /**
     * 使用技能（消耗 PP）
     * @param {number} skillId - 技能 ID
     * @returns {boolean} - 是否成功使用
     */
    useSkill(skillId) {
        if (!this.skills.includes(skillId)) {
            console.warn(`[Elf] ${this.getDisplayName()} 没有技能 ${skillId}`);
            return false;
        }

        if (!this.skillPP[skillId] || this.skillPP[skillId] <= 0) {
            console.warn(`[Elf] 技能 ${skillId} PP 不足`);
            return false;
        }

        this.skillPP[skillId] -= 1;
        this._syncInstanceData();
        return true;
    }

    /**
     * 恢复技能 PP
     * @param {number} skillId - 技能 ID（null 表示恢复所有技能）
     * @param {number} amount - 恢复量
     */
    restorePP(skillId = null, amount = 999) {
        if (skillId !== null) {
            const skillData = DataLoader.getSkill(skillId);
            if (skillData && this.skillPP[skillId] !== undefined) {
                this.skillPP[skillId] = Math.min(skillData.pp, this.skillPP[skillId] + amount);
            }
        } else {
            // 恢复所有技能
            this.skills.forEach(sid => {
                const skillData = DataLoader.getSkill(sid);
                if (skillData) {
                    this.skillPP[sid] = skillData.pp;
                }
            });
        }
        this._syncInstanceData();
    }

    /**
     * 获取所有技能的详细信息
     * @returns {Array}
     */
    getSkillDetails() {
        return this.skills.map(skillId => {
            const skillData = DataLoader.getSkill(skillId);
            return {
                ...skillData,
                currentPP: this.skillPP[skillId] || 0
            };
        });
    }

    /**
     * 获取完整的属性信息（用于 UI 显示）
     * @returns {Object}
     */
    getStats() {
        return {
            hp: this.getMaxHp(),
            currentHp: this.currentHp,
            atk: this.getAtk(),
            spAtk: this.getSpAtk(),
            def: this.getDef(),
            spDef: this.getSpDef(),
            spd: this.getSpd()
        };
    }

    /**
     * 同步更新到实例数据（用于保存）
     * @private
     */
    _syncInstanceData() {
        this._instanceData.level = this.level;
        this._instanceData.exp = this.exp;
        this._instanceData.currentHp = this.currentHp;
        this._instanceData.skills = this.skills;
        this._instanceData.skillPP = this.skillPP;
        this._instanceData.iv = this.iv;
        this._instanceData.ev = this.ev;
    }

    /**
     * 创建精灵实例的静态工厂方法
     * @param {number} elfId - 精灵 ID
     * @param {Object} instanceData - 实例数据
     * @returns {Elf|null}
     */
    static create(elfId, instanceData) {
        const elfData = DataLoader.getElf(elfId);
        if (!elfData) {
            console.error(`[Elf] 找不到精灵 ID: ${elfId}`);
            return null;
        }
        return new Elf(elfData, instanceData);
    }

    /**
     * 创建野生精灵实例
     * @param {number} elfId - 精灵 ID
     * @param {number} level - 等级
     * @returns {Elf|null}
     */
    static createWild(elfId, level) {
        const elfData = DataLoader.getElf(elfId);
        if (!elfData) {
            console.error(`[Elf] 找不到精灵 ID: ${elfId}`);
            return null;
        }

        // 生成随机 IV
        const iv = {
            hp: Math.floor(Math.random() * 32),
            atk: Math.floor(Math.random() * 32),
            spAtk: Math.floor(Math.random() * 32),
            def: Math.floor(Math.random() * 32),
            spDef: Math.floor(Math.random() * 32),
            spd: Math.floor(Math.random() * 32)
        };

        // 初始 EV 全 0
        const ev = { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 0 };

        // 根据等级确定初始技能
        const skills = [];
        elfData.learnableSkills.forEach(skillInfo => {
            if (skillInfo.learnLevel <= level && skills.length < 4) {
                skills.push(skillInfo.skillId);
            }
        });

        // 初始化技能 PP
        const skillPP = {};
        skills.forEach(skillId => {
            const skillData = DataLoader.getSkill(skillId);
            if (skillData) {
                skillPP[skillId] = skillData.pp;
            }
        });

        const instanceData = {
            elfId: elfId,
            nickname: null,
            level: level,
            exp: 0,
            currentHp: 0, // 临时，将在构造后计算
            skills: skills,
            skillPP: skillPP,
            iv: iv,
            ev: ev
        };

        const elf = new Elf(elfData, instanceData);

        // 设置满 HP
        elf.currentHp = elf.getMaxHp();
        elf._syncInstanceData();

        return elf;
    }
}

// 导出为全局对象
window.Elf = Elf;
