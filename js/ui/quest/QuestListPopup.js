const QUEST_GROUP_ORDER = ['claimable', 'active', 'available', 'locked', 'completed'];
const QUEST_GROUP_LABEL = {
    claimable: '可完成待领奖',
    active: '进行中',
    available: '未领取',
    locked: '未解锁',
    completed: '已完成'
};

const QUEST_STYLE = {
    available: { fill: 0x70bdf8, border: 0xd8eeff, title: '#ffffff', sub: '#eaf5ff' },
    active: { fill: 0xffa43d, border: 0xffd8a9, title: '#ffffff', sub: '#fff3df' },
    claimable: { fill: 0x3ecb72, border: 0xbff2d3, title: '#ffffff', sub: '#e8fff0' },
    completed: { fill: 0x7a818b, border: 0xc4c8cf, title: '#f1f3f5', sub: '#e4e7ea' },
    locked: { fill: 0x4a5059, border: 0x7f8792, title: '#f3f5f6', sub: '#d7dde3' }
};

const QuestListPopup = {
    mount(scene, options = {}) {
        this.unmount(scene);

        const layout = options.layout || {};
        const width = Number.isFinite(layout.width) ? layout.width : 860;
        const height = Number.isFinite(layout.height) ? layout.height : 520;

        const state = {
            layout: {
                x: Number.isFinite(layout.x) ? layout.x : Math.floor((scene.cameras.main.width - width) / 2),
                y: Number.isFinite(layout.y) ? layout.y : Math.floor((scene.cameras.main.height - height) / 2),
                width,
                height
            },
            depth: Number.isFinite(options.depth) ? options.depth : 5600,
            onClose: typeof options.onClose === 'function' ? options.onClose : null,
            onQuestTap: typeof options.onQuestTap === 'function' ? options.onQuestTap : null,
            root: null,
            listContent: null,
            viewport: null,
            maskShape: null,
            listMask: null,
            scrollTrack: null,
            scrollThumb: null,
            scrollOffset: 0,
            maxScrollOffset: 0,
            selectedQuestId: null,
            dragPointerId: -1,
            dragStartY: 0,
            dragStartOffset: 0,
            dragMoved: false,
            handlers: {}
        };

        state.root = scene.add.container(state.layout.x, state.layout.y).setDepth(state.depth);
        this.createLayout(scene, state);
        this.bindHandlers(scene, state);

        scene.__captainQuestListPopupState = state;
        return state;
    },

    unmount(scene) {
        const state = scene && scene.__captainQuestListPopupState;
        if (!state) return;

        if (scene.input && state.handlers.wheel) scene.input.off('wheel', state.handlers.wheel);
        if (scene.input && state.handlers.pointerdown) scene.input.off('pointerdown', state.handlers.pointerdown);
        if (scene.input && state.handlers.pointermove) scene.input.off('pointermove', state.handlers.pointermove);
        if (scene.input && state.handlers.pointerup) scene.input.off('pointerup', state.handlers.pointerup);

        if (state.listContent && state.listMask) state.listContent.clearMask(true);
        if (state.listMask) state.listMask.destroy();
        if (state.maskShape) state.maskShape.destroy();
        if (state.root && state.root.scene) state.root.destroy(true);
        delete scene.__captainQuestListPopupState;
    },

    render(scene, entries, selectedQuestId) {
        const state = scene.__captainQuestListPopupState;
        if (!state || !state.listContent) return;

        state.selectedQuestId = Number.isFinite(selectedQuestId) ? selectedQuestId : null;
        state.listContent.removeAll(true);

        const grouped = { claimable: [], active: [], available: [], locked: [], completed: [] };
        (entries || []).forEach((entry) => {
            if (entry && grouped[entry.status]) grouped[entry.status].push(entry);
        });

        const viewport = state.viewport;
        const contentX = viewport.x + 6;
        const contentW = viewport.width - 18;
        const startY = viewport.y + 8;
        let cursorY = startY;

        QUEST_GROUP_ORDER.forEach((status) => {
            const list = grouped[status];
            if (!list.length) return;

            state.listContent.add(scene.add.text(contentX, cursorY, QUEST_GROUP_LABEL[status], {
                fontSize: '14px', color: '#2d4d6f', fontStyle: 'bold'
            }));
            cursorY += 24;

            list.forEach((entry) => {
                const selected = Number.isFinite(state.selectedQuestId) && state.selectedQuestId === entry.id;
                state.listContent.add(this.createItem(scene, state, entry, contentX, cursorY, contentW, 68, selected));
                cursorY += 76;
            });
            cursorY += 8;
        });

        state.maxScrollOffset = Math.max(0, cursorY - startY - viewport.height);
        this.applyScroll(state, state.scrollOffset, true);
    },

    createLayout(scene, state) {
        const w = state.layout.width;
        const h = state.layout.height;
        const root = state.root;

        const frame = scene.add.graphics();
        frame.fillStyle(0x123253, 0.98).fillRoundedRect(0, 0, w, h, 16);
        frame.lineStyle(2, 0x7eafd8, 1).strokeRoundedRect(0, 0, w, h, 16);
        frame.fillStyle(0xffffff, 0.05).fillRoundedRect(10, 8, w - 20, 20, 8);
        root.add(frame);

        root.add(scene.add.text(w / 2, 38, '任务列表', {
            fontSize: '32px', color: '#ffffff', fontStyle: 'bold', stroke: '#2c5f92', strokeThickness: 7
        }).setOrigin(0.5));

        const closeBg = scene.add.circle(w - 24, 24, 14, 0x7c3f3f).setInteractive({ useHandCursor: true });
        const closeText = scene.add.text(w - 24, 24, 'X', { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        closeBg.on('pointerover', () => closeBg.setFillStyle(0xa95050));
        closeBg.on('pointerout', () => closeBg.setFillStyle(0x7c3f3f));
        closeBg.on('pointerdown', () => state.onClose && state.onClose());
        root.add(closeBg);
        root.add(closeText);

        const bodyY = 78;
        const bodyH = h - bodyY - 16;
        const leftW = Math.floor(w * 0.38);
        const rightW = w - leftW - 30;
        const rightX = leftW + 20;

        const bodyFrame = scene.add.graphics();
        bodyFrame.fillStyle(0x1c456d, 0.9).fillRoundedRect(14, bodyY, w - 28, bodyH, 12);
        root.add(bodyFrame);

        const leftPanel = scene.add.graphics();
        leftPanel.fillStyle(0x275883, 0.8).fillRoundedRect(22, bodyY + 10, leftW - 14, bodyH - 20, 10);
        root.add(leftPanel);
        this.createPortrait(scene, root, 22, bodyY + 10, leftW - 14, bodyH - 20);

        const rightPanel = scene.add.graphics();
        rightPanel.fillStyle(0xf8fbff, 1).fillRoundedRect(rightX, bodyY + 10, rightW, bodyH - 20, 10);
        rightPanel.lineStyle(2, 0x2e5f90, 1).strokeRoundedRect(rightX, bodyY + 10, rightW, bodyH - 20, 10);
        root.add(rightPanel);

        state.viewport = { x: rightX + 10, y: bodyY + 20, width: rightW - 20, height: bodyH - 40 };
        state.listContent = scene.add.container(0, 0);
        root.add(state.listContent);

        state.maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
        state.maskShape.fillStyle(0xffffff, 1).fillRect(
            state.layout.x + state.viewport.x,
            state.layout.y + state.viewport.y,
            state.viewport.width,
            state.viewport.height
        );
        state.listMask = state.maskShape.createGeometryMask();
        state.listContent.setMask(state.listMask);

        state.scrollTrack = scene.add.graphics();
        state.scrollThumb = scene.add.graphics();
        root.add(state.scrollTrack);
        root.add(state.scrollThumb);
    },

    createPortrait(scene, root, x, y, w, h) {
        const wrap = scene.add.graphics();
        wrap.fillStyle(0xffffff, 0.08).fillRoundedRect(x + 12, y + 12, w - 24, h - 54, 12);
        wrap.lineStyle(1.5, 0x9bc1e8, 0.9).strokeRoundedRect(x + 12, y + 12, w - 24, h - 54, 12);
        root.add(wrap);

        const centerX = x + w / 2;
        const centerY = y + Math.floor((h - 56) * 0.48);
        if (scene.textures.exists('npc_captain_ui_icon')) {
            const image = scene.add.image(centerX, centerY, 'npc_captain_ui_icon');
            image.setScale(Math.min((w - 48) / image.width, (h - 96) / image.height));
            root.add(image);
        } else {
            root.add(scene.add.circle(centerX, centerY, 56, 0x45688e, 1));
            root.add(scene.add.text(centerX, centerY, 'Captain', {
                fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5));
        }
        root.add(scene.add.text(centerX, y + h - 22, '船长罗杰', {
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5));
    },

    createItem(scene, state, entry, x, y, w, h, selected) {
        const style = QUEST_STYLE[entry.status] || QUEST_STYLE.available;
        const item = scene.add.container(0, 0);

        const bg = scene.add.graphics();
        bg.fillStyle(style.fill, 1).fillRoundedRect(x, y, w, h, 8);
        bg.lineStyle(selected ? 3 : 1.5, selected ? 0xffffff : style.border, 1).strokeRoundedRect(x, y, w, h, 8);
        item.add(bg);

        item.add(scene.add.text(x + 12, y + 10, entry.title, {
            fontSize: '16px', color: style.title, fontStyle: 'bold'
        }));
        item.add(scene.add.text(x + 12, y + 38, entry.subtitle, {
            fontSize: '12px', color: style.sub, wordWrap: { width: w - 54 }
        }));

        if (entry.status === 'locked') {
            item.add(scene.add.text(x + w - 12, y + 10, 'LOCK', {
                fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(1, 0));
        }

        if (entry.interactive) {
            const hit = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => !state.dragMoved && item.setScale(1.01));
            hit.on('pointerout', () => item.setScale(1));
            hit.on('pointerup', (pointer) => {
                if (state.dragMoved) {
                    state.dragMoved = false;
                    return;
                }
                state.onQuestTap && state.onQuestTap(entry, pointer);
            });
            item.add(hit);
        }

        return item;
    },

    bindHandlers(scene, state) {
        state.handlers.wheel = (pointer, gameObjects, dx, dy) => {
            if (!this.inViewport(state, pointer.x, pointer.y)) return;
            this.applyScroll(state, state.scrollOffset + dy * 0.75, false);
        };

        state.handlers.pointerdown = (pointer) => {
            if (!this.inViewport(state, pointer.x, pointer.y)) return;
            state.dragPointerId = pointer.id;
            state.dragStartY = pointer.y;
            state.dragStartOffset = state.scrollOffset;
            state.dragMoved = false;
        };

        state.handlers.pointermove = (pointer) => {
            if (state.dragPointerId !== pointer.id) return;
            const delta = pointer.y - state.dragStartY;
            if (Math.abs(delta) >= 4) state.dragMoved = true;
            this.applyScroll(state, state.dragStartOffset - delta, false);
        };

        state.handlers.pointerup = (pointer) => {
            if (state.dragPointerId === pointer.id) state.dragPointerId = -1;
        };

        scene.input.on('wheel', state.handlers.wheel);
        scene.input.on('pointerdown', state.handlers.pointerdown);
        scene.input.on('pointermove', state.handlers.pointermove);
        scene.input.on('pointerup', state.handlers.pointerup);
    },

    applyScroll(state, nextOffset, force) {
        const clamped = Phaser.Math.Clamp(nextOffset, 0, state.maxScrollOffset);
        if (!force && clamped === state.scrollOffset) return;
        state.scrollOffset = clamped;
        state.listContent.y = -clamped;

        const view = state.viewport;
        const trackX = view.x + view.width - 6;
        state.scrollTrack.clear();
        state.scrollThumb.clear();
        if (state.maxScrollOffset <= 0) return;

        state.scrollTrack.fillStyle(0xd5e3f1, 1).fillRoundedRect(trackX, view.y, 4, view.height, 2);
        const visibleRatio = view.height / (view.height + state.maxScrollOffset);
        const thumbH = Math.max(30, Math.floor(view.height * visibleRatio));
        const progress = state.scrollOffset / state.maxScrollOffset;
        const thumbY = view.y + Math.floor((view.height - thumbH) * progress);
        state.scrollThumb.fillStyle(0x4e77a3, 1).fillRoundedRect(trackX - 1, thumbY, 6, thumbH, 3);
    },

    inViewport(state, x, y) {
        const view = state.viewport;
        const worldX = state.layout.x + view.x;
        const worldY = state.layout.y + view.y;
        return x >= worldX && x <= worldX + view.width && y >= worldY && y <= worldY + view.height;
    }
};

window.QuestListPopup = QuestListPopup;
