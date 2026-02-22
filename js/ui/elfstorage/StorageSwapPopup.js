/**
 * StorageSwapPopup - 仓库放入背包时的替换弹窗
 */

const StorageSwapPopup = {
    mount(scene, options = {}) {
        const state = {
            depth: Number.isFinite(options.depth) ? options.depth : 6200,
            root: scene.add.container(0, 0),
            selectedBagIndex: -1,
            onConfirm: null,
            onCancel: null
        };

        state.root.setDepth(state.depth);
        state.root.setVisible(false);
        scene.__elfStorageSwapPopupState = state;
        return state;
    },

    unmount(scene) {
        const state = scene && scene.__elfStorageSwapPopupState;
        if (!state) {
            return;
        }
        if (state.root && state.root.scene) {
            state.root.destroy(true);
        }
        delete scene.__elfStorageSwapPopupState;
    },

    show(scene, payload = {}) {
        const state = scene.__elfStorageSwapPopupState;
        if (!state || !state.root) {
            return;
        }

        state.selectedBagIndex = Number.isInteger(payload.selectedBagIndex)
            ? payload.selectedBagIndex
            : 0;
        state.onConfirm = typeof payload.onConfirm === 'function' ? payload.onConfirm : null;
        state.onCancel = typeof payload.onCancel === 'function' ? payload.onCancel : null;

        this.render(scene, payload.title || '背包已满，请选择替换目标');
        state.root.setVisible(true);
    },

    hide(scene) {
        const state = scene.__elfStorageSwapPopupState;
        if (!state || !state.root) {
            return;
        }
        state.root.setVisible(false);
        state.root.removeAll(true);
    },

    render(scene, titleText) {
        const state = scene.__elfStorageSwapPopupState;
        if (!state || !state.root) {
            return;
        }

        state.root.removeAll(true);

        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const popupW = Math.min(700, W - 80);
        const popupH = Math.min(420, H - 70);
        const popupX = Math.floor((W - popupW) / 2);
        const popupY = Math.floor((H - popupH) / 2);

        const mask = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.58).setInteractive({ useHandCursor: false });
        state.root.add(mask);

        const panel = scene.add.graphics();
        panel.fillStyle(0x17314a, 0.98);
        panel.fillRoundedRect(popupX, popupY, popupW, popupH, 12);
        panel.lineStyle(2, 0x86aed2, 1);
        panel.strokeRoundedRect(popupX, popupY, popupW, popupH, 12);
        state.root.add(panel);

        const title = scene.add.text(popupX + popupW / 2, popupY + 20, titleText, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        state.root.add(title);

        this.renderBagCards(scene, state, popupX, popupY, popupW, popupH);
        this.renderButtons(scene, state, popupX, popupY, popupW, popupH);
    },

    renderBagCards(scene, state, popupX, popupY, popupW, popupH) {
        const bag = Array.isArray(PlayerData.elves) ? PlayerData.elves : [];
        const cols = 3;
        const rows = 2;
        const gap = 12;
        const gridX = popupX + 24;
        const gridY = popupY + 64;
        const gridW = popupW - 48;
        const gridH = popupH - 150;
        const cardW = Math.floor((gridW - gap * (cols - 1)) / cols);
        const cardH = Math.floor((gridH - gap * (rows - 1)) / rows);

        for (let index = 0; index < 6; index++) {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = gridX + col * (cardW + gap);
            const y = gridY + row * (cardH + gap);
            const elfData = bag[index] || null;
            const selected = index === state.selectedBagIndex;
            const card = this.createBagCard(scene, state, index, elfData, x, y, cardW, cardH, selected);
            state.root.add(card);
        }
    },

    createBagCard(scene, state, index, elfData, x, y, w, h, selected) {
        const container = scene.add.container(0, 0);
        const bg = scene.add.graphics();
        bg.fillStyle(elfData ? 0x244968 : 0x2d3b4a, 0.95);
        bg.fillRoundedRect(x, y, w, h, 8);
        bg.lineStyle(selected ? 2.5 : 1, selected ? 0x56e089 : 0x9ab7d1, 1);
        bg.strokeRoundedRect(x, y, w, h, 8);
        container.add(bg);

        if (elfData) {
            const baseData = DataLoader.getElf(elfData.elfId);
            const displayName = elfData.nickname || (baseData ? baseData.name : `ID:${elfData.elfId}`);
            const name = scene.add.text(x + 10, y + 8, displayName, {
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            container.add(name);

            const level = scene.add.text(x + w - 10, y + 8, `Lv.${elfData.level || 1}`, {
                fontSize: '12px',
                color: '#d8eaff'
            }).setOrigin(1, 0);
            container.add(level);

            if (typeof ElfPortraitView !== 'undefined' && ElfPortraitView && typeof ElfPortraitView.addStillPortrait === 'function') {
                const iconContainer = scene.add.container(x + w / 2, y + h / 2 + 8);
                ElfPortraitView.addStillPortrait(scene, iconContainer, 0, 0, elfData.elfId, {
                    maxSize: Math.min(w - 24, h - 42),
                    warnTag: 'StorageSwapPopup'
                });
                container.add(iconContainer);
            }

            const hit = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
            hit.on('pointerdown', () => {
                state.selectedBagIndex = index;
                this.render(scene, '背包已满，请选择替换目标');
            });
            container.add(hit);
        }

        return container;
    },

    renderButtons(scene, state, popupX, popupY, popupW, popupH) {
        const buttonY = popupY + popupH - 34;
        const gap = 90;
        const replaceBtn = this.createButton(scene, popupX + popupW / 2 - gap, buttonY, '替换', true, () => {
            if (state.onConfirm) {
                state.onConfirm(state.selectedBagIndex);
            }
        });
        const cancelBtn = this.createButton(scene, popupX + popupW / 2 + gap, buttonY, '取消', true, () => {
            if (state.onCancel) {
                state.onCancel();
            }
        });
        state.root.add(replaceBtn);
        state.root.add(cancelBtn);
    },

    createButton(scene, centerX, centerY, label, enabled, onClick) {
        const container = scene.add.container(0, 0);
        const w = 128;
        const h = 40;
        const bg = scene.add.graphics();
        bg.fillStyle(enabled ? 0x4c86b6 : 0x5c6570, 1);
        bg.fillRoundedRect(centerX - w / 2, centerY - h / 2, w, h, 8);
        bg.lineStyle(1, enabled ? 0xb9daf5 : 0x8f98a3, 1);
        bg.strokeRoundedRect(centerX - w / 2, centerY - h / 2, w, h, 8);
        container.add(bg);

        const text = scene.add.text(centerX, centerY, label, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        if (enabled) {
            const hit = scene.add.rectangle(centerX, centerY, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
            hit.on('pointerdown', onClick);
            container.add(hit);
        }

        return container;
    }
};

window.StorageSwapPopup = StorageSwapPopup;
