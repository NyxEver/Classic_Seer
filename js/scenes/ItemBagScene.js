/**
 * ItemBagScene - 物品背包弹窗
 * 仅作为叠加弹窗使用：不暂停底层场景，关闭时仅 stop 自身。
 */
class ItemBagScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ItemBagScene' });
        this.returnScene = 'SpaceshipScene';
        this.returnData = {};
    }

    init(data) {
        this.returnScene = data.returnScene || 'SpaceshipScene';
        this.returnData = data.returnData || {};
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5200 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5200;

        this.modalW = Math.min(860, this.W - 80);
        this.modalH = Math.min(520, this.H - 70);
        this.modalX = Math.floor((this.W - this.modalW) / 2);
        this.modalY = Math.floor((this.H - this.modalH) / 2);

        this.root = this.add.container(this.modalX, this.modalY).setDepth(this.baseDepth + 1);

        this.createPanelFrame();
        this.createHeader();
        this.createItemList();
        this.createCloseControls();
    }

    createPanelFrame() {
        const frame = this.add.graphics();
        frame.fillStyle(0x132537, 0.97);
        frame.fillRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.lineStyle(2, 0x5f84a6, 1);
        frame.strokeRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.fillStyle(0xffffff, 0.06);
        frame.fillRoundedRect(8, 8, this.modalW - 16, 18, 8);
        this.root.add(frame);
    }

    createHeader() {
        const headerH = 72;
        const header = this.add.graphics();
        header.fillStyle(0x1d3a52, 0.95);
        header.fillRoundedRect(0, 0, this.modalW, headerH, 16);
        header.fillRect(0, 22, this.modalW, headerH - 22);
        header.lineStyle(1, 0x6e95b8, 0.9);
        header.lineBetween(0, headerH, this.modalW, headerH);
        this.root.add(header);

        const title = this.add.text(20, 18, '物品背包', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.root.add(title);

        const beanText = this.add.text(this.modalW - 20, 20, `赛尔豆: ${PlayerData.seerBeans}`, {
            fontSize: '15px',
            color: '#ffdd77',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        this.root.add(beanText);
    }

    createItemList() {
        const contentX = 18;
        const contentY = 86;
        const contentW = this.modalW - 36;
        const rowH = 68;
        const sectionGap = 10;

        const items = ItemBag.getAll();
        const itemIds = Object.keys(items);

        if (itemIds.length === 0) {
            const empty = this.add.text(this.modalW / 2, this.modalH / 2, '背包是空的', {
                fontSize: '20px',
                color: '#8aa0b6'
            }).setOrigin(0.5);
            this.root.add(empty);
            return;
        }

        const categories = {
            capsule: { name: '精灵胶囊', color: 0x3f8f7b, items: [] },
            hpPotion: { name: '体力药剂', color: 0xaa6542, items: [] },
            ppPotion: { name: '活力药剂', color: 0x4e6eb1, items: [] }
        };

        itemIds.forEach((idText) => {
            const itemId = parseInt(idText, 10);
            const itemData = DataLoader.getItem(itemId);
            if (!itemData || !categories[itemData.type]) {
                return;
            }

            categories[itemData.type].items.push({
                id: itemId,
                data: itemData,
                count: items[idText]
            });
        });

        let cursorY = contentY;
        for (const category of Object.values(categories)) {
            if (!category.items.length) {
                continue;
            }

            const tag = this.add.graphics();
            tag.fillStyle(category.color, 0.25);
            tag.fillRoundedRect(contentX, cursorY, contentW, 28, 6);
            this.root.add(tag);

            const tagText = this.add.text(contentX + 10, cursorY + 14, category.name, {
                fontSize: '14px',
                color: '#d7e8f8',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            this.root.add(tagText);
            cursorY += 34;

            category.items.forEach((item) => {
                const row = this.createItemRow(contentX, cursorY, contentW, rowH, item);
                this.root.add(row);
                cursorY += rowH + 8;
            });

            cursorY += sectionGap;
        }
    }

    createItemRow(x, y, w, h, item) {
        const container = this.add.container(0, 0);

        const bg = this.add.graphics();
        bg.fillStyle(0x1d3248, 0.96);
        bg.fillRoundedRect(x, y, w, h, 8);
        bg.lineStyle(1, 0x4f6f8d, 1);
        bg.strokeRoundedRect(x, y, w, h, 8);
        container.add(bg);

        const iconPanel = this.add.graphics();
        iconPanel.fillStyle(0x2a4864, 0.95);
        iconPanel.fillRoundedRect(x + 10, y + 10, h - 20, h - 20, 6);
        container.add(iconPanel);

        const iconKey = AssetMappings.getItemImageKey(item.id);
        if (iconKey && this.textures.exists(iconKey)) {
            const icon = this.add.image(x + 10 + (h - 20) / 2, y + h / 2, iconKey);
            const scale = Math.min((h - 26) / icon.width, (h - 26) / icon.height);
            icon.setScale(scale);
            container.add(icon);
        } else {
            const fallback = this.add.text(x + 10 + (h - 20) / 2, y + h / 2, item.data.name.charAt(0), {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(fallback);
        }

        const name = this.add.text(x + h + 6, y + 12, item.data.name, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(name);

        const desc = this.add.text(x + h + 6, y + 36, item.data.description, {
            fontSize: '12px',
            color: '#a9bfd4'
        });
        container.add(desc);

        const count = this.add.text(x + w - 14, y + h / 2, `x${item.count}`, {
            fontSize: '18px',
            color: '#b8f0b8',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        container.add(count);

        return container;
    }

    createCloseControls() {
        const topCloseBg = this.add.circle(this.modalX + this.modalW - 24, this.modalY + 24, 14, 0x7b3f3f)
            .setDepth(this.baseDepth + 3)
            .setInteractive({ useHandCursor: true });
        const topCloseText = this.add.text(this.modalX + this.modalW - 24, this.modalY + 24, 'X', {
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(this.baseDepth + 4);

        topCloseBg.on('pointerover', () => topCloseBg.setFillStyle(0xa34f4f));
        topCloseBg.on('pointerout', () => topCloseBg.setFillStyle(0x7b3f3f));
        topCloseBg.on('pointerdown', () => this.closeModal());

        const btnW = 128;
        const btnH = 38;
        const closeBtn = this.add.container(this.modalX + this.modalW / 2, this.modalY + this.modalH - 28)
            .setDepth(this.baseDepth + 3);

        const closeBg = this.add.graphics();
        closeBg.fillStyle(0x4d6278, 1);
        closeBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        closeBg.lineStyle(1, 0x8db2d3, 1);
        closeBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        closeBtn.add(closeBg);

        const closeText = this.add.text(0, 0, '关闭', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        closeBtn.add(closeText);

        const closeHit = this.add.rectangle(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
        closeHit.on('pointerover', () => {
            closeBg.clear();
            closeBg.fillStyle(0x6685a5, 1);
            closeBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            closeBg.lineStyle(1, 0xb7d8f4, 1);
            closeBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        });
        closeHit.on('pointerout', () => {
            closeBg.clear();
            closeBg.fillStyle(0x4d6278, 1);
            closeBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            closeBg.lineStyle(1, 0x8db2d3, 1);
            closeBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        });
        closeHit.on('pointerdown', () => this.closeModal());
        closeBtn.add(closeHit);
    }

    closeModal() {
        ModalOverlayLayer.unmount(this);

        if (this.scene.isActive(this.returnScene)) {
            this.scene.stop();
            return;
        }

        SceneRouter.start(this, this.returnScene, this.returnData || {});
    }
}

window.ItemBagScene = ItemBagScene;
