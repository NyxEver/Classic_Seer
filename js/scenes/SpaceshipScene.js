/**
 * SpaceshipScene - 飞船场景
 * 玩家大本营，连接各房间的 HUB
 */

class SpaceshipScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SpaceshipScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建房间入口
        this.createRoomButtons(width, height);

        // 创建顶部信息栏
        this.createTopBar(width);

        // 更新存档位置
        PlayerData.currentMapId = 'spaceship';
        PlayerData.saveToStorage();

        console.log('SpaceshipScene created');
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        const graphics = this.add.graphics();

        // 飞船内部背景 - 金属蓝灰色调
        graphics.fillGradientStyle(0x2a3a4a, 0x2a3a4a, 0x1a2a3a, 0x1a2a3a, 1);
        graphics.fillRect(0, 0, width, height);

        // 装饰线条 - 科技感
        graphics.lineStyle(2, 0x4a6a8a, 0.5);
        for (let i = 0; i < 5; i++) {
            const y = 100 + i * 100;
            graphics.lineBetween(0, y, width, y);
        }

        // 舷窗装饰
        this.createPorthole(100, 150);
        this.createPorthole(width - 100, 150);
    }

    createPorthole(x, y) {
        const graphics = this.add.graphics();

        // 外框
        graphics.lineStyle(4, 0x6a8aaa, 1);
        graphics.strokeCircle(x, y, 40);

        // 内部 - 太空景色
        graphics.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x000000, 0x000000, 1);
        graphics.fillCircle(x, y, 35);

        // 星星
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(x - 10, y - 5, 1);
        graphics.fillCircle(x + 15, y + 10, 1.5);
        graphics.fillCircle(x - 5, y + 15, 1);
    }

    // ========== 顶部信息栏 ==========
    createTopBar(width) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x1a2a3a, 0.9);
        graphics.fillRect(0, 0, width, 50);
        graphics.lineStyle(2, 0x4a6a8a, 1);
        graphics.lineBetween(0, 50, width, 50);

        // 标题
        this.add.text(width / 2, 25, '赛尔号飞船', {
            fontSize: '24px',
            color: '#88ccff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 赛尔豆显示
        this.add.text(width - 20, 25, `赛尔豆: ${PlayerData.seerBeans}`, {
            fontSize: '16px',
            color: '#ffdd88'
        }).setOrigin(1, 0.5);
    }

    // ========== 房间入口 ==========
    createRoomButtons(width, height) {
        // 房间配置：名称、是否可用、目标场景
        const rooms = [
            { name: '船长室', enabled: true, scene: 'CaptainRoomScene', icon: '🎖️' },
            { name: '机械室', enabled: false, scene: null, icon: '⚙️' },
            { name: '实验室', enabled: false, scene: null, icon: '🔬' },
            { name: '传送舱', enabled: true, scene: 'TeleportScene', icon: '🚀' },
            { name: '能源中心', enabled: false, scene: null, icon: '⚡' },
            { name: '资料室', enabled: false, scene: null, icon: '📚' }
        ];

        // 布局：2行3列
        const cols = 3;
        const rows = 2;
        const buttonWidth = 180;
        const buttonHeight = 120;
        const startX = (width - cols * buttonWidth - (cols - 1) * 40) / 2 + buttonWidth / 2;
        const startY = 200;
        const spacingX = buttonWidth + 40;
        const spacingY = buttonHeight + 30;

        rooms.forEach((room, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            this.createRoomButton(x, y, buttonWidth, buttonHeight, room);
        });
    }

    createRoomButton(x, y, w, h, room) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.graphics();

        if (room.enabled) {
            // 可用状态
            bg.fillGradientStyle(0x3a5a7a, 0x3a5a7a, 0x2a4a6a, 0x2a4a6a, 1);
            bg.lineStyle(2, 0x6a9aca, 1);
        } else {
            // 禁用状态
            bg.fillStyle(0x3a3a3a, 0.8);
            bg.lineStyle(2, 0x5a5a5a, 1);
        }

        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

        // 图标
        const icon = this.add.text(0, -20, room.icon, {
            fontSize: '36px'
        }).setOrigin(0.5);

        if (!room.enabled) {
            icon.setAlpha(0.5);
        }

        // 名称
        const label = this.add.text(0, 25, room.name, {
            fontSize: '18px',
            color: room.enabled ? '#ffffff' : '#888888',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 禁用标签
        let disabledLabel = null;
        if (!room.enabled) {
            disabledLabel = this.add.text(0, 48, '(开发中)', {
                fontSize: '12px',
                color: '#666666'
            }).setOrigin(0.5);
        }

        container.add([bg, icon, label]);
        if (disabledLabel) container.add(disabledLabel);

        // 交互
        const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        if (room.enabled) {
            container.on('pointerover', () => {
                bg.clear();
                bg.fillGradientStyle(0x5a7a9a, 0x5a7a9a, 0x4a6a8a, 0x4a6a8a, 1);
                bg.lineStyle(2, 0x8abada, 1);
                bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
                bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
                container.setScale(1.05);
            });

            container.on('pointerout', () => {
                bg.clear();
                bg.fillGradientStyle(0x3a5a7a, 0x3a5a7a, 0x2a4a6a, 0x2a4a6a, 1);
                bg.lineStyle(2, 0x6a9aca, 1);
                bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
                bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
                container.setScale(1);
            });

            container.on('pointerdown', () => {
                container.setScale(0.95);
            });

            container.on('pointerup', () => {
                container.setScale(1.05);
                SceneManager.changeScene(this, room.scene);
            });
        } else {
            container.on('pointerup', () => {
                this.showDevMessage();
            });
        }

        return container;
    }

    showDevMessage() {
        // 显示"开发中"提示
        const { width, height } = this.cameras.main;

        const msgBg = this.add.graphics();
        msgBg.fillStyle(0x000000, 0.8);
        msgBg.fillRoundedRect(width / 2 - 100, height / 2 - 30, 200, 60, 10);

        const msgText = this.add.text(width / 2, height / 2, '该功能开发中...', {
            fontSize: '18px',
            color: '#ffaa00'
        }).setOrigin(0.5);

        // 1.5秒后消失
        this.time.delayedCall(1500, () => {
            msgBg.destroy();
            msgText.destroy();
        });
    }
}
