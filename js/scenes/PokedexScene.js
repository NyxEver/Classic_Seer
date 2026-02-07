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
            // 已捕捉：显示彩色图标
            const icon = this.add.graphics();
            icon.fillStyle(this.getTypeColor(elfData.type), 1);
            icon.fillCircle(0, 0, 35);
            icon.fillStyle(0xffffff, 0.3);
            icon.fillCircle(-10, -10, 12);
            iconContainer.add(icon);
        } else if (hasSeen) {
            // 已见未捕捉：显示灰色剪影
            const icon = this.add.graphics();
            icon.fillStyle(0x333333, 1);
            icon.fillCircle(0, 0, 35);
            iconContainer.add(icon);

            // 问号标记
            const question = this.add.text(0, 0, '?', {
                fontSize: '32px',
                color: '#555555',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            iconContainer.add(question);
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
            const typeLabel = this.add.text(0, 65, this.getTypeDisplayName(elfData.type), {
                fontSize: '14px',
                color: this.getTypeTextColor(elfData.type)
            }).setOrigin(0.5);
            container.add(typeLabel);

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
        const colors = {
            'water': 0x4a9aff,
            'fire': 0xff6a4a,
            'grass': 0x6abb6a,
            'electric': 0xffcc4a,
            'normal': 0xaaaaaa,
            'flying': 0x9ac0ff,
            'ground': 0xbb9a6a,
            'ice': 0x7addff,
            'mechanical': 0x8a8a9a
        };
        return colors[type] || 0x888888;
    }

    getTypeTextColor(type) {
        const colors = {
            'water': '#88ccff',
            'fire': '#ffaa88',
            'grass': '#88dd88',
            'electric': '#ffee88',
            'normal': '#cccccc',
            'flying': '#aaccff',
            'ground': '#ddbb88',
            'ice': '#aaeeff',
            'mechanical': '#aaaacc'
        };
        return colors[type] || '#aaaaaa';
    }

    getTypeDisplayName(type) {
        const names = {
            'water': '水属性',
            'fire': '火属性',
            'grass': '草属性',
            'electric': '电属性',
            'normal': '普通属性',
            'flying': '飞行属性',
            'ground': '地面属性',
            'ice': '冰属性',
            'mechanical': '机械属性'
        };
        return names[type] || type;
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
