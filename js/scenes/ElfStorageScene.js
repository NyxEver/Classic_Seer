/**
 * ElfStorageScene - 精灵仓库弹窗
 */
class ElfStorageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ElfStorageScene' });
        this.returnScene = 'SpaceshipScene';
        this.returnData = {};
        this.selectedType = null;
        this.currentPage = 0;
        this.selectedStorageIndex = -1;
        this.filteredEntries = [];
    }

    init(data = {}) {
        this.returnScene = data.returnScene || 'SpaceshipScene';
        this.returnData = data.returnData || {};
        this.selectedType = null;
        this.currentPage = 0;
        this.selectedStorageIndex = -1;
        this.filteredEntries = [];
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5500 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5500;

        this.modalW = Math.min(960, this.W - 60);
        this.modalH = Math.min(560, this.H - 40);
        this.modalX = Math.floor((this.W - this.modalW) / 2);
        this.modalY = Math.floor((this.H - this.modalH) / 2);

        this.root = this.add.container(this.modalX, this.modalY).setDepth(this.baseDepth + 1);

        this.createFrame();
        this.createHeader();
        this.createPanels();
        this.createBottomAction();
        StorageSwapPopup.mount(this, { depth: this.baseDepth + 20 });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());

        this.refreshView(true);
    }

    createFrame() {
        const frame = this.add.graphics();
        frame.fillStyle(0x123253, 0.98);
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
        header.fillRoundedRect(0, 0, this.modalW, 64, 16);
        header.fillRect(0, 24, this.modalW, 40);
        header.lineStyle(1, 0x6f95b8, 0.9);
        header.lineBetween(0, 64, this.modalW, 64);
        this.root.add(header);

        this.countText = this.add.text(16, 20, '数量 000', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.root.add(this.countText);

        const title = this.add.text(this.modalW / 2, 18, '精灵仓库', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#2e5f93',
            strokeThickness: 6
        }).setOrigin(0.5, 0);
        this.root.add(title);

        const closeBg = this.add.circle(this.modalW - 24, 24, 14, 0x1e4a77).setInteractive({ useHandCursor: true });
        closeBg.on('pointerover', () => closeBg.setFillStyle(0x2d6ca8));
        closeBg.on('pointerout', () => closeBg.setFillStyle(0x1e4a77));
        closeBg.on('pointerdown', () => this.closePanel());
        this.root.add(closeBg);

        const closeText = this.add.text(this.modalW - 24, 24, 'X', {
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.root.add(closeText);
    }

    createPanels() {
        const topY = 74;
        const bottomGap = 76;
        const panelH = this.modalH - topY - bottomGap;
        const gap = 12;
        const panelW = Math.floor((this.modalW - 24 - gap * 2) / 3);
        const startX = 12;

        this.filterBounds = { x: this.modalX + startX, y: this.modalY + topY, width: panelW, height: panelH };
        this.gridBounds = { x: this.modalX + startX + panelW + gap, y: this.modalY + topY, width: panelW, height: panelH };
        this.detailBounds = { x: this.modalX + startX + (panelW + gap) * 2, y: this.modalY + topY, width: panelW, height: panelH };

        StorageFilterPanel.mount(this, {
            ...this.filterBounds,
            depth: this.baseDepth + 2,
            onTypeChange: (nextType) => {
                this.selectedType = nextType;
                this.currentPage = 0;
                this.refreshView(false);
            }
        });

        StorageGridPanel.mount(this, {
            ...this.gridBounds,
            depth: this.baseDepth + 2,
            onSelect: (storageIndex) => {
                this.selectedStorageIndex = storageIndex;
                this.refreshView(false);
            },
            onPageChange: (nextPage) => {
                this.currentPage = nextPage;
                this.refreshView(false);
            }
        });

        StorageDetailPanel.mount(this, {
            ...this.detailBounds,
            depth: this.baseDepth + 2
        });
    }

    createBottomAction() {
        const centerX = this.modalW / 2;
        const y = this.modalH - 34;
        const w = 280;
        const h = 42;

        this.bottomActionContainer = this.add.container(0, 0).setDepth(this.baseDepth + 3);
        this.root.add(this.bottomActionContainer);

        this.bottomActionBg = this.add.graphics();
        this.bottomActionContainer.add(this.bottomActionBg);

        this.bottomActionLabel = this.add.text(centerX, y, '放入背包', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.bottomActionContainer.add(this.bottomActionLabel);

        this.bottomActionHit = this.add.rectangle(centerX, y, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
        this.bottomActionHit.on('pointerdown', () => this.onPutIntoBag());
        this.bottomActionContainer.add(this.bottomActionHit);

        this.bottomActionLayout = { centerX, y, w, h };
    }

    refreshView(resetPage) {
        if (resetPage) {
            this.currentPage = 0;
        }

        this.filteredEntries = typeof ElfStorage !== 'undefined' && ElfStorage
            ? ElfStorage.getSortedEntries(this.selectedType)
            : [];

        if (!this.filteredEntries.some((entry) => entry.storageIndex === this.selectedStorageIndex)) {
            this.selectedStorageIndex = -1;
        }

        const totalPages = Math.max(1, Math.ceil(this.filteredEntries.length / 9));
        this.currentPage = Phaser.Math.Clamp(this.currentPage, 0, totalPages - 1);

        const selectedEntry = this.getSelectedEntry();
        const selectedDisplayIndex = selectedEntry
            ? this.filteredEntries.findIndex((entry) => entry.storageIndex === selectedEntry.storageIndex)
            : -1;

        const totalCount = (typeof ElfStorage !== 'undefined' && ElfStorage && typeof ElfStorage.getCount === 'function')
            ? ElfStorage.getCount()
            : this.filteredEntries.length;
        this.countText.setText(`数量 ${String(totalCount).padStart(3, '0')}`);

        StorageFilterPanel.render(this, this.selectedType);
        StorageGridPanel.render(this, {
            entries: this.filteredEntries,
            pageIndex: this.currentPage,
            selectedStorageIndex: this.selectedStorageIndex
        });
        StorageDetailPanel.render(this, {
            entry: selectedEntry,
            displayIndex: selectedDisplayIndex
        });

        this.refreshBottomActionState(!!selectedEntry);
    }

    getSelectedEntry() {
        if (!Number.isInteger(this.selectedStorageIndex)) {
            return null;
        }
        return this.filteredEntries.find((entry) => entry.storageIndex === this.selectedStorageIndex) || null;
    }

    refreshBottomActionState(enabled) {
        const layout = this.bottomActionLayout;
        if (!layout) {
            return;
        }

        this.bottomActionBg.clear();
        this.bottomActionBg.fillStyle(enabled ? 0x2f77c0 : 0x5b6672, 1);
        this.bottomActionBg.fillRoundedRect(layout.centerX - layout.w / 2, layout.y - layout.h / 2, layout.w, layout.h, 10);
        this.bottomActionBg.lineStyle(1.5, enabled ? 0xb8daf9 : 0x949da8, 1);
        this.bottomActionBg.strokeRoundedRect(layout.centerX - layout.w / 2, layout.y - layout.h / 2, layout.w, layout.h, 10);

        if (enabled) {
            this.bottomActionHit.setInteractive({ useHandCursor: true });
            this.bottomActionLabel.setAlpha(1);
        } else {
            this.bottomActionHit.disableInteractive();
            this.bottomActionLabel.setAlpha(0.75);
        }
    }

    onPutIntoBag() {
        const selectedEntry = this.getSelectedEntry();
        if (!selectedEntry || typeof ElfStorage === 'undefined' || !ElfStorage) {
            return;
        }

        if (!Array.isArray(PlayerData.elves)) {
            return;
        }

        if (PlayerData.elves.length < ElfStorage.BAG_CAPACITY) {
            const result = ElfStorage.moveStorageElfToBag(selectedEntry.storageIndex);
            if (result && result.success) {
                this.refreshView(false);
            }
            return;
        }

        StorageSwapPopup.show(this, {
            selectedBagIndex: 0,
            onConfirm: (bagIndex) => {
                const swapResult = ElfStorage.swapStorageWithBag(selectedEntry.storageIndex, bagIndex);
                if (swapResult && swapResult.success) {
                    StorageSwapPopup.hide(this);
                    this.refreshView(false);
                }
            },
            onCancel: () => {
                StorageSwapPopup.hide(this);
            }
        });
    }

    cleanup() {
        StorageSwapPopup.unmount(this);
        StorageFilterPanel.unmount(this);
        StorageGridPanel.unmount(this);
        StorageDetailPanel.unmount(this);
        ModalOverlayLayer.unmount(this);
    }

    closePanel() {
        StorageSwapPopup.hide(this);
        ModalOverlayLayer.unmount(this);

        const targetScene = this.returnScene || 'SpaceshipScene';
        const targetData = this.returnData || {};
        if (this.scene.isActive(targetScene)) {
            this.scene.stop();
            return;
        }
        SceneRouter.start(this, targetScene, targetData);
    }
}

window.ElfStorageScene = ElfStorageScene;
