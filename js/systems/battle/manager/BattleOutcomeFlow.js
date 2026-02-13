/**
 * BattleOutcomeFlow - 回合后结算流
 * 负责胜负判定收口、胜利/失败处理和持久化。
 */

const BattleOutcomeFlow = {
    async processAfterActions(manager, result) {
        if (result.outcome.battleEnded) {
            return;
        }

        manager.setPhase(BattleManager.PHASE.CHECK_RESULT);
        const checkResult = manager.checkBattleEnd();

        if (checkResult.ended) {
            manager.markBattleEnd(result, {
                winner: checkResult.winner,
                reason: 'faint'
            });
            manager.appendBattleEndEvent(result, 'faint');
            manager.setPhase(BattleManager.PHASE.BATTLE_END);

            if (checkResult.winner === 'player') {
                await this.handleVictory(manager, result);
            } else {
                await this.handleDefeat(manager, result);
            }
            return;
        }

        if (checkResult.needSwitch) {
            manager.markNeedSwitch(result, 'player_fainted_need_switch');
            manager.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
            return;
        }

        manager.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
    },

    async handleVictory(manager, result) {
        manager.log('战斗胜利！');

        const expReward = manager.calculateExpReward();
        manager.log(`${manager.playerElf.getDisplayName()} 获得了 ${expReward} 经验值！`);

        const levelUpResults = manager.playerElf.addExp(expReward);

        result.expGained = expReward;
        result.levelUps = levelUpResults;

        let canEvolve = false;
        let evolveTo = null;

        for (const levelUp of levelUpResults) {
            manager.log(`${manager.playerElf.getDisplayName()} 升级到 ${levelUp.newLevel} 级！`);
            for (const skillId of levelUp.newSkills) {
                const dataLoader = manager.getDependency('DataLoader');
                const skill = dataLoader ? dataLoader.getSkill(skillId) : null;
                if (skill) {
                    manager.log(`${manager.playerElf.getDisplayName()} 学会了 ${skill.name}！`);
                }
            }

            if (levelUp.canEvolve) {
                canEvolve = true;
                evolveTo = levelUp.evolveTo;
            }
        }

        const pendingSkills = manager.playerElf.getPendingSkills();
        if (pendingSkills.length > 0) {
            console.log(`[BattleManager] 发现 ${pendingSkills.length} 个待学习技能: ${pendingSkills.join(', ')}`);
        }

        if (!canEvolve && manager.playerElf.checkEvolution()) {
            canEvolve = true;
            evolveTo = manager.playerElf.evolvesTo;
            console.log(`[BattleManager] 检测到精灵已满足进化条件: ${manager.playerElf.getDisplayName()} -> ID ${evolveTo}`);
        }

        manager.playerElf.gainEVFromDefeat(manager.enemyElf);

        const gameEvents = manager.getDependency('GameEvents');
        if (gameEvents) {
            gameEvents.emit(gameEvents.EVENTS.QUEST_PROGRESS, {
                type: 'defeat',
                targetId: manager.enemyElf.id,
                value: 1,
                source: 'BattleManager.handleVictory'
            });
        } else {
            console.warn('[BattleManager] GameEvents 未加载，任务进度事件未发出');
        }

        const playerData = manager.getDependency('PlayerData');
        if (playerData) {
            playerData.saveToStorage();
        }

        manager.onBattleEnd({
            victory: true,
            expGained: expReward,
            levelUps: levelUpResults,
            canEvolve: canEvolve,
            evolveTo: evolveTo,
            pendingSkills: pendingSkills,
            playerElf: manager.playerElf
        });
    },

    async handleDefeat(manager) {
        manager.log('战斗失败...');
        manager.log(`${manager.playerElf.getDisplayName()} 已无法战斗。`);

        manager.onBattleEnd({
            victory: false
        });
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleOutcomeFlow', BattleOutcomeFlow);
}

window.BattleOutcomeFlow = BattleOutcomeFlow;
