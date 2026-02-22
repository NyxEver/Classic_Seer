/**
 * StorageGridPanel - 精灵仓库中部 3x3 展示与翻页面板
 */

const StorageGridPanel = {
    PAGE_SIZE: 9,

    mount(scene, options = {}) {
        const state = {
            x: Number.isFinite(options.x) ? options.x : 0,
            y: Number.isFinite(options.y) ? options.y : 0,
            width: Number.isFinite(options.width) ? options.width : 260,
            height: Number.isFinite(options.height) ? options.height : 340,
            depth: Number.isFinite(options.depth) ? options.depth : 6000,
            onSelect: typeof options.onSelect === 'function' ? options.onSelect : null,
            onPageChange: typeof options.onPageChange === 'function' ? options.onPageChange : null,
            root: scene.add.container(0, 0),
            entries: [],
            pageIndex: 0,
            selectedStorageIndex: -1,
            totalPages: 1
        };

        state.root.setDepth(state.depth);
        scene.__elfStorageGridPanelState = state;
        this.render(scene, {
            entries: [],
            pageIndex: 0,
            selectedStorageIndex: -1
        });
        return state;
    },

    unmount(scene) {
        const state = scene && scene.__elfStorageGridPanelState;
        if (!state) {
            return;
        }
        if (state.root && state.root.scene) {
            state.root.destroy(true);
        }
        delete scene.__elfStorageGridPanelState;
    },

    render(scene, payload = {}) {
        const state = scene.__elfStorageGridPanelState;
        if (!state || !state.root) {
            return;
        }

        state.entries = Array.isArray(payload.entries) ? payload.entries : [];
        state.totalPages = Math.max(1, Math.ceil(state.entries.length / this.PAGE_SIZE));
        state.pageIndex = Phaser.Math.Clamp(Number(payload.pageIndex) || 0, 0, state.totalPages - 1);
        state.selectedStorageIndex = Number.isInteger(payload.selectedStorageIndex) ? payload.selectedStorageIndex : -1;

        state.root.removeAll(true);

        const panel = scene.add.graphics();
        panel.fillStyle(0x1b3650, 0.96);
        panel.fillRoundedRect(state.x, state.y, state.width, state.height, 12);
        panel.lineStyle(1.5, 0x6f96bc, 1);
        panel.strokeRoundedRect(state.x, state.y, state.width, state.height, 12);
        state.root.add(panel);

        this.renderGrid(scene, state);
        this.renderPager(scene, state);
    },

    renderGrid(scene, state) {
        const cols = 3;
        const rows = 3;
        const gap = 8;
        const padding = 12;
        const pagerReserve = 40;
        const cardW = Math.floor((state.width - padding * 2 - gap * (cols - 1)) / cols);
        const cardH = Math.floor((state.height - padding * 2 - gap * (rows - 1) - pagerReserve) / rows);
        const pageStart = state.pageIndex * this.PAGE_SIZE;
        const pageEntries = state.entries.slice(pageStart, pageStart + this.PAGE_SIZE);

        if (pageEntries.length === 0) {
            const emptyText = scene.add.text(
                state.x + state.width / 2,
                state.y + (state.height - pagerReserve) / 2,
                '仓库为空',
                { fontSize: '18px', color: '#8fb0cf' }
            ).setOrigin(0.5);
            state.root.add(emptyText);
            return;
        }

        for (let i = 0; i < this.PAGE_SIZE; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = state.x + padding + col * (cardW + gap);
            const y = state.y + padding + row * (cardH + gap);
            const entry = pageEntries[i] || null;
            const card = this.createCard(scene, state, entry, x, y, cardW, cardH);
            state.root.add(card);
        }
    },

    createCard(scene, state, entry, x, y, w, h) {
        const container = scene.add.container(0, 0);
        const selected = entry && entry.storageIndex === state.selectedStorageIndex;

        const bg = scene.add.graphics();
        bg.fillStyle(0xffffff, 0.98);
        bg.fillRoundedRect(x, y, w, h, 8);
        bg.lineStyle(selected ? 2.5 : 1, selected ? 0x4fd882 : 0xc3d3e2, 1);
        bg.strokeRoundedRect(x, y, w, h, 8);
        container.add(bg);

        if (!entry || !entry.elfData) {
            const emptyText = scene.add.text(x + w / 2, y + h / 2, '--', {
                fontSize: '16px', color: '#8aa1b8'
            }).setOrigin(0.5);
            container.add(emptyText);
            return container;
        }

        const elfData = entry.elfData;
        const centerX = x + w / 2;
        const centerY = y + h / 2 - 8;
        if (typeof ElfPortraitView !== 'undefined' && ElfPortraitView && typeof ElfPortraitView.addStillPortrait === 'function') {
            const portraitContainer = scene.add.container(centerX, centerY);
            ElfPortraitView.addStillPortrait(scene, portraitContainer, 0, 0, elfData.elfId, {
                maxSize: Math.min(w - 20, h - 30),
                warnTag: 'ElfStorageScene'
            });
            container.add(portraitContainer);
        }

        const hit = scene.add.rectangle(centerX, y + h / 2, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
            if (state.onSelect) {
                state.onSelect(entry.storageIndex);
            }
        });
        container.add(hit);
        return container;
    },

    renderPager(scene, state) {
        const pagerY = state.y + state.height - 22;
        const centerX = state.x + state.width / 2;
        const canPrev = state.pageIndex > 0;
        const canNext = state.pageIndex < state.totalPages - 1;

        const prevBtn = this.createTriangleButton(scene, centerX - 44, pagerY, 'left', canPrev, () => {
            if (canPrev && state.onPageChange) {
                state.onPageChange(state.pageIndex - 1);
            }
        });
        const nextBtn = this.createTriangleButton(scene, centerX + 44, pagerY, 'right', canNext, () => {
            if (canNext && state.onPageChange) {
                state.onPageChange(state.pageIndex + 1);
            }
        });

        const pageText = scene.add.text(centerX, pagerY - 8, `${state.pageIndex + 1}/${state.totalPages}`, {
            fontSize: '13px',
            color: '#d5e8fa',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        state.root.add(prevBtn);
        state.root.add(nextBtn);
        state.root.add(pageText);
    },

    createTriangleButton(scene, x, y, direction, enabled, onClick) {
        const container = scene.add.container(0, 0);
        const bg = scene.add.graphics();
        bg.fillStyle(enabled ? 0x7b8794 : 0x4f565d, 1);
        bg.fillRoundedRect(x - 18, y - 14, 36, 28, 7);
        bg.lineStyle(1, enabled ? 0xbfc8d2 : 0x777d84, 1);
        bg.strokeRoundedRect(x - 18, y - 14, 36, 28, 7);
        container.add(bg);

        const tri = scene.add.graphics();
        tri.fillStyle(0xeef2f5, 1);
        tri.beginPath();
        if (direction === 'left') {
            tri.moveTo(x - 6, y);
            tri.lineTo(x + 6, y - 6);
            tri.lineTo(x + 6, y + 6);
        } else {
            tri.moveTo(x + 6, y);
            tri.lineTo(x - 6, y - 6);
            tri.lineTo(x - 6, y + 6);
        }
        tri.closePath();
        tri.fillPath();
        container.add(tri);

        if (enabled) {
            const hit = scene.add.rectangle(x, y, 36, 28, 0x000000, 0.001).setInteractive({ useHandCursor: true });
            hit.on('pointerdown', onClick);
            container.add(hit);
        }

        return container;
    }
};

window.StorageGridPanel = StorageGridPanel;
