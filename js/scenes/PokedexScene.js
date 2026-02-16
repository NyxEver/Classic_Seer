/**
 * PokedexScene - 图鉴弹窗
 * 叠加在世界场景或精灵管理弹窗之上，不暂停底层场景。
 */
class PokedexScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PokedexScene' });
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

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5400 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5400;

        this.modalW = Math.min(950, this.W - 70);
        this.modalH = Math.min(560, this.H - 50);
        this.modalX = Math.floor((this.W - this.modalW) / 2);
        this.modalY = Math.floor((this.H - this.modalH) / 2);

        this.root = this.add.container(this.modalX, this.modalY).setDepth(this.baseDepth + 1);

        this.createPanelFrame();
        this.createHeader();
        this.createElfGrid();
        this.createCloseButton();

        console.log('PokedexScene modal created');
    }

    createPanelFrame() {
        const frame = this.add.graphics();
        frame.fillStyle(0x13263a, 0.98);
        frame.fillRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.lineStyle(2, 0x6288ac, 1);
        frame.strokeRoundedRect(0, 0, this.modalW, this.modalH, 16);
        frame.fillStyle(0xffffff, 0.05);
        frame.fillRoundedRect(8, 8, this.modalW - 16, 18, 8);
        this.root.add(frame);
    }

    createHeader() {
        const headerH = 74;
        const header = this.add.graphics();
        header.fillStyle(0x1c3a54, 0.95);
        header.fillRoundedRect(0, 0, this.modalW, headerH, 16);
        header.fillRect(0, 24, this.modalW, headerH - 24);
        header.lineStyle(1, 0x6d95b8, 0.9);
        header.lineBetween(0, headerH, this.modalW, headerH);
        this.root.add(header);

        const title = this.add.text(20, 18, '精灵图鉴', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.root.add(title);

        const allElves = DataLoader.getAllElves();
        const seenCount = PlayerData.seenElves.length;
        const caughtCount = PlayerData.caughtElves.length;
        const statText = this.add.text(this.modalW - 20, 22, `发现 ${seenCount}/${allElves.length}  捕捉 ${caughtCount}/${allElves.length}`, {
            fontSize: '14px',
            color: '#c7dff5',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        this.root.add(statText);
    }

    createElfGrid() {
        const allElves = DataLoader.getAllElves();
        const contentX = 18;
        const contentY = 90;
        const contentW = this.modalW - 36;
        const cardW = 130;
        const cardH = 130;
        const cols = 6;
        const spacingX = Math.floor((contentW - cols * cardW) / (cols - 1));
        const spacingY = 10;

        allElves.forEach((elfData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = contentX + col * (cardW + spacingX);
            const y = contentY + row * (cardH + spacingY);
            const card = this.createElfCard(x, y, cardW, cardH, elfData);
            this.root.add(card);
        });
    }

    createElfCard(x, y, w, h, elfData) {
        const container = this.add.container(0, 0);

        const hasCaught = PlayerData.hasCaught(elfData.id);
        const hasSeen = PlayerData.hasSeen(elfData.id);

        const bg = this.add.graphics();
        if (hasCaught) {
            bg.fillStyle(0x2c4c6e, 0.95);
            bg.lineStyle(2, 0x7db2df, 1);
        } else if (hasSeen) {
            bg.fillStyle(0x2f3640, 0.9);
            bg.lineStyle(2, 0x717d8b, 1);
        } else {
            bg.fillStyle(0x242a31, 0.85);
            bg.lineStyle(1, 0x49515d, 1);
        }
        bg.fillRoundedRect(x, y, w, h, 10);
        bg.strokeRoundedRect(x, y, w, h, 10);
        container.add(bg);

        const noText = this.add.text(x + 8, y + 6, `No.${elfData.id.toString().padStart(3, '0')}`, {
            fontSize: '11px',
            color: hasCaught || hasSeen ? '#cde5ff' : '#6f7d8d'
        });
        container.add(noText);

        const iconContainer = this.add.container(x + w / 2, y + 52);
        container.add(iconContainer);

        if (hasCaught) {
            const portrait = ElfPortraitView.addStillPortrait(this, iconContainer, 0, 0, elfData.id, {
                maxSize: 54,
                warnTag: 'PokedexScene'
            });
            if (!portrait) {
                const fallback = this.add.circle(0, 0, 24, DataLoader.getTypeColor(elfData.type), 1);
                iconContainer.add(fallback);
            }
        } else if (hasSeen) {
            const portrait = ElfPortraitView.addStillPortrait(this, iconContainer, 0, 0, elfData.id, {
                maxSize: 54,
                tint: 0x303030,
                warnTag: 'PokedexScene'
            });
            if (!portrait) {
                const fallback = this.add.circle(0, 0, 24, 0x3a3a3a, 1);
                iconContainer.add(fallback);
                const q = this.add.text(0, 0, '?', {
                    fontSize: '22px',
                    color: '#565656',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                iconContainer.add(q);
            }
        } else {
            const unknown = this.add.circle(0, 0, 24, 0x2c2c2c, 1);
            const q = this.add.text(0, 0, '?', {
                fontSize: '24px',
                color: '#4d4d4d',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            iconContainer.add(unknown);
            iconContainer.add(q);
        }

        const displayName = hasSeen ? elfData.name : '？？？';
        const name = this.add.text(x + w / 2, y + 86, displayName, {
            fontSize: '14px',
            color: hasCaught ? '#ffffff' : (hasSeen ? '#b1bdc9' : '#707b87'),
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        container.add(name);

        if (hasCaught) {
            TypeIconView.render(this, container, x + w / 2, y + 110, elfData.type, {
                iconSize: 18,
                originX: 0.5,
                originY: 0.5,
                fallbackRadius: 7
            });

            const caughtMark = this.add.text(x + w - 8, y + 6, '✓', {
                fontSize: '14px',
                color: '#92ff9f',
                fontStyle: 'bold'
            }).setOrigin(1, 0);
            container.add(caughtMark);
        } else if (hasSeen) {
            const seenMark = this.add.text(x + w - 8, y + 6, '👁', {
                fontSize: '11px',
                color: '#a3adb8'
            }).setOrigin(1, 0);
            container.add(seenMark);
        }

        return container;
    }

    createCloseButton() {
        const closeBg = this.add.circle(this.modalX + this.modalW - 24, this.modalY + 24, 14, 0x7b3f3f)
            .setDepth(this.baseDepth + 3)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(this.modalX + this.modalW - 24, this.modalY + 24, 'X', {
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(this.baseDepth + 4);

        closeBg.on('pointerover', () => closeBg.setFillStyle(0xa54f4f));
        closeBg.on('pointerout', () => closeBg.setFillStyle(0x7b3f3f));
        closeBg.on('pointerdown', () => this.closeModal());
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

window.PokedexScene = PokedexScene;
