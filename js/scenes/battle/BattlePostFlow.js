/**
 * BattlePostFlow - BattleScene post-turn and lifecycle facade methods.
 *
 * These methods run with BattleScene as `this`.
 */

function getBattlePostFlowDependency(name) {
    if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
        const dep = AppContext.get(name, null);
        if (dep) {
            return dep;
        }
    }
    if (typeof window !== 'undefined') {
        return window[name] || null;
    }
    return null;
}

function getSafeReturnData(scene) {
    if (!scene || !scene.returnData || typeof scene.returnData !== 'object') {
        return {};
    }
    return { ...scene.returnData };
}

function startBattleFollowupScene(scene, targetScene, data) {
    const sceneRouter = getBattlePostFlowDependency('SceneRouter');
    if (!sceneRouter) {
        return false;
    }

    scene.fadeOutBattleBgm(() => {
        const launched = sceneRouter.launch(scene, targetScene, data, {
            bgmStrategy: 'inherit'
        });
        if (launched) {
            scene.scene.bringToTop(targetScene);
        }
    });
    return true;
}

const BattlePostFlow = {
    finalizeBattleOnce(flow, payload = {}) {
        switch (flow) {
            case 'capture_success': {
                if (this.postFlowLocked) {
                    return false;
                }

                this.postFlowLocked = true;
                this.battleEnded = true;
                this.disableMenu();
                this.showPopup(
                    payload.title || '🎉 捕捉成功！',
                    payload.message || `成功捕捉了 ${this.enemyElf.getDisplayName()}！`,
                    () => this.finalizeBattleOnce('return_to_map', { reason: 'capture_success' })
                );
                return true;
            }
            case 'escape_success': {
                if (this.postFlowLocked) {
                    return false;
                }

                this.postFlowLocked = true;
                this.battleEnded = true;
                this.disableMenu();
                this.showPopup(
                    payload.title || '逃跑成功！',
                    payload.message || '成功逃离了战斗！',
                    () => this.finalizeBattleOnce('return_to_map', { reason: 'escape_success' })
                );
                return true;
            }
            case 'battle_end': {
                if (this.postFlowLocked) {
                    return false;
                }

                const result = payload.result || {};
                this.postFlowLocked = true;
                this.battleEnded = true;
                this.disableMenu();

                if (result.victory) {
                    let msg = `获得 ${result.expGained} 经验值！`;
                    if (result.levelUps && result.levelUps.length > 0) {
                        for (const lu of result.levelUps) {
                            msg += `\n升到 ${lu.newLevel} 级！`;
                            for (const sid of lu.newSkills) {
                                const dataLoader = getBattlePostFlowDependency('DataLoader');
                                const sk = dataLoader ? dataLoader.getSkill(sid) : null;
                                if (sk) {
                                    msg += `\n学会 ${sk.name}！`;
                                }
                            }
                        }
                    }

                    if (result.pendingSkills && result.pendingSkills.length > 0) {
                        msg += `\n\n有 ${result.pendingSkills.length} 个新技能待学习...`;
                    }

                    if (result.canEvolve && result.evolveTo && result.playerElf) {
                        msg += `\n\n咦？${result.playerElf.getDisplayName()} 好像要进化了！`;
                    }

                    this.pendingResult = result;

                    this.time.delayedCall(500, () => {
                        this.showPopup('🎉 战斗胜利！', msg, () => {
                            this.finalizeBattleOnce('post_battle');
                        });
                    });
                } else {
                    this.time.delayedCall(500, () => {
                        this.showPopup('战斗失败', `${this.playerElf.getDisplayName()} 倒下了...`, () => {
                            this.finalizeBattleOnce('return_to_map', { reason: 'battle_defeat' });
                        });
                    });
                }

                return true;
            }
            case 'post_battle':
                this.processPostBattle();
                return true;
            case 'evolution_check':
                this.processEvolution();
                return true;
            case 'return_to_map':
                this.returnToMap();
                return true;
            default:
                return false;
        }
    },

    handleBattleEnd(result) {
        return this.finalizeBattleOnce('battle_end', { result });
    },

    processPostBattle() {
        const result = this.pendingResult;
        if (!result) {
            this.finalizeBattleOnce('return_to_map', { reason: 'missing_pending_result' });
            return;
        }

        if (result.pendingSkills && result.pendingSkills.length > 0) {
            this.processNextPendingSkill(result.pendingSkills, 0, () => {
                this.finalizeBattleOnce('evolution_check');
            });
        } else {
            this.finalizeBattleOnce('evolution_check');
        }
    },

    processNextPendingSkill(pendingSkills, index, onComplete) {
        if (index >= pendingSkills.length) {
            onComplete();
            return;
        }

        const skillId = pendingSkills[index];
        const result = this.pendingResult;

        if (!result) {
            this.finalizeBattleOnce('return_to_map', { reason: 'missing_pending_result' });
            return;
        }

        const returnData = getSafeReturnData(this);

        const started = startBattleFollowupScene(this, 'SkillLearnScene', {
            elf: result.playerElf,
            newSkillId: skillId,
            returnScene: this.returnScene,
            returnData,
            closeSceneKeys: ['BattleScene'],
            chainData: {
                canEvolve: result.canEvolve,
                evolveTo: result.evolveTo,
                playerElf: result.playerElf,
                returnScene: this.returnScene,
                returnData
            }
        });

        if (!started) {
            this.finalizeBattleOnce('return_to_map', { reason: 'missing_scene_router_for_skill' });
        }
    },

    processEvolution() {
        const result = this.pendingResult;
        if (!result) {
            this.finalizeBattleOnce('return_to_map', { reason: 'missing_pending_result' });
            return;
        }

        if (result.canEvolve && result.evolveTo && result.playerElf) {
            const elfBeforeEvolution = result.playerElf;
            const newElfId = result.evolveTo;

            const playerData = getBattlePostFlowDependency('PlayerData');
            if (!playerData) {
                this.finalizeBattleOnce('return_to_map', { reason: 'missing_player_data_for_evolution' });
                return;
            }

            const returnData = getSafeReturnData(this);
            const started = startBattleFollowupScene(this, 'EvolutionScene', {
                elf: elfBeforeEvolution,
                newElfId,
                returnScene: this.returnScene,
                returnData,
                closeSceneKeys: ['BattleScene'],
                callback: () => {
                    elfBeforeEvolution.evolve();
                    playerData.saveToStorage();
                    console.log(`[BattleScene] 进化完成: ${elfBeforeEvolution.name}`);
                }
            });

            if (!started) {
                this.finalizeBattleOnce('return_to_map', { reason: 'missing_scene_router_for_evolution' });
            }
        } else {
            this.finalizeBattleOnce('return_to_map', { reason: 'evolution_not_required' });
        }
    },

    returnToMap() {
        if (this.returnTriggered) {
            return;
        }
        this.returnTriggered = true;

        const sceneRouter = getBattlePostFlowDependency('SceneRouter');
        if (!sceneRouter) {
            return;
        }

        const returnData = getSafeReturnData(this);
        this.fadeOutBattleBgm(() => {
            sceneRouter.start(this, this.returnScene, returnData, {
                bgmStrategy: 'inherit'
            });
        });
    },

    playBattleBgm() {
        const bgmManager = getBattlePostFlowDependency('BgmManager');
        if (!bgmManager) {
            console.warn('[BattleScene] BgmManager 未加载，跳过战斗 BGM');
            return;
        }

        this.bgmStopTriggered = false;
        bgmManager.transitionTo('BattleScene', this);
        this.battleBgm = bgmManager.currentSound;
    },

    fadeOutBattleBgm(onComplete = null, fadeMs = 450, force = false) {
        const bgmManager = getBattlePostFlowDependency('BgmManager');
        if (!bgmManager) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        if (this.bgmStopTriggered && !force) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.bgmStopTriggered = true;

        bgmManager.stopCurrent(Math.max(0, fadeMs), () => {
            this.battleBgm = null;
            if (onComplete) {
                onComplete();
            }
        }, this);
    },

    cleanupBattleBgm() {
        const bgmManager = getBattlePostFlowDependency('BgmManager');
        if (bgmManager && bgmManager.currentSound) {
            this.fadeOutBattleBgm(null, 0, true);
        }
        this.battleBgm = null;
        this.isBgmFadingOut = false;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattlePostFlow', BattlePostFlow);
}

window.BattlePostFlow = BattlePostFlow;
