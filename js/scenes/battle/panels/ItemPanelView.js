/**
 * BattleItemPanelView - 战斗道具面板
 *
 * 职责：
 * - 展示道具网格（按分类筛选：血药 / PP 药 / 胶囊 / 全部）
 * - 提供分类切换按钮与分页滚动
 * - 点击道具后提交 ITEM / CATCH 行动意图
 * - 与 SkillPanel、SwitchPanel、CapsulePanel 互斥显示
 *
 * 以 BattleScene 的 this 执行所有方法。
 */

const BattleItemPanelView = {
    /** 面板挂载时无操作（由 showItemPanel 按需创建） */
    mount() { },

    /**
     * 面板更新：如果道具面板已打开，刷新道具网格
     */
    update() {
        if (this.itemPanelContainer && this.isItemPanelOpen === true) {
            BattleItemPanelView.updateItemGrid.call(this);
        }
    },

    /** 面板卸载时关闭道具面板 */
    unmount() {
        BattleItemPanelView.closeItemPanel.call(this, true);
    },

    /**
     * 打开道具面板（覆盖技能面板区域）
     * 初始化分类按钮与道具网格，默认显示全部
     */
    showItemPanel() {
        if (!this.menuEnabled || this.battleEnded || this.forceSwitchMode) {
            return;
        }
        if (this.itemPanelContainer) {
            return;
        }
        this.closeElfSwitchPanel();
        this.closeCapsulePanel();

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
            const btn = BattleItemPanelView.createCategoryButton.call(this, catX, catY + i * (catBtnH + catGap), catBtnW, catBtnH, cat);
            this.itemPanelContainer.add(btn);
            this.categoryButtons.push(btn);
        });

        this.itemGridContainer = this.add.container(this.itemPanelLayout.gridX, this.itemPanelLayout.gridY);
        this.itemPanelContainer.add(this.itemGridContainer);

        this.updateItemGrid();
    },

    /**
     * 创建分类筛选按钮
     * @param {number} x - 按钮 X
     * @param {number} y - 按钮 Y
     * @param {number} w - 按钮宽
     * @param {number} h - 按钮高
     * @param {Object} cat - 分类配置 { key, label, icon }
     * @returns {Phaser.GameObjects.Container} 按钮容器
     */
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

    /** 刷新分类按钮高亮状态 */
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

    /**
     * 刷新道具网格（按当前分类和滚动偏移渲染可见道具槽位）
     * 包含空状态提示与分页指示器
     */
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

            const slot = BattleItemPanelView.createItemSlot.call(this, x, y, slotW, slotH, item);
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

    /**
     * 创建单个道具槽位（含图标、数量标签与交互热区）
     * @param {number} x - 槽位 X
     * @param {number} y - 槽位 Y
     * @param {number} w - 槽位宽
     * @param {number} h - 槽位高
     * @param {Object} item - { itemId, itemData, count, category }
     * @returns {Phaser.GameObjects.Container} 槽位容器
     */
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

    /**
     * 使用道具：胶囊提交 CATCH，其他提交 ITEM
     * @param {Object} item - 道具数据
     */
    useItem(item) {
        const itemData = item.itemData;
        if (!itemData || typeof item.itemId !== 'number') {
            return;
        }

        if (itemData.type === 'capsule') {
            const submitted = this.submitPanelIntent(BattleManager.ACTION.CATCH, { itemId: item.itemId });
            if (submitted) {
                this.closeItemPanel();
            }
            return;
        }

        const submitted = this.submitPanelIntent(BattleManager.ACTION.ITEM, { itemId: item.itemId });
        if (submitted) {
            this.closeItemPanel();
        }
    },

    /**
     * 关闭道具面板
     * @param {boolean} [skipRefresh=false] - 是否跳过刷新操作按钮
     */
    closeItemPanel(skipRefresh = false) {
        if (this.itemPanelContainer) {
            this.itemPanelContainer.destroy();
            this.itemPanelContainer = null;
        }
        this.itemPanelLayout = null;
        this.isItemPanelOpen = false;
        if (!skipRefresh) {
            this.refreshActionButtons();
        }
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleItemPanelView', BattleItemPanelView);
}

window.BattleItemPanelView = BattleItemPanelView;
