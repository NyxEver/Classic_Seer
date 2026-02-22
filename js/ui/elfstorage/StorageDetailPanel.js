/**
 * StorageDetailPanel - 精灵仓库右侧详情面板
 */

const StorageDetailPanel = {
    mount(scene, options = {}) {
        const state = {
            x: Number.isFinite(options.x) ? options.x : 0,
            y: Number.isFinite(options.y) ? options.y : 0,
            width: Number.isFinite(options.width) ? options.width : 260,
            height: Number.isFinite(options.height) ? options.height : 340,
            depth: Number.isFinite(options.depth) ? options.depth : 6000,
            root: scene.add.container(0, 0)
        };
        state.root.setDepth(state.depth);
        scene.__elfStorageDetailPanelState = state;
        this.render(scene, { entry: null, displayIndex: -1 });
        return state;
    },

    unmount(scene) {
        const state = scene && scene.__elfStorageDetailPanelState;
        if (!state) {
            return;
        }
        if (state.root && state.root.scene) {
            state.root.destroy(true);
        }
        delete scene.__elfStorageDetailPanelState;
    },

    render(scene, payload = {}) {
        const state = scene.__elfStorageDetailPanelState;
        if (!state || !state.root) {
            return;
        }

        state.root.removeAll(true);

        const panel = scene.add.graphics();
        panel.fillStyle(0x122c43, 0.97);
        panel.fillRoundedRect(state.x, state.y, state.width, state.height, 12);
        panel.lineStyle(1.5, 0x6f96bc, 1);
        panel.strokeRoundedRect(state.x, state.y, state.width, state.height, 12);
        state.root.add(panel);

        const entry = payload.entry || null;
        const displayIndex = Number.isInteger(payload.displayIndex) ? payload.displayIndex : -1;
        if (!entry || !entry.elfData) {
            const empty = scene.add.text(state.x + state.width / 2, state.y + state.height / 2, '请选择仓库精灵', {
                fontSize: '18px',
                color: '#9db8d2'
            }).setOrigin(0.5);
            state.root.add(empty);
            return;
        }

        const elfData = entry.elfData;
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) {
            return;
        }

        const elf = new Elf(baseData, elfData);
        const ivValue = Number.isFinite(elfData.iv)
            ? Phaser.Math.Clamp(Math.round(elfData.iv), 0, 31)
            : (PlayerData && typeof PlayerData.normalizeIvValue === 'function'
                ? PlayerData.normalizeIvValue(elfData.iv)
                : 15);

        const leftX = state.x + 14;
        const infoY = state.y + 14;
        const rows = [
            `序号 ${String(displayIndex + 1).padStart(3, '0')}`,
            `名字 ${elf.getDisplayName()}`,
            `个体 ${ivValue}/31`,
            `等级 Lv.${elf.level}`,
            '性格 未设定'
        ];

        rows.forEach((text, index) => {
            const line = scene.add.text(leftX, infoY + index * 24, text, {
                fontSize: '14px',
                color: '#f3f8ff',
                fontStyle: index === 1 ? 'bold' : 'normal'
            });
            state.root.add(line);
        });

        const statsY = infoY + 132;
        const colLeftX = leftX;
        const colRightX = state.x + Math.floor(state.width / 2) + 4;
        const leftStats = [
            ['攻击', elf.getAtk()],
            ['特攻', elf.getSpAtk()],
            ['速度', elf.getSpd()]
        ];
        const rightStats = [
            ['防御', elf.getDef()],
            ['特防', elf.getSpDef()],
            ['体力', elf.getMaxHp()]
        ];

        leftStats.forEach((item, index) => {
            const line = scene.add.text(colLeftX, statsY + index * 28, `${item[0]} ${item[1]}`, {
                fontSize: '14px',
                color: '#d8e8f7'
            });
            state.root.add(line);
        });

        rightStats.forEach((item, index) => {
            const line = scene.add.text(colRightX, statsY + index * 28, `${item[0]} ${item[1]}`, {
                fontSize: '14px',
                color: '#d8e8f7'
            });
            state.root.add(line);
        });
    }
};

window.StorageDetailPanel = StorageDetailPanel;
