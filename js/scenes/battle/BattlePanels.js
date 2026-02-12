/**
 * BattlePanels - BattleScene panel and interaction facade methods.
 *
 * These methods run with BattleScene as `this`.
 */

function renderBattleTypeIcon(scene, container, x, y, type, options = {}) {
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

const BattlePanels = {
    createBottomControlPanel() {
        const panelY = 430;
        const panelH = 170;
        this.bottomPanelY = panelY;
        this.isItemPanelOpen = false;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a2a3a, 0.95);
        panelBg.fillRect(0, panelY, this.W, panelH);
        panelBg.lineStyle(3, 0x3a5a7a);
        panelBg.lineBetween(0, panelY, this.W, panelY);

        this.createLeftInfoPanel(panelY);
        this.createMiddleSkillPanel(panelY);
        this.createRightActionButtons(panelY);
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
                const btn = this.createSkillButton(btnX, btnY, skillBtnW, skillBtnH, skill, i);
                this.skillButtons.push(btn);
                this.skillContainer.add(btn);
            } else {
                const emptyBtn = this.createEmptySkillSlot(btnX, btnY, skillBtnW, skillBtnH);
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

        renderBattleTypeIcon(this, container, 10, 38, skill.type, {
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

    createRightActionButtons(panelY) {
        const x = 710;
        const y = panelY + 15;
        const btnW = 120;
        const btnH = 45;
        const gap = 10;

        if (this.actionContainer) {
            this.actionContainer.destroy();
        }
        this.actionContainer = this.add.container(0, 0);

        const hasMultipleElves = PlayerData.elves.length > 1;
        const itemPanelOpen = this.isItemPanelOpen === true;

        const buttons = [
            { label: '战斗', action: () => this.showSkillPanel(), disabled: !itemPanelOpen },
            { label: '道具', action: () => this.showItemPanel(), disabled: itemPanelOpen },
            { label: '精灵', action: () => this.showElfSwitchPanel(), disabled: !hasMultipleElves },
            { label: '逃跑', action: () => this.doEscape(), disabled: false }
        ];

        this.actionButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = x + col * (btnW + gap);
            const btnY = y + row * (btnH + gap);
            const btn = this.createActionButton(btnX, btnY, btnW, btnH, buttons[i]);
            this.actionButtons.push(btn);
            this.actionContainer.add(btn);
        }
    },

    refreshActionButtons() {
        this.createRightActionButtons(this.bottomPanelY || 430);
        if (!this.menuEnabled && this.actionContainer) {
            this.actionContainer.setAlpha(0.4);
        }
    },

    showSkillPanel() {
        this.closeItemPanel();
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
    },

    showCapsulePanel() {
        if (!this.canCatch) {
            this.addLog('无法在此战斗中捕捉！');
            return;
        }

        const capsules = ItemBag.getCapsules();
        if (capsules.length === 0) {
            this.addLog('没有可用的精灵胶囊！');
            return;
        }

        this.capsulePanelContainer = this.add.container(this.W / 2, this.H / 2);
        this.capsulePanelContainer.setDepth(90);

        const w = 350;
        const h = 250;

        const mask = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.5).setOrigin(0.5);
        mask.setInteractive();
        this.capsulePanelContainer.add(mask);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(3, 0x4a8aca);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        this.capsulePanelContainer.add(bg);

        const title = this.add.text(0, -h / 2 + 25, '选择胶囊', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.capsulePanelContainer.add(title);

        const startY = -h / 2 + 60;
        const itemH = 50;
        capsules.forEach((capsuleInfo, index) => {
            const itemY = startY + index * (itemH + 10);
            const itemContainer = this.add.container(0, itemY);

            const itemBg = this.add.graphics();
            itemBg.fillStyle(0x2a4a7a, 1);
            itemBg.fillRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            itemBg.lineStyle(2, 0x4a7aba);
            itemBg.strokeRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            itemContainer.add(itemBg);

            const nameText = this.add.text(-w / 2 + 35, itemH / 2, capsuleInfo.itemData.name, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0, 0.5);
            itemContainer.add(nameText);

            const countText = this.add.text(w / 2 - 35, itemH / 2, `x${capsuleInfo.count}`, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#aaddaa'
            }).setOrigin(1, 0.5);
            itemContainer.add(countText);

            const hit = this.add.rectangle(0, itemH / 2, w - 40, itemH).setInteractive({ useHandCursor: true });
            itemContainer.add(hit);

            hit.on('pointerover', () => {
                itemBg.clear();
                itemBg.fillStyle(0x3a6aaa, 1);
                itemBg.fillRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
                itemBg.lineStyle(2, 0x5a9ada);
                itemBg.strokeRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            });

            hit.on('pointerout', () => {
                itemBg.clear();
                itemBg.fillStyle(0x2a4a7a, 1);
                itemBg.fillRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
                itemBg.lineStyle(2, 0x4a7aba);
                itemBg.strokeRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            });

            hit.on('pointerdown', () => {
                this.closeCapsulePanel();
                this.doCatch(capsuleInfo.itemData);
            });

            this.capsulePanelContainer.add(itemContainer);
        });

        const cancelY = h / 2 - 35;
        const cancelBg = this.add.graphics();
        cancelBg.fillStyle(0x5a3a3a, 1);
        cancelBg.fillRoundedRect(-50, cancelY - 15, 100, 30, 6);
        this.capsulePanelContainer.add(cancelBg);

        const cancelText = this.add.text(0, cancelY, '取消', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.capsulePanelContainer.add(cancelText);

        const cancelHit = this.add.rectangle(0, cancelY, 100, 30).setInteractive({ useHandCursor: true });
        this.capsulePanelContainer.add(cancelHit);
        cancelHit.on('pointerdown', () => this.closeCapsulePanel());
    },

    closeCapsulePanel() {
        if (this.capsulePanelContainer) {
            this.capsulePanelContainer.destroy();
            this.capsulePanelContainer = null;
        }
    },

    doCatch(capsule) {
        this.disableMenu();
        this.battleManager.setPlayerAction(BattleManager.ACTION.CATCH, { capsule });
        this.executeTurn();
    },

    showItemPanel() {
        if (this.itemPanelContainer) {
            return;
        }
        this.closeElfSwitchPanel();
        this.closeCapsulePanel();

        if (this.skillContainer) {
            this.skillContainer.setVisible(false);
        }

        const panelY = 430;
        this.itemPanelContainer = this.add.container(310, panelY + 10);
        this.itemPanelContainer.setDepth(50);

        const panelW = 380;
        const panelH = 150;
        const panelPadding = 10;
        const catBtnW = 56;
        const catGap = 5;
        const gridW = panelW - panelPadding * 3 - catBtnW;
        const gridH = panelH - panelPadding * 2;

        this.itemPanelLayout = {
            panelW,
            panelH,
            panelPadding,
            gridX: panelPadding,
            gridY: panelPadding,
            gridW,
            gridH,
            cols: 4,
            rows: 2,
            slotGapX: 8,
            slotGapY: 8
        };

        this.isItemPanelOpen = true;
        this.refreshActionButtons();

        const bg = this.add.graphics();
        bg.fillStyle(0x0a1a2a, 0.95);
        bg.fillRoundedRect(0, 0, panelW, panelH, 8);
        bg.lineStyle(2, 0x3a5a7a);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 8);
        this.itemPanelContainer.add(bg);

        this.itemCategory = 'all';
        this.itemScrollOffset = 0;

        const categories = [
            { key: 'hp', label: '血药', icon: '❤️' },
            { key: 'pp', label: 'PP药', icon: '💧' },
            { key: 'capsule', label: '胶囊', icon: '🔴' }
        ];

        const catX = panelW - panelPadding - catBtnW;
        const catY = panelPadding;
        const catBtnH = Math.floor((gridH - catGap * 2) / 3);

        this.categoryButtons = [];
        categories.forEach((cat, i) => {
            const btn = this.createCategoryButton(catX, catY + i * (catBtnH + catGap), catBtnW, catBtnH, cat);
            this.itemPanelContainer.add(btn);
            this.categoryButtons.push(btn);
        });

        this.itemGridContainer = this.add.container(this.itemPanelLayout.gridX, this.itemPanelLayout.gridY);
        this.itemPanelContainer.add(this.itemGridContainer);

        this.updateItemGrid();
    },

    createCategoryButton(x, y, w, h, cat) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(this.itemCategory === cat.key ? 0x3a6a9a : 0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 5);
        bg.lineStyle(1, 0x4a7aaa);
        bg.strokeRoundedRect(0, 0, w, h, 5);
        container.add(bg);

        const icon = this.add.text(w / 2, h / 2 - 6, cat.icon, {
            fontSize: '16px'
        }).setOrigin(0.5);
        container.add(icon);

        const label = this.add.text(w / 2, h / 2 + 10, cat.label, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#aaddcc'
        }).setOrigin(0.5);
        container.add(label);

        const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerdown', () => {
            this.itemCategory = cat.key;
            this.itemScrollOffset = 0;
            this.updateCategoryHighlight();
            this.updateItemGrid();
        });

        container._bg = bg;
        container._cat = cat;
        container._w = w;
        container._h = h;

        return container;
    },

    updateCategoryHighlight() {
        this.categoryButtons.forEach((btn) => {
            const bg = btn._bg;
            const cat = btn._cat;
            const w = btn._w;
            const h = btn._h;
            bg.clear();
            bg.fillStyle(this.itemCategory === cat.key ? 0x3a6a9a : 0x2a4a6a, 1);
            bg.fillRoundedRect(0, 0, w, h, 5);
            bg.lineStyle(1, this.itemCategory === cat.key ? 0x6a9aca : 0x4a7aaa);
            bg.strokeRoundedRect(0, 0, w, h, 5);
        });
    },

    updateItemGrid() {
        this.itemGridContainer.removeAll(true);
        const layout = this.itemPanelLayout || {
            gridW: 264,
            gridH: 120,
            cols: 4,
            rows: 2,
            slotGapX: 6,
            slotGapY: 6
        };

        const allItems = ItemBag.getAll();
        const items = [];

        Object.entries(allItems).forEach(([itemId, count]) => {
            if (count <= 0) {
                return;
            }
            const itemData = DataLoader.getItem(parseInt(itemId, 10));
            if (!itemData) {
                return;
            }

            let category = 'other';
            if (itemData.type === 'capsule') {
                category = 'capsule';
            } else if (itemData.type === 'hpPotion') {
                category = 'hp';
            } else if (itemData.type === 'ppPotion') {
                category = 'pp';
            }

            if (this.itemCategory === 'all' || this.itemCategory === category) {
                items.push({ itemId: parseInt(itemId, 10), itemData, count, category });
            }
        });

        const cols = layout.cols;
        const rows = layout.rows;
        const gapX = layout.slotGapX;
        const gapY = layout.slotGapY;
        const slotW = Math.floor((layout.gridW - gapX * (cols - 1)) / cols);
        const slotH = Math.floor((layout.gridH - gapY * (rows - 1)) / rows);
        const visibleItems = items.slice(this.itemScrollOffset, this.itemScrollOffset + cols * rows);

        visibleItems.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * (slotW + gapX);
            const y = row * (slotH + gapY);

            const slot = this.createItemSlot(x, y, slotW, slotH, item);
            this.itemGridContainer.add(slot);
        });

        if (visibleItems.length === 0) {
            const emptyText = this.add.text(Math.floor(layout.gridW / 2), Math.floor(layout.gridH / 2), '没有此类道具', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#888888'
            }).setOrigin(0.5);
            this.itemGridContainer.add(emptyText);
        }

        if (items.length > cols * rows) {
            const scrollInfo = this.add.text(layout.gridW - 4, layout.gridH - 2,
                `▲ ▼ ${this.itemScrollOffset / (cols * rows) + 1}/${Math.ceil(items.length / (cols * rows))}`, {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: '#aaaaaa'
                }).setOrigin(1, 1);
            this.itemGridContainer.add(scrollInfo);
        }
    },

    createItemSlot(x, y, w, h, item) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(1, 0x4a7aaa);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const itemIconKey = AssetMappings.getItemImageKey(item.itemId);
        if (itemIconKey && this.textures.exists(itemIconKey)) {
            const iconImage = this.add.image(w / 2, h / 2 - 2, itemIconKey);
            const iconSize = w - 12;
            const scale = Math.min(iconSize / iconImage.width, iconSize / iconImage.height);
            iconImage.setScale(scale);
            container.add(iconImage);
        } else {
            let iconChar = '📦';
            if (item.category === 'capsule') {
                iconChar = '🔴';
            } else if (item.category === 'hp') {
                iconChar = '❤️';
            } else if (item.category === 'pp') {
                iconChar = '💧';
            }

            const icon = this.add.text(w / 2, h / 2 - 5, iconChar, {
                fontSize: '24px'
            }).setOrigin(0.5);
            container.add(icon);
        }

        const countBg = this.add.graphics();
        countBg.fillStyle(0x1a1a2a, 0.9);
        countBg.fillRoundedRect(w - 22, h - 18, 20, 16, 3);
        container.add(countBg);

        const countText = this.add.text(w - 12, h - 10, `${item.count}`, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(countText);

        const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x3a6a9a, 1);
            bg.fillRoundedRect(0, 0, w, h, 6);
            bg.lineStyle(2, 0x6a9aca);
            bg.strokeRoundedRect(0, 0, w, h, 6);
        });

        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2a4a6a, 1);
            bg.fillRoundedRect(0, 0, w, h, 6);
            bg.lineStyle(1, 0x4a7aaa);
            bg.strokeRoundedRect(0, 0, w, h, 6);
        });

        hit.on('pointerdown', () => {
            this.useItem(item);
        });

        return container;
    },

    useItem(item) {
        const itemData = item.itemData;

        if (itemData.type === 'capsule') {
            if (!this.canCatch) {
                this.addLog('无法在此战斗中使用胶囊！');
                return;
            }
            this.closeItemPanel();
            this.doCatch(itemData);
        } else if (itemData.type === 'hpPotion' && itemData.effect) {
            const healAmount = itemData.effect.hpRestore || 20;
            const maxHp = this.playerElf.getMaxHp();
            const oldHp = this.playerElf.currentHp;
            this.playerElf.currentHp = Math.min(maxHp, oldHp + healAmount);
            const healed = this.playerElf.currentHp - oldHp;

            if (healed > 0) {
                ItemBag.removeItem(item.itemId, 1);
                this.addLog(`使用了 ${itemData.name}，恢复了 ${healed} HP！`);

                this.updateStatusHp('player');
                this.playerElf._syncInstanceData();
                PlayerData.saveToStorage();

                this.closeItemPanel();
                this.disableMenu();
                this.battleManager.setPlayerAction(BattleManager.ACTION.ITEM, { itemId: item.itemId });
                this.executeTurn();
            } else {
                this.addLog(`${this.playerElf.getDisplayName()} 的 HP 已满！`);
            }
        } else if (itemData.type === 'ppPotion' && itemData.effect) {
            const restoreAmount = itemData.effect.ppRestore || 5;
            const skills = this.playerElf.getSkillDetails();
            let restored = false;

            skills.forEach((skill) => {
                if (this.playerElf.skillPP[skill.id] < skill.pp) {
                    this.playerElf.skillPP[skill.id] = Math.min(skill.pp, this.playerElf.skillPP[skill.id] + restoreAmount);
                    restored = true;
                }
            });

            if (restored) {
                ItemBag.removeItem(item.itemId, 1);
                this.addLog(`使用了 ${itemData.name}，恢复了技能 PP！`);
                this.updateSkillPP();
                this.playerElf._syncInstanceData();
                PlayerData.saveToStorage();

                this.closeItemPanel();
                this.disableMenu();
                this.battleManager.setPlayerAction(BattleManager.ACTION.ITEM, { itemId: item.itemId });
                this.executeTurn();
            } else {
                this.addLog('所有技能 PP 已满！');
            }
        }
    },

    closeItemPanel() {
        if (this.itemPanelContainer) {
            this.itemPanelContainer.destroy();
            this.itemPanelContainer = null;
        }
        this.itemPanelLayout = null;
        this.isItemPanelOpen = false;
        this.refreshActionButtons();
        if (this.skillContainer) {
            this.skillContainer.setVisible(true);
        }
    },

    showElfSwitchPanel(forceSwitch = false) {
        this.closeItemPanel();
        this.closeElfSwitchPanel();
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
            const slot = this.createElfSlot(panelX + 15 + i * (slotSize + slotGap), topBarY, slotSize, elves[i], i);
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
                    const skillCard = this.createSwitchSkillCard(sx, sy, skillW, skillH, skillData, currentPP);
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

        renderBattleTypeIcon(this, container, w - 12, h / 2, skill.type, {
            iconSize: 16,
            fallbackFontSize: '10px',
            fallbackColor: '#aaddaa',
            fallbackOriginX: 1
        });

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

        const newElf = new Elf(baseData, elfData);

        this.closeElfSwitchPanel();
        this.disableMenu();

        this.addLog(`${this.playerElf.getDisplayName()}，回来吧！`);
        this.addLog(`去吧，${newElf.getDisplayName()}！`);

        this.playerElf = newElf;
        this.battleManager.playerElf = newElf;

        this.updatePlayerSpriteAndStatus();

        if (this.forceSwitchMode) {
            this.showLogs(() => {
                this.enableMenu();
                this.startTurnTimer();
            });
        } else {
            this.battleManager.setPlayerAction(BattleManager.ACTION.SWITCH, { elfIndex });
            this.executeTurn();
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

        this.rebuildSkillPanel();
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
                const btn = this.createSkillButton(btnX, btnY, skillBtnW, skillBtnH, skill, i);
                this.skillButtons.push(btn);
                this.skillContainer.add(btn);
            } else {
                const emptyBtn = this.createEmptySkillSlot(btnX, btnY, skillBtnW, skillBtnH);
                this.skillButtons.push(emptyBtn);
                this.skillContainer.add(emptyBtn);
            }
        }
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
    AppContext.register('BattlePanels', BattlePanels);
}

window.BattlePanels = BattlePanels;
