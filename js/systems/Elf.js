/**
 * Elf - 精灵类
 * 结合基础数据和实例数据，提供属性计算和状态管理
 */
const ELF_MAX_LEVEL = 100;

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
        this.evolutionLevel = elfData.evolveLevel;  // 注意：数据层用 evolveLevel
        this.evolvesTo = elfData.evolveTo;          // 注意：数据层用 evolveTo
        this.evolutionChainId = elfData.evolutionChainId;
        this.catchRate = elfData.catchRate;
        this.evYield = elfData.evYield;

        // 实例数据（来自玩家存档）
        this.nickname = instanceData.nickname;
        // 等级统一限制在 [1, 100]，避免脏存档或调试入口越界
        this.level = Math.max(1, Math.min(instanceData.level, ELF_MAX_LEVEL));
        this.exp = instanceData.exp;
        if (this.level >= ELF_MAX_LEVEL) {
            this.exp = 0;
        }
        this.currentHp = instanceData.currentHp;
        this.skills = instanceData.skills || [];
        this.skillPP = instanceData.skillPP || {};
        this.iv = instanceData.iv;
        this.ev = instanceData.ev;
        this.pendingSkills = instanceData.pendingSkills || [];  // 待学习的技能（技能槽已满时）

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
        return ElfStats.calculateStat(this, stat, isHp);
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
        return ElfStats.getTotalEV(this);
    }

    /**
     * 增加努力值
     * @param {string} stat - 属性名 (hp/atk/spAtk/def/spDef/spd)
     * @param {number} amount - 增加量
     * @returns {number} - 实际增加的量
     */
    addEV(stat, amount) {
        return ElfStats.addEV(this, stat, amount);
    }

    /**
     * 从击败的精灵获取努力值
     * @param {Object} defeatedElf - 被击败精灵的 Elf 实例或 elfData
     */
    gainEVFromDefeat(defeatedElf) {
        ElfStats.gainEVFromDefeat(this, defeatedElf);
    }

    /**
     * 获取升到下一级所需经验值
     * 公式：当前等级 * 100
     * @returns {number}
     */
    getExpToNextLevel() {
        return ElfProgression.getExpToNextLevel(this, ELF_MAX_LEVEL);
    }

    /**
     * 检查是否可以升级
     * @returns {boolean}
     */
    canLevelUp() {
        return ElfProgression.canLevelUp(this, ELF_MAX_LEVEL);
    }

    /**
     * 执行升级
     * @returns {Object|null} - 升级信息，包含是否学会新技能
     */
    levelUp() {
        return ElfProgression.levelUp(this, ELF_MAX_LEVEL);
    }

    /**
     * 检查是否可以进化
     * @returns {boolean} - 是否可以进化
     */
    checkEvolution() {
        return ElfProgression.checkEvolution(this);
    }

    /**
     * 执行进化
     * 将精灵转变为进化后的形态，保留技能槽、IV、EV 等
     * @returns {Object|null} - 进化后的精灵数据，失败返回 null
     */
    evolve() {
        return ElfProgression.evolve(this);
    }

    /**
     * 添加经验值，处理升级逻辑
     * @param {number} amount - 经验值
     * @returns {Array} - 升级信息数组（可能连续升级）
     */
    addExp(amount) {
        return ElfProgression.addExp(this, amount, ELF_MAX_LEVEL);
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
        return ElfStats.getStats(this);
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
        this._instanceData.pendingSkills = this.pendingSkills;  // 同步待学习技能
        this._instanceData.elfId = this.id;  // 同步精灵 ID（进化后会变）
    }

    /**
     * 获取待学习技能列表
     * @returns {Array<number>} - 待学习的技能 ID 数组
     */
    getPendingSkills() {
        return this.pendingSkills || [];
    }

    /**
     * 清除待学习技能列表
     */
    clearPendingSkills() {
        this.pendingSkills = [];
        this._syncInstanceData();
    }

    /**
     * 从待学习列表中移除指定技能（学习或放弃后调用）
     * @param {number} skillId - 技能 ID
     */
    removePendingSkill(skillId) {
        const index = this.pendingSkills.indexOf(skillId);
        if (index > -1) {
            this.pendingSkills.splice(index, 1);
            this._syncInstanceData();
        }
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
            level: Math.max(1, Math.min(level, ELF_MAX_LEVEL)),
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

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('Elf', Elf);
}

// 导出为全局对象
window.Elf = Elf;
