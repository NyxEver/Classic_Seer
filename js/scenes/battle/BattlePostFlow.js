/**
 * BattlePostFlow - 战斗后处理流程门面
 *
 * 职责：
 * - 统一管理战斗结束后的各种流程（胜利弹窗、技能学习、进化、返回地图）
 * - 管理战斗 BGM 的播放、淡出与清理
 * - 通过 postFlowLocked 防止流程重复触发
 *
 * 以 BattleScene 的 this 执行所有方法。
 */

/**
 * 获取依赖对象（优先从 AppContext，回退到 window）
 * @param {string} name - 依赖名称
 * @returns {Object|null}
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

/**
 * 安全获取场景返回数据的副本
 * @param {Phaser.Scene} scene
 * @returns {Object}
 */
function getSafeReturnData(scene) {
    if (!scene || !scene.returnData || typeof scene.returnData !== 'object') {
        return {};
    }
    return { ...scene.returnData };
}

/**
 * 启动战斗后续场景（淡出 BGM 后通过 SceneRouter 跳转）
 * @param {Phaser.Scene} scene - 当前场景
 * @param {string} targetScene - 目标场景 key
 * @param {Object} data - 传递数据
 * @returns {boolean} 是否成功启动
 */
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
    /**
     * 战斗结束后的统一流程入口（每个 flow 只允许触发一次）
     * @param {string} flow - 流程类型：capture_success / escape_success / battle_end / post_battle / evolution_check / return_to_map
     * @param {Object} [payload={}] - 流程负载
     * @returns {boolean} 是否处理成功
     */
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

    /**
     * 处理战斗结束结果（委托给 finalizeBattleOnce）
     * @param {Object} result - 战斗结果对象
     * @returns {boolean}
     */
    handleBattleEnd(result) {
        return this.finalizeBattleOnce('battle_end', { result });
    },

    /** 战斗后处理：先处理待学技能，再检查进化 */
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

    /**
     * 递归处理待学技能队列
     * @param {Array} pendingSkills - 待学技能 ID 数组
     * @param {number} index - 当前索引
     * @param {Function} onComplete - 全部处理完成回调
     */
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

    /** 检查并处理进化流程 */
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

    /** 返回地图场景（防重复触发） */
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

    /** 播放战斗 BGM */
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

    /**
     * 淡出战斗 BGM
     * @param {Function|null} [onComplete=null] - 淡出完成回调
     * @param {number} [fadeMs=450] - 淡出持续时间
     * @param {boolean} [force=false] - 是否强制淡出
     */
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

    /** 立即清理战斗 BGM（场景销毁时调用） */
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
