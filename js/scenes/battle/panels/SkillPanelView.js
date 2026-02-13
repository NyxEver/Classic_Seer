function renderSkillPanelTypeIcon(scene, container, x, y, type, options = {}) {
    if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.render === 'function') {
        TypeIconView.render(scene, container, x, y, type, {
            iconSize: options.iconSize || 16,
            originX: options.fallbackOriginX ?? 0.5,
            originY: 0.5
        });
        return;
    }

    const radius = Math.max(4, Math.floor((options.iconSize || 16) / 2));
    const fallbackDot = scene.add.circle(x, y, radius, 0x8899aa, 1);
    container.add(fallbackDot);
}

const BattleSkillPanelView = {
    mount(options = {}) {
        const panelY = Number.isFinite(options.panelY) ? options.panelY : (this.bottomPanelY || 430);
        if (this.skillContainer) {
            BattleSkillPanelView.rebuildSkillPanel.call(this);
            return;
        }
        BattleSkillPanelView.createMiddleSkillPanel.call(this, panelY);
    },

    update() {
        BattleSkillPanelView.updateSkillPP.call(this);
    },

    unmount() {
        if (this.skillContainer) {
            this.skillContainer.destroy();
            this.skillContainer = null;
        }
        this.skillButtons = [];
    },

    createMiddleSkillPanel(panelY) {
        const x = 310;
        const y = panelY + 10;
        const w = 380;
        const h = 150;

        const skillBg = this.add.graphics();
        skillBg.fillStyle(0x152030, 1);
        skillBg.fillRoundedRect(x, y, w, h, 6);
        skillBg.lineStyle(2, 0x2a4a6a);
        skillBg.strokeRoundedRect(x, y, w, h, 6);

        this.skillContainer = this.add.container(0, 0);

        const skills = this.playerElf.getSkillDetails();
        const skillBtnW = 175;
        const skillBtnH = 55;
        const gapX = 10;
        const gapY = 10;
        const totalW = skillBtnW * 2 + gapX;
        const totalH = skillBtnH * 2 + gapY;
        const startX = x + Math.floor((w - totalW) / 2);
        const startY = y + Math.floor((h - totalH) / 2);

        this.skillButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = startX + col * (skillBtnW + gapX);
            const btnY = startY + row * (skillBtnH + gapY);

            if (i < skills.length) {
                const skill = skills[i];
                const btn = BattleSkillPanelView.createSkillButton.call(this, btnX, btnY, skillBtnW, skillBtnH, skill, i);
                this.skillButtons.push(btn);
                this.skillContainer.add(btn);
            } else {
                const emptyBtn = BattleSkillPanelView.createEmptySkillSlot.call(this, btnX, btnY, skillBtnW, skillBtnH);
                this.skillButtons.push(emptyBtn);
                this.skillContainer.add(emptyBtn);
            }
        }
    },

    createSkillButton(x, y, w, h, skill, index) {
        const container = this.add.container(x, y);
        const disabled = skill.currentPP <= 0;

        const bg = this.add.graphics();
        bg.fillStyle(disabled ? 0x333333 : 0x2a4a7a, 1);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(2, disabled ? 0x444444 : 0x4a7aba);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const nameText = this.add.text(10, 10, skill.name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: disabled ? '#666666' : '#ffffff',
            fontStyle: 'bold'
        });
        container.add(nameText);

        renderSkillPanelTypeIcon(this, container, 10, 38, skill.type, {
            iconSize: 14,
            fallbackFontSize: '12px',
            fallbackColor: '#88aacc',
            fallbackOriginX: 0
        });

        const ppText = this.add.text(w - 10, h / 2, `PP ${skill.currentPP}/${skill.pp}`, {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: disabled ? '#444444' : '#aaddaa'
        }).setOrigin(1, 0.5);
        container.add(ppText);

        if (!disabled) {
            const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
            container.add(hit);

            hit.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0x3a6aaa, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x5a9ada);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0x2a4a7a, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x4a7aba);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerdown', () => {
                if (this.menuEnabled && !this.battleEnded) {
                    this.doSkill(skill.id);
                }
            });
        }

        container._skill = skill;
        container._ppText = ppText;
        container._index = index;
        return container;
    },

    createEmptySkillSlot(x, y, w, h) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 0.5);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(1, 0x333333);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const text = this.add.text(w / 2, h / 2, '-', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#444444'
        }).setOrigin(0.5);
        container.add(text);

        return container;
    },

    updateSkillPP() {
        const skills = this.playerElf.getSkillDetails();
        for (let i = 0; i < skills.length && i < this.skillButtons.length; i++) {
            const btn = this.skillButtons[i];
            if (btn._skill && btn._ppText) {
                const skill = skills[i];
                btn._ppText.setText(`PP ${skill.currentPP}/${skill.pp}`);
            }
        }
    },

    showSkillPanel() {
        if (this.isItemPanelOpen) {
            this.closeItemPanel();
            return;
        }
        this.refreshActionButtons();
    },

    rebuildSkillPanel() {
        if (this.skillContainer) {
            this.skillContainer.removeAll(true);
        }

        const skills = this.playerElf.getSkillDetails();
        const panelY = 430;
        const x = 310;
        const y = panelY + 10;
        const w = 380;
        const h = 150;
        const skillBtnW = 175;
        const skillBtnH = 55;
        const gapX = 10;
        const gapY = 10;
        const totalW = skillBtnW * 2 + gapX;
        const totalH = skillBtnH * 2 + gapY;
        const startX = x + Math.floor((w - totalW) / 2);
        const startY = y + Math.floor((h - totalH) / 2);

        this.skillButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = startX + col * (skillBtnW + gapX);
            const btnY = startY + row * (skillBtnH + gapY);

            if (i < skills.length) {
                const skill = skills[i];
                const btn = BattleSkillPanelView.createSkillButton.call(this, btnX, btnY, skillBtnW, skillBtnH, skill, i);
                this.skillButtons.push(btn);
                this.skillContainer.add(btn);
            } else {
                const emptyBtn = BattleSkillPanelView.createEmptySkillSlot.call(this, btnX, btnY, skillBtnW, skillBtnH);
                this.skillButtons.push(emptyBtn);
                this.skillContainer.add(emptyBtn);
            }
        }
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleSkillPanelView', BattleSkillPanelView);
}

window.BattleSkillPanelView = BattleSkillPanelView;
