/**
 * CaptainRoomScene - 船长室场景
 * 任务系统中心，与船长对话接取任务
 */

class CaptainRoomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CaptainRoomScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建船长 NPC
        this.createCaptain(width, height);

        // 创建任务面板
        this.createQuestPanel(width, height);

        // 创建返回按钮
        this.createBackButton();

        // 更新存档位置
        PlayerData.currentMapId = 'captain';
        PlayerData.saveToStorage();

        console.log('CaptainRoomScene created');
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        const graphics = this.add.graphics();

        // 船长室背景 - 暖色调
        graphics.fillGradientStyle(0x3a3020, 0x3a3020, 0x2a2010, 0x2a2010, 1);
        graphics.fillRect(0, 0, width, height);

        // 装饰 - 墙面纹理
        graphics.lineStyle(1, 0x5a5040, 0.3);
        for (let i = 0; i < 20; i++) {
            const y = i * 30;
            graphics.lineBetween(0, y, width, y);
        }

        // 地板
        graphics.fillStyle(0x4a4030, 1);
        graphics.fillRect(0, height - 80, width, 80);
        graphics.lineStyle(2, 0x6a6050, 1);
        graphics.lineBetween(0, height - 80, width, height - 80);
    }

    // ========== 船长 NPC ==========
    createCaptain(width, height) {
        const captainX = 200;
        const captainY = height - 200;

        // 船长形象（简化版）
        const captainContainer = this.add.container(captainX, captainY);

        // 身体
        const body = this.add.graphics();
        body.fillStyle(0x2a4a8a, 1);
        body.fillRoundedRect(-40, -30, 80, 100, 10);

        // 头部
        body.fillStyle(0xffcc99, 1);
        body.fillCircle(0, -50, 30);

        // 帽子
        body.fillStyle(0x1a3a7a, 1);
        body.fillRect(-35, -85, 70, 15);
        body.fillRect(-25, -95, 50, 15);

        // 徽章（使用圆形替代）
        body.fillStyle(0xffdd00, 1);
        body.fillCircle(0, 10, 10);

        captainContainer.add(body);

        // 名称
        this.add.text(captainX, captainY + 80, '船长 罗杰', {
            fontSize: '16px',
            color: '#ffdd88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 对话气泡
        this.createDialogBubble(captainX + 120, captainY - 80);

        // 点击船长交互
        const hitArea = new Phaser.Geom.Rectangle(-50, -100, 100, 180);
        captainContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        captainContainer.on('pointerover', () => {
            captainContainer.setScale(1.05);
        });

        captainContainer.on('pointerout', () => {
            captainContainer.setScale(1);
        });

        captainContainer.on('pointerup', () => {
            this.showCaptainDialog();
        });
    }

    createDialogBubble(x, y) {
        const graphics = this.add.graphics();

        // 气泡背景
        graphics.fillStyle(0xffffff, 0.95);
        graphics.fillRoundedRect(x - 10, y - 25, 180, 50, 10);

        // 气泡尖角
        graphics.fillTriangle(x, y + 25, x + 20, y + 25, x + 10, y + 40);

        // 文字
        this.add.text(x + 80, y, '欢迎回来，赛尔！', {
            fontSize: '14px',
            color: '#333333'
        }).setOrigin(0.5);
    }

    showCaptainDialog() {
        const { width, height } = this.cameras.main;

        // 对话框背景
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x000000, 0.8);
        dialogBg.fillRect(0, height - 150, width, 150);

        // 对话内容
        const dialogText = this.add.text(width / 2, height - 75,
            '船长：年轻的赛尔，去克洛斯星探索吧！\n那里有许多可爱的皮皮精灵等着你捕捉。', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // 关闭按钮
        const closeBtn = this.add.text(width - 30, height - 140, '×', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        closeBtn.setInteractive();
        closeBtn.on('pointerup', () => {
            dialogBg.destroy();
            dialogText.destroy();
            closeBtn.destroy();
        });
    }

    // ========== 任务面板 ==========
    createQuestPanel(width, height) {
        const panelX = width - 250;
        const panelY = 100;
        const panelW = 220;
        const panelH = 350;

        // 面板背景
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
        graphics.lineStyle(2, 0x886644, 1);
        graphics.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

        // 标题
        this.add.text(panelX + panelW / 2, panelY + 25, '任务列表', {
            fontSize: '20px',
            color: '#ffdd88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 分隔线
        graphics.lineStyle(1, 0x886644, 0.5);
        graphics.lineBetween(panelX + 20, panelY + 50, panelX + panelW - 20, panelY + 50);

        // 任务列表（MVP 阶段静态数据）
        const quests = [
            { name: '初次探索', desc: '前往克洛斯星', status: 'active', icon: '📍' },
            { name: '捕捉皮皮', desc: '捕获一只皮皮', status: 'locked', icon: '🎯' },
            { name: '变强之路', desc: '将精灵升到 Lv.10', status: 'locked', icon: '⬆️' }
        ];

        quests.forEach((quest, index) => {
            const qy = panelY + 80 + index * 80;
            this.createQuestItem(panelX + 15, qy, panelW - 30, quest);
        });
    }

    createQuestItem(x, y, w, quest) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.graphics();
        const isActive = quest.status === 'active';

        bg.fillStyle(isActive ? 0x3a5a3a : 0x3a3a3a, 0.8);
        bg.fillRoundedRect(0, 0, w, 70, 8);

        if (isActive) {
            bg.lineStyle(1, 0x88aa88, 1);
            bg.strokeRoundedRect(0, 0, w, 70, 8);
        }

        // 图标
        const icon = this.add.text(15, 35, quest.icon, {
            fontSize: '24px'
        }).setOrigin(0, 0.5);

        // 任务名称
        const name = this.add.text(50, 20, quest.name, {
            fontSize: '16px',
            color: isActive ? '#88ff88' : '#888888',
            fontStyle: 'bold'
        });

        // 任务描述
        const desc = this.add.text(50, 45, quest.desc, {
            fontSize: '12px',
            color: isActive ? '#aaaaaa' : '#666666'
        });

        // 状态标签
        if (!isActive) {
            const lock = this.add.text(w - 10, 35, '🔒', {
                fontSize: '16px'
            }).setOrigin(1, 0.5);
            container.add(lock);
        }

        container.add([bg, icon, name, desc]);
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btn = this.add.container(80, 550);

        const bg = this.add.graphics();
        bg.fillStyle(0x5a5040, 1);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        bg.lineStyle(2, 0x8a7060, 1);
        bg.strokeRoundedRect(-60, -20, 120, 40, 8);

        const label = this.add.text(0, 0, '← 返回飞船', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, label]);

        const hitArea = new Phaser.Geom.Rectangle(-60, -20, 120, 40);
        btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x7a7060, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0xaa9080, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x5a5040, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0x8a7060, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerup', () => {
            SceneManager.changeScene(this, 'SpaceshipScene');
        });
    }
}
