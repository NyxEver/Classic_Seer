const SkillLearnModalView = {
    createFrame() {
        const frame = this.add.graphics();
        frame.fillStyle(0x123152, 0.97);
        frame.fillRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.lineStyle(2, 0x78acd8, 1);
        frame.strokeRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.fillStyle(0xffffff, 0.05);
        frame.fillRoundedRect(10, 8, this.modalW - 20, 20, 8);
        this.root.add(frame);
    },

    createHeader() {
        const title = this.add.text(this.modalW / 2, 40, '技能替换', {
            fontSize: '30px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#234c79',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.root.add(title);

        this.subTitleText = this.add.text(this.modalW / 2, 74, '', {
            fontSize: '14px',
            color: '#d6e6f6'
        }).setOrigin(0.5);
        this.root.add(this.subTitleText);
    },

    createSkillArea() {
        const areaX = 28;
        const areaY = 94;
        const areaW = this.modalW - 56;
        const areaH = 316;

        const areaBg = this.add.graphics();
        areaBg.fillStyle(0xf2f6fb, 0.97);
        areaBg.fillRoundedRect(areaX, areaY, areaW, areaH, 12);
        areaBg.lineStyle(2, 0x90afcf, 1);
        areaBg.strokeRoundedRect(areaX, areaY, areaW, areaH, 12);
        this.root.add(areaBg);

        this.skillArea = this.add.container(0, 0);
        this.root.add(this.skillArea);
        this.renderSkillCards();
    },

    renderSkillCards() {
        this.skillArea.removeAll(true);
        this.currentSkillCards = [];

        const areaX = 28;
        const areaY = 94;
        const areaW = this.modalW - 56;

        const newCardW = 360;
        const newCardH = 88;
        const newCardX = areaX + (areaW - newCardW) / 2;
        const newCardY = areaY + 18;

        const newCard = this.createSkillCard({
            x: newCardX,
            y: newCardY,
            w: newCardW,
            h: newCardH,
            skill: this.newSkillData,
            title: '新技能',
            interactive: false,
            selected: false,
            cardType: 'new'
        });
        this.skillArea.add(newCard.container);

        const gridY = newCardY + newCardH + 20;
        const cardW = 320;
        const cardH = 82;
        const gapX = 14;
        const gapY = 12;
        const gridStartX = areaX + (areaW - cardW * 2 - gapX) / 2;

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = gridStartX + col * (cardW + gapX);
            const y = gridY + row * (cardH + gapY);
            const oldSkillId = this.elf.skills[i];
            const oldSkill = Number.isFinite(oldSkillId) ? DataLoader.getSkill(oldSkillId) : null;

            const card = this.createSkillCard({
                x,
                y,
                w: cardW,
                h: cardH,
                skill: oldSkill,
                title: `槽位 ${i + 1}`,
                interactive: !!oldSkill,
                selected: this.selectedSlotIndex === i,
                cardType: 'existing',
                slotIndex: i
            });

            if (card.hit) {
                card.hit.on('pointerdown', () => this.selectSlot(i));
            }

            this.currentSkillCards.push(card);
            this.skillArea.add(card.container);
        }
    },

    createSkillCard(config) {
        const { x, y, w, h, skill, title, interactive, selected, cardType, slotIndex } = config;
        const container = this.add.container(0, 0);
        const bg = this.add.graphics();
        container.add(bg);

        const palette = this.getCardPalette(cardType, selected);
        bg.fillStyle(palette.fill, 1);
        bg.fillRoundedRect(x, y, w, h, 10);
        bg.lineStyle(palette.borderWidth, palette.border, 1);
        bg.strokeRoundedRect(x, y, w, h, 10);

        const titleText = this.add.text(x + 10, y + 8, title, {
            fontSize: '12px',
            color: palette.title,
            fontStyle: 'bold'
        });
        container.add(titleText);

        if (skill) {
            if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.renderSkill === 'function') {
                TypeIconView.renderSkill(this, container, x + w - 12, y + 10, skill, {
                    iconSize: 18,
                    originX: 1,
                    originY: 0
                });
            } else {
                const fallbackDot = this.add.circle(x + w - 12, y + 10, 8, 0x8899aa, 1).setOrigin(1, 0);
                container.add(fallbackDot);
            }

            const nameText = this.add.text(x + 12, y + 30, skill.name, {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            container.add(nameText);

            const powerText = this.add.text(x + 12, y + h - 24, `威力 ${skill.power || '-'}  命中 ${skill.accuracy ?? '-'}`, {
                fontSize: '12px',
                color: '#d6e6f8'
            });
            container.add(powerText);

            const ppText = this.add.text(x + w - 12, y + h - 24, `PP ${skill.pp || '-'}`, {
                fontSize: '12px',
                color: '#d6f5b6',
                fontStyle: 'bold'
            }).setOrigin(1, 0);
            container.add(ppText);

            if (cardType === 'new') {
                const desc = this.add.text(x + 12, y + 54, skill.description || '', {
                    fontSize: '11px',
                    color: '#c4d7eb',
                    wordWrap: { width: w - 24 }
                });
                container.add(desc);
            }
        } else {
            const emptyText = this.add.text(x + w / 2, y + h / 2 + 4, '--', {
                fontSize: '18px',
                color: '#7f94ab'
            }).setOrigin(0.5);
            container.add(emptyText);
        }

        let hit = null;
        if (interactive) {
            hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => {
                if (this.selectedSlotIndex === slotIndex) return;
                const hoverPalette = this.getCardPalette(cardType, false, true);
                bg.clear();
                bg.fillStyle(hoverPalette.fill, 1);
                bg.fillRoundedRect(x, y, w, h, 10);
                bg.lineStyle(hoverPalette.borderWidth, hoverPalette.border, 1);
                bg.strokeRoundedRect(x, y, w, h, 10);
            });
            hit.on('pointerout', () => {
                if (this.selectedSlotIndex === slotIndex) return;
                const normalPalette = this.getCardPalette(cardType, false, false);
                bg.clear();
                bg.fillStyle(normalPalette.fill, 1);
                bg.fillRoundedRect(x, y, w, h, 10);
                bg.lineStyle(normalPalette.borderWidth, normalPalette.border, 1);
                bg.strokeRoundedRect(x, y, w, h, 10);
            });
            if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.bind === 'function') {
                SkillTooltipView.bind(this, hit, skill, { bindKey: '__seerSkillTooltipBound' });
            }
            container.add(hit);
        } else if (skill) {
            hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
            if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.bind === 'function') {
                SkillTooltipView.bind(this, hit, skill, { bindKey: '__seerSkillTooltipBound' });
            }
            container.add(hit);
        }

        return { container, bg, hit, slotIndex };
    },

    getCardPalette(cardType, selected, hovered = false) {
        if (selected) {
            return { fill: 0x5a3a2a, border: 0xffa64b, borderWidth: 3, title: '#ffd6b0' };
        }
        if (cardType === 'new') {
            return { fill: 0x22577d, border: 0x67a7d8, borderWidth: 2, title: '#d4ebff' };
        }
        return {
            fill: hovered ? 0x3e607f : 0x315171,
            border: hovered ? 0x8dbce3 : 0x6f96bf,
            borderWidth: 2,
            title: '#d4e8ff'
        };
    },

    createActionButtons() {
        const y = this.modalH - 54;
        const centerX = this.modalW / 2;

        this.replaceButtonState = this.createFooterButton(centerX - 90, y, 132, 42, '替换', {
            enabledColor: 0x3a7bc0,
            disabledColor: 0x6f7680,
            borderColor: 0xd9ecff,
            onClick: () => this.confirmReplacement()
        });
        this.root.add(this.replaceButtonState.container);

        const cancelButton = this.createFooterButton(centerX + 90, y, 132, 42, '取消', {
            enabledColor: 0x2d67a8,
            disabledColor: 0x2d67a8,
            borderColor: 0xd9ecff,
            onClick: () => this.skipLearning(),
            alwaysEnabled: true
        });
        this.root.add(cancelButton.container);
    },

    createFooterButton(x, y, w, h, text, config) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', config.onClick);
        container.add(hit);

        const state = {
            container,
            bg,
            label,
            hit,
            w,
            h,
            enabledColor: config.enabledColor,
            disabledColor: config.disabledColor,
            borderColor: config.borderColor,
            alwaysEnabled: !!config.alwaysEnabled
        };

        this.paintFooterButton(state, !!config.alwaysEnabled);
        return state;
    },

    paintFooterButton(state, enabled) {
        state.bg.clear();
        state.bg.fillStyle(enabled ? state.enabledColor : state.disabledColor, 1);
        state.bg.fillRoundedRect(-state.w / 2, -state.h / 2, state.w, state.h, 9);
        state.bg.lineStyle(1.5, state.borderColor, enabled ? 1 : 0.65);
        state.bg.strokeRoundedRect(-state.w / 2, -state.h / 2, state.w, state.h, 9);
        state.label.setAlpha(enabled ? 1 : 0.85);

        if (enabled || state.alwaysEnabled) {
            state.hit.setInteractive({ useHandCursor: true });
        } else {
            state.hit.disableInteractive();
        }
    },

    refreshHeaderText() {
        if (!this.subTitleText) {
            return;
        }
        this.subTitleText.setText(`${this.elf.getDisplayName()} 想学习 ${this.newSkillData.name}`);
    },

    refreshReplaceButtonState() {
        if (!this.replaceButtonState) {
            return;
        }
        const enabled = Number.isInteger(this.selectedSlotIndex) && this.selectedSlotIndex >= 0;
        this.paintFooterButton(this.replaceButtonState, enabled);
    },

    selectSlot(index) {
        if (this.isTransitioning) {
            return;
        }
        this.selectedSlotIndex = index;
        this.renderSkillCards();
        this.refreshReplaceButtonState();
    }
};

window.SkillLearnModalView = SkillLearnModalView;
