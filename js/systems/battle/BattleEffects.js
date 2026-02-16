/**
 * BattleEffects - 战斗效果职责
 * 负责属性阶段倍率、先后手判定、技能效果与基础结算规则
 */

const BattleEffects = {
    /**
     * 获取属性等级对应倍率
     * @param {number} stage
     * @returns {number}
     */
    getStatMultiplier(stage) {
        const multipliers = {
            '-6': 2 / 8, '-5': 2 / 7, '-4': 2 / 6, '-3': 2 / 5, '-2': 2 / 4, '-1': 2 / 3,
            '0': 1,
            '1': 3 / 2, '2': 4 / 2, '3': 5 / 2, '4': 6 / 2, '5': 7 / 2, '6': 8 / 2
        };
        return multipliers[stage.toString()] || 1;
    },

    /**
     * 获取实际速度
     * @param {Elf} elf
     * @param {Object} statStages
     * @returns {number}
     */
    getEffectiveSpeed(elf, statStages) {
        const baseSpd = elf.getSpd();
        const stage = statStages.spd;
        const multiplier = this.getStatMultiplier(stage);
        return Math.floor(baseSpd * multiplier);
    },

    /**
     * 获取行动优先级
     * @param {Object} action
     * @returns {number}
     */
    getActionPriority(action) {
        if (!action || action.type !== 'skill') {
            return 0;
        }
        const skill = DataLoader.getSkill(action.skillId);
        return skill ? (skill.priority || 0) : 0;
    },

    /**
     * 判定行动顺序
     * @param {BattleManager} manager
     * @returns {Array<string>}
     */
    determineOrder(manager) {
        const playerPriority = this.getActionPriority(manager.playerAction);
        const enemyPriority = this.getActionPriority(manager.enemyAction);

        let runtimePriorityPlayer = 0;
        let runtimePriorityEnemy = 0;
        const runtime = (typeof AppContext !== 'undefined' && AppContext && typeof AppContext.get === 'function')
            ? AppContext.get('BattleEffectRuntime', null)
            : (typeof window !== 'undefined' ? window.BattleEffectRuntime : null);

        if (runtime && typeof runtime.getPriorityBonus === 'function') {
            runtimePriorityPlayer = runtime.getPriorityBonus(manager, 'player', manager.enemyElf);
            runtimePriorityEnemy = runtime.getPriorityBonus(manager, 'enemy', manager.playerElf);
        }

        const playerTotalPriority = playerPriority + runtimePriorityPlayer;
        const enemyTotalPriority = enemyPriority + runtimePriorityEnemy;

        if (playerTotalPriority !== enemyTotalPriority) {
            return playerTotalPriority > enemyTotalPriority ? ['player', 'enemy'] : ['enemy', 'player'];
        }

        const playerSpeed = this.getEffectiveSpeed(manager.playerElf, manager.playerStatStages);
        const enemySpeed = this.getEffectiveSpeed(manager.enemyElf, manager.enemyStatStages);

        if (playerSpeed !== enemySpeed) {
            return playerSpeed > enemySpeed ? ['player', 'enemy'] : ['enemy', 'player'];
        }

        return Math.random() < 0.5 ? ['player', 'enemy'] : ['enemy', 'player'];
    },

    /**
     * 应用技能效果
     * @param {Object} effect
     * @param {Object} context
     */
    applySkillEffect(effect, context) {
        if (!effect || !context || !context.manager) {
            return;
        }

        const executor = (typeof AppContext !== 'undefined' && AppContext && typeof AppContext.get === 'function')
            ? AppContext.get('BattleActionExecutor', null)
            : (typeof window !== 'undefined' ? window.BattleActionExecutor : null);

        if (!executor || typeof executor.applySkillEffect !== 'function') {
            return;
        }

        executor.applySkillEffect(
            context.manager,
            effect,
            context.attacker,
            context.defender,
            context.attackerStages,
            context.defenderStages,
            context.result
        );
    },

    applyStatusFromEffect(effect, context) {
        if (!effect || !effect.status) {
            return;
        }

        const statusEffect = (typeof AppContext !== 'undefined' && AppContext && typeof AppContext.get === 'function')
            ? AppContext.get('StatusEffect', null)
            : (typeof window !== 'undefined' ? window.StatusEffect : null);

        if (!statusEffect || typeof statusEffect.applyStatus !== 'function') {
            return;
        }

        const targetKey = effect.target === 'self' ? 'self' : 'enemy';
        const targetElf = targetKey === 'self' ? context.attacker : context.defender;
        if (!targetElf || targetElf.isFainted()) {
            return;
        }

        const applyResult = statusEffect.applyStatus(targetElf, effect.status, {
            duration: effect.duration
        });

        const statusName = statusEffect.getStatusName(effect.status);
        if (applyResult.replacedStatus) {
            const oldStatusName = statusEffect.getStatusName(applyResult.replacedStatus);
            context.log(`${targetElf.getDisplayName()} 的${oldStatusName}状态被${statusName}覆盖了！`);
            if (typeof context.appendEvent === 'function') {
                context.appendEvent(BattleManager.EVENT.STATUS_REMOVED, {
                    target: targetKey,
                    status: applyResult.replacedStatus,
                    reason: 'replaced'
                });
            }
        }

        if (applyResult.applied) {
            context.log(`${targetElf.getDisplayName()} 陷入了${statusName}状态！`);
        } else if (applyResult.refreshed) {
            context.log(`${targetElf.getDisplayName()} 的${statusName}状态回合刷新了！`);
        }

        if ((applyResult.applied || applyResult.refreshed) && typeof context.appendEvent === 'function') {
            context.appendEvent(BattleManager.EVENT.STATUS_APPLIED, {
                target: targetKey,
                status: applyResult.statusType,
                category: applyResult.category,
                duration: applyResult.duration,
                refreshed: !!applyResult.refreshed,
                replacedStatus: applyResult.replacedStatus || null
            });
        }
    },

    /**
     * 检查战斗结束
     * @param {BattleManager} manager
     * @returns {{ended:boolean, winner:string|null, needSwitch:boolean}}
     */
    checkBattleEnd(manager) {
        if (manager.enemyElf.isFainted()) {
            return { ended: true, winner: 'player', needSwitch: false };
        }
        if (manager.playerElf.isFainted()) {
            const availableElves = PlayerData.elves.filter((e) => e.currentHp > 0);
            if (availableElves.length > 0) {
                return { ended: false, winner: null, needSwitch: true };
            }
            return { ended: true, winner: 'enemy', needSwitch: false };
        }
        return { ended: false, winner: null, needSwitch: false };
    },

    /**
     * 计算经验奖励
     * @param {BattleManager} manager
     * @returns {number}
     */
    calculateExpReward(manager) {
        const baseExp = manager.enemyElf.level * 15;
        const typeMultiplier = manager.battleType === 'trainer' ? 1.5 : 1;
        return Math.floor(baseExp * typeMultiplier);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleEffects', BattleEffects);
}

window.BattleEffects = BattleEffects;
