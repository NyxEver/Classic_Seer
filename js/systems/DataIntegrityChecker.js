/**
 * DataIntegrityChecker - 数据完整性校验器
 * 仅输出 console.warn，不阻断游戏启动流程
 */

const DataIntegrityChecker = {
    /**
     * 执行全量校验
     * @returns {{ passed: boolean, issues: string[] }}
     */
    run() {
        if (typeof DataLoader === 'undefined' || !DataLoader.isLoaded) {
            const message = '[DataIntegrityChecker] DataLoader 未就绪，跳过校验';
            console.warn(message);
            return { passed: false, issues: [message] };
        }

        const issues = [];

        const elves = DataLoader.elves || {};
        const skills = DataLoader.skills || {};
        const items = DataLoader.items || {};
        const quests = DataLoader.quests || {};

        const elfIds = new Set(Object.keys(elves).map(Number));
        const skillIds = new Set(Object.keys(skills).map(Number));
        const itemIds = new Set(Object.keys(items).map(Number));
        const questIds = new Set(Object.keys(quests).map(Number));

        this.checkElfEvolutionTargets(elves, elfIds, issues);
        this.checkElfLearnableSkills(elves, skillIds, issues);
        this.checkQuestObjectives(quests, elfIds, itemIds, issues);
        this.checkQuestRewards(quests, itemIds, issues);
        this.checkQuestRequirements(quests, questIds, issues);

        if (issues.length === 0) {
            console.log(
                `[DataIntegrityChecker] 校验通过：elves=${elfIds.size}, skills=${skillIds.size}, items=${itemIds.size}, quests=${questIds.size}`
            );
            return { passed: true, issues: [] };
        }

        console.warn(`[DataIntegrityChecker] 发现 ${issues.length} 个问题（仅告警，不阻断）`);
        issues.forEach((issue) => {
            console.warn(`[DataIntegrityChecker] ${issue}`);
        });

        return { passed: false, issues };
    },

    checkElfEvolutionTargets(elves, elfIds, issues) {
        Object.values(elves).forEach((elf) => {
            if (!elf || elf.evolveTo === null || elf.evolveTo === undefined) {
                return;
            }

            if (!elfIds.has(Number(elf.evolveTo))) {
                issues.push(`精灵 ${elf.id}(${elf.name}) 的 evolveTo=${elf.evolveTo} 不存在`);
            }
        });
    },

    checkElfLearnableSkills(elves, skillIds, issues) {
        Object.values(elves).forEach((elf) => {
            const learnableSkills = Array.isArray(elf.learnableSkills) ? elf.learnableSkills : [];

            learnableSkills.forEach((entry, index) => {
                const skillId = Number(entry.skillId);
                if (!skillIds.has(skillId)) {
                    issues.push(
                        `精灵 ${elf.id}(${elf.name}) 的 learnableSkills[${index}].skillId=${entry.skillId} 不存在`
                    );
                }
            });
        });
    },

    checkQuestObjectives(quests, elfIds, itemIds, issues) {
        Object.values(quests).forEach((quest) => {
            const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];

            objectives.forEach((objective, index) => {
                const targetId = objective.targetId;
                if (targetId === null || targetId === undefined) {
                    return;
                }

                if (objective.type === 'collect') {
                    if (!itemIds.has(Number(targetId))) {
                        issues.push(
                            `任务 ${quest.id}(${quest.name}) objectives[${index}] 的物品 targetId=${targetId} 不存在`
                        );
                    }
                    return;
                }

                if ((objective.type === 'catch' || objective.type === 'defeat') && !elfIds.has(Number(targetId))) {
                    issues.push(
                        `任务 ${quest.id}(${quest.name}) objectives[${index}] 的精灵 targetId=${targetId} 不存在`
                    );
                }
            });
        });
    },

    checkQuestRewards(quests, itemIds, issues) {
        Object.values(quests).forEach((quest) => {
            const rewards = quest.rewards || {};
            const rewardItems = Array.isArray(rewards.items) ? rewards.items : [];

            rewardItems.forEach((item, index) => {
                const itemId = Number(item.id);
                if (!itemIds.has(itemId)) {
                    issues.push(`任务 ${quest.id}(${quest.name}) rewards.items[${index}].id=${item.id} 不存在`);
                }
            });
        });
    },

    checkQuestRequirements(quests, questIds, issues) {
        Object.values(quests).forEach((quest) => {
            const requirements = Array.isArray(quest.requirements) ? quest.requirements : [];

            requirements.forEach((requiredQuestId) => {
                if (!questIds.has(Number(requiredQuestId))) {
                    issues.push(
                        `任务 ${quest.id}(${quest.name}) 的前置任务 requirement=${requiredQuestId} 不存在`
                    );
                }
            });
        });
    }
};

window.DataIntegrityChecker = DataIntegrityChecker;
