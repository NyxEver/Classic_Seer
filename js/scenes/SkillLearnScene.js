class SkillLearnScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SkillLearnScene' });
    }

    init(data = {}) {
        this.elf = data.elf || null;
        this.newSkillId = Number.isFinite(data.newSkillId) ? data.newSkillId : null;
        this.returnScene = data.returnScene || 'SpaceshipScene';
        this.returnData = data.returnData || {};
        this.callback = typeof data.callback === 'function' ? data.callback : null;
        this.chainData = data.chainData || null;
        this.closeSceneKeys = Array.isArray(data.closeSceneKeys)
            ? data.closeSceneKeys.filter((key) => typeof key === 'string' && key && key !== 'SkillLearnScene')
            : [];

        this.isTransitioning = false;
        this.selectedSlotIndex = null;
        this.newSkillData = null;
        this.currentSkillCards = [];
        this.replaceButtonState = null;
        this.subTitleText = null;
        this.skillArea = null;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        const camera = this.cameras.main;

        this.newSkillData = this.newSkillId !== null ? DataLoader.getSkill(this.newSkillId) : null;
        if (!this.elf || typeof this.elf.getDisplayName !== 'function' || !this.newSkillData) {
            console.error('[SkillLearnScene] 初始化失败：缺少精灵或技能数据');
            if (this.elf && Number.isFinite(this.newSkillId) && typeof this.elf.removePendingSkill === 'function') {
                this.elf.removePendingSkill(this.newSkillId);
            }
            this.returnToPrevious();
            return;
        }

        if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.unmount === 'function') {
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => SkillTooltipView.unmount(this));
            this.events.once(Phaser.Scenes.Events.DESTROY, () => SkillTooltipView.unmount(this));
        }

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5600 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5600;

        this.modalW = Math.min(860, camera.width - 80);
        this.modalH = Math.min(520, camera.height - 70);
        this.modalX = Math.floor((camera.width - this.modalW) / 2);
        this.modalY = Math.floor((camera.height - this.modalH) / 2);

        this.root = this.add.container(this.modalX, this.modalY).setDepth(this.baseDepth + 1);
        this.createFrame();
        this.createHeader();
        this.createSkillArea();
        this.createActionButtons();
        this.refreshHeaderText();
        this.refreshReplaceButtonState();
    }

    confirmReplacement() {
        if (this.isTransitioning || !Number.isInteger(this.selectedSlotIndex)) {
            return;
        }

        const oldSkillId = this.elf.skills[this.selectedSlotIndex];
        this.elf.skills[this.selectedSlotIndex] = this.newSkillId;
        this.elf.skillPP[this.newSkillId] = this.newSkillData.pp;
        if (Number.isFinite(oldSkillId)) {
            delete this.elf.skillPP[oldSkillId];
        }

        if (typeof this.elf.removePendingSkill === 'function') {
            this.elf.removePendingSkill(this.newSkillId);
        }
        if (typeof this.elf._syncInstanceData === 'function') {
            this.elf._syncInstanceData();
        }

        PlayerData.saveToStorage();
        if (this.callback) {
            this.callback(true, this.newSkillId);
        }
        this.returnToPrevious();
    }

    skipLearning() {
        if (this.isTransitioning) {
            return;
        }

        if (this.elf && typeof this.elf.removePendingSkill === 'function' && Number.isFinite(this.newSkillId)) {
            this.elf.removePendingSkill(this.newSkillId);
        }

        PlayerData.saveToStorage();
        if (this.callback) {
            this.callback(false, null);
        }
        this.returnToPrevious();
    }

    returnToPrevious() {
        if (this.isTransitioning) {
            return;
        }
        this.isTransitioning = true;
        if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.hide === 'function') {
            SkillTooltipView.hide(this);
        }

        const defaultReturnScene = this.resolveSafeReturnScene(this.returnScene);
        const defaultReturnData = this.returnData && typeof this.returnData === 'object' ? this.returnData : {};

        if (!this.chainData) {
            this.closeAndReturn(defaultReturnScene, defaultReturnData);
            return;
        }

        const chainReturnScene = this.resolveSafeReturnScene(this.chainData.returnScene || defaultReturnScene);
        const chainReturnData = this.chainData.returnData && typeof this.chainData.returnData === 'object'
            ? this.chainData.returnData
            : defaultReturnData;

        // 链式返回优先级：继续 pending skill -> 进入进化 -> 返回来源场景。
        // 这样可以保证“逐个处理待学习技能”与“学技后进化”两条规则同时成立。
        const remainingSkills = this.getRemainingPendingSkills();
        if (remainingSkills.length > 0) {
            const started = SceneRouter.start(this, 'SkillLearnScene', {
                elf: this.elf,
                newSkillId: remainingSkills[0],
                returnScene: chainReturnScene,
                returnData: chainReturnData,
                closeSceneKeys: this.closeSceneKeys,
                chainData: {
                    canEvolve: this.chainData.canEvolve,
                    evolveTo: this.chainData.evolveTo,
                    playerElf: this.chainData.playerElf,
                    returnScene: chainReturnScene,
                    returnData: chainReturnData
                }
            }, {
                bgmStrategy: 'inherit'
            });
            if (started) {
                return;
            }
        }

        if (this.chainData.canEvolve && this.chainData.evolveTo && this.chainData.playerElf) {
            const launched = this.launchModalAndStopSelf('EvolutionScene', {
                elf: this.chainData.playerElf,
                newElfId: this.chainData.evolveTo,
                returnScene: chainReturnScene,
                returnData: chainReturnData,
                closeSceneKeys: this.closeSceneKeys,
                callback: () => {
                    this.chainData.playerElf.evolve();
                    PlayerData.saveToStorage();
                }
            });
            if (launched) {
                return;
            }
        }

        this.closeAndReturn(chainReturnScene, chainReturnData);
    }

    launchModalAndStopSelf(targetScene, data) {
        const launched = SceneRouter.launch(this, targetScene, data, { bgmStrategy: 'inherit' });
        if (!launched) {
            return false;
        }

        this.scene.bringToTop(targetScene);
        ModalOverlayLayer.unmount(this);
        this.scene.stop();
        return true;
    }

    closeAndReturn(targetSceneKey, targetData) {
        const targetScene = this.resolveSafeReturnScene(targetSceneKey);
        const data = targetData && typeof targetData === 'object' ? targetData : {};

        ModalOverlayLayer.unmount(this);

        if (this.scene.isActive(targetScene)) {
            this.scene.stop();
            return;
        }

        this.stopConfiguredScenes(targetScene);

        const started = SceneRouter.start(this, targetScene, data);
        if (!started && targetScene !== 'SpaceshipScene') {
            SceneRouter.start(this, 'SpaceshipScene', {});
            return;
        }
        if (!started) {
            this.scene.stop();
        }
    }

    stopConfiguredScenes(targetScene) {
        this.closeSceneKeys.forEach((sceneKey) => {
            if (!sceneKey || sceneKey === targetScene || sceneKey === this.scene.key) {
                return;
            }
            if (!this.scene.get(sceneKey)) {
                return;
            }
            if (this.scene.isActive(sceneKey) || this.scene.isPaused(sceneKey) || this.scene.isSleeping(sceneKey)) {
                this.scene.stop(sceneKey);
            }
        });

        if (targetScene !== 'BattleScene' && this.scene.get('BattleScene') && this.scene.isActive('BattleScene')) {
            this.scene.stop('BattleScene');
        }
    }

    getRemainingPendingSkills() {
        if (!this.elf || typeof this.elf.getPendingSkills !== 'function') {
            return [];
        }

        const pendingSkills = this.elf.getPendingSkills() || [];
        const remaining = [];

        pendingSkills.forEach((skillId) => {
            if (!Number.isFinite(skillId)) {
                if (typeof this.elf.removePendingSkill === 'function') {
                    this.elf.removePendingSkill(skillId);
                }
                return;
            }

            if (!DataLoader.getSkill(skillId)) {
                if (typeof this.elf.removePendingSkill === 'function') {
                    this.elf.removePendingSkill(skillId);
                }
                return;
            }

            remaining.push(skillId);
        });

        return remaining;
    }

    resolveSafeReturnScene(sceneKey) {
        const transientSceneKeys = { SkillLearnScene: true, EvolutionScene: true };
        if (!sceneKey || transientSceneKeys[sceneKey] || !this.scene.get(sceneKey)) {
            return 'SpaceshipScene';
        }
        return sceneKey;
    }
}

if (typeof SkillLearnModalView !== 'undefined' && SkillLearnModalView) {
    Object.assign(SkillLearnScene.prototype, SkillLearnModalView);
}

window.SkillLearnScene = SkillLearnScene;
