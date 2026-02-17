class EvolutionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EvolutionScene' });
    }

    init(data = {}) {
        this.elf = data.elf || null;
        this.newElfId = Number.isFinite(data.newElfId) ? data.newElfId : null;
        this.returnScene = data.returnScene || 'SpaceshipScene';
        this.returnData = data.returnData || {};
        this.callback = typeof data.callback === 'function' ? data.callback : null;
        this.closeSceneKeys = Array.isArray(data.closeSceneKeys)
            ? data.closeSceneKeys.filter((key) => typeof key === 'string' && key && key !== 'EvolutionScene')
            : [];

        this.isTransitioning = false;
        this.animationCompleted = false;
        this.confirmButtonState = null;

        this.beforeElfData = null;
        this.afterElfData = null;
        this.previewRows = [];
        this.beforeSprite = null;
        this.afterSprite = null;
        this.glowCircle = null;
        this.infoText = null;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        const camera = this.cameras.main;

        this.beforeElfData = this.elf ? DataLoader.getElf(this.elf.id) : null;
        this.afterElfData = Number.isFinite(this.newElfId) ? DataLoader.getElf(this.newElfId) : null;
        if (!this.elf || !this.beforeElfData || !this.afterElfData) {
            console.error('[EvolutionScene] 初始化失败：缺少进化数据');
            this.closeAndReturn(this.returnScene, this.returnData);
            return;
        }

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5700 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5700;

        this.modalW = Math.min(940, camera.width - 70);
        this.modalH = Math.min(540, camera.height - 50);
        this.modalX = Math.floor((camera.width - this.modalW) / 2);
        this.modalY = Math.floor((camera.height - this.modalH) / 2);

        this.root = this.add.container(this.modalX, this.modalY).setDepth(this.baseDepth + 1);

        this.previewRows = this.buildPreviewRows();

        this.createFrame();
        this.createHeader();
        this.createLeftPanel();
        this.createRightPanel();
        this.createConfirmButton();
        this.playEvolutionAnimation();
    }

    createFrame() {
        const frame = this.add.graphics();
        frame.fillStyle(0x122f4a, 0.97);
        frame.fillRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.lineStyle(2, 0x79aedb, 1);
        frame.strokeRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.fillStyle(0xffffff, 0.05);
        frame.fillRoundedRect(10, 8, this.modalW - 20, 20, 8);
        this.root.add(frame);
    }

    createHeader() {
        const title = this.add.text(this.modalW / 2, 42, '进化结算', {
            fontSize: '30px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#234c79',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.root.add(title);
    }

    createLeftPanel() {
        this.leftX = 24;
        this.leftY = 86;
        this.leftW = 420;
        this.leftH = 382;

        const panel = this.add.graphics();
        panel.fillStyle(0x183752, 0.95);
        panel.fillRoundedRect(this.leftX, this.leftY, this.leftW, this.leftH, 12);
        panel.lineStyle(1.5, 0x5f8db4, 1);
        panel.strokeRoundedRect(this.leftX, this.leftY, this.leftW, this.leftH, 12);
        this.root.add(panel);

        const nameText = this.add.text(this.leftX + this.leftW / 2, this.leftY + 22, `${this.beforeElfData.name}  →  ${this.afterElfData.name}`, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.root.add(nameText);

        const stageCenterX = this.leftX + this.leftW / 2;
        const stageCenterY = this.leftY + 190;

        this.glowCircle = this.add.circle(stageCenterX, stageCenterY, 98, 0xffe075, 0).setScale(0.8);
        this.root.add(this.glowCircle);

        this.beforeSprite = this.createEvolutionPortrait(stageCenterX, stageCenterY, this.beforeElfData, 0x4f89b9);
        this.afterSprite = this.createEvolutionPortrait(stageCenterX, stageCenterY, this.afterElfData, 0x74b86c);
        this.afterSprite.setAlpha(0);
        this.afterSprite.setScale(0.6);

        this.root.add(this.beforeSprite);
        this.root.add(this.afterSprite);

        this.infoText = this.add.text(this.leftX + this.leftW / 2, this.leftY + this.leftH - 70, '', {
            fontSize: '15px',
            color: '#d6e7f8',
            align: 'center'
        }).setOrigin(0.5);
        this.root.add(this.infoText);
        this.updateInfoText(false);
    }

    createRightPanel() {
        const rightX = 468;
        const rightY = 86;
        const rightW = this.modalW - rightX - 24;
        const rightH = 382;

        const panel = this.add.graphics();
        panel.fillStyle(0x173247, 0.95);
        panel.fillRoundedRect(rightX, rightY, rightW, rightH, 12);
        panel.lineStyle(1.5, 0x5f8db4, 1);
        panel.strokeRoundedRect(rightX, rightY, rightW, rightH, 12);
        this.root.add(panel);

        const title = this.add.text(rightX + 18, rightY + 16, '属性提升', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.root.add(title);

        const rowStartY = rightY + 58;
        const rowH = 44;
        this.previewRows.forEach((row, index) => {
            const y = rowStartY + index * rowH;

            const rowBg = this.add.graphics();
            rowBg.fillStyle(index % 2 === 0 ? 0x21435f : 0x1d3b54, 0.9);
            rowBg.fillRoundedRect(rightX + 14, y, rightW - 28, 36, 7);
            this.root.add(rowBg);

            const label = this.add.text(rightX + 26, y + 18, row.label, {
                fontSize: '15px',
                color: '#d8e9fb',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            this.root.add(label);

            const delta = this.add.text(rightX + rightW - 178, y + 18, this.formatDelta(row.delta), {
                fontSize: '15px',
                color: row.delta >= 0 ? '#b8f2b8' : '#ffb8b8',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            this.root.add(delta);

            const arrow = this.add.text(rightX + rightW - 152, y + 18, '➜', {
                fontSize: '16px',
                color: '#79e37f',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.root.add(arrow);

            const value = this.add.text(rightX + rightW - 24, y + 18, `${row.after}`, {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            this.root.add(value);
        });
    }

    createConfirmButton() {
        const x = this.modalW / 2;
        const y = this.modalH - 36;
        const w = 170;
        const h = 44;

        const container = this.add.container(x, y);
        this.root.add(container);

        const bg = this.add.graphics();
        container.add(bg);

        const label = this.add.text(0, 0, '确认', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.completeEvolution());
        container.add(hit);

        this.confirmButtonState = { bg, label, hit, w, h };
        this.setConfirmButtonEnabled(false);
    }

    setConfirmButtonEnabled(enabled) {
        if (!this.confirmButtonState) {
            return;
        }

        const state = this.confirmButtonState;
        state.bg.clear();
        state.bg.fillStyle(enabled ? 0x2d71b3 : 0x6f7680, 1);
        state.bg.fillRoundedRect(-state.w / 2, -state.h / 2, state.w, state.h, 10);
        state.bg.lineStyle(1.5, 0xd7ebff, enabled ? 1 : 0.65);
        state.bg.strokeRoundedRect(-state.w / 2, -state.h / 2, state.w, state.h, 10);
        state.label.setAlpha(enabled ? 1 : 0.85);

        if (enabled) {
            state.hit.setInteractive({ useHandCursor: true });
        } else {
            state.hit.disableInteractive();
        }
    }

    createEvolutionPortrait(x, y, elfData, fallbackColor) {
        const container = this.add.container(x, y);
        const portraitContainer = this.add.container(0, 0);
        container.add(portraitContainer);

        let hasPortrait = false;
        if (typeof ElfPortraitView !== 'undefined' && ElfPortraitView && typeof ElfPortraitView.addStillPortrait === 'function') {
            const portrait = ElfPortraitView.addStillPortrait(this, portraitContainer, 0, 0, elfData.id, {
                maxSize: 164,
                warnTag: 'EvolutionScene'
            });
            hasPortrait = !!portrait;
        }

        if (!hasPortrait) {
            const fallback = this.add.circle(0, 0, 70, fallbackColor, 0.92);
            const text = this.add.text(0, 0, elfData.name, {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            portraitContainer.add(fallback);
            portraitContainer.add(text);
        }

        return container;
    }

    playEvolutionAnimation() {
        const beforeName = this.beforeElfData.name;
        const afterName = this.afterElfData.name;

        this.tweens.add({
            targets: this.beforeSprite,
            scaleX: 0.6,
            scaleY: 0.6,
            alpha: 0.2,
            duration: 700,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: this.glowCircle,
            alpha: 0.95,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 620,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 1
        });

        this.time.delayedCall(620, () => {
            this.tweens.add({
                targets: this.afterSprite,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 760,
                ease: 'Back.easeOut'
            });

            this.tweens.add({
                targets: this.beforeSprite,
                alpha: 0,
                duration: 360,
                ease: 'Sine.easeInOut'
            });

            this.tweens.add({
                targets: this.glowCircle,
                alpha: 0,
                duration: 760,
                ease: 'Sine.easeInOut'
            });
        });

        this.time.delayedCall(1500, () => {
            this.animationCompleted = true;
            this.setConfirmButtonEnabled(true);
            this.updateInfoText(true);
            if (typeof PlayerData !== 'undefined' && PlayerData && typeof PlayerData.markCaught === 'function') {
                PlayerData.markCaught(this.newElfId);
            }
            console.log(`[EvolutionScene] ${beforeName} 进化为 ${afterName}`);
        });
    }

    updateInfoText(completed) {
        if (!this.infoText) {
            return;
        }

        const expNeed = this.elf.getExpToNextLevel ? this.elf.getExpToNextLevel() : 0;
        if (!completed) {
            this.infoText.setText([
                `${this.elf.getDisplayName()} 正在进化...`,
                `等级 Lv.${this.elf.level}  经验 ${this.elf.exp}/${expNeed > 0 ? expNeed : 'MAX'}`
            ]);
            return;
        }

        this.infoText.setText([
            `恭喜！${this.beforeElfData.name} 进化为 ${this.afterElfData.name}！`,
            `等级 Lv.${this.elf.level}  经验 ${this.elf.exp}/${expNeed > 0 ? expNeed : 'MAX'}`
        ]);
    }

    buildPreviewRows() {
        const beforeStats = {
            level: this.elf.level,
            hp: this.elf.getMaxHp(),
            atk: this.elf.getAtk(),
            def: this.elf.getDef(),
            spAtk: this.elf.getSpAtk(),
            spDef: this.elf.getSpDef(),
            spd: this.elf.getSpd()
        };

        const evolvedStats = this.buildEvolvedPreviewStats();

        return [
            { label: '等级', before: beforeStats.level, after: evolvedStats.level },
            { label: '体力', before: beforeStats.hp, after: evolvedStats.hp },
            { label: '攻击', before: beforeStats.atk, after: evolvedStats.atk },
            { label: '防守', before: beforeStats.def, after: evolvedStats.def },
            { label: '特攻', before: beforeStats.spAtk, after: evolvedStats.spAtk },
            { label: '特防', before: beforeStats.spDef, after: evolvedStats.spDef },
            { label: '速度', before: beforeStats.spd, after: evolvedStats.spd }
        ].map((row) => ({
            ...row,
            delta: row.after - row.before
        }));
    }

    buildEvolvedPreviewStats() {
        const instanceData = {
            elfId: this.afterElfData.id,
            nickname: this.elf.nickname || null,
            level: this.elf.level,
            exp: this.elf.exp,
            currentHp: this.elf.currentHp,
            skills: Array.isArray(this.elf.skills) ? [...this.elf.skills] : [],
            skillPP: this.elf.skillPP ? { ...this.elf.skillPP } : {},
            iv: this.elf.iv ? { ...this.elf.iv } : { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 0 },
            ev: this.elf.ev ? { ...this.elf.ev } : { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 0 },
            pendingSkills: Array.isArray(this.elf.pendingSkills) ? [...this.elf.pendingSkills] : [],
            status: this.elf.status && typeof this.elf.status === 'object'
                ? JSON.parse(JSON.stringify(this.elf.status))
                : { weakening: {}, control: null }
        };

        const previewElf = new Elf(this.afterElfData, instanceData);
        return {
            level: previewElf.level,
            hp: previewElf.getMaxHp(),
            atk: previewElf.getAtk(),
            def: previewElf.getDef(),
            spAtk: previewElf.getSpAtk(),
            spDef: previewElf.getSpDef(),
            spd: previewElf.getSpd()
        };
    }

    formatDelta(delta) {
        return `${delta >= 0 ? '+' : ''}${delta}`;
    }

    completeEvolution() {
        if (this.isTransitioning || !this.animationCompleted) {
            return;
        }
        this.isTransitioning = true;

        if (this.callback) {
            this.callback(this.newElfId);
        }

        this.closeAndReturn(this.returnScene, this.returnData);
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

    resolveSafeReturnScene(sceneKey) {
        const transientSceneKeys = {
            SkillLearnScene: true,
            EvolutionScene: true
        };

        if (!sceneKey || transientSceneKeys[sceneKey] || !this.scene.get(sceneKey)) {
            return 'SpaceshipScene';
        }

        return sceneKey;
    }
}

window.EvolutionScene = EvolutionScene;
