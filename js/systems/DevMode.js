/**
 * DevMode - 开发者模式工具
 * 提供调试功能：经验增加、100%捕捉、图鉴解锁
 */

const DevMode = {
    // 开发者模式奖励精灵（谱尼）
    DEV_REWARD_ELF_ID: 300,

    // 开发者模式是否开启
    enabled: false,

    // 100% 捕捉是否开启
    alwaysCatch: false,

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
        window.dev = {
            /**
             * 给指定精灵增加经验
             * @param {number} elfIndex - 精灵在背包中的索引 (0-5)
             * @param {number} amount - 经验数量
             */
            giveExp: (elfIndex, amount = 5000) => {
                const elf = ElfBag.getByIndex(elfIndex);
                if (!elf) {
                    console.error(`[DevMode] 无法找到索引为 ${elfIndex} 的精灵`);
                    return false;
                }

                const oldLevel = elf.level;
                elf.addExp(amount);
                const newLevel = elf.level;

                // 保存存档
                PlayerData.saveToStorage();

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
                const allElves = DataLoader.getAllElves();
                let count = 0;

                allElves.forEach(elfData => {
                    if (!PlayerData.hasCaught(elfData.id)) {
                        PlayerData.markCaught(elfData.id);
                        count++;
                    }
                });

                // 保存存档
                PlayerData.saveToStorage();

                console.log(`[DevMode] 图鉴解锁完成，新增 ${count} 只精灵`);
                console.log(`[DevMode] 当前已捕捉: ${PlayerData.caughtElves.length} 只`);

                return count;
            },

            /**
             * 显示当前开发者模式状态
             */
            status: () => {
                console.log('=== 开发者模式状态 ===');
                console.log(`开发者模式: ${DevMode.enabled ? '开启' : '关闭'}`);
                console.log(`100% 捕捉: ${DevMode.alwaysCatch ? '开启' : '关闭'}`);
                console.log(`图鉴已见: ${PlayerData.seenElves.length} 只`);
                console.log(`图鉴已捕: ${PlayerData.caughtElves.length} 只`);
                console.log(`背包精灵: ${ElfBag.getCount()} 只`);
            }
        };

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
    },

    /**
     * 开启开发者模式时自动发放谱尼（仅发放一次）
     */
    _ensureDevRewardElf() {
        const hasPuni = (PlayerData.elves || []).some((elf) => elf.elfId === this.DEV_REWARD_ELF_ID);
        if (hasPuni) {
            return;
        }

        const added = PlayerData.addElf(this.DEV_REWARD_ELF_ID, 1, '谱尼');
        if (!added) {
            console.warn('[DevMode] 自动发放谱尼失败，可能是数据未加载');
            return;
        }

        PlayerData.markCaught(this.DEV_REWARD_ELF_ID);
        PlayerData.saveToStorage();
        console.log('[DevMode] 已自动发放开发者奖励精灵：谱尼');
    },

    /**
     * 获取当前活动场景的 key
     * @returns {string|null}
     */
    _getCurrentSceneKey() {
        if (typeof game === 'undefined') return null;
        const scenes = game.scene.getScenes(true);
        if (scenes.length > 0) {
            return scenes[0].scene.key;
        }
        return null;
    },

    /**
     * 触发技能学习场景
     * @param {Elf} elf - 精灵实例
     * @param {string} returnSceneKey - 返回的场景 key
     * @param {boolean} canEvolve - 是否可以进化
     */
    _triggerSkillLearnScene(elf, returnSceneKey, canEvolve) {
        if (typeof game === 'undefined') {
            console.error('[DevMode] 无法访问 game 对象');
            return;
        }

        const pendingSkills = elf.getPendingSkills();
        if (pendingSkills.length === 0) return;

        const currentScene = game.scene.getScenes(true)[0];
        if (!currentScene) {
            console.error('[DevMode] 无法获取当前场景');
            return;
        }

        SceneRouter.start(currentScene, 'SkillLearnScene', {
            elf: elf,
            newSkillId: pendingSkills[0],
            returnScene: returnSceneKey,
            returnData: {},
            chainData: {
                canEvolve: canEvolve,
                evolveTo: elf.evolvesTo,
                playerElf: elf,
                returnScene: returnSceneKey
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
        if (typeof game === 'undefined') {
            console.error('[DevMode] 无法访问 game 对象');
            return;
        }

        const currentScene = game.scene.getScenes(true)[0];
        if (!currentScene) {
            console.error('[DevMode] 无法获取当前场景');
            return;
        }

        SceneRouter.start(currentScene, 'EvolutionScene', {
            elf: elf,
            newElfId: elf.evolvesTo,
            returnScene: returnSceneKey,
            returnData: {},
            callback: (evolvedElfId) => {
                elf.evolve();
                PlayerData.saveToStorage();
                console.log(`[DevMode] 进化完成: ${elf.name}`);
            }
        }, {
            bgmStrategy: 'inherit'
        });
    }
};

// 导出为全局对象
window.DevMode = DevMode;
