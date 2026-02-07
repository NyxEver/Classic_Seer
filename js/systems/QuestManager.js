/**
 * QuestManager - 任务管理器
 * 管理任务接取、进度追踪和奖励发放
 */

const QuestManager = {
    /**
     * 初始化任务进度结构（如果不存在）
     */
    ensureProgressStructure() {
        if (!PlayerData.questProgress) {
            PlayerData.questProgress = {};
        }
        if (!PlayerData.questProgress.active) {
            PlayerData.questProgress.active = {};
        }
        if (!PlayerData.questProgress.completed) {
            PlayerData.questProgress.completed = [];
        }
    },

    /**
     * 获取可接取的任务
     * @returns {Array} - 可接取的任务数组
     */
    getAvailableQuests() {
        this.ensureProgressStructure();
        const available = [];

        if (!DataLoader.quests) {
            console.warn('[QuestManager] 任务数据尚未加载');
            return available;
        }

        for (const questId in DataLoader.quests) {
            const quest = DataLoader.quests[questId];

            // 跳过已接取的任务
            if (this.isQuestActive(quest.id)) continue;

            // 跳过已完成的任务
            if (this.isQuestCompleted(quest.id)) continue;

            // 检查前置条件
            if (this.checkRequirements(quest)) {
                available.push(quest);
            }
        }

        return available;
    },

    /**
     * 获取进行中的任务
     * @returns {Array} - 进行中的任务数组（含进度）
     */
    getActiveQuests() {
        this.ensureProgressStructure();
        const active = [];

        for (const questIdStr in PlayerData.questProgress.active) {
            const questId = parseInt(questIdStr);
            const quest = DataLoader.getQuest(questId);
            if (quest) {
                const progress = PlayerData.questProgress.active[questId];
                active.push({
                    ...quest,
                    progress: progress
                });
            }
        }

        return active;
    },

    /**
     * 获取已完成的任务
     * @returns {Array} - 已完成的任务数组
     */
    getCompletedQuests() {
        this.ensureProgressStructure();
        const completed = [];

        for (const questId of PlayerData.questProgress.completed) {
            const quest = DataLoader.getQuest(questId);
            if (quest) {
                completed.push(quest);
            }
        }

        return completed;
    },

    /**
     * 检查任务是否正在进行中
     * @param {number} questId 
     * @returns {boolean}
     */
    isQuestActive(questId) {
        this.ensureProgressStructure();
        return PlayerData.questProgress.active.hasOwnProperty(questId);
    },

    /**
     * 检查任务是否已完成
     * @param {number} questId 
     * @returns {boolean}
     */
    isQuestCompleted(questId) {
        this.ensureProgressStructure();
        return PlayerData.questProgress.completed.includes(questId);
    },

    /**
     * 检查任务前置条件是否满足
     * @param {Object} quest 
     * @returns {boolean}
     */
    checkRequirements(quest) {
        if (!quest.requirements || quest.requirements.length === 0) {
            return true;
        }

        for (const reqQuestId of quest.requirements) {
            if (!this.isQuestCompleted(reqQuestId)) {
                return false;
            }
        }

        return true;
    },

    /**
     * 接取任务
     * @param {number} questId 
     * @returns {boolean} - 是否成功接取
     */
    acceptQuest(questId) {
        this.ensureProgressStructure();
        const quest = DataLoader.getQuest(questId);

        if (!quest) {
            console.error(`[QuestManager] 找不到任务 ID: ${questId}`);
            return false;
        }

        if (this.isQuestActive(questId)) {
            console.warn(`[QuestManager] 任务 ${questId} 已在进行中`);
            return false;
        }

        if (this.isQuestCompleted(questId)) {
            console.warn(`[QuestManager] 任务 ${questId} 已完成`);
            return false;
        }

        if (!this.checkRequirements(quest)) {
            console.warn(`[QuestManager] 任务 ${questId} 前置条件不满足`);
            return false;
        }

        // 初始化任务进度（每个目标当前进度为 0）
        const progress = {};
        quest.objectives.forEach((obj, index) => {
            progress[index] = 0;
        });

        PlayerData.questProgress.active[questId] = progress;
        PlayerData.saveToStorage();

        console.log(`[QuestManager] 接取任务: ${quest.name}`);
        return true;
    },

    /**
     * 更新任务进度
     * @param {string} eventType - 事件类型: 'catch', 'defeat', 'levelUp', 'collect', 'talk'
     * @param {number|null} targetId - 目标 ID（精灵 ID、物品 ID 等，null 表示任意）
     * @param {number} value - 事件数值（数量或等级）
     */
    updateProgress(eventType, targetId, value) {
        this.ensureProgressStructure();
        let updated = false;

        // 遍历所有进行中的任务
        for (const questIdStr in PlayerData.questProgress.active) {
            const questId = parseInt(questIdStr);
            const quest = DataLoader.getQuest(questId);
            if (!quest) continue;

            const progress = PlayerData.questProgress.active[questId];

            // 检查每个目标
            quest.objectives.forEach((objective, index) => {
                if (objective.type !== eventType) return;

                // 检查目标 ID 匹配（null 表示任意目标）
                if (objective.targetId !== null && objective.targetId !== targetId) {
                    // 对于 levelUp 类型，targetId 可能不匹配但仍需检查 targetLevel
                    if (eventType !== 'levelUp') return;
                }

                // 更新进度
                if (eventType === 'levelUp') {
                    // 升级任务：检查是否达到目标等级
                    if (value >= objective.targetLevel) {
                        progress[index] = Math.min(progress[index] + 1, objective.count);
                        updated = true;
                        console.log(`[QuestManager] 任务 ${quest.name} 目标 ${index} 进度: ${progress[index]}/${objective.count}`);
                    }
                } else {
                    // 其他类型：累加计数
                    progress[index] = Math.min(progress[index] + value, objective.count);
                    updated = true;
                    console.log(`[QuestManager] 任务 ${quest.name} 目标 ${index} 进度: ${progress[index]}/${objective.count}`);
                }
            });
        }

        if (updated) {
            PlayerData.saveToStorage();
        }
    },

    /**
     * 检查任务是否可完成
     * @param {number} questId 
     * @returns {boolean}
     */
    checkCompletion(questId) {
        this.ensureProgressStructure();
        if (!this.isQuestActive(questId)) return false;

        const quest = DataLoader.getQuest(questId);
        if (!quest) return false;

        const progress = PlayerData.questProgress.active[questId];

        // 检查所有目标是否达成
        for (let i = 0; i < quest.objectives.length; i++) {
            const objective = quest.objectives[i];
            const currentProgress = progress[i] || 0;
            if (currentProgress < objective.count) {
                return false;
            }
        }

        return true;
    },

    /**
     * 完成任务并发放奖励
     * @param {number} questId 
     * @returns {Object|null} - 奖励信息或 null（如果失败）
     */
    completeQuest(questId) {
        this.ensureProgressStructure();

        if (!this.checkCompletion(questId)) {
            console.warn(`[QuestManager] 任务 ${questId} 条件未满足，无法完成`);
            return null;
        }

        const quest = DataLoader.getQuest(questId);
        if (!quest) return null;

        // 从进行中移除
        delete PlayerData.questProgress.active[questId];

        // 添加到已完成
        PlayerData.questProgress.completed.push(questId);

        // 发放奖励
        const rewards = quest.rewards;
        if (rewards.seerBeans > 0) {
            PlayerData.addSeerBeans(rewards.seerBeans);
        }
        if (rewards.items && rewards.items.length > 0) {
            rewards.items.forEach(item => {
                PlayerData.addItem(item.id, item.count);
            });
        }

        PlayerData.saveToStorage();
        console.log(`[QuestManager] 完成任务: ${quest.name}`);

        return rewards;
    },

    /**
     * 获取任务目标的进度文本
     * @param {Object} quest - 任务对象（含 progress）
     * @param {number} objectiveIndex 
     * @returns {string} - 如 "1/3"
     */
    getProgressText(quest, objectiveIndex = 0) {
        if (!quest.progress) return '0/0';

        const objective = quest.objectives[objectiveIndex];
        const current = quest.progress[objectiveIndex] || 0;
        const target = objective.count;

        return `${current}/${target}`;
    },

    /**
     * 获取任务目标类型的中文描述
     * @param {Object} objective 
     * @returns {string}
     */
    getObjectiveDescription(objective) {
        const typeNames = {
            'catch': '捕捉',
            'defeat': '击败',
            'levelUp': '升级到',
            'collect': '收集',
            'talk': '对话'
        };

        let desc = typeNames[objective.type] || objective.type;

        if (objective.type === 'levelUp') {
            desc += ` Lv.${objective.targetLevel}`;
        } else if (objective.targetId) {
            const elf = DataLoader.getElf(objective.targetId);
            if (elf) {
                desc += ` ${elf.name}`;
            }
        }

        return desc;
    }
};

// 导出为全局对象
window.QuestManager = QuestManager;
