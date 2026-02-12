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

        if (playerPriority !== enemyPriority) {
            return playerPriority > enemyPriority ? ['player', 'enemy'] : ['enemy', 'player'];
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
        if (effect.chance && effect.chance < 100) {
            const roll = Math.random() * 100;
            if (roll > effect.chance) {
                return;
            }
        }

        if (effect.type === 'statChange') {
            const targetStages = effect.target === 'enemy' ? context.defenderStages : context.attackerStages;
            const targetElf = effect.target === 'enemy' ? context.defender : context.attacker;
            const stat = effect.stat;
            const stages = effect.stages;

            const oldStage = targetStages[stat];
            targetStages[stat] = Math.max(-6, Math.min(6, targetStages[stat] + stages));
            const newStage = targetStages[stat];

            if (oldStage !== newStage) {
                const statNames = {
                    atk: '攻击',
                    def: '防御',
                    spAtk: '特攻',
                    spDef: '特防',
                    spd: '速度',
                    accuracy: '命中'
                };
                const statName = statNames[stat] || stat;
                const changeText = stages > 0 ? '提高了' : '降低了';
                const amount = Math.abs(stages) === 1 ? '' : `${Math.abs(stages)}级`;

                context.log(`${targetElf.getDisplayName()} 的${statName}${changeText}${amount}！`);

                const statEvent = {
                    target: effect.target,
                    stat: stat,
                    stages: stages
                };
                if (typeof context.appendEvent === 'function') {
                    context.appendEvent('stat_change', statEvent);
                } else {
                    context.result.events.push({
                        type: 'stat_change',
                        ...statEvent
                    });
                }
            } else {
                const text = stages > 0 ? '已经不能再提高了' : '已经不能再降低了';
                context.log(`${targetElf.getDisplayName()} 的${stat}${text}！`);
            }
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
