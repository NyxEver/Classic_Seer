/**
 * BattleManager - 战斗管理器
 * 管理战斗流程、回合执行和结果处理
 */

class BattleManager {
    // 回合阶段常量
    static PHASE = {
        PLAYER_CHOOSE: 'PLAYER_CHOOSE',
        EXECUTE_TURN: 'EXECUTE_TURN',
        CHECK_RESULT: 'CHECK_RESULT',
        BATTLE_END: 'BATTLE_END'
    };

    // 行动类型
    static ACTION = {
        SKILL: 'skill',
        ITEM: 'item',
        SWITCH: 'switch',
        ESCAPE: 'escape'
    };

    /**
     * 构造函数
     * @param {Object} config - 战斗配置
     * @param {Elf} config.playerElf - 玩家精灵
     * @param {Elf} config.enemyElf - 敌方精灵
     * @param {string} config.battleType - 'wild' 或 'trainer'
     * @param {boolean} config.canEscape - 是否可逃跑
     * @param {boolean} config.canCatch - 是否可捕捉
     * @param {Function} config.onMessage - 消息回调
     * @param {Function} config.onBattleEnd - 战斗结束回调
     */
    constructor(config) {
        this.playerElf = config.playerElf;
        this.enemyElf = config.enemyElf;
        this.battleType = config.battleType || 'wild';
        this.canEscape = config.canEscape !== false;
        this.canCatch = config.canCatch !== false && this.battleType === 'wild';

        // 回调函数
        this.onMessage = config.onMessage || ((msg) => console.log(`[Battle] ${msg}`));
        this.onBattleEnd = config.onBattleEnd || (() => { });

        // 状态
        this.turnPhase = BattleManager.PHASE.PLAYER_CHOOSE;
        this.battleLog = [];
        this.turnCount = 0;
        this.escapeAttempts = 0;

        // 当前回合行动
        this.playerAction = null;
        this.enemyAction = null;

        // 属性等级变化 (-6 到 +6)
        this.playerStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };
        this.enemyStatStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0 };

        // 特殊状态（如玩水效果）
        this.playerEffects = {};
        this.enemyEffects = {};

        console.log('[BattleManager] 战斗初始化:', {
            player: this.playerElf.getDisplayName(),
            enemy: this.enemyElf.getDisplayName(),
            type: this.battleType
        });
    }

    /**
     * 获取当前阶段
     * @returns {string}
     */
    getPhase() {
        return this.turnPhase;
    }

    /**
     * 切换阶段
     * @param {string} phase
     */
    setPhase(phase) {
        console.log(`[BattleManager] 阶段切换: ${this.turnPhase} -> ${phase}`);
        this.turnPhase = phase;
    }

    /**
     * 添加战斗日志
     * @param {string} message
     */
    log(message) {
        this.battleLog.push(message);
        this.onMessage(message);
    }

    /**
     * 设置玩家行动
     * @param {string} action - 行动类型
     * @param {Object} data - 行动数据
     */
    setPlayerAction(action, data = {}) {
        this.playerAction = { type: action, ...data };
        console.log('[BattleManager] 玩家行动:', this.playerAction);
    }

    /**
     * AI 生成敌方行动（随机选择技能）
     */
    generateEnemyAction() {
        const skills = this.enemyElf.getSkillDetails();
        const availableSkills = skills.filter(s => s.currentPP > 0);

        if (availableSkills.length === 0) {
            // 没有可用技能，使用挣扎（暂时用第一个技能）
            this.enemyAction = { type: BattleManager.ACTION.SKILL, skillId: skills[0].id };
        } else {
            // 随机选择一个技能
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            this.enemyAction = { type: BattleManager.ACTION.SKILL, skillId: randomSkill.id };
        }

        console.log('[BattleManager] 敌方行动:', this.enemyAction);
    }

    /**
     * 获取实际速度（考虑等级变化）
     * @param {Elf} elf
     * @param {Object} statStages
     * @returns {number}
     */
    getEffectiveSpeed(elf, statStages) {
        const baseSpd = elf.getSpd();
        const stage = statStages.spd;
        const multiplier = this.getStatMultiplier(stage);
        return Math.floor(baseSpd * multiplier);
    }

    /**
     * 获取属性等级对应的倍率
     * @param {number} stage - -6 到 +6
     * @returns {number}
     */
    getStatMultiplier(stage) {
        // 标准属性倍率表
        const multipliers = {
            '-6': 2 / 8, '-5': 2 / 7, '-4': 2 / 6, '-3': 2 / 5, '-2': 2 / 4, '-1': 2 / 3,
            '0': 1,
            '1': 3 / 2, '2': 4 / 2, '3': 5 / 2, '4': 6 / 2, '5': 7 / 2, '6': 8 / 2
        };
        return multipliers[stage.toString()] || 1;
    }

    /**
     * 确定行动顺序
     * @returns {Array} - ['player', 'enemy'] 或 ['enemy', 'player']
     */
    determineOrder() {
        // 检查先制技能
        const playerPriority = this.getActionPriority(this.playerAction);
        const enemyPriority = this.getActionPriority(this.enemyAction);

        if (playerPriority !== enemyPriority) {
            return playerPriority > enemyPriority ? ['player', 'enemy'] : ['enemy', 'player'];
        }

        // 先制相同，比较速度
        const playerSpeed = this.getEffectiveSpeed(this.playerElf, this.playerStatStages);
        const enemySpeed = this.getEffectiveSpeed(this.enemyElf, this.enemyStatStages);

        if (playerSpeed !== enemySpeed) {
            return playerSpeed > enemySpeed ? ['player', 'enemy'] : ['enemy', 'player'];
        }

        // 速度相同，随机决定
        return Math.random() < 0.5 ? ['player', 'enemy'] : ['enemy', 'player'];
    }

    /**
     * 获取行动优先级
     * @param {Object} action
     * @returns {number}
     */
    getActionPriority(action) {
        if (!action || action.type !== BattleManager.ACTION.SKILL) {
            return 0;
        }
        const skill = DataLoader.getSkill(action.skillId);
        return skill ? (skill.priority || 0) : 0;
    }

    /**
     * 执行回合
     * @returns {Promise<Object>} - 回合结果
     */
    async executeTurn() {
        this.turnCount++;
        this.setPhase(BattleManager.PHASE.EXECUTE_TURN);

        const result = {
            playerAction: this.playerAction,
            enemyAction: this.enemyAction,
            events: [],
            battleEnded: false,
            winner: null
        };

        // 处理逃跑
        if (this.playerAction.type === BattleManager.ACTION.ESCAPE) {
            const escaped = this.attemptEscape();
            result.events.push({
                type: 'escape',
                success: escaped
            });

            if (escaped) {
                this.log('成功逃跑了！');
                result.battleEnded = true;
                result.escaped = true;
                this.setPhase(BattleManager.PHASE.BATTLE_END);
                return result;
            } else {
                this.log('逃跑失败！');
                // 逃跑失败，敌方行动
                this.generateEnemyAction();
                await this.executeAction('enemy', result);
            }
        } else {
            // 生成敌方行动
            this.generateEnemyAction();

            // 确定行动顺序
            const order = this.determineOrder();
            console.log('[BattleManager] 行动顺序:', order);

            // 执行双方行动
            for (const actor of order) {
                const targetFainted = await this.executeAction(actor, result);
                if (targetFainted) {
                    break; // 一方倒下，停止后续行动
                }
            }
        }

        // 检查战斗结果
        this.setPhase(BattleManager.PHASE.CHECK_RESULT);
        const checkResult = this.checkBattleEnd();

        if (checkResult.ended) {
            result.battleEnded = true;
            result.winner = checkResult.winner;
            this.setPhase(BattleManager.PHASE.BATTLE_END);

            if (checkResult.winner === 'player') {
                await this.handleVictory(result);
            } else {
                await this.handleDefeat(result);
            }
        } else {
            // 回合结束，返回玩家选择阶段
            this.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
        }

        // 清除本回合行动
        this.playerAction = null;
        this.enemyAction = null;

        return result;
    }

    /**
     * 执行单个行动
     * @param {string} actor - 'player' 或 'enemy'
     * @param {Object} result - 回合结果对象
     * @returns {boolean} - 是否导致目标倒下
     */
    async executeAction(actor, result) {
        const isPlayer = actor === 'player';
        const action = isPlayer ? this.playerAction : this.enemyAction;
        const attacker = isPlayer ? this.playerElf : this.enemyElf;
        const defender = isPlayer ? this.enemyElf : this.playerElf;
        const attackerStages = isPlayer ? this.playerStatStages : this.enemyStatStages;
        const defenderStages = isPlayer ? this.enemyStatStages : this.playerStatStages;

        if (action.type === BattleManager.ACTION.SKILL) {
            const skill = DataLoader.getSkill(action.skillId);
            if (!skill) {
                console.error('[BattleManager] 技能不存在:', action.skillId);
                return false;
            }

            // 消耗 PP
            attacker.useSkill(action.skillId);

            // 显示使用技能消息
            this.log(`${attacker.getDisplayName()} 使用了 ${skill.name}！`);

            // 命中检定
            const hit = DamageCalculator.checkHit(skill, -defenderStages.accuracy);
            if (!hit) {
                this.log('但是没有命中...');
                result.events.push({
                    type: 'attack',
                    actor: actor,
                    skill: skill,
                    hit: false
                });
                return false;
            }

            // 伤害计算（如果是攻击技能）
            if (skill.power > 0) {
                const damageResult = DamageCalculator.calculate(attacker, defender, skill);

                // 属性克制提示
                const effectText = DamageCalculator.getEffectivenessText(damageResult.effectiveness);
                if (effectText) {
                    this.log(effectText);
                }

                // 暴击提示
                if (damageResult.isCritical) {
                    this.log('暴击！');
                }

                // 造成伤害
                const fainted = defender.takeDamage(damageResult.damage);
                this.log(`${defender.getDisplayName()} 受到了 ${damageResult.damage} 点伤害！`);

                result.events.push({
                    type: 'attack',
                    actor: actor,
                    skill: skill,
                    hit: true,
                    damage: damageResult.damage,
                    critical: damageResult.isCritical,
                    effectiveness: damageResult.effectiveness,
                    targetFainted: fainted
                });

                if (fainted) {
                    this.log(`${defender.getDisplayName()} 倒下了！`);
                    return true;
                }
            }

            // 处理技能效果
            if (skill.effect) {
                this.applySkillEffect(skill.effect, attacker, defender, attackerStages, defenderStages, result);
            }
        }

        return false;
    }

    /**
     * 应用技能效果
     */
    applySkillEffect(effect, attacker, defender, attackerStages, defenderStages, result) {
        // 检查触发概率
        if (effect.chance && effect.chance < 100) {
            const roll = Math.random() * 100;
            if (roll > effect.chance) {
                return; // 效果未触发
            }
        }

        if (effect.type === 'statChange') {
            const targetStages = effect.target === 'enemy' ? defenderStages : attackerStages;
            const targetElf = effect.target === 'enemy' ? defender : attacker;
            const stat = effect.stat;
            const stages = effect.stages;

            // 应用等级变化
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

                this.log(`${targetElf.getDisplayName()} 的${statName}${changeText}${amount}！`);

                result.events.push({
                    type: 'statChange',
                    target: effect.target,
                    stat: stat,
                    stages: stages
                });
            } else {
                // 已到极限
                const text = stages > 0 ? '已经不能再提高了' : '已经不能再降低了';
                this.log(`${targetElf.getDisplayName()} 的${stat}${text}！`);
            }
        }
    }

    /**
     * 尝试逃跑
     * @returns {boolean} - 是否成功
     */
    attemptEscape() {
        // 训练家战斗不可逃跑
        if (this.battleType === 'trainer' || !this.canEscape) {
            this.log('无法从训练家战斗中逃跑！');
            return false;
        }

        this.escapeAttempts++;

        // 计算逃跑成功率
        let escapeChance = 50; // 基础 50%

        const playerSpeed = this.getEffectiveSpeed(this.playerElf, this.playerStatStages);
        const enemySpeed = this.getEffectiveSpeed(this.enemyElf, this.enemyStatStages);

        if (playerSpeed > enemySpeed) {
            escapeChance += 20;
        } else if (playerSpeed < enemySpeed) {
            escapeChance -= 20;
        }

        // 每次逃跑尝试增加成功率
        escapeChance += (this.escapeAttempts - 1) * 10;

        // 限制范围
        escapeChance = Math.min(95, Math.max(5, escapeChance));

        const roll = Math.random() * 100;
        const success = roll < escapeChance;

        console.log(`[BattleManager] 逃跑检定: ${roll.toFixed(1)} < ${escapeChance}? ${success}`);

        return success;
    }

    /**
     * 检查战斗是否结束
     * @returns {Object} - { ended, winner }
     */
    checkBattleEnd() {
        if (this.enemyElf.isFainted()) {
            return { ended: true, winner: 'player' };
        }
        if (this.playerElf.isFainted()) {
            return { ended: true, winner: 'enemy' };
        }
        return { ended: false, winner: null };
    }

    /**
     * 计算经验奖励
     * @returns {number}
     */
    calculateExpReward() {
        // 基础经验 = 敌方精灵等级 * 15
        const baseExp = this.enemyElf.level * 15;

        // 野生精灵经验较少
        const typeMultiplier = this.battleType === 'trainer' ? 1.5 : 1;

        return Math.floor(baseExp * typeMultiplier);
    }

    /**
     * 处理胜利
     * @param {Object} result
     */
    async handleVictory(result) {
        this.log('战斗胜利！');

        // 计算经验
        const expReward = this.calculateExpReward();
        this.log(`${this.playerElf.getDisplayName()} 获得了 ${expReward} 经验值！`);

        // 添加经验并处理升级
        const levelUpResults = this.playerElf.addExp(expReward);

        result.expGained = expReward;
        result.levelUps = levelUpResults;

        // 显示升级信息
        for (const levelUp of levelUpResults) {
            this.log(`${this.playerElf.getDisplayName()} 升级到 ${levelUp.newLevel} 级！`);
            for (const skillId of levelUp.newSkills) {
                const skill = DataLoader.getSkill(skillId);
                if (skill) {
                    this.log(`${this.playerElf.getDisplayName()} 学会了 ${skill.name}！`);
                }
            }
        }

        // 获取努力值
        this.playerElf.gainEVFromDefeat(this.enemyElf);

        // 保存游戏
        PlayerData.saveToStorage();

        // 调用结束回调
        this.onBattleEnd({
            victory: true,
            expGained: expReward,
            levelUps: levelUpResults
        });
    }

    /**
     * 处理失败
     * @param {Object} result
     */
    async handleDefeat(result) {
        this.log('战斗失败...');
        this.log(`${this.playerElf.getDisplayName()} 已无法战斗。`);

        // 调用结束回调
        this.onBattleEnd({
            victory: false
        });
    }
}

// 导出为全局对象
window.BattleManager = BattleManager;
