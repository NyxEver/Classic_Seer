const BattleSwitchPanelView = {
    mount() {},

    update() {},

    unmount() {
        BattleSwitchPanelView.closeElfSwitchPanel.call(this);
    },

    showElfSwitchPanel(forceSwitch = false) {
        if (!forceSwitch && (!this.menuEnabled || this.battleEnded || this.forceSwitchMode)) {
            return;
        }

        if (this.elfSwitchContainer) {
            if (this.forceSwitchMode === forceSwitch) {
                return;
            }
            this.closeElfSwitchPanel();
        }

        this.closeItemPanel();
        this.closeCapsulePanel();

        const panelY = 430;
        this.elfSwitchContainer = this.add.container(0, panelY);
        this.elfSwitchContainer.setDepth(80);

        const panelW = 700;
        const panelH = 165;
        const panelX = 300;

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 0.98);
        bg.fillRoundedRect(panelX, 5, panelW, panelH, 10);
        bg.lineStyle(2, 0x4a7aaa);
        bg.strokeRoundedRect(panelX, 5, panelW, panelH, 10);
        this.elfSwitchContainer.add(bg);

        const topBarY = 12;
        const slotSize = 40;
        const slotGap = 8;
        const elves = PlayerData.elves;

        this.elfSlots = [];
        this.selectedSwitchIndex = 0;

        for (let i = 0; i < elves.length; i++) {
            const slot = BattleSwitchPanelView.createElfSlot.call(this, panelX + 15 + i * (slotSize + slotGap), topBarY, slotSize, elves[i], i);
            this.elfSwitchContainer.add(slot);
            this.elfSlots.push(slot);
        }

        this.elfInfoContainer = this.add.container(panelX + 15, topBarY + slotSize + 15);
        this.elfSwitchContainer.add(this.elfInfoContainer);

        this.elfSkillContainer = this.add.container(panelX + 250, topBarY + slotSize + 15);
        this.elfSwitchContainer.add(this.elfSkillContainer);

        for (let i = 0; i < elves.length; i++) {
            if (elves[i] !== this.playerElf._instanceData) {
                this.selectSwitchElf(i);
                break;
            }
        }

        if (!forceSwitch) {
            const closeBtn = this.add.text(panelX + panelW - 15, 15, '✕', {
                fontSize: '20px',
                color: '#ff6666'
            }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
            closeBtn.on('pointerdown', () => this.closeElfSwitchPanel());
            this.elfSwitchContainer.add(closeBtn);
        }

        this.forceSwitchMode = forceSwitch;
    },

    createElfSlot(x, y, size, elfData, index) {
        const container = this.add.container(x, y);
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) {
            return container;
        }

        const elf = new Elf(baseData, elfData);
        const isCurrent = elfData === this.playerElf._instanceData;
        const canFight = elfData.currentHp > 0;

        const bg = this.add.graphics();
        const bgColor = isCurrent ? 0x4a6a8a : (canFight ? 0x2a4a6a : 0x3a3a3a);
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(0, 0, size, size, 6);
        if (isCurrent) {
            bg.lineStyle(3, 0xffdd44);
        } else {
            bg.lineStyle(2, canFight ? 0x4a8aca : 0x555555);
        }
        bg.strokeRoundedRect(0, 0, size, size, 6);
        container.add(bg);

        const portrait = ElfPortraitView.addStillPortrait(this, container, size / 2, size / 2, baseData.id, {
            maxSize: size - 8,
            tint: canFight ? null : 0x666666,
            warnTag: 'BattleScene'
        });

        if (!portrait) {
            const iconText = this.add.text(size / 2, size / 2, baseData.name.charAt(0), {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: canFight ? '#ffffff' : '#666666',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(iconText);
        }

        const lvText = this.add.text(size - 2, size - 2, `${elf.level}`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#aaddaa'
        }).setOrigin(1, 1);
        container.add(lvText);

        if (!isCurrent && canFight) {
            const hit = this.add.rectangle(size / 2, size / 2, size, size).setInteractive({ useHandCursor: true });
            container.add(hit);
            hit.on('pointerdown', () => this.selectSwitchElf(index));
        }

        container._bg = bg;
        container._index = index;
        container._elfData = elfData;
        container._isCurrent = isCurrent;

        return container;
    },

    selectSwitchElf(index) {
        this.selectedSwitchIndex = index;

        this.elfSlots.forEach((slot, i) => {
            const bg = slot._bg;
            if (!bg) {
                return;
            }
            const isCurrent = slot._isCurrent;
            const canFight = slot._elfData.currentHp > 0;
            const isSelected = i === index;

            bg.clear();
            const bgColor = isCurrent ? 0x4a6a8a : (isSelected ? 0x3a6a9a : (canFight ? 0x2a4a6a : 0x3a3a3a));
            bg.fillStyle(bgColor, 1);
            bg.fillRoundedRect(0, 0, 40, 40, 6);
            if (isCurrent) {
                bg.lineStyle(3, 0xffdd44);
            } else if (isSelected) {
                bg.lineStyle(3, 0x88ccff);
            } else {
                bg.lineStyle(2, canFight ? 0x4a8aca : 0x555555);
            }
            bg.strokeRoundedRect(0, 0, 40, 40, 6);
        });

        this.updateElfSwitchInfo(index);
    },

    updateElfSwitchInfo(index) {
        this.elfInfoContainer.removeAll(true);
        this.elfSkillContainer.removeAll(true);

        const elfData = PlayerData.elves[index];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) {
            return;
        }

        const elf = new Elf(baseData, elfData);
        const canFight = elfData.currentHp > 0;
        const isCurrent = elfData === this.playerElf._instanceData;

        const name = elfData.nickname || baseData.name;
        const nameText = this.add.text(0, 0, name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.elfInfoContainer.add(nameText);

        const hpLabel = this.add.text(0, 25, `HP: ${elfData.currentHp}/${elf.getMaxHp()}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#88ddaa'
        });
        this.elfInfoContainer.add(hpLabel);

        const hpBarW = 180;
        const hpBarH = 12;
        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x222222, 1);
        hpBg.fillRoundedRect(0, 45, hpBarW, hpBarH, 4);
        this.elfInfoContainer.add(hpBg);

        const hpPct = elfData.currentHp / elf.getMaxHp();
        if (hpPct > 0) {
            const hpBar = this.add.graphics();
            let hpColor = 0x44dd44;
            if (hpPct <= 0.2) {
                hpColor = 0xdd4444;
            } else if (hpPct <= 0.5) {
                hpColor = 0xddaa44;
            }
            hpBar.fillStyle(hpColor, 1);
            hpBar.fillRoundedRect(2, 47, (hpBarW - 4) * hpPct, hpBarH - 4, 3);
            this.elfInfoContainer.add(hpBar);
        }

        const btnY = 65;
        const btnW = 80;
        const btnH = 30;
        const btnEnabled = canFight && !isCurrent;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(btnEnabled ? 0x44aa66 : 0x444444, 1);
        btnBg.fillRoundedRect(0, btnY, btnW, btnH, 6);
        this.elfInfoContainer.add(btnBg);

        const btnText = this.add.text(btnW / 2, btnY + btnH / 2, '出战', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: btnEnabled ? '#ffffff' : '#888888',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elfInfoContainer.add(btnText);

        if (btnEnabled) {
            const btnHit = this.add.rectangle(btnW / 2, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
            this.elfInfoContainer.add(btnHit);
            btnHit.on('pointerdown', () => this.doSwitch(index));
        }

        const skillW = 210;
        const skillH = 40;
        const skillGapX = 5;
        const skillGapY = 5;

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = col * (skillW + skillGapX);
            const sy = row * (skillH + skillGapY);

            if (i < elfData.skills.length) {
                const skillId = elfData.skills[i];
                const skillData = DataLoader.getSkill(skillId);
                const currentPP = elfData.skillPP[skillId] || 0;

                if (skillData) {
                    const skillCard = BattleSwitchPanelView.createSwitchSkillCard.call(this, sx, sy, skillW, skillH, skillData, currentPP);
                    this.elfSkillContainer.add(skillCard);
                }
            } else {
                const emptyCard = this.add.graphics();
                emptyCard.fillStyle(0x222222, 0.5);
                emptyCard.fillRoundedRect(sx, sy, skillW, skillH, 4);
                this.elfSkillContainer.add(emptyCard);

                const dash = this.add.text(sx + skillW / 2, sy + skillH / 2, '-', {
                    fontSize: '16px',
                    color: '#444444'
                }).setOrigin(0.5);
                this.elfSkillContainer.add(dash);
            }
        }
    },

    createSwitchSkillCard(x, y, w, h, skill, currentPP) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(1, 0x4a6a8a);
        bg.strokeRoundedRect(0, 0, w, h, 4);
        container.add(bg);

        const nameText = this.add.text(8, 5, skill.name, {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(nameText);

        const metaText = this.add.text(8, 23, `威力${skill.power}  PP${currentPP}/${skill.pp}`, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#88aacc'
        });
        container.add(metaText);

        if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.renderSkill === 'function') {
            TypeIconView.renderSkill(this, container, w - 12, h / 2, skill, {
                iconSize: 16,
                originX: 1,
                originY: 0.5
            });
        } else {
            const fallbackDot = this.add.circle(w - 12, h / 2, 8, 0x8899aa, 1).setOrigin(1, 0.5);
            container.add(fallbackDot);
        }

        return container;
    },

    closeElfSwitchPanel() {
        if (this.elfSwitchContainer) {
            this.elfSwitchContainer.destroy();
            this.elfSwitchContainer = null;
        }
        this.forceSwitchMode = false;
    },

    doSwitch(elfIndex) {
        const elfData = PlayerData.elves[elfIndex];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData || elfData.currentHp <= 0) {
            return;
        }

        const wasForceSwitch = this.forceSwitchMode === true;
        if (!wasForceSwitch && (!this.menuEnabled || this.battleEnded || this.actionIntentLocked)) {
            return;
        }

        const previousPlayerElf = this.playerElf;
        const previousManagerElf = this.battleManager ? this.battleManager.playerElf : null;
        const newElf = new Elf(baseData, elfData);

        this.closeElfSwitchPanel();

        this.addLog(`${this.playerElf.getDisplayName()}，回来吧！`);
        this.addLog(`去吧，${newElf.getDisplayName()}！`);

        this.playerElf = newElf;
        this.battleManager.playerElf = newElf;

        this.updatePlayerSpriteAndStatus();

        if (wasForceSwitch) {
            this.showLogs(() => {
                this.enableMenu();
                this.startTurnTimer();
            });
        } else {
            const submitted = this.submitPanelIntent(BattleManager.ACTION.SWITCH, { elfIndex });
            if (!submitted) {
                this.playerElf = previousPlayerElf;
                if (this.battleManager) {
                    this.battleManager.playerElf = previousManagerElf;
                }
                this.updatePlayerSpriteAndStatus();
            }
        }
    },

    updatePlayerSpriteAndStatus() {
        if (this.playerSprite) {
            this.playerSprite.destroy();
        }
        this.playerSprite = this.createCharacterSprite(200, 230, this.playerElf, true);

        if (this.playerStatus && this.playerStatus.container) {
            this.playerStatus.container.destroy();
        }
        this.createStatusBar(this.playerElf, 20, 10, true);
        if (typeof this.refreshStatusIcons === 'function') {
            this.refreshStatusIcons();
        }

        this.rebuildSkillPanel();
    },

    showForceSwitchPanel() {
        const availableElves = PlayerData.elves.filter((e) => e.currentHp > 0);

        if (availableElves.length === 0) {
            return false;
        }

        this.addLog('必须选择一只精灵出战！');
        this.showElfSwitchPanel(true);
        return true;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleSwitchPanelView', BattleSwitchPanelView);
}

window.BattleSwitchPanelView = BattleSwitchPanelView;
