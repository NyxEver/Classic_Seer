/**
 * StorageFilterPanel - 精灵仓库属性筛选面板
 */

const STORAGE_FILTER_TYPES = [
    'grass', 'water', 'fire', 'flying',
    'electric', 'mechanical', 'ground', 'normal',
    'ice', 'psychic', 'battle', 'light',
    'shadow', 'mystery', 'dragon', 'spirit'
];

const StorageFilterPanel = {
    mount(scene, options = {}) {
        const state = {
            x: Number.isFinite(options.x) ? options.x : 0,
            y: Number.isFinite(options.y) ? options.y : 0,
            width: Number.isFinite(options.width) ? options.width : 240,
            height: Number.isFinite(options.height) ? options.height : 320,
            depth: Number.isFinite(options.depth) ? options.depth : 6000,
            onTypeChange: typeof options.onTypeChange === 'function' ? options.onTypeChange : null,
            selectedType: null,
            root: scene.add.container(0, 0),
            buttons: []
        };

        state.root.setDepth(state.depth);
        scene.__elfStorageFilterPanelState = state;
        this.render(scene, null);
        return state;
    },

    unmount(scene) {
        const state = scene && scene.__elfStorageFilterPanelState;
        if (!state) {
            return;
        }
        if (state.root && state.root.scene) {
            state.root.destroy(true);
        }
        delete scene.__elfStorageFilterPanelState;
    },

    render(scene, selectedType) {
        const state = scene.__elfStorageFilterPanelState;
        if (!state || !state.root) {
            return;
        }

        state.selectedType = selectedType || null;
        state.root.removeAll(true);
        state.buttons = [];

        const panel = scene.add.graphics();
        panel.fillStyle(0x1b3650, 0.96);
        panel.fillRoundedRect(state.x, state.y, state.width, state.height, 12);
        panel.lineStyle(1.5, 0x6f96bc, 1);
        panel.strokeRoundedRect(state.x, state.y, state.width, state.height, 12);
        state.root.add(panel);

        const cols = 4;
        const rows = 4;
        const gap = 8;
        const padding = 12;
        const buttonW = Math.floor((state.width - padding * 2 - gap * (cols - 1)) / cols);
        const buttonH = Math.floor((state.height - padding * 2 - gap * (rows - 1)) / rows);

        STORAGE_FILTER_TYPES.forEach((type, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = state.x + padding + col * (buttonW + gap);
            const y = state.y + padding + row * (buttonH + gap);
            const selected = type === state.selectedType;
            const card = this.createButton(scene, state, type, x, y, buttonW, buttonH, selected);
            state.root.add(card);
        });
    },

    createButton(scene, state, type, x, y, w, h, selected) {
        const container = scene.add.container(0, 0);
        const bg = scene.add.graphics();
        bg.fillStyle(0x214866, 0.95);
        bg.fillRoundedRect(x, y, w, h, 8);
        bg.lineStyle(selected ? 2.5 : 1, selected ? 0x72f29e : 0x88abc9, 1);
        bg.strokeRoundedRect(x, y, w, h, 8);
        container.add(bg);

        if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.render === 'function') {
            TypeIconView.render(scene, container, x + w / 2, y + h / 2, type, {
                iconSize: 24,
                fallbackRadius: 10,
                stroke: false
            });
        }

        const hit = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => {
            if (!selected) {
                bg.clear();
                bg.fillStyle(0x2a587b, 0.95);
                bg.fillRoundedRect(x, y, w, h, 8);
                bg.lineStyle(1.5, 0xa9c7df, 1);
                bg.strokeRoundedRect(x, y, w, h, 8);
            }
        });
        hit.on('pointerout', () => {
            if (!selected) {
                bg.clear();
                bg.fillStyle(0x214866, 0.95);
                bg.fillRoundedRect(x, y, w, h, 8);
                bg.lineStyle(1, 0x88abc9, 1);
                bg.strokeRoundedRect(x, y, w, h, 8);
            }
        });
        hit.on('pointerdown', () => {
            const nextType = state.selectedType === type ? null : type;
            if (state.onTypeChange) {
                state.onTypeChange(nextType);
            }
        });
        container.add(hit);

        return container;
    }
};

window.StorageFilterPanel = StorageFilterPanel;
