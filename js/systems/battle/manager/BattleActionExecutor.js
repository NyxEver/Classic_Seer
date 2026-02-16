/**
 * BattleActionExecutor - 单次行动执行器
 * 负责技能路径（PP、命中、伤害、effect dispatcher）及事件写入。
 */

function getExecutorSupport() {
    if (typeof AppContext !== 'undefined' && AppContext && typeof AppContext.get === 'function') {
        return AppContext.get('BattleActionExecutorSupport', null);
    }
    if (typeof window !== 'undefined') {
        return window.BattleActionExecutorSupport || null;
    }
    return null;
}

const BattleActionExecutor = {
    async executeAction(manager, actor, result) {
        const support = getExecutorSupport();
        if (!support) {
            console.error('[BattleActionExecutor] BattleActionExecutorSupport 未加载');
            return false;
        }

        const isPlayer = actor === 'player';
        const action = isPlayer ? manager.playerAction : manager.enemyAction;
        const attacker = isPlayer ? manager.playerElf : manager.enemyElf;
        const defender = isPlayer ? manager.enemyElf : manager.playerElf;
        const actorSide = isPlayer ? 'player' : 'enemy';
        const defenderSide = isPlayer ? 'enemy' : 'player';
        const attackerStages = isPlayer ? manager.playerStatStages : manager.enemyStatStages;
        const defenderStages = isPlayer ? manager.enemyStatStages : manager.playerStatStages;

        if (!action || action.type !== BattleManager.ACTION.SKILL) {
            return false;
        }

        const statusEffect = manager.getDependency('StatusEffect');
        if (statusEffect && typeof statusEffect.canAct === 'function') {
            const actionState = statusEffect.canAct(attacker, manager.turnCount);
            if (!actionState.canAct) {
                const statusName = statusEffect.getStatusName(actionState.statusType);
                if (actionState.reason === 'woken_this_turn') {
                    manager.log(`${attacker.getDisplayName()} 刚从${statusName}中恢复，本回合无法行动！`);
                } else {
                    manager.log(`${attacker.getDisplayName()} 处于${statusName}状态，无法行动！`);
                }
                manager.appendTurnEvent(result, BattleManager.EVENT.ACTION_BLOCKED, {
                    actor: actorSide,
                    status: actionState.statusType,
                    reason: actionState.reason
                });
                return false;
            }
        }

        const dataLoader = manager.getDependency('DataLoader');
        const damageCalculator = manager.getDependency('DamageCalculator');
        const runtime = manager.getDependency('BattleEffectRuntime');
        const helpers = manager.getDependency('BattleEffectHelpers') || (typeof BattleEffectHelpers !== 'undefined' ? BattleEffectHelpers : null);
        if (!dataLoader || !damageCalculator || !helpers) {
            console.error('[BattleActionExecutor] DataLoader/DamageCalculator/BattleEffectHelpers 未加载');
            return false;
        }

        if (runtime && typeof runtime.ensure === 'function') {
            runtime.ensure(manager);
        }

        const skill = dataLoader.getSkill(action.skillId);
        if (!skill) {
            console.error('[BattleActionExecutor] 技能不存在:', action.skillId);
            return false;
        }

        const effect = skill.effect && typeof skill.effect === 'object' ? skill.effect : null;
        const effectType = effect && typeof effect.type === 'string' ? effect.type : null;
        const damagePlan = {
            power: skill.power,
            hitCount: 1,
            singleRollHitCount: false,
            minimumTargetHp: null,
            customDamage: null,
            cancelDamage: false,
            forceCritical: !!(runtime && typeof runtime.isGuaranteedCrit === 'function' && runtime.isGuaranteedCrit(manager, actorSide)),
            damageMultiplier: 1,
            forceNeutralHit: false
        };

        const effectContext = {
            manager,
            result,
            runtime,
            helpers,
            actorSide,
            targetSide: defenderSide,
            attacker,
            defender,
            attackerStages,
            defenderStages,
            action,
            skill,
            effect,
            effectType,
            damagePlan,
            damageResult: null,
            damageDealt: 0
        };

        const oldPP = attacker.skillPP[action.skillId] || 0;
        attacker.useSkill(action.skillId);
        const newPP = attacker.skillPP[action.skillId] || 0;
        manager.appendTurnEvent(result, BattleManager.EVENT.PP_CHANGE, {
            target: actorSide,
            skillId: action.skillId,
            oldPP,
            newPP,
            delta: newPP - oldPP,
            reason: 'skill_cast'
        });

        support.applyStatusSkillSealPenalty(runtime, manager, actorSide, attacker, action.skillId, result);

        manager.log(`${attacker.getDisplayName()} 使用了 ${skill.name}！`);
        manager.appendTurnEvent(result, BattleManager.EVENT.SKILL_CAST, {
            actor: actorSide,
            target: defenderSide,
            skillId: skill.id,
            skillName: skill.name,
            skillType: skill.type,
            skillCategory: skill.category || 'status'
        });

        if (support.shouldBlockByVoidShield(runtime, manager, actorSide, defenderSide, skill)) {
            manager.log(`${attacker.getDisplayName()} 的技能被虚无护盾化解了！`);
            manager.appendTurnEvent(result, BattleManager.EVENT.ACTION_BLOCKED, {
                actor: actorSide,
                reason: 'void_shield'
            });
            manager.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                actor: actorSide,
                target: defenderSide,
                skillId: skill.id,
                skillName: skill.name,
                reason: 'void_shield'
            });
            return false;
        }

        if (runtime && typeof runtime.getStatusSkillSeal === 'function') {
            const seal = runtime.getStatusSkillSeal(manager, actorSide);
            if (seal && skill.category === 'status') {
                const chance = Number.isFinite(seal.chance) ? seal.chance : 100;
                if (!helpers.rollChance(chance)) {
                    manager.log(`${attacker.getDisplayName()} 的属性技能被封印，技能失效！`);
                    manager.appendTurnEvent(result, BattleManager.EVENT.ACTION_BLOCKED, {
                        actor: actorSide,
                        reason: 'status_skill_seal'
                    });
                    manager.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                        actor: actorSide,
                        target: defenderSide,
                        skillId: skill.id,
                        skillName: skill.name,
                        reason: 'status_skill_seal'
                    });
                    return false;
                }
            }
        }

        if (runtime && typeof runtime.isStatusSkillImmune === 'function' && runtime.isStatusSkillImmune(manager, defenderSide) && skill.category === 'status') {
            manager.log(`${defender.getDisplayName()} 免疫属性技能，攻击未生效！`);
            manager.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                actor: actorSide,
                target: defenderSide,
                skillId: skill.id,
                skillName: skill.name,
                reason: 'status_skill_immune'
            });
            return false;
        }

        const hit = damageCalculator.checkHit(skill, -defenderStages.accuracy);
        if (!hit) {
            manager.log('但是没有命中...');
            manager.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                actor: actorSide,
                target: defenderSide,
                skillId: skill.id,
                skillName: skill.name
            });
            return false;
        }

        if (runtime && typeof runtime.hasWaterSport === 'function' && runtime.hasWaterSport(manager, defenderSide) && skill.type === 'fire') {
            damagePlan.damageMultiplier *= 0.5;
            manager.log('受玩水效果影响，火系伤害降低！');
        }
        if (runtime && typeof runtime.getDamageMultiplier === 'function') {
            const extraMultiplier = runtime.getDamageMultiplier(manager, actorSide);
            if (extraMultiplier !== 1) {
                damagePlan.damageMultiplier *= extraMultiplier;
            }
        }

        support.runEffectHook(manager, effectType, 'beforeDamage', effectContext);

        const shouldApplyDamagePath = skill.power > 0 || Number.isFinite(damagePlan.customDamage);
        if (shouldApplyDamagePath) {
            if (runtime && typeof runtime.consumeProtect === 'function' && runtime.consumeProtect(manager, defenderSide)) {
                manager.log(`${defender.getDisplayName()} 的防护挡下了攻击！`);
                manager.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                    actor: actorSide,
                    target: defenderSide,
                    skillId: skill.id,
                    skillName: skill.name,
                    reason: 'protect'
                });
                return false;
            }

            if (runtime && typeof runtime.hasImmuneDamage === 'function' && runtime.hasImmuneDamage(manager, defenderSide)) {
                manager.log(`${defender.getDisplayName()} 当前免疫伤害！`);
                manager.appendTurnEvent(result, BattleManager.EVENT.MISS, {
                    actor: actorSide,
                    target: defenderSide,
                    skillId: skill.id,
                    skillName: skill.name,
                    reason: 'immune_damage'
                });
                return false;
            }
        }

        let damage = 0;
        let damageResult = { damage: 0, isCritical: false, effectiveness: 1, stab: false, hitCount: 1 };

        if (!damagePlan.cancelDamage && shouldApplyDamagePath) {
            if (Number.isFinite(damagePlan.customDamage)) {
                damage = Math.max(0, Math.floor(damagePlan.customDamage));
                damageResult.hitCount = 1;
            } else {
                const hitCount = Math.max(1, Math.floor(damagePlan.hitCount || 1));
                let total = 0;
                let critical = false;
                let effectiveness = 1;
                let stab = false;

                if (damagePlan.singleRollHitCount) {
                    const single = damageCalculator.calculate(attacker, defender, skill, {
                        overridePower: damagePlan.power,
                        forceCritical: damagePlan.forceCritical
                    });
                    total = single.damage * hitCount;
                    critical = !!single.isCritical;
                    effectiveness = single.effectiveness;
                    stab = !!single.stab;
                } else {
                    for (let i = 0; i < hitCount; i++) {
                        const single = damageCalculator.calculate(attacker, defender, skill, {
                            overridePower: damagePlan.power,
                            forceCritical: damagePlan.forceCritical
                        });
                        total += single.damage;
                        critical = critical || !!single.isCritical;
                        effectiveness = single.effectiveness;
                        stab = stab || !!single.stab;
                    }
                }

                damage = Math.max(0, Math.floor(total * damagePlan.damageMultiplier));
                damageResult = { damage, isCritical: critical, effectiveness, stab, hitCount };
            }
        }

        if (Number.isFinite(damagePlan.minimumTargetHp) && damagePlan.minimumTargetHp >= 0) {
            const maxAllowed = Math.max(0, defender.currentHp - Math.floor(damagePlan.minimumTargetHp));
            damage = Math.min(damage, maxAllowed);
            damageResult.damage = damage;
        }

        if (shouldApplyDamagePath && !damagePlan.cancelDamage) {
            if (!Number.isFinite(damagePlan.customDamage)) {
                const effectText = damageCalculator.getEffectivenessText(damageResult.effectiveness);
                if (effectText) {
                    manager.log(effectText);
                }
                if (damageResult.isCritical) {
                    manager.log('暴击！');
                }
            }

            if (damage > 0) {
                const oldHp = defender.currentHp;
                const fainted = defender.takeDamage(damage);
                effectContext.damageDealt = oldHp - defender.currentHp;

                manager.log(`${defender.getDisplayName()} 受到了 ${effectContext.damageDealt} 点伤害！`);
                manager.appendTurnEvent(result, BattleManager.EVENT.HIT, {
                    actor: actorSide,
                    target: defenderSide,
                    skillId: skill.id,
                    skillName: skill.name,
                    damage: effectContext.damageDealt,
                    critical: damageResult.isCritical,
                    effectiveness: damageResult.effectiveness,
                    hitCount: damageResult.hitCount,
                    targetFainted: fainted
                });
                manager.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                    target: defenderSide,
                    oldHp,
                    newHp: defender.currentHp,
                    delta: defender.currentHp - oldHp,
                    reason: 'damage',
                    by: actorSide,
                    skillId: skill.id
                });

                if (runtime && typeof runtime.recordDamageTaken === 'function') {
                    runtime.recordDamageTaken(manager, defenderSide, effectContext.damageDealt);
                }
                support.tryWakeByHit(manager, defender, defenderSide, result);
            } else {
                manager.appendTurnEvent(result, BattleManager.EVENT.HIT, {
                    actor: actorSide,
                    target: defenderSide,
                    skillId: skill.id,
                    skillName: skill.name,
                    damage: 0,
                    critical: false,
                    effectiveness: damagePlan.forceNeutralHit ? 1 : damageResult.effectiveness,
                    hitCount: damageResult.hitCount,
                    targetFainted: false
                });
            }
        }

        effectContext.damageResult = damageResult;
        support.runEffectHook(manager, effectType, 'onHit', effectContext);
        support.runEffectHook(manager, effectType, 'afterDamage', effectContext);
        support.runEffectHook(manager, effectType, 'afterSkill', effectContext);

        if (runtime && typeof runtime.getTimedEffect === 'function') {
            const steadyRegen = runtime.getTimedEffect(manager, actorSide, 'skillLifeSteadyRegen');
            if (steadyRegen && steadyRegen.amount > 0) {
                const restored = helpers.applyHeal(effectContext, actorSide, steadyRegen.amount, 'effect_heal', {
                    effectType: 'skillLifeSteadyRegen'
                });
                if (restored > 0) {
                    manager.log(`${attacker.getDisplayName()} 从生命稳态中恢复了 ${restored} 点体力！`);
                    manager.appendTurnEvent(result, BattleManager.EVENT.EFFECT_TICK, {
                        side: actorSide,
                        effectType: 'skillLifeSteadyRegen',
                        amount: restored
                    });
                }
            }
        }

        if (defender.isFainted()) {
            manager.log(`${defender.getDisplayName()} 倒下了！`);
            return true;
        }

        return false;
    },

    applySkillEffect(manager, effect, attacker, defender, attackerStages, defenderStages, result) {
        const support = getExecutorSupport();
        const helpers = manager.getDependency('BattleEffectHelpers') || (typeof BattleEffectHelpers !== 'undefined' ? BattleEffectHelpers : null);
        const runtime = manager.getDependency('BattleEffectRuntime');
        if (!support || !helpers || !effect || typeof effect.type !== 'string') {
            return;
        }

        const actorSide = attacker === manager.playerElf ? 'player' : 'enemy';
        const targetSide = actorSide === 'player' ? 'enemy' : 'player';
        const context = {
            manager,
            result,
            runtime,
            helpers,
            actorSide,
            targetSide,
            attacker,
            defender,
            attackerStages,
            defenderStages,
            action: null,
            skill: { id: null, name: 'effect-proxy', category: 'status', power: 0 },
            effect,
            effectType: effect.type,
            damagePlan: { power: 0, hitCount: 1, singleRollHitCount: false, minimumTargetHp: null, customDamage: null, cancelDamage: true, forceCritical: false, damageMultiplier: 1, forceNeutralHit: false },
            damageResult: null,
            damageDealt: 0
        };

        support.runEffectHook(manager, effect.type, 'onHit', context);
        support.runEffectHook(manager, effect.type, 'afterDamage', context);
        support.runEffectHook(manager, effect.type, 'afterSkill', context);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleActionExecutor', BattleActionExecutor);
}

window.BattleActionExecutor = BattleActionExecutor;
