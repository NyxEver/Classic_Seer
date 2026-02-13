/**
 * BattleActionExecutor - 单次行动执行器
 * 负责技能路径（PP、命中、伤害、效果）及事件写入。
 */

const BattleActionExecutor = {
    async executeAction(manager, actor, result) {
        const isPlayer = actor === 'player';
        const action = isPlayer ? manager.playerAction : manager.enemyAction;
        const attacker = isPlayer ? manager.playerElf : manager.enemyElf;
        const defender = isPlayer ? manager.enemyElf : manager.playerElf;
        const attackerStages = isPlayer ? manager.playerStatStages : manager.enemyStatStages;
        const defenderStages = isPlayer ? manager.enemyStatStages : manager.playerStatStages;

        if (!action || action.type !== BattleManager.ACTION.SKILL) {
            return false;
        }

        const dataLoader = manager.getDependency('DataLoader');
        const damageCalculator = manager.getDependency('DamageCalculator');
        if (!dataLoader || !damageCalculator) {
            console.error('[BattleManager] DataLoader/DamageCalculator 未加载，无法执行技能');
            return false;
        }

        const skill = dataLoader.getSkill(action.skillId);
        if (!skill) {
            console.error('[BattleManager] 技能不存在:', action.skillId);
            return false;
        }

        const oldPP = attacker.skillPP[action.skillId] || 0;
        attacker.useSkill(action.skillId);
        const newPP = attacker.skillPP[action.skillId] || 0;
        manager.appendTurnEvent(result, BattleManager.EVENT.PP_CHANGE, {
            target: actor,
            skillId: action.skillId,
            oldPP,
            newPP,
            delta: newPP - oldPP,
            reason: 'skill_cast'
        });

        manager.log(`${attacker.getDisplayName()} 使用了 ${skill.name}！`);

        manager.appendTurnEvent(result, BattleManager.EVENT.SKILL_CAST, {
            actor: actor,
            target: isPlayer ? 'enemy' : 'player',
            skillId: skill.id,
            skillName: skill.name,
            skillType: skill.type,
            skillCategory: skill.category || 'status'
        });

        const hit = damageCalculator.checkHit(skill, -defenderStages.accuracy);
        if (!hit) {
            manager.log('但是没有命中...');
            manager.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                actor: actor,
                target: isPlayer ? 'enemy' : 'player',
                skillId: skill.id,
                skillName: skill.name
            });
            return false;
        }

        if (skill.power > 0) {
            const damageResult = damageCalculator.calculate(attacker, defender, skill);

            const effectText = damageCalculator.getEffectivenessText(damageResult.effectiveness);
            if (effectText) {
                manager.log(effectText);
            }

            if (damageResult.isCritical) {
                manager.log('暴击！');
            }

            const oldHp = defender.currentHp;
            const fainted = defender.takeDamage(damageResult.damage);
            manager.log(`${defender.getDisplayName()} 受到了 ${damageResult.damage} 点伤害！`);

            manager.appendTurnEvent(result, BattleManager.EVENT.HIT, {
                actor: actor,
                target: isPlayer ? 'enemy' : 'player',
                skillId: skill.id,
                skillName: skill.name,
                damage: damageResult.damage,
                critical: damageResult.isCritical,
                effectiveness: damageResult.effectiveness,
                targetFainted: fainted
            });
            manager.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                target: isPlayer ? 'enemy' : 'player',
                oldHp,
                newHp: defender.currentHp,
                delta: defender.currentHp - oldHp,
                reason: 'damage',
                by: actor,
                skillId: skill.id
            });

            if (fainted) {
                manager.log(`${defender.getDisplayName()} 倒下了！`);
                return true;
            }
        }

        if (skill.effect) {
            this.applySkillEffect(manager, skill.effect, attacker, defender, attackerStages, defenderStages, result);
        }

        return false;
    },

    applySkillEffect(manager, effect, attacker, defender, attackerStages, defenderStages, result) {
        const battleEffects = manager.getDependency('BattleEffects');
        if (!battleEffects) {
            return;
        }

        battleEffects.applySkillEffect(effect, {
            attacker,
            defender,
            attackerStages,
            defenderStages,
            result,
            appendEvent: (type, payload) => manager.appendTurnEvent(result, type, payload),
            log: (message) => manager.log(message)
        });
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleActionExecutor', BattleActionExecutor);
}

window.BattleActionExecutor = BattleActionExecutor;
