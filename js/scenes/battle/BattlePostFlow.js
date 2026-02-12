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

const BattlePostFlow = {
    handleBattleEnd(result) {
        this.battleEnded = true;
        this.disableMenu();
        this.fadeOutBattleBgm();

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
                    this.processPostBattle();
                });
            });
        } else {
            this.time.delayedCall(500, () => {
                this.showPopup('战斗失败', `${this.playerElf.getDisplayName()} 倒下了...`);
            });
        }
    },

    processPostBattle() {
        const result = this.pendingResult;

        if (result.pendingSkills && result.pendingSkills.length > 0) {
            this.processNextPendingSkill(result.pendingSkills, 0, () => {
                this.processEvolution();
            });
        } else {
            this.processEvolution();
        }
    },

    processNextPendingSkill(pendingSkills, index, onComplete) {
        if (index >= pendingSkills.length) {
            onComplete();
            return;
        }

        const skillId = pendingSkills[index];
        const result = this.pendingResult;

        const sceneRouter = getBattlePostFlowDependency('SceneRouter');
        if (!sceneRouter) {
            this.returnToMap();
            return;
        }

        sceneRouter.start(this, 'SkillLearnScene', {
            elf: result.playerElf,
            newSkillId: skillId,
            returnScene: this.returnScene,
            returnData: this.returnData || {},
            chainData: {
                canEvolve: result.canEvolve,
                evolveTo: result.evolveTo,
                playerElf: result.playerElf,
                returnScene: this.returnScene,
                returnData: this.returnData || {}
            }
        }, {
            bgmStrategy: 'inherit'
        });
    },

    processEvolution() {
        const result = this.pendingResult;

        if (result.canEvolve && result.evolveTo && result.playerElf) {
            const elfBeforeEvolution = result.playerElf;
            const newElfId = result.evolveTo;

            const sceneRouter = getBattlePostFlowDependency('SceneRouter');
            const playerData = getBattlePostFlowDependency('PlayerData');
            if (!sceneRouter || !playerData) {
                this.returnToMap();
                return;
            }

            sceneRouter.start(this, 'EvolutionScene', {
                elf: elfBeforeEvolution,
                newElfId,
                returnScene: this.returnScene,
                returnData: this.returnData || {},
                callback: () => {
                    elfBeforeEvolution.evolve();
                    playerData.saveToStorage();
                    console.log(`[BattleScene] 进化完成: ${elfBeforeEvolution.name}`);
                }
            }, {
                bgmStrategy: 'inherit'
            });
        } else {
            this.returnToMap();
        }
    },

    returnToMap() {
        const sceneRouter = getBattlePostFlowDependency('SceneRouter');
        this.fadeOutBattleBgm(() => {
            if (!sceneRouter) {
                return;
            }
            sceneRouter.start(this, this.returnScene, this.returnData || {}, {
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

        bgmManager.transitionTo('BattleScene', this);
        this.battleBgm = bgmManager.currentSound;
    },

    fadeOutBattleBgm(onComplete = null) {
        const bgmManager = getBattlePostFlowDependency('BgmManager');
        if (!bgmManager) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        bgmManager.stopCurrent(450, () => {
            this.battleBgm = null;
            if (onComplete) {
                onComplete();
            }
        }, this);
    },

    cleanupBattleBgm() {
        const bgmManager = getBattlePostFlowDependency('BgmManager');
        if (bgmManager) {
            bgmManager.stopCurrent(0, null, this);
        }
        this.battleBgm = null;
        this.isBgmFadingOut = false;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattlePostFlow', BattlePostFlow);
}

window.BattlePostFlow = BattlePostFlow;
