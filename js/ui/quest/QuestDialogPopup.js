/**
 * QuestDialogPopup - 船长任务弹窗第二层（任务对话）
 * 只处理显示层，业务动作由 Scene 回调驱动。
 */

const QuestDialogPopup = {
    show(scene, options = {}) {
        this.hide(scene);

        const layout = options.layout || {};
        const state = {
            root: null,
            depth: Number.isFinite(options.depth) ? options.depth : 5700,
            onClose: typeof options.onClose === 'function' ? options.onClose : null,
            buttons: Array.isArray(options.buttons) ? options.buttons : []
        };

        const modalX = Number.isFinite(layout.x) ? layout.x : 0;
        const modalY = Number.isFinite(layout.y) ? layout.y : 0;
        const modalW = Number.isFinite(layout.width) ? layout.width : scene.cameras.main.width;
        const modalH = Number.isFinite(layout.height) ? layout.height : scene.cameras.main.height;

        state.root = scene.add.container(modalX, modalY).setDepth(state.depth);
        const root = state.root;

        const blocker = scene.add.rectangle(modalW / 2, modalH / 2, modalW, modalH, 0x000000, 0.36)
            .setInteractive({ useHandCursor: false });
        blocker.on('pointerdown', (pointer) => {
            if (pointer && pointer.event && typeof pointer.event.stopPropagation === 'function') {
                pointer.event.stopPropagation();
            }
        });
        root.add(blocker);

        const dialogW = Math.min(620, modalW - 120);
        const dialogH = 300;
        const dialogX = Math.floor((modalW - dialogW) / 2);
        const dialogY = Math.floor((modalH - dialogH) / 2);

        const shell = scene.add.graphics();
        shell.fillStyle(0xffffff, 1);
        shell.fillRoundedRect(dialogX, dialogY, dialogW, dialogH, 14);
        shell.lineStyle(2, 0x75a8d6, 1);
        shell.strokeRoundedRect(dialogX, dialogY, dialogW, dialogH, 14);
        root.add(shell);

        const headerH = 52;
        const header = scene.add.graphics();
        header.fillStyle(0x43a0ff, 1);
        header.fillRoundedRect(dialogX + 2, dialogY + 2, dialogW - 4, headerH, 11);
        root.add(header);

        const titleText = scene.add.text(dialogX + 20, dialogY + 16, options.title || '任务对话', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        root.add(titleText);

        const closeBg = scene.add.circle(dialogX + dialogW - 20, dialogY + 20, 11, 0x2f7fce).setInteractive({ useHandCursor: true });
        const closeText = scene.add.text(dialogX + dialogW - 20, dialogY + 20, 'X', {
            fontSize: '11px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        closeBg.on('pointerover', () => closeBg.setFillStyle(0x4f99de));
        closeBg.on('pointerout', () => closeBg.setFillStyle(0x2f7fce));
        closeBg.on('pointerdown', () => this.handleClose(state));
        root.add(closeBg);
        root.add(closeText);

        const contentX = dialogX + 14;
        const contentY = dialogY + headerH + 16;
        const contentW = dialogW - 28;
        const contentH = 158;
        const contentBg = scene.add.graphics();
        contentBg.fillStyle(0xffffff, 1);
        contentBg.fillRoundedRect(contentX, contentY, contentW, contentH, 10);
        contentBg.lineStyle(1.5, 0x8fb2d5, 1);
        contentBg.strokeRoundedRect(contentX, contentY, contentW, contentH, 10);
        root.add(contentBg);

        const contentText = scene.add.text(contentX + 12, contentY + 10, options.content || '', {
            fontSize: '15px',
            color: '#222222',
            lineSpacing: 6,
            wordWrap: { width: contentW - 24 }
        });
        root.add(contentText);

        this.createButtons(scene, root, state.buttons, dialogX, dialogY, dialogW, dialogH);
        scene.__captainQuestDialogState = state;
        return state;
    },

    hide(scene) {
        const state = scene && scene.__captainQuestDialogState;
        if (!state) return;
        if (state.root && state.root.scene) state.root.destroy(true);
        delete scene.__captainQuestDialogState;
    },

    isVisible(scene) {
        return !!(scene && scene.__captainQuestDialogState);
    },

    createButtons(scene, root, buttons, dialogX, dialogY, dialogW, dialogH) {
        if (!buttons.length) return;

        const areaY = dialogY + dialogH - 32;
        const buttonW = buttons.length === 1 ? 148 : 132;
        const buttonH = 40;
        const gap = buttons.length === 1 ? 0 : 24;
        const startX = dialogX + (dialogW - (buttonW * buttons.length + gap * (buttons.length - 1))) / 2;

        buttons.forEach((btn, index) => {
            const x = startX + index * (buttonW + gap);
            const color = btn.primary ? 0x2f7fce : 0x4d6f92;

            const box = scene.add.graphics();
            box.fillStyle(color, 1);
            box.fillRoundedRect(x, areaY - buttonH / 2, buttonW, buttonH, 8);
            box.lineStyle(1, 0xd7ebff, 1);
            box.strokeRoundedRect(x, areaY - buttonH / 2, buttonW, buttonH, 8);
            root.add(box);

            const text = scene.add.text(x + buttonW / 2, areaY, btn.label || '确认', {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            root.add(text);

            const hit = scene.add.rectangle(x + buttonW / 2, areaY, buttonW, buttonH, 0x000000, 0.001)
                .setInteractive({ useHandCursor: true });

            hit.on('pointerover', () => {
                box.clear();
                box.fillStyle(btn.primary ? 0x4a95df : 0x6588ad, 1);
                box.fillRoundedRect(x, areaY - buttonH / 2, buttonW, buttonH, 8);
                box.lineStyle(1, 0xe8f3ff, 1);
                box.strokeRoundedRect(x, areaY - buttonH / 2, buttonW, buttonH, 8);
            });

            hit.on('pointerout', () => {
                box.clear();
                box.fillStyle(color, 1);
                box.fillRoundedRect(x, areaY - buttonH / 2, buttonW, buttonH, 8);
                box.lineStyle(1, 0xd7ebff, 1);
                box.strokeRoundedRect(x, areaY - buttonH / 2, buttonW, buttonH, 8);
            });

            hit.on('pointerdown', () => {
                if (typeof btn.onClick === 'function') btn.onClick();
            });

            root.add(hit);
        });
    },

    handleClose(state) {
        if (state && typeof state.onClose === 'function') {
            state.onClose();
        }
    }
};

window.QuestDialogPopup = QuestDialogPopup;
