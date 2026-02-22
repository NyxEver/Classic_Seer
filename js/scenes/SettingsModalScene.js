/**
 * SettingsModalScene - 设置弹窗场景
 * 提供 BGM 音量、开发者模式、返回主菜单、存档导入导出。
 */
class SettingsModalScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsModalScene' });

        this.returnScene = 'CaptainRoomScene';
        this.currentVolume = 1;
        this.isAdjustingVolume = false;
        this.confirmState = null;
        this.fileInputEl = null;
        this.toastTween = null;
    }

    init(data = {}) {
        this.returnScene = data.returnScene || 'CaptainRoomScene';
        this.currentVolume = 1;
        this.isAdjustingVolume = false;
        this.confirmState = null;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5600 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5600;

        this.modalW = Math.min(640, this.W - 90);
        this.modalH = Math.min(500, this.H - 80);
        this.modalX = Math.floor((this.W - this.modalW) / 2);
        this.modalY = Math.floor((this.H - this.modalH) / 2);

        this.root = this.add.container(this.modalX, this.modalY).setDepth(this.baseDepth + 1);

        this.createFrame();
        this.createHeader();
        this.createVolumeSection();
        this.createDevModeToggle();
        this.createActionButtons();
        this.createToastText();
        this.bindGlobalInputHandlers();

        this.syncVolumeFromPlayerData();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
    }

    createFrame() {
        const frame = this.add.graphics();
        frame.fillStyle(0x132c45, 0.98);
        frame.fillRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.lineStyle(2, 0x7eaed8, 1);
        frame.strokeRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.fillStyle(0xffffff, 0.05);
        frame.fillRoundedRect(10, 8, this.modalW - 20, 20, 8);
        this.root.add(frame);
    }

    createHeader() {
        const header = this.add.graphics();
        header.fillStyle(0x1d3a52, 0.95);
        header.fillRoundedRect(0, 0, this.modalW, 68, 16);
        header.fillRect(0, 24, this.modalW, 44);
        header.lineStyle(1, 0x6f95b8, 0.9);
        header.lineBetween(0, 68, this.modalW, 68);
        this.root.add(header);

        const title = this.add.text(this.modalW / 2, 20, '设置', {
            fontSize: '30px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#2e5f93',
            strokeThickness: 6
        }).setOrigin(0.5, 0);
        this.root.add(title);

        const closeBg = this.add.circle(this.modalW - 24, 24, 14, 0x1e4a77).setInteractive({ useHandCursor: true });
        closeBg.on('pointerover', () => closeBg.setFillStyle(0x2d6ca8));
        closeBg.on('pointerout', () => closeBg.setFillStyle(0x1e4a77));
        closeBg.on('pointerdown', () => this.closeModal());
        this.root.add(closeBg);

        const closeText = this.add.text(this.modalW - 24, 24, 'X', {
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.root.add(closeText);
    }

    createVolumeSection() {
        const sectionY = 96;

        const sectionBg = this.add.graphics();
        sectionBg.fillStyle(0x1a3853, 0.92);
        sectionBg.fillRoundedRect(20, sectionY, this.modalW - 40, 120, 12);
        sectionBg.lineStyle(1, 0x5f8eb8, 0.95);
        sectionBg.strokeRoundedRect(20, sectionY, this.modalW - 40, 120, 12);
        this.root.add(sectionBg);

        const label = this.add.text(38, sectionY + 20, 'BGM 音量', {
            fontSize: '20px',
            color: '#e7f3ff',
            fontStyle: 'bold'
        });
        this.root.add(label);

        this.volumeValueText = this.add.text(this.modalW - 40, sectionY + 22, '100%', {
            fontSize: '18px',
            color: '#a6d2ff',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        this.root.add(this.volumeValueText);

        const trackY = sectionY + 78;
        const trackX = this.modalW / 2;
        const trackWidth = this.modalW - 120;

        this.volumeSlider = {
            trackX: trackX,
            trackY: trackY,
            trackWidth: trackWidth
        };

        this.volumeTrackBg = this.add.graphics();
        this.root.add(this.volumeTrackBg);

        this.volumeTrackFill = this.add.graphics();
        this.root.add(this.volumeTrackFill);

        this.volumeKnob = this.add.circle(trackX, trackY, 12, 0x9dd4ff)
            .setStrokeStyle(2, 0xe9f6ff, 1)
            .setInteractive({ useHandCursor: true });
        this.root.add(this.volumeKnob);

        const trackHit = this.add.rectangle(trackX, trackY, trackWidth + 20, 34, 0x000000, 0.001)
            .setInteractive({ useHandCursor: true });
        trackHit.on('pointerdown', (pointer) => {
            this.isAdjustingVolume = true;
            this.updateVolumeFromPointer(pointer);
        });
        this.root.add(trackHit);

        this.volumeKnob.on('pointerdown', (pointer) => {
            this.isAdjustingVolume = true;
            this.updateVolumeFromPointer(pointer);
        });
    }

    createDevModeToggle() {
        const sectionY = 236;

        const sectionBg = this.add.graphics();
        sectionBg.fillStyle(0x1a3853, 0.92);
        sectionBg.fillRoundedRect(20, sectionY, this.modalW - 40, 74, 12);
        sectionBg.lineStyle(1, 0x5f8eb8, 0.95);
        sectionBg.strokeRoundedRect(20, sectionY, this.modalW - 40, 74, 12);
        this.root.add(sectionBg);

        const label = this.add.text(38, sectionY + 24, '开发者模式', {
            fontSize: '19px',
            color: '#e7f3ff',
            fontStyle: 'bold'
        });
        this.root.add(label);

        this.devModeEnabled = typeof DevMode !== 'undefined' && !!DevMode.enabled;

        this.devToggleBg = this.add.graphics();
        this.root.add(this.devToggleBg);

        this.devToggleText = this.add.text(this.modalW - 90, sectionY + 22, '', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.root.add(this.devToggleText);

        this.devToggleHit = this.add.rectangle(this.modalW - 90, sectionY + 36, 140, 42, 0x000000, 0.001)
            .setInteractive({ useHandCursor: true });
        this.devToggleHit.on('pointerdown', () => this.toggleDevMode());
        this.root.add(this.devToggleHit);

        this.refreshDevToggleView();
    }

    createActionButtons() {
        const startY = 334;
        const spacing = 52;
        SettingsModalUi.createActionButton(this, this.modalW / 2, startY, '返回主菜单', () => this.confirmReturnToMainMenu());
        SettingsModalUi.createActionButton(this, this.modalW / 2, startY + spacing, '导出存档', () => this.exportSaveFile());
        SettingsModalUi.createActionButton(this, this.modalW / 2, startY + spacing * 2, '导入存档', () => this.importSaveFile());
    }

    createToastText() {
        SettingsModalUi.createToastText(this);
    }

    bindGlobalInputHandlers() {
        this.onGlobalPointerMove = (pointer) => {
            if (!this.isAdjustingVolume || !pointer.isDown) {
                return;
            }
            this.updateVolumeFromPointer(pointer);
        };

        this.onGlobalPointerUp = () => {
            if (!this.isAdjustingVolume) {
                return;
            }
            this.isAdjustingVolume = false;
            this.persistVolumeToSave();
        };

        this.input.on('pointermove', this.onGlobalPointerMove);
        this.input.on('pointerup', this.onGlobalPointerUp);
    }

    syncVolumeFromPlayerData() {
        const savedVolume = this.resolveVolumeValue(
            typeof PlayerData !== 'undefined' && PlayerData ? PlayerData.bgmVolume : null,
            1
        );
        this.setVolume(savedVolume, false);
    }

    updateVolumeFromPointer(pointer) {
        if (!this.volumeSlider) {
            return;
        }

        const localX = pointer.worldX - this.modalX;
        const left = this.volumeSlider.trackX - this.volumeSlider.trackWidth / 2;
        const right = this.volumeSlider.trackX + this.volumeSlider.trackWidth / 2;
        const clamped = Phaser.Math.Clamp(localX, left, right);
        const ratio = (clamped - left) / this.volumeSlider.trackWidth;
        this.setVolume(ratio, false);
    }

    setVolume(rawValue, persist) {
        const nextValue = this.resolveVolumeValue(rawValue, this.currentVolume);
        this.currentVolume = nextValue;

        if (typeof BgmManager !== 'undefined' && BgmManager && typeof BgmManager.setVolume === 'function') {
            BgmManager.setVolume(nextValue);
        }

        this.refreshVolumeSliderVisual();

        if (persist) {
            this.persistVolumeToSave();
        }
    }

    refreshVolumeSliderVisual() {
        if (!this.volumeSlider) {
            return;
        }

        const left = this.volumeSlider.trackX - this.volumeSlider.trackWidth / 2;
        const fillWidth = Math.max(0, this.volumeSlider.trackWidth * this.currentVolume);

        this.volumeTrackBg.clear();
        this.volumeTrackBg.fillStyle(0x294764, 1);
        this.volumeTrackBg.fillRoundedRect(left, this.volumeSlider.trackY - 5, this.volumeSlider.trackWidth, 10, 6);

        this.volumeTrackFill.clear();
        this.volumeTrackFill.fillStyle(0x6fb6ff, 1);
        this.volumeTrackFill.fillRoundedRect(left, this.volumeSlider.trackY - 5, fillWidth, 10, 6);

        this.volumeKnob.x = left + fillWidth;
        this.volumeValueText.setText(`${Math.round(this.currentVolume * 100)}%`);
    }

    persistVolumeToSave() {
        if (typeof PlayerData === 'undefined' || !PlayerData) {
            return;
        }

        PlayerData.bgmVolume = this.currentVolume;
        if (typeof PlayerData.saveToStorage === 'function') {
            PlayerData.saveToStorage();
        }
    }

    resolveVolumeValue(value, fallback) {
        const raw = Number(value);
        if (!Number.isFinite(raw)) {
            return Phaser.Math.Clamp(Number(fallback) || 1, 0, 1);
        }
        return Phaser.Math.Clamp(raw, 0, 1);
    }

    toggleDevMode() {
        if (typeof DevMode === 'undefined' || !DevMode) {
            this.showToast('开发者模式系统不可用', true);
            return;
        }

        if (this.devModeEnabled) {
            DevMode.disable();
            this.devModeEnabled = false;
        } else {
            DevMode.enable();
            this.devModeEnabled = true;
        }

        this.refreshDevToggleView();
        this.showToast(`开发者模式已${this.devModeEnabled ? '开启' : '关闭'}`);
    }

    refreshDevToggleView() {
        if (!this.devToggleBg || !this.devToggleText) {
            return;
        }

        const x = this.modalW - 90;
        const y = 236 + 36;
        const width = 124;
        const height = 34;

        this.devToggleBg.clear();
        this.devToggleBg.fillStyle(this.devModeEnabled ? 0x3f8f58 : 0x5d6772, 1);
        this.devToggleBg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
        this.devToggleBg.lineStyle(1.5, this.devModeEnabled ? 0xc5efce : 0xaeb8c4, 1);
        this.devToggleBg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);

        this.devToggleText.setText(this.devModeEnabled ? '已开启' : '已关闭');
        this.devToggleText.setColor(this.devModeEnabled ? '#dffff0' : '#ecf0f5');
    }

    confirmReturnToMainMenu() {
        this.showConfirmDialog({
            title: '确定返回主菜单吗？',
            message: '未保存的进度将会丢失。',
            confirmLabel: '确认',
            onConfirm: () => {
                this.stopGameplayScenesBeforeMainMenu();
                SceneRouter.start(this, 'MainMenuScene');
            }
        });
    }

    stopGameplayScenesBeforeMainMenu() {
        const activeScenes = this.scene.manager.getScenes(true);
        activeScenes.forEach((sceneInstance) => {
            const sceneKey = sceneInstance && sceneInstance.scene ? sceneInstance.scene.key : '';
            if (!sceneKey || sceneKey === 'SettingsModalScene' || sceneKey === 'MainMenuScene' || sceneKey === 'BootScene') {
                return;
            }
            this.scene.stop(sceneKey);
        });
    }

    exportSaveFile() {
        if (typeof SaveTransfer === 'undefined' || !SaveTransfer || typeof SaveTransfer.exportCurrentSave !== 'function') {
            this.showToast('导出功能不可用', true);
            return;
        }

        const result = SaveTransfer.exportCurrentSave();
        if (!result.ok) {
            this.showToast(result.message || '导出失败', true);
            return;
        }

        this.showToast(`导出成功：${result.fileName}`);
    }

    importSaveFile() {
        if (typeof SaveTransfer === 'undefined' || !SaveTransfer) {
            this.showToast('导入功能不可用', true);
            return;
        }

        if (!this.fileInputEl) {
            this.fileInputEl = document.createElement('input');
            this.fileInputEl.type = 'file';
            this.fileInputEl.accept = '.json,application/json';
            this.fileInputEl.style.display = 'none';
            document.body.appendChild(this.fileInputEl);
            this.fileInputEl.addEventListener('change', (event) => this.handleImportFileSelection(event));
        }

        this.fileInputEl.value = '';
        this.fileInputEl.click();
    }

    handleImportFileSelection(event) {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) {
            return;
        }

        SaveTransfer.readFileAsText(file)
            .then((text) => {
                const parsed = SaveTransfer.parseImportText(text);
                if (!parsed.ok) {
                    this.showToast(parsed.message || '存档文件无效或已损坏', true);
                    return;
                }

                this.showConfirmDialog({
                    title: '确定导入此存档吗？',
                    message: '当前存档将被覆盖，此操作不可恢复！',
                    confirmLabel: '确认',
                    onConfirm: () => {
                        const saveResult = SaveTransfer.saveImportedData(parsed.data);
                        if (!saveResult.ok) {
                            this.showToast(saveResult.message || '导入失败', true);
                            return;
                        }
                        location.reload();
                    }
                });
            })
            .catch(() => {
                this.showToast('读取存档文件失败', true);
            });
    }

    showConfirmDialog(config) {
        SettingsModalUi.showConfirmDialog(this, config);
    }

    closeConfirmDialog() {
        SettingsModalUi.closeConfirmDialog(this);
    }

    showToast(message, isError = false) {
        SettingsModalUi.showToast(this, message, isError);
    }

    closeModal() {
        this.closeConfirmDialog();
        ModalOverlayLayer.unmount(this);
        this.scene.stop();
    }

    cleanup() {
        this.closeConfirmDialog();

        if (this.input && this.onGlobalPointerMove) {
            this.input.off('pointermove', this.onGlobalPointerMove);
        }
        if (this.input && this.onGlobalPointerUp) {
            this.input.off('pointerup', this.onGlobalPointerUp);
        }

        if (this.fileInputEl) {
            if (this.fileInputEl.parentNode) {
                this.fileInputEl.parentNode.removeChild(this.fileInputEl);
            }
            this.fileInputEl = null;
        }

        if (this.toastTween) {
            this.toastTween.stop();
            this.toastTween = null;
        }

        ModalOverlayLayer.unmount(this);
    }
}

window.SettingsModalScene = SettingsModalScene;
