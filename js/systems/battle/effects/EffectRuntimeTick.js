/**
 * BattleEffectRuntimeTick - turn-end tick extension for BattleEffectRuntime.
 */

if (typeof BattleEffectRuntime !== 'undefined' && BattleEffectRuntime) {
    BattleEffectRuntime.tickTurnEnd = function tickTurnEnd(manager, result) {
        const tickSide = (side) => {
            const state = this.getSideState(manager, side);
            const elf = this.getElfBySide(manager, side);
            if (!elf) {
                return;
            }

            const applyDamageTick = (amount, statusType, sourceSide) => {
                if (elf.isFainted()) {
                    return;
                }

                const oldHp = elf.currentHp;
                const applied = Math.min(oldHp, Math.max(0, Math.floor(amount || 0)));
                if (applied <= 0) {
                    return;
                }

                elf.currentHp = oldHp - applied;
                if (typeof elf._syncInstanceData === 'function') {
                    elf._syncInstanceData();
                }

                manager.log(`${elf.getDisplayName()} 受到持续效果影响，损失了 ${applied} 点体力！`);
                manager.appendTurnEvent(result, BattleManager.EVENT.STATUS_DAMAGE, {
                    target: side,
                    status: statusType,
                    damage: applied,
                    oldHp,
                    newHp: elf.currentHp
                });
                manager.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                    target: side,
                    oldHp,
                    newHp: elf.currentHp,
                    delta: elf.currentHp - oldHp,
                    reason: 'status_damage',
                    status: statusType,
                    by: sourceSide || null
                });
            };

            const applyHealTick = (targetSide, amount, reasonTag) => {
                const targetElf = this.getElfBySide(manager, targetSide);
                if (!targetElf || targetElf.isFainted() || this.isNoHeal(manager, targetSide)) {
                    return;
                }

                const oldHp = targetElf.currentHp;
                const maxHp = targetElf.getMaxHp();
                targetElf.currentHp = Math.min(maxHp, oldHp + Math.max(0, Math.floor(amount || 0)));
                if (typeof targetElf._syncInstanceData === 'function') {
                    targetElf._syncInstanceData();
                }

                if (targetElf.currentHp !== oldHp) {
                    manager.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                        target: targetSide,
                        oldHp,
                        newHp: targetElf.currentHp,
                        delta: targetElf.currentHp - oldHp,
                        reason: 'effect_heal',
                        status: reasonTag
                    });
                }
            };

            if (state.dotFixedDamage && state.dotFixedDamage.remainingTurns > 0) {
                applyDamageTick(state.dotFixedDamage.amount, 'dotFixedDamage', state.dotFixedDamage.sourceSide);
            }

            if (state.parasitism && state.parasitism.remainingTurns > 0) {
                const ratio = Number.isFinite(state.parasitism.healRatio) ? state.parasitism.healRatio : 0.125;
                const drainAmount = Math.max(1, Math.floor(elf.getMaxHp() * ratio));
                const oldHp = elf.currentHp;
                applyDamageTick(drainAmount, 'parasitism', state.parasitism.sourceSide);
                const actualDrain = oldHp - elf.currentHp;
                if (actualDrain > 0) {
                    applyHealTick(state.parasitism.sourceSide, actualDrain, 'parasitism');
                }
            }

            if (
                state.compositeBuff.regen
                && state.compositeBuff.regen.remainingTurns > 0
                && !elf.isFainted()
                && !this.isNoHeal(manager, side)
            ) {
                const healAmount = Math.max(1, Math.floor(elf.getMaxHp() * (state.compositeBuff.regen.ratio || 0)));
                applyHealTick(side, healAmount, 'compositeBuffRegen');
            }

            const tickSingle = (slot) => {
                if (!state[slot] || state[slot].remainingTurns <= 0) {
                    return;
                }
                state[slot].remainingTurns -= 1;
                if (state[slot].remainingTurns <= 0) {
                    manager.appendTurnEvent(result, BattleManager.EVENT.EFFECT_EXPIRED, {
                        side,
                        effectType: slot
                    });
                    state[slot] = null;
                }
            };

            tickSingle('protect');
            tickSingle('voidShield');
            tickSingle('skillLifeSteadyRegen');
            tickSingle('statusSkillImmune');
            tickSingle('dotFixedDamage');
            tickSingle('guaranteedCrit');
            tickSingle('statusSkillSeal');
            tickSingle('noHeal');
            tickSingle('parasitism');

            Object.keys(state.fieldEffects).forEach((key) => {
                const entry = state.fieldEffects[key];
                if (!entry || entry.remainingTurns <= 0) {
                    state.fieldEffects[key] = null;
                    return;
                }
                entry.remainingTurns -= 1;
                if (entry.remainingTurns <= 0) {
                    manager.appendTurnEvent(result, BattleManager.EVENT.EFFECT_EXPIRED, {
                        side,
                        effectType: key
                    });
                    state.fieldEffects[key] = null;
                }
            });

            const tickComposite = (slot) => {
                const entry = state.compositeBuff[slot];
                if (!entry || entry.remainingTurns <= 0) {
                    state.compositeBuff[slot] = null;
                    return;
                }
                entry.remainingTurns -= 1;
                if (entry.remainingTurns <= 0) {
                    manager.appendTurnEvent(result, BattleManager.EVENT.EFFECT_EXPIRED, {
                        side,
                        effectType: `composite.${slot}`
                    });
                    state.compositeBuff[slot] = null;
                }
            };

            tickComposite('immuneDamage');
            tickComposite('regen');
            tickComposite('guaranteedFirstStrike');
            tickComposite('damageMultiplier');
        };

        tickSide('player');
        tickSide('enemy');
    };
}
