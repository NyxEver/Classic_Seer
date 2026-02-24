/** BattleActionResolver - 非技能动作解析器 */

const BattleActionResolver = {
    getActionItemId(manager, action) {
        if (!action || typeof action !== 'object') {
            return null;
        }

        if (typeof action.itemId === 'number') {
            return action.itemId;
        }

        if (action.capsule && typeof action.capsule.id === 'number') {
            return action.capsule.id;
        }

        return null;
    },

    applyPlayerItem(manager, itemId, result) {
        const itemBag = manager.getDependency('ItemBag');
        const dataLoader = manager.getDependency('DataLoader');
        const playerData = manager.getDependency('PlayerData');

        if (!itemBag || !dataLoader || !playerData) {
            manager.log('道具系统未就绪，无法使用道具。');
            return { applied: false, consumesTurn: false };
        }

        const itemData = dataLoader.getItem(itemId);
        if (!itemData) {
            manager.log('该道具不存在，无法使用。');
            return { applied: false, consumesTurn: false };
        }

        if (!itemBag.has(itemId, 1)) {
            manager.log(`${itemData.name} 数量不足！`);
            return { applied: false, consumesTurn: false };
        }

        if (itemData.type === 'capsule') {
            manager.log('捕捉胶囊请使用捕捉指令。');
            return { applied: false, consumesTurn: false };
        }

        if (itemData.type === 'hpPotion') {
            const runtime = manager.getDependency('BattleEffectRuntime');
            if (runtime && typeof runtime.isNoHeal === 'function' && runtime.isNoHeal(manager, 'player')) {
                manager.log(`${manager.playerElf.getDisplayName()} 处于禁疗状态，无法使用回复药剂！`);
                return { applied: false, consumesTurn: false };
            }

            const healAmount = itemData.effect ? (itemData.effect.hpRestore || 20) : 20;
            const maxHp = manager.playerElf.getMaxHp();
            const oldHp = manager.playerElf.currentHp;
            manager.playerElf.currentHp = Math.min(maxHp, oldHp + healAmount);
            const healed = manager.playerElf.currentHp - oldHp;

            if (healed <= 0) {
                manager.log(`${manager.playerElf.getDisplayName()} 的 HP 已满！`);
                return { applied: false, consumesTurn: false };
            }

            itemBag.remove(itemId, 1);
            manager.playerElf._syncInstanceData();
            playerData.saveToStorage();

            manager.log(`使用了 ${itemData.name}，恢复了 ${healed} HP！`);
            manager.appendTurnEvent(result, BattleManager.EVENT.ITEM_USED, {
                actor: 'player',
                itemId,
                itemType: itemData.type,
                hpRecovered: healed
            });
            manager.appendTurnEvent(result, BattleManager.EVENT.HP_CHANGE, {
                target: 'player',
                oldHp,
                newHp: manager.playerElf.currentHp,
                delta: manager.playerElf.currentHp - oldHp,
                reason: 'item_use',
                itemId
            });
            return { applied: true, consumesTurn: true };
        }

        if (itemData.type === 'ppPotion') {
            const restoreAmount = itemData.effect ? (itemData.effect.ppRestore || 5) : 5;
            const skills = manager.playerElf.getSkillDetails();
            let restored = false;
            const restoredSkills = [];

            skills.forEach((skill) => {
                const currentPp = manager.playerElf.skillPP[skill.id] || 0;
                if (currentPp < skill.pp) {
                    const nextPp = Math.min(skill.pp, currentPp + restoreAmount);
                    manager.playerElf.skillPP[skill.id] = nextPp;
                    restoredSkills.push({
                        skillId: skill.id,
                        oldPP: currentPp,
                        newPP: nextPp,
                        delta: nextPp - currentPp
                    });
                    restored = true;
                }
            });

            if (!restored) {
                manager.log('所有技能 PP 已满！');
                return { applied: false, consumesTurn: false };
            }

            itemBag.remove(itemId, 1);
            manager.playerElf._syncInstanceData();
            playerData.saveToStorage();

            manager.log(`使用了 ${itemData.name}，恢复了技能 PP！`);
            manager.appendTurnEvent(result, BattleManager.EVENT.ITEM_USED, {
                actor: 'player',
                itemId,
                itemType: itemData.type,
                ppRestored: restoreAmount,
                restoredSkills
            });
            restoredSkills.forEach((entry) => {
                manager.appendTurnEvent(result, BattleManager.EVENT.PP_CHANGE, {
                    target: 'player',
                    skillId: entry.skillId,
                    oldPP: entry.oldPP,
                    newPP: entry.newPP,
                    delta: entry.delta,
                    reason: 'item_use',
                    itemId
                });
            });
            return { applied: true, consumesTurn: true };
        }

        manager.log('该道具当前无法在战斗中使用。');
        return { applied: false, consumesTurn: false };
    },

    prepareEnemyAction(manager, result) {
        manager.generateEnemyAction();
        result.enemyAction = manager.cloneAction(manager.enemyAction);
        manager.appendActionSubmittedEvent(result, 'enemy', manager.enemyAction);
    },

    async resolvePrimaryAction(manager, result) {
        const action = manager.playerAction;

        if (!action || !action.type) {
            manager.log('本回合未提交有效行动。');
            manager.markActionRejected(result, 'invalid_player_action');
            return;
        }

        if (action.type === BattleManager.ACTION.CATCH) {
            await this.resolveCatchAction(manager, result);
            return;
        }

        if (action.type === BattleManager.ACTION.SWITCH) {
            manager.appendTurnEvent(result, BattleManager.EVENT.SWITCH_DONE, {
                actor: 'player',
                elfIndex: action.elfIndex
            });
            this.prepareEnemyAction(manager, result);
            await manager.executeAction('enemy', result);
            return;
        }

        if (action.type === BattleManager.ACTION.ITEM) {
            const itemId = this.getActionItemId(manager, action);
            const itemOutcome = this.applyPlayerItem(manager, itemId, result);
            if (itemOutcome.applied && itemOutcome.consumesTurn) {
                this.prepareEnemyAction(manager, result);
                await manager.executeAction('enemy', result);
            } else {
                manager.markActionRejected(result, 'item_use_rejected');
            }
            return;
        }

        if (action.type === BattleManager.ACTION.ESCAPE) {
            const escaped = manager.attemptEscape();
            manager.appendTurnEvent(result, BattleManager.EVENT.ESCAPE_RESULT, {
                actor: 'player',
                success: escaped
            });

            if (escaped) {
                manager.log('成功逃跑了！');
                manager.markBattleEnd(result, {
                    reason: 'escape_success',
                    escaped: true
                });
                manager.appendBattleEndEvent(result, 'escape_success');
                manager.setPhase(BattleManager.PHASE.BATTLE_END);
            } else {
                manager.log('逃跑失败！');
                this.prepareEnemyAction(manager, result);
                await manager.executeAction('enemy', result);
            }
            return;
        }

        if (action.type === BattleManager.ACTION.SKILL) {
            this.prepareEnemyAction(manager, result);

            const order = manager.determineOrder();
            const runtime = manager.getDependency('BattleEffectRuntime');
            if (runtime && typeof runtime.recordTurnOrder === 'function') {
                runtime.recordTurnOrder(manager, order);
            }
            result.turnOrder = order.slice();
            console.log('[BattleManager] 行动顺序:', order);

            for (const actor of order) {
                const targetFainted = await manager.executeAction(actor, result);
                if (targetFainted) {
                    break;
                }
            }
            return;
        }
        manager.log('未知行动类型，回合取消。');
        manager.markActionRejected(result, 'unknown_action_type');
    },

    getDeferredCatchEvent(manager, result) {
        const catchEvent = manager.getLastEvent(result, BattleManager.EVENT.CATCH_RESULT);
        if (!catchEvent || !catchEvent.result) {
            return null;
        }
        return catchEvent.result.pending === true ? catchEvent : null;
    },
    async resolveDeferredCatch(manager, result) {
        const catchEvent = this.getDeferredCatchEvent(manager, result);
        if (!catchEvent) {
            return result && result.catchResult ? result.catchResult : null;
        }
        const catchSystem = manager.getDependency('CatchSystem');
        const playerData = manager.getDependency('PlayerData');
        const dataLoader = manager.getDependency('DataLoader');
        const catchResult = {
            ...(catchEvent.result || {}),
            pending: false,
            success: false,
            reason: null,
            target: null
        };
        if (!catchSystem || !playerData || !dataLoader) {
            catchResult.reason = 'catch_system_unavailable';
        } else {
            const capsule = dataLoader.getItem(catchResult.itemId);
            if (!capsule || capsule.type !== 'capsule') {
                catchResult.reason = 'invalid_capsule_type';
            } else {
                const attempt = catchSystem.attemptCatch(manager.enemyElf, capsule);
                catchResult.rate = attempt.rate;
                catchResult.shakes = attempt.shakes;

                if (attempt.success) {
                    const capturedResult = catchSystem.addCapturedElf(manager.enemyElf);
                    if (!capturedResult || !capturedResult.success) {
                        catchResult.success = false;
                        catchResult.reason = capturedResult && capturedResult.reason
                            ? capturedResult.reason
                            : 'capture_store_failed';
                    } else {
                        catchResult.success = true;
                        catchResult.target = capturedResult.target || 'bag';
                    }
                } else {
                    catchResult.success = false;
                    catchResult.reason = 'catch_failed';
                }
            }
        }
        catchEvent.success = !!catchResult.success;
        catchEvent.result = catchResult;
        result.catchResult = catchResult;
        result.outcome.deferAfterAnimation = false;
        if (catchResult.success) {
            if (catchResult.target === 'storage') {
                manager.log(`成功捕捉了 ${manager.enemyElf.getDisplayName()}，已自动放入仓库！`);
            } else {
                manager.log(`成功捕捉了 ${manager.enemyElf.getDisplayName()}！`);
            }
            manager.markBattleEnd(result, {
                winner: 'player',
                reason: 'catch_success',
                captured: true
            });
            manager.appendBattleEndEvent(result, 'catch_success');
            manager.setPhase(BattleManager.PHASE.BATTLE_END);
            playerData.saveToStorage();
            return catchResult;
        }
        if (catchResult.reason === 'bag_storage_full') {
            manager.log('背包与仓库已满，捕捉失败！');
        } else {
            manager.log('捕捉失败！');
        }
        result.outcome.status = 'continue';
        result.outcome.reason = catchResult.reason || 'catch_failed';
        manager.setPhase(BattleManager.PHASE.EXECUTE_TURN);
        return catchResult;
    },
    async resolveDeferredCatchFailure(manager, result) {
        const catchEvent = manager.getLastEvent(result, BattleManager.EVENT.CATCH_RESULT);
        const catchResult = catchEvent && catchEvent.result ? catchEvent.result : null;
        if (!catchResult || catchResult.success) {
            return;
        }
        this.prepareEnemyAction(manager, result);
        await manager.executeAction('enemy', result);
        if (!result.outcome.battleEnded) {
            await manager.processAfterActions(result);
        }
    },

    async resolveCatchAction(manager, result) {
        if (!manager.canCatch) {
            manager.log('无法在此战斗中捕捉！');
            manager.markActionRejected(result, 'catch_not_allowed');
            return;
        }

        const itemBag = manager.getDependency('ItemBag');
        const dataLoader = manager.getDependency('DataLoader');
        const capsuleItemId = this.getActionItemId(manager, manager.playerAction);

        if (!itemBag || !dataLoader) {
            manager.log('捕捉系统未就绪，无法使用胶囊。');
            manager.markActionRejected(result, 'catch_system_unavailable');
            return;
        }

        if (!capsuleItemId) {
            manager.log('未选择有效的捕捉胶囊。');
            manager.markActionRejected(result, 'invalid_capsule');
            return;
        }

        const capsule = dataLoader.getItem(capsuleItemId);
        if (!capsule || capsule.type !== 'capsule') {
            manager.log('该道具不是可用的捕捉胶囊。');
            manager.markActionRejected(result, 'invalid_capsule_type');
            return;
        }

        if (!itemBag.has(capsuleItemId, 1)) {
            manager.log(`${capsule.name} 数量不足！`);
            manager.markActionRejected(result, 'capsule_insufficient');
            return;
        }

        // 先扣胶囊并写入 item_used，再进入动画后判定。
        itemBag.remove(capsuleItemId, 1);
        manager.log(`使用了 ${capsule.name}！`);
        manager.appendTurnEvent(result, BattleManager.EVENT.ITEM_USED, {
            actor: 'player',
            itemId: capsuleItemId,
            itemType: 'capsule'
        });

        const pendingCatchResult = {
            pending: true,
            success: false,
            itemId: capsuleItemId,
            capsuleName: capsule.name,
            reason: null,
            target: null
        };

        manager.appendTurnEvent(result, BattleManager.EVENT.CATCH_RESULT, {
            actor: 'player',
            itemId: capsuleItemId,
            success: false,
            result: pendingCatchResult
        });

        result.catchResult = pendingCatchResult;
        result.outcome.deferAfterAnimation = true;
        result.outcome.reason = 'catch_pending_animation';
        result.outcome.status = 'continue';
        manager.setPhase(BattleManager.PHASE.PLAYER_CHOOSE);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleActionResolver', BattleActionResolver);
}

window.BattleActionResolver = BattleActionResolver;
