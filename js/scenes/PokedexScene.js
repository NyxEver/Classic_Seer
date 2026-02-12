/**
 * PokedexScene - 图鉴场景（资料室）
 * 显示所有精灵的发现/捕捉状态
 */

class PokedexScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PokedexScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建顶部栏
        this.createTopBar(width);

        // 创建精灵列表
        this.createElfList(width, height);

        console.log('PokedexScene created');
    }

    createBackground(width, height) {
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a2a3a, 0x1a2a3a, 0x0a1a2a, 0x0a1a2a, 1);
        graphics.fillRect(0, 0, width, height);
    }

    createTopBar(width) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x1a2a3a, 0.95);
        graphics.fillRect(0, 0, width, 60);
        graphics.lineStyle(2, 0x4a6a8a, 1);
        graphics.lineBetween(0, 60, width, 60);

        // 标题
        this.add.text(width / 2, 30, '📚 精灵图鉴', {
            fontSize: '24px',
            color: '#88ccff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 统计信息
        const allElves = DataLoader.getAllElves();
        const seenCount = PlayerData.seenElves.length;
        const caughtCount = PlayerData.caughtElves.length;
        const totalCount = allElves.length;

        this.add.text(width - 20, 30, `发现: ${seenCount}/${totalCount}  捕捉: ${caughtCount}/${totalCount}`, {
            fontSize: '14px',
            color: '#aabbcc'
        }).setOrigin(1, 0.5);

        // 返回按钮
        const backBtn = this.createButton(80, 30, '← 返回', () => {
            SceneManager.changeScene(this, 'SpaceshipScene');
        });
    }

    createElfList(width, height) {
        const allElves = DataLoader.getAllElves();
        const startY = 100;
        const cardW = 180;
        const cardH = 200;
        const cols = 4;
        const spacing = 30;
        const startX = (width - cols * cardW - (cols - 1) * spacing) / 2 + cardW / 2;

        allElves.forEach((elfData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardW + spacing);
            const y = startY + row * (cardH + spacing) + cardH / 2;

            this.createElfCard(x, y, cardW, cardH, elfData);
        });
    }

    createElfCard(x, y, w, h, elfData) {
        const container = this.add.container(x, y);

        const hasCaught = PlayerData.hasCaught(elfData.id);
        const hasSeen = PlayerData.hasSeen(elfData.id);

        // 卡片背景
        const bg = this.add.graphics();
        if (hasCaught) {
            bg.fillGradientStyle(0x3a5a7a, 0x3a5a7a, 0x2a4a6a, 0x2a4a6a, 1);
            bg.lineStyle(2, 0x6a9aca, 1);
        } else if (hasSeen) {
            bg.fillGradientStyle(0x3a3a4a, 0x3a3a4a, 0x2a2a3a, 0x2a2a3a, 1);
            bg.lineStyle(2, 0x5a5a6a, 1);
        } else {
            bg.fillStyle(0x2a2a2a, 0.8);
            bg.lineStyle(2, 0x4a4a4a, 1);
        }
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        container.add(bg);

        // 精灵编号
        this.add.text(-w / 2 + 10, -h / 2 + 10, `No.${elfData.id.toString().padStart(3, '0')}`, {
            fontSize: '12px',
            color: hasCaught ? '#88ccff' : '#666666'
        }).setOrigin(0, 0);
        container.add(this.children.list[this.children.list.length - 1]);

        // 精灵图标
        const iconContainer = this.add.container(0, -20);
        container.add(iconContainer);

        if (hasCaught) {
            const portrait = ElfPortraitView.addStillPortrait(this, iconContainer, 0, 0, elfData.id, {
                maxSize: 70,
                warnTag: 'PokedexScene'
            });

            if (!portrait) {
                // 后备：已捕捉显示彩色圆
                const icon = this.add.graphics();
                icon.fillStyle(this.getTypeColor(elfData.type), 1);
                icon.fillCircle(0, 0, 35);
                icon.fillStyle(0xffffff, 0.3);
                icon.fillCircle(-10, -10, 12);
                iconContainer.add(icon);
            }
        } else if (hasSeen) {
            const portrait = ElfPortraitView.addStillPortrait(this, iconContainer, 0, 0, elfData.id, {
                maxSize: 70,
                tint: 0x333333,
                warnTag: 'PokedexScene'
            });

            if (!portrait) {
                // 后备：已见未捕捉显示灰色剪影
                const icon = this.add.graphics();
                icon.fillStyle(0x333333, 1);
                icon.fillCircle(0, 0, 35);
                iconContainer.add(icon);

                const question = this.add.text(0, 0, '?', {
                    fontSize: '32px',
                    color: '#555555',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                iconContainer.add(question);
            }
        } else {
            // 未见：显示问号
            const icon = this.add.graphics();
            icon.fillStyle(0x222222, 1);
            icon.fillCircle(0, 0, 35);
            iconContainer.add(icon);

            const question = this.add.text(0, 0, '?', {
                fontSize: '40px',
                color: '#444444',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            iconContainer.add(question);
        }

        // 精灵名称
        let displayName;
        if (hasCaught) {
            displayName = elfData.name;
        } else if (hasSeen) {
            displayName = elfData.name;
        } else {
            displayName = '？？？';
        }

        const nameText = this.add.text(0, 40, displayName, {
            fontSize: '18px',
            color: hasCaught ? '#ffffff' : (hasSeen ? '#888888' : '#555555'),
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(nameText);

        // 属性标签
        if (hasCaught) {
            this.addTypeVisual(container, 0, 65, elfData.type);

            // 状态标记
            const statusIcon = this.add.text(w / 2 - 10, -h / 2 + 10, '✓', {
                fontSize: '16px',
                color: '#88ff88'
            }).setOrigin(1, 0);
            container.add(statusIcon);
        } else if (hasSeen) {
            const statusIcon = this.add.text(w / 2 - 10, -h / 2 + 10, '👁', {
                fontSize: '14px',
                color: '#888888'
            }).setOrigin(1, 0);
            container.add(statusIcon);
        }

        return container;
    }

    getTypeColor(type) {
        return DataLoader.getTypeColor(type);
    }

    getTypeTextColor(type) {
        const color = this.getTypeColor(type);
        return `#${color.toString(16).padStart(6, '0')}`;
    }

    getTypeDisplayName(type) {
        return `${DataLoader.getTypeName(type)}属性`;
    }

    /**
     * 属性显示：优先使用图标，缺失时回退为无文字色块图标
     */
    addTypeVisual(container, x, y, type) {
        TypeIconView.render(this, container, x, y, type, {
            iconSize: 22,
            originX: 0.5,
            originY: 0.5,
            fallbackRadius: 10
        });
    }

    createButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        const btnW = 80;
        const btnH = 32;

        const bg = this.add.graphics();
        bg.fillStyle(0x3a5a7a, 1);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        bg.lineStyle(1, 0x6a9aca, 1);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(label);

        const hitArea = new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x5a7a9a, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
            bg.lineStyle(1, 0x8abada, 1);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
            container.setScale(1.05);
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3a5a7a, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
            bg.lineStyle(1, 0x6a9aca, 1);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
            container.setScale(1);
        });

        container.on('pointerdown', () => callback());

        return container;
    }
}
