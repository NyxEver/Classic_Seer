const BattleActionButtonsView = {
    mount(options = {}) {
        const panelY = Number.isFinite(options.panelY) ? options.panelY : (this.bottomPanelY || 430);
        BattleActionButtonsView.createRightActionButtons.call(this, panelY);
    },

    update(options = {}) {
        const panelY = Number.isFinite(options.panelY) ? options.panelY : (this.bottomPanelY || 430);
        BattleActionButtonsView.createRightActionButtons.call(this, panelY);
    },

    unmount() {
        if (this.actionContainer) {
            this.actionContainer.destroy();
            this.actionContainer = null;
        }
        this.actionButtons = [];
    },

    createRightActionButtons(panelY) {
        const x = 710;
        const y = panelY + 15;
        const btnW = 120;
        const btnH = 45;
        const gap = 10;

        if (this.actionContainer && !this.actionContainer.scene) {
            this.actionContainer = null;
        }
        if (this.actionContainer) {
            this.actionContainer.destroy();
        }
        this.actionContainer = this.add.container(0, 0);

        const hasMultipleElves = PlayerData.elves.length > 1;
        const itemPanelOpen = this.isItemPanelOpen === true;
        const forceSwitchMode = this.forceSwitchMode === true;
        const menuEnabled = this.menuEnabled === true;
        const battleEnded = this.battleEnded === true;
        const interactionBlocked = !menuEnabled || battleEnded;

        const buttons = [
            { label: '战斗', action: () => this.showSkillPanel(), disabled: interactionBlocked || forceSwitchMode || !itemPanelOpen },
            { label: '道具', action: () => this.showItemPanel(), disabled: interactionBlocked || forceSwitchMode || itemPanelOpen },
            { label: '精灵', action: () => this.showElfSwitchPanel(), disabled: interactionBlocked || !hasMultipleElves },
            { label: '逃跑', action: () => this.doEscape(), disabled: interactionBlocked || forceSwitchMode }
        ];

        this.actionButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = x + col * (btnW + gap);
            const btnY = y + row * (btnH + gap);
            const btn = BattleActionButtonsView.createActionButton.call(this, btnX, btnY, btnW, btnH, buttons[i]);
            this.actionButtons.push(btn);
            this.actionContainer.add(btn);
        }
    },

    createActionButton(x, y, w, h, config) {
        const container = this.add.container(x, y);
        const disabled = config.disabled;

        const bg = this.add.graphics();
        bg.fillStyle(disabled ? 0x333333 : 0x2a5a8a, 1);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(2, disabled ? 0x444444 : 0x4a8aca);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const text = this.add.text(w / 2, h / 2, config.label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: disabled ? '#666666' : '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        if (!disabled) {
            const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
            container.add(hit);

            hit.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0x3a7aba, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x5aaaee);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0x2a5a8a, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x4a8aca);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerdown', () => {
                if (this.menuEnabled && !this.battleEnded) {
                    config.action();
                }
            });
        }

        return container;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleActionButtonsView', BattleActionButtonsView);
}

window.BattleActionButtonsView = BattleActionButtonsView;
