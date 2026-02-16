/**
 * DevMode - 开发者模式工具
 * 提供调试功能：经验增加、100%捕捉、图鉴解锁
 */

function getDevModeDependency(name) {
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

const DevMode = {
    // 开发者模式奖励精灵（谱尼）
    DEV_REWARD_ELF_ID: 300,

    // 开发者模式是否开启
    enabled: false,

    // 100% 捕捉是否开启
    alwaysCatch: false,

    // 过场类场景（不应作为返回目标）
    transientSceneKeys: ['SkillLearnScene', 'EvolutionScene'],

    /**
     * 开启开发者模式
     */
    enable() {
        this.enabled = true;
        this._ensureDevRewardElf();
        this._mountDevTools();
        console.log('[DevMode] 开发者模式已开启');
    },

    /**
     * 关闭开发者模式
     */
    disable() {
        this.enabled = false;
        this._unmountDevTools();
        console.log('[DevMode] 开发者模式已关闭');
    },

    /**
     * 切换开发者模式
     * @returns {boolean} - 切换后的状态
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    },

    /**
     * 挂载 window.dev 工具对象
     */
    _mountDevTools() {
        const devTools = {
            /**
             * 给指定精灵增加经验
             * @param {number} elfIndex - 精灵在背包中的索引 (0-5)
             * @param {number} amount - 经验数量
             */
            giveExp: (elfIndex, amount = 5000) => {
                const elfBag = getDevModeDependency('ElfBag');
                const playerData = getDevModeDependency('PlayerData');
                if (!elfBag || !playerData) {
                    console.error('[DevMode] ElfBag/PlayerData 未就绪，无法加经验');
                    return false;
                }

                const elf = elfBag.getByIndex(elfIndex);
                if (!elf) {
                    console.error(`[DevMode] 无法找到索引为 ${elfIndex} 的精灵`);
                    return false;
                }

                const oldLevel = elf.level;
                elf.addExp(amount);
                const newLevel = elf.level;

                // 保存存档
                playerData.saveToStorage();

                console.log(`[DevMode] ${elf.name} 获得 ${amount} 经验`);
                if (newLevel > oldLevel) {
                    console.log(`[DevMode] ${elf.name} 从 Lv.${oldLevel} 升级到 Lv.${newLevel}!`);

                    // 检查待处理事件并立即触发场景
                    const pendingSkills = elf.getPendingSkills();
                    const canEvolve = elf.checkEvolution();

                    if (pendingSkills.length > 0 || canEvolve) {
                        // 获取当前活动场景
                        const currentSceneKey = DevMode._getCurrentSceneKey();

                        if (pendingSkills.length > 0) {
                            console.log(`[DevMode] 🎮 触发技能学习界面，${pendingSkills.length} 个新技能待学习`);
                            DevMode._triggerSkillLearnScene(elf, currentSceneKey, canEvolve);
                        } else if (canEvolve) {
                            console.log(`[DevMode] 🎮 触发进化界面`);
                            DevMode._triggerEvolutionScene(elf, currentSceneKey);
                        }
                    }
                }

                return true;
            },

            /**
             * 开启/关闭 100% 捕捉成功
             * @param {boolean} enabled - 是否开启
             */
            setAlwaysCatch: (enabled = true) => {
                DevMode.alwaysCatch = enabled;
                console.log(`[DevMode] 100% 捕捉: ${enabled ? '开启' : '关闭'}`);
            },

            /**
             * 解锁全部图鉴
             * 将所有精灵标记为已见/已捕捉
             */
            unlockAllPokedex: () => {
                const dataLoader = getDevModeDependency('DataLoader');
                const playerData = getDevModeDependency('PlayerData');
                if (!dataLoader || !playerData) {
                    console.error('[DevMode] DataLoader/PlayerData 未就绪，无法解锁图鉴');
                    return 0;
                }

                const allElves = dataLoader.getAllElves();
                let count = 0;

                allElves.forEach(elfData => {
                    if (!playerData.hasCaught(elfData.id)) {
                        playerData.markCaught(elfData.id);
                        count++;
                    }
                });

                // 保存存档
                playerData.saveToStorage();

                console.log(`[DevMode] 图鉴解锁完成，新增 ${count} 只精灵`);
                console.log(`[DevMode] 当前已捕捉: ${playerData.caughtElves.length} 只`);

                return count;
            },

            /**
             * 显示当前开发者模式状态
             */
            status: () => {
                const playerData = getDevModeDependency('PlayerData');
                const elfBag = getDevModeDependency('ElfBag');
                if (!playerData || !elfBag) {
                    console.warn('[DevMode] PlayerData/ElfBag 未就绪');
                    return;
                }

                console.log('=== 开发者模式状态 ===');
                console.log(`开发者模式: ${DevMode.enabled ? '开启' : '关闭'}`);
                console.log(`100% 捕捉: ${DevMode.alwaysCatch ? '开启' : '关闭'}`);
                console.log(`图鉴已见: ${playerData.seenElves.length} 只`);
                console.log(`图鉴已捕: ${playerData.caughtElves.length} 只`);
                console.log(`背包精灵: ${elfBag.getCount()} 只`);
            }
        };

        window.dev = devTools;
        const appContext = getDevModeDependency('AppContext');
        if (appContext && typeof appContext.register === 'function') {
            appContext.register('dev', devTools);
        }

        console.log('[DevMode] window.dev 工具已挂载');
        console.log('[DevMode] 可用命令: dev.giveExp(index, amount), dev.setAlwaysCatch(bool), dev.unlockAllPokedex(), dev.status()');
    },

    /**
     * 卸载 window.dev 工具对象
     */
    _unmountDevTools() {
        if (window.dev) {
            delete window.dev;
            console.log('[DevMode] window.dev 工具已卸载');
        }

        const appContext = getDevModeDependency('AppContext');
        if (appContext && typeof appContext.unregister === 'function') {
            appContext.unregister('dev');
        }
    },

    /**
     * 开启开发者模式时自动发放谱尼（仅发放一次）
     */
    _ensureDevRewardElf() {
        const playerData = getDevModeDependency('PlayerData');
        if (!playerData) {
            console.warn('[DevMode] PlayerData 未就绪，跳过开发者奖励精灵发放');
            return;
        }

        const hasPuni = (playerData.elves || []).some((elf) => elf.elfId === this.DEV_REWARD_ELF_ID);
        if (hasPuni) {
            return;
        }

        const added = playerData.addElf(this.DEV_REWARD_ELF_ID, 1, '谱尼');
        if (!added) {
            console.warn('[DevMode] 自动发放谱尼失败，可能是数据未加载');
            return;
        }

        playerData.markCaught(this.DEV_REWARD_ELF_ID);
        playerData.saveToStorage();
        console.log('[DevMode] 已自动发放开发者奖励精灵：谱尼');
    },

    /**
     * 获取当前活动场景的 key
     * @returns {string|null}
     */
    _getCurrentSceneKey() {
        const gameInstance = getDevModeDependency('game') || getDevModeDependency('__seerGame');
        if (!gameInstance) return null;

        const scenes = gameInstance.scene.getScenes(true);
        if (scenes.length > 0) {
            const currentScene = scenes[0];
            if (!currentScene || !currentScene.scene) {
                return null;
            }

            const currentKey = currentScene.scene.key;
            const transientSet = new Set(this.transientSceneKeys || []);
            if (transientSet.has(currentKey)) {
                const fallback = currentScene.returnScene || null;
                if (fallback && !transientSet.has(fallback) && fallback !== currentKey) {
                    return fallback;
                }
                return 'SpaceshipScene';
            }

            return currentKey;
        }
        return null;
    },

    _sanitizeReturnSceneKey(sceneKey) {
        const transientSet = new Set(this.transientSceneKeys || []);
        if (!sceneKey || transientSet.has(sceneKey)) {
            return 'SpaceshipScene';
        }
        return sceneKey;
    },

    /**
     * 触发技能学习场景
     * @param {Elf} elf - 精灵实例
     * @param {string} returnSceneKey - 返回的场景 key
     * @param {boolean} canEvolve - 是否可以进化
     */
    _triggerSkillLearnScene(elf, returnSceneKey, canEvolve) {
        const gameInstance = getDevModeDependency('game') || getDevModeDependency('__seerGame');
        const sceneRouter = getDevModeDependency('SceneRouter');

        if (!gameInstance) {
            console.error('[DevMode] 无法访问 game 对象');
            return;
        }
        if (!sceneRouter) {
            console.error('[DevMode] SceneRouter 未就绪，无法触发技能学习场景');
            return;
        }

        const dataLoader = getDevModeDependency('DataLoader');
        const pendingSkills = (elf.getPendingSkills() || []).filter((skillId) => {
            if (!Number.isFinite(skillId)) {
                if (typeof elf.removePendingSkill === 'function') {
                    elf.removePendingSkill(skillId);
                }
                return false;
            }
            if (!dataLoader || typeof dataLoader.getSkill !== 'function') {
                return true;
            }
            const exists = !!dataLoader.getSkill(skillId);
            if (!exists && typeof elf.removePendingSkill === 'function') {
                elf.removePendingSkill(skillId);
            }
            return exists;
        });
        if (pendingSkills.length === 0) return;

        const currentScene = gameInstance.scene.getScenes(true)[0];
        if (!currentScene) {
            console.error('[DevMode] 无法获取当前场景');
            return;
        }

        const safeReturnSceneKey = this._sanitizeReturnSceneKey(returnSceneKey);

        sceneRouter.start(currentScene, 'SkillLearnScene', {
            elf: elf,
            newSkillId: pendingSkills[0],
            returnScene: safeReturnSceneKey,
            returnData: {},
            chainData: {
                canEvolve: canEvolve,
                evolveTo: elf.evolvesTo,
                playerElf: elf,
                returnScene: safeReturnSceneKey
            }
        }, {
            bgmStrategy: 'inherit'
        });
    },

    /**
     * 触发进化场景
     * @param {Elf} elf - 精灵实例
     * @param {string} returnSceneKey - 返回的场景 key
     */
    _triggerEvolutionScene(elf, returnSceneKey) {
        const gameInstance = getDevModeDependency('game') || getDevModeDependency('__seerGame');
        const sceneRouter = getDevModeDependency('SceneRouter');
        const playerData = getDevModeDependency('PlayerData');

        if (!gameInstance) {
            console.error('[DevMode] 无法访问 game 对象');
            return;
        }
        if (!sceneRouter || !playerData) {
            console.error('[DevMode] SceneRouter/PlayerData 未就绪，无法触发进化场景');
            return;
        }

        const currentScene = gameInstance.scene.getScenes(true)[0];
        if (!currentScene) {
            console.error('[DevMode] 无法获取当前场景');
            return;
        }

        const safeReturnSceneKey = this._sanitizeReturnSceneKey(returnSceneKey);

        sceneRouter.start(currentScene, 'EvolutionScene', {
            elf: elf,
            newElfId: elf.evolvesTo,
            returnScene: safeReturnSceneKey,
            returnData: {},
            callback: (evolvedElfId) => {
                elf.evolve();
                playerData.saveToStorage();
                console.log(`[DevMode] 进化完成: ${elf.name}`);
            }
        }, {
            bgmStrategy: 'inherit'
        });
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('DevMode', DevMode);
}

// 导出为全局对象
window.DevMode = DevMode;
