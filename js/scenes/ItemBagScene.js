/**
 * ItemBagScene - 物品背包场景
 * 显示玩家拥有的物品
 */

class ItemBagScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ItemBagScene' });
    }

    init(data) {
        this.returnScene = data.returnScene || 'SpaceshipScene';
    }

    create() {
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        this.createBackground();
        this.createHeader();
        this.createItemList();
        this.createBackButton();
    }

    // ========== 背景 ==========
    createBackground() {
        const g = this.add.graphics();
        g.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x0a1a2a, 0x0a1a2a, 1);
        g.fillRect(0, 0, this.W, this.H);
    }

    // ========== 顶部信息栏 ==========
    createHeader() {
        const headerH = 80;
        const g = this.add.graphics();
        g.fillStyle(0x2a4a6a, 0.9);
        g.fillRect(0, 0, this.W, headerH);
        g.lineStyle(2, 0x4a7a9a);
        g.lineBetween(0, headerH, this.W, headerH);

        // 标题
        this.add.text(this.W / 2, 25, '物品背包', {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 赛尔豆显示
        this.add.text(this.W / 2, 55, `💰 赛尔豆: ${PlayerData.seerBeans}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffdd44'
        }).setOrigin(0.5);
    }

    // ========== 物品列表 ==========
    createItemList() {
        const startY = 100;
        const itemH = 70;
        const padding = 20;
        const itemW = this.W - padding * 2;

        // 获取所有物品
        const items = ItemBag.getAll();
        const itemIds = Object.keys(items);

        if (itemIds.length === 0) {
            this.add.text(this.W / 2, this.H / 2, '背包是空的', {
                fontSize: '20px', fontFamily: 'Arial', color: '#888888'
            }).setOrigin(0.5);
            return;
        }

        // 分类显示物品
        const categories = {
            'capsule': { name: '精灵胶囊', items: [], color: 0x44aa88 },
            'hpPotion': { name: '体力药剂', items: [], color: 0xdd6644 },
            'ppPotion': { name: '活力药剂', items: [], color: 0x6688dd }
        };

        // 分类物品
        itemIds.forEach(id => {
            const itemData = DataLoader.getItem(parseInt(id));
            if (itemData && categories[itemData.type]) {
                categories[itemData.type].items.push({
                    id: parseInt(id),
                    data: itemData,
                    count: items[id]
                });
            }
        });

        let y = startY;

        // 渲染每个分类
        for (const type in categories) {
            const cat = categories[type];
            if (cat.items.length === 0) continue;

            // 分类标题
            const catBg = this.add.graphics();
            catBg.fillStyle(cat.color, 0.3);
            catBg.fillRoundedRect(padding, y, itemW, 35, 6);
            this.add.text(padding + 15, y + 17, cat.name, {
                fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            y += 45;

            // 分类下的物品
            cat.items.forEach(item => {
                this.createItemRow(padding, y, itemW, itemH - 10, item);
                y += itemH;
            });

            y += 10; // 分类间距
        }
    }

    createItemRow(x, y, w, h, item) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x2a3a5a, 1);
        bg.fillRoundedRect(0, 0, w, h, 8);
        bg.lineStyle(2, 0x4a5a7a);
        bg.strokeRoundedRect(0, 0, w, h, 8);
        container.add(bg);

        // 物品图标背景
        const iconBg = this.add.graphics();
        iconBg.fillStyle(0x3a5a7a, 1);
        iconBg.fillRoundedRect(10, 10, h - 20, h - 20, 6);
        container.add(iconBg);

        // 物品图标：优先使用资源映射，缺失时回退首字
        const itemIconKey = AssetMappings.getItemImageKey(item.id);
        if (itemIconKey && this.textures.exists(itemIconKey)) {
            const iconImage = this.add.image(10 + (h - 20) / 2, h / 2, itemIconKey);
            const iconSize = h - 24;
            const scale = Math.min(iconSize / iconImage.width, iconSize / iconImage.height);
            iconImage.setScale(scale);
            container.add(iconImage);
        } else {
            const iconText = this.add.text(10 + (h - 20) / 2, h / 2, item.data.name.charAt(0), {
                fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(iconText);
        }

        // 物品名称
        const nameText = this.add.text(h + 10, 15, item.data.name, {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        container.add(nameText);

        // 物品描述
        const descText = this.add.text(h + 10, 38, item.data.description, {
            fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa'
        });
        container.add(descText);

        // 数量
        const countText = this.add.text(w - 20, h / 2, `x${item.count}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#aaddaa', fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        container.add(countText);
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btnW = 120, btnH = 45;
        const x = this.W / 2, y = this.H - 50;

        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x5a3a3a, 1);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        bg.lineStyle(2, 0x8a5a5a);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        container.add(bg);

        const text = this.add.text(0, 0, '返回', {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        const hit = this.add.rectangle(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x7a5a5a, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            bg.lineStyle(2, 0xaa7a7a);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        });

        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x5a3a3a, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            bg.lineStyle(2, 0x8a5a5a);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        });

        hit.on('pointerdown', () => {
            SceneManager.changeScene(this, this.returnScene);
        });
    }
}

window.ItemBagScene = ItemBagScene;
