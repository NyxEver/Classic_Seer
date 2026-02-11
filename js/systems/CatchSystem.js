/**
 * CatchSystem - 捕捉系统
 * 处理精灵捕捉的概率计算和结果判定
 */

const CatchSystem = {
    /**
     * 计算捕捉成功率
     * @param {Elf} elf - 目标精灵实例
     * @param {Object} capsule - 胶囊数据
     * @returns {number} - 捕捉成功率 (0-100)
     */
    calculateCatchRate(elf, capsule) {
        // 获取精灵基础捕捉率
        const targetElfId = elf && typeof elf.id === 'number' ? elf.id : elf.elfId;
        const elfData = DataLoader.getElf(targetElfId);
        const baseCatchRate = elfData ? elfData.catchRate : 50;

        // HP 加成：HP 越低越容易抓
        // (1 - 当前HP/最大HP) * 50
        const maxHp = elf.getMaxHp();
        const currentHp = elf.currentHp;
        const hpBonus = Math.floor((1 - currentHp / maxHp) * 50);

        // 胶囊加成
        const capsuleBonus = capsule.effect ? capsule.effect.catchBonus : 0;

        // 最终捕捉率，最高 100
        const finalRate = Math.min(baseCatchRate + hpBonus + capsuleBonus, 100);

        console.log(`[CatchSystem] 捕捉率计算:`);
        console.log(`  基础捕捉率: ${baseCatchRate}`);
        console.log(`  HP 加成: ${hpBonus} (${currentHp}/${maxHp})`);
        console.log(`  胶囊加成: ${capsuleBonus}`);
        console.log(`  最终捕捉率: ${finalRate}%`);

        return finalRate;
    },

    /**
     * 尝试捕捉精灵
     * @param {Elf} elf - 目标精灵实例
     * @param {Object} capsule - 胶囊数据
     * @returns {Object} - 捕捉结果 {success, rate, shakes}
     */
    attemptCatch(elf, capsule) {
        // 开发者模式：100% 捕捉
        if (typeof DevMode !== 'undefined' && DevMode.alwaysCatch) {
            console.log('[CatchSystem] 开发者模式：100% 捕捉成功');
            return {
                success: true,
                rate: 100,
                shakes: 3
            };
        }

        const rate = this.calculateCatchRate(elf, capsule);
        const roll = Math.random() * 100;
        const success = roll < rate;

        // 计算晃动次数 (1-3 次)
        // 晃动次数与成功率相关，成功率越高晃动次数越多
        let shakes = 1;
        if (rate >= 30) shakes = 2;
        if (rate >= 60 || success) shakes = 3;

        console.log(`[CatchSystem] 捕捉判定: 需要 < ${rate}，实际 ${roll.toFixed(2)}，${success ? '成功' : '失败'}`);

        return {
            success: success,
            rate: rate,
            shakes: shakes
        };
    },

    /**
     * 捕捉成功后将精灵加入背包
     * @param {Elf} elf - 被捕捉的精灵
     * @returns {boolean} - 是否成功添加
     */
    addCapturedElf(elf) {
        // 创建精灵实例数据
        // 注意：Elf 类使用 elf.id (来自 elfData) 而不是 elf.elfId
        const elfInstanceData = {
            elfId: elf.id,  // 使用 elf.id 而不是 elf.elfId
            nickname: null,
            level: elf.level,
            exp: elf.exp || 0,
            obtainedAt: Date.now(),
            currentHp: elf.currentHp,
            skills: elf.skills ? [...elf.skills] : [],
            skillPP: elf.skillPP ? { ...elf.skillPP } : {},
            iv: elf.iv ? { ...elf.iv } : PlayerData.generateRandomIV(),
            ev: elf.ev ? { ...elf.ev } : PlayerData.createInitialEV()
        };

        // 添加到玩家精灵列表
        PlayerData.elves.push(elfInstanceData);
        console.log(`[CatchSystem] 成功捕捉 ${elf.name}，已加入背包`);
        console.log(`[CatchSystem] 精灵数据:`, elfInstanceData);

        // 通知任务系统捕捉精灵
        if (typeof QuestManager !== 'undefined') {
            QuestManager.updateProgress('catch', elf.id, 1);
        }

        // 标记精灵为已捕捉（图鉴系统）
        PlayerData.markCaught(elf.id);

        // 保存存档
        PlayerData.saveToStorage();

        return true;
    }
};

// 导出为全局对象
window.CatchSystem = CatchSystem;
