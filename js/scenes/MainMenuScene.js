/**
 * MainMenuScene - 主菜单场景
 * 游戏标题、新游戏/继续游戏按钮
 */

class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景渐变
        this.createBackground(width, height);

        // 游戏标题
        this.createTitle(width, height);

        // 菜单按钮
        this.createMenuButtons(width, height);

        // 版本号
        this.add.text(width - 10, height - 10, 'v0.5.0', {
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(1, 1);

        console.log('MainMenuScene created');
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        // 深空背景
        const graphics = this.add.graphics();

        // 渐变背景 - 从深蓝到黑
        graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0a0a15, 0x0a0a15, 1);
        graphics.fillRect(0, 0, width, height);

        // 添加星星效果
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }

        // 添加闪烁星星动画
        this.createTwinklingStars(width, height);
    }

    createTwinklingStars(width, height) {
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);

            const star = this.add.circle(x, y, 1.5, 0xffffff, 0.8);

            // 闪烁动画
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }

    // ========== 标题 ==========
    createTitle(width, height) {
        // 主标题
        const title = this.add.text(width / 2, height * 0.25, 'Project Seer', {
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4a90d9',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 10,
                fill: true
            }
        }).setOrigin(0.5);

        // 副标题
        this.add.text(width / 2, height * 0.35, '赛尔号复刻版', {
            fontSize: '24px',
            color: '#88aadd'
        }).setOrigin(0.5);

        // 标题呼吸动画
        this.tweens.add({
            targets: title,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ========== 菜单按钮 ==========
    createMenuButtons(width, height) {
        const buttonY = height * 0.55;
        const buttonSpacing = 70;

        // 检查是否有存档
        const hasSave = SaveSystem.hasSave();

        // 新游戏按钮
        this.createMenuButton(width / 2, buttonY, '新 游 戏', true, () => {
            this.startNewGame();
        });

        // 继续游戏按钮
        this.createMenuButton(width / 2, buttonY + buttonSpacing, '继续游戏', hasSave, () => {
            this.continueGame();
        });
    }

    createMenuButton(x, y, text, enabled, callback) {
        const buttonWidth = 200;
        const buttonHeight = 50;

        // 按钮容器
        const container = this.add.container(x, y);

        // 按钮背景
        const bg = this.add.graphics();

        if (enabled) {
            // 可用状态 - 渐变蓝色
            bg.fillGradientStyle(0x3a5a8f, 0x3a5a8f, 0x2a4a7f, 0x2a4a7f, 1);
            bg.lineStyle(2, 0x6aa0e0, 1);
        } else {
            // 禁用状态 - 灰色
            bg.fillStyle(0x444444, 0.8);
            bg.lineStyle(2, 0x666666, 1);
        }

        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);

        // 按钮文字
        const label = this.add.text(0, 0, text, {
            fontSize: '22px',
            color: enabled ? '#ffffff' : '#888888',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, label]);

        if (enabled) {
            // 设置交互
            const hitArea = new Phaser.Geom.Rectangle(
                -buttonWidth / 2, -buttonHeight / 2,
                buttonWidth, buttonHeight
            );
            container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

            // 悬停效果
            container.on('pointerover', () => {
                bg.clear();
                bg.fillGradientStyle(0x5a7aaf, 0x5a7aaf, 0x4a6a9f, 0x4a6a9f, 1);
                bg.lineStyle(2, 0x8ac0ff, 1);
                bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
                bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
                container.setScale(1.05);
            });

            container.on('pointerout', () => {
                bg.clear();
                bg.fillGradientStyle(0x3a5a8f, 0x3a5a8f, 0x2a4a7f, 0x2a4a7f, 1);
                bg.lineStyle(2, 0x6aa0e0, 1);
                bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
                bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
                container.setScale(1);
            });

            container.on('pointerdown', () => {
                container.setScale(0.95);
            });

            container.on('pointerup', () => {
                container.setScale(1.05);
                callback();
            });
        }

        return container;
    }

    // ========== 游戏流程 ==========
    startNewGame() {
        console.log('Starting new game...');

        // 创建新存档
        PlayerData.createNew();
        PlayerData.currentMapId = 'spaceship';
        PlayerData.saveToStorage();

        // 切换到飞船场景
        SceneManager.changeScene(this, 'SpaceshipScene');
    }

    continueGame() {
        console.log('Continuing game...');

        // 加载存档
        if (PlayerData.loadFromSave()) {
            // 根据存档的位置进入相应场景
            const targetScene = PlayerData.currentMapId || 'spaceship';

            // 映射 mapId 到场景 key
            const sceneMap = {
                'spaceship': 'SpaceshipScene',
                'captain': 'CaptainRoomScene',
                'teleport': 'TeleportScene',
                'klose': 'KloseScene'
            };

            const sceneKey = sceneMap[targetScene] || 'SpaceshipScene';
            SceneManager.changeScene(this, sceneKey);
        } else {
            console.error('Failed to load save data');
        }
    }
}
