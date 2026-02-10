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
        this.add.text(width - 10, height - 10, 'v0.8.0', {
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
        this.showWelcomeDialog();
    }

    // ========== 新游戏对话框流程 ==========
    showWelcomeDialog() {
        const { width, height } = this.cameras.main;

        // 创建遮罩层
        this.dialogOverlay = this.add.graphics();
        this.dialogOverlay.fillStyle(0x000000, 0.7);
        this.dialogOverlay.fillRect(0, 0, width, height);
        this.dialogOverlay.setDepth(100);

        // 对话框容器
        this.dialogContainer = this.add.container(width / 2, height / 2).setDepth(101);

        // 对话框背景
        const dialogBg = this.add.graphics();
        dialogBg.fillGradientStyle(0x2a3a5a, 0x2a3a5a, 0x1a2a4a, 0x1a2a4a, 1);
        dialogBg.fillRoundedRect(-250, -180, 500, 360, 16);
        dialogBg.lineStyle(3, 0x6a9aca, 1);
        dialogBg.strokeRoundedRect(-250, -180, 500, 360, 16);
        this.dialogContainer.add(dialogBg);

        // 欢迎标题
        const titleText = this.add.text(0, -140, '欢迎来到赛尔号！', {
            fontSize: '28px',
            color: '#88ccff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.dialogContainer.add(titleText);

        // 欢迎消息
        const welcomeMsg = this.add.text(0, -80,
            '在这片浩瀚的宇宙中，你将成为一名赛尔战士，\n与精灵伙伴一起探索未知的星球！\n\n请输入你的名字：', {
            fontSize: '16px',
            color: '#ccddee',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);
        this.dialogContainer.add(welcomeMsg);

        // 名字输入框背景
        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x1a2a3a, 1);
        inputBg.fillRoundedRect(-120, -10, 240, 40, 8);
        inputBg.lineStyle(2, 0x4a6a8a, 1);
        inputBg.strokeRoundedRect(-120, -10, 240, 40, 8);
        this.dialogContainer.add(inputBg);

        // 玩家名字文本显示
        this.playerName = '赛尔';
        this.nameText = this.add.text(0, 10, this.playerName, {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.dialogContainer.add(this.nameText);

        // 预设名字按钮
        const presetNames = ['赛尔', '小明', '星际战士', '探险家'];
        const btnStartX = -180;
        const btnSpacing = 90;

        presetNames.forEach((name, i) => {
            const btn = this.createSmallButton(btnStartX + i * btnSpacing, 60, name, () => {
                this.playerName = name;
                this.nameText.setText(name);
            });
            this.dialogContainer.add(btn);
        });

        // 下一步按钮
        const nextBtn = this.createDialogButton(0, 130, '下一步', () => {
            this.showStarterElfDialog();
        });
        this.dialogContainer.add(nextBtn);
    }

    showStarterElfDialog() {
        // 清除当前对话框内容
        this.dialogContainer.removeAll(true);

        // 重建对话框背景（更宽以容纳3个精灵）
        const dialogBg = this.add.graphics();
        dialogBg.fillGradientStyle(0x2a3a5a, 0x2a3a5a, 0x1a2a4a, 0x1a2a4a, 1);
        dialogBg.fillRoundedRect(-350, -230, 700, 460, 16);
        dialogBg.lineStyle(3, 0x6a9aca, 1);
        dialogBg.strokeRoundedRect(-350, -230, 700, 460, 16);
        this.dialogContainer.add(dialogBg);

        // 标题
        const titleText = this.add.text(0, -195, '选择你的初始精灵', {
            fontSize: '26px',
            color: '#88ccff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.dialogContainer.add(titleText);

        // 3个初始精灵: 布布种子(1-草), 伊优(4-水), 小火猴(7-火)
        const starters = [
            { id: 1, name: '布布种子', type: 'grass', color: 0x44aa44, desc: '草属性初始精灵，坚韧顽强，防御出众' },
            { id: 4, name: '伊优', type: 'water', color: 0x4a9aff, desc: '水属性初始精灵，活泼可爱，忠诚可靠' },
            { id: 7, name: '小火猴', type: 'fire', color: 0xff6644, desc: '火属性初始精灵，热情似火，速度飞快' }
        ];

        this.selectedStarterId = 4; // 默认选中伊优
        this.starterCards = [];

        const cardWidth = 180;
        const cardHeight = 240;
        const cardSpacing = 30;
        const startX = -((cardWidth * 3 + cardSpacing * 2) / 2) + cardWidth / 2;

        starters.forEach((starter, i) => {
            const cardX = startX + i * (cardWidth + cardSpacing);
            const cardY = -20;

            const card = this.createStarterCard(cardX, cardY, cardWidth, cardHeight, starter, i);
            this.dialogContainer.add(card);
            this.starterCards.push({ container: card, starter: starter, outline: card._outline });
        });

        // 更新初始选中状态
        this.updateStarterSelection();

        // 确认按钮
        const confirmBtn = this.createDialogButton(0, 185, '确认出发！', () => {
            this.confirmNewGame();
        });
        this.dialogContainer.add(confirmBtn);
    }

    createStarterCard(x, y, width, height, starter, index) {
        const container = this.add.container(x, y);

        // 卡片背景
        const cardBg = this.add.graphics();
        cardBg.fillGradientStyle(0x3a5a8a, 0x3a5a8a, 0x2a4a7a, 0x2a4a7a, 1);
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        container.add(cardBg);

        // 选中边框（稍后通过 updateStarterSelection 控制）
        const outline = this.add.graphics();
        container.add(outline);
        container._outline = outline;
        container._width = width;
        container._height = height;

        // 精灵图标 - 尝试使用真实贴图
        const imageKey = AssetMappings.getElfImageKey(starter.id);
        if (imageKey && this.textures.exists(imageKey)) {
            const sprite = this.add.image(0, -55, imageKey);
            const maxSize = 80;
            const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
            sprite.setScale(scale);
            container.add(sprite);
        } else {
            // 后备：彩色圆圈
            const elfIcon = this.add.graphics();
            elfIcon.fillStyle(starter.color, 1);
            elfIcon.fillCircle(0, -55, 40);
            elfIcon.fillStyle(this.lightenColor(starter.color), 1);
            elfIcon.fillCircle(-10, -65, 12);
            elfIcon.fillCircle(10, -65, 12);
            container.add(elfIcon);
        }

        // 精灵名称
        const nameText = this.add.text(0, 5, starter.name, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(nameText);

        // 属性标签（使用属性图标）
        const typeIconKey = AssetMappings.getTypeIconKey(starter.type);
        if (typeIconKey && this.textures.exists(typeIconKey)) {
            const typeIcon = this.add.image(0, 32, typeIconKey).setOrigin(0.5);
            const scale = Math.min(24 / typeIcon.width, 24 / typeIcon.height);
            typeIcon.setScale(scale);
            container.add(typeIcon);
        } else {
            const fallbackIcon = this.add.circle(0, 32, 10, DataLoader.getTypeColor(starter.type), 1);
            fallbackIcon.setStrokeStyle(1, 0xffffff, 0.8);
            container.add(fallbackIcon);
        }

        // 简介
        const desc = this.add.text(0, 65, starter.desc, {
            fontSize: '12px',
            color: '#aaccdd',
            wordWrap: { width: width - 20 },
            align: 'center'
        }).setOrigin(0.5);
        container.add(desc);

        // 交互区域
        const hitArea = this.add.rectangle(0, 0, width, height).setInteractive({ useHandCursor: true });
        container.add(hitArea);

        hitArea.on('pointerdown', () => {
            this.selectedStarterId = starter.id;
            this.updateStarterSelection();
        });

        hitArea.on('pointerover', () => {
            if (this.selectedStarterId !== starter.id) {
                cardBg.clear();
                cardBg.fillGradientStyle(0x4a6a9a, 0x4a6a9a, 0x3a5a8a, 0x3a5a8a, 1);
                cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
            }
        });

        hitArea.on('pointerout', () => {
            if (this.selectedStarterId !== starter.id) {
                cardBg.clear();
                cardBg.fillGradientStyle(0x3a5a8a, 0x3a5a8a, 0x2a4a7a, 0x2a4a7a, 1);
                cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
            }
        });

        container._cardBg = cardBg;

        return container;
    }

    updateStarterSelection() {
        this.starterCards.forEach(({ container, starter, outline }) => {
            const w = container._width;
            const h = container._height;
            const isSelected = starter.id === this.selectedStarterId;

            outline.clear();
            if (isSelected) {
                outline.lineStyle(4, 0xffdd44, 1);
                outline.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

                // 更新背景为高亮
                container._cardBg.clear();
                container._cardBg.fillGradientStyle(0x5a7aaa, 0x5a7aaa, 0x4a6a9a, 0x4a6a9a, 1);
                container._cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
            } else {
                outline.lineStyle(2, 0x5a7a9a, 1);
                outline.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

                // 恢复普通背景
                container._cardBg.clear();
                container._cardBg.fillGradientStyle(0x3a5a8a, 0x3a5a8a, 0x2a4a7a, 0x2a4a7a, 1);
                container._cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
            }
        });
    }

    lightenColor(color) {
        const r = Math.min(255, ((color >> 16) & 0xff) + 60);
        const g = Math.min(255, ((color >> 8) & 0xff) + 60);
        const b = Math.min(255, (color & 0xff) + 60);
        return (r << 16) | (g << 8) | b;
    }

    getTypeColor(type) {
        const color = DataLoader.getTypeColor(type);
        return `#${color.toString(16).padStart(6, '0')}`;
    }

    confirmNewGame() {
        // 创建新存档（使用选中的初始精灵）
        PlayerData.createNew(this.playerName, this.selectedStarterId);
        PlayerData.currentMapId = 'spaceship';
        PlayerData.saveToStorage();

        // 清理对话框
        if (this.dialogOverlay) this.dialogOverlay.destroy();
        if (this.dialogContainer) this.dialogContainer.destroy();

        // 切换到飞船场景
        SceneManager.changeScene(this, 'SpaceshipScene');
    }

    getTypeDisplayName(type) {
        return DataLoader.getTypeName(type);
    }

    createSmallButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x3a5a7a, 1);
        bg.fillRoundedRect(-35, -15, 70, 30, 6);
        bg.lineStyle(1, 0x6a9aca, 1);
        bg.strokeRoundedRect(-35, -15, 70, 30, 6);
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(label);

        const hitArea = new Phaser.Geom.Rectangle(-35, -15, 70, 30);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x5a7a9a, 1);
            bg.fillRoundedRect(-35, -15, 70, 30, 6);
            bg.lineStyle(1, 0x8abada, 1);
            bg.strokeRoundedRect(-35, -15, 70, 30, 6);
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3a5a7a, 1);
            bg.fillRoundedRect(-35, -15, 70, 30, 6);
            bg.lineStyle(1, 0x6a9aca, 1);
            bg.strokeRoundedRect(-35, -15, 70, 30, 6);
        });

        container.on('pointerdown', () => callback());

        return container;
    }

    createDialogButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x4a7aaa, 0x4a7aaa, 0x3a6a9a, 0x3a6a9a, 1);
        bg.fillRoundedRect(-80, -20, 160, 40, 8);
        bg.lineStyle(2, 0x8abada, 1);
        bg.strokeRoundedRect(-80, -20, 160, 40, 8);
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        const hitArea = new Phaser.Geom.Rectangle(-80, -20, 160, 40);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            bg.clear();
            bg.fillGradientStyle(0x6a9aca, 0x6a9aca, 0x5a8aba, 0x5a8aba, 1);
            bg.fillRoundedRect(-80, -20, 160, 40, 8);
            bg.lineStyle(2, 0xaadaff, 1);
            bg.strokeRoundedRect(-80, -20, 160, 40, 8);
            container.setScale(1.05);
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillGradientStyle(0x4a7aaa, 0x4a7aaa, 0x3a6a9a, 0x3a6a9a, 1);
            bg.fillRoundedRect(-80, -20, 160, 40, 8);
            bg.lineStyle(2, 0x8abada, 1);
            bg.strokeRoundedRect(-80, -20, 160, 40, 8);
            container.setScale(1);
        });

        container.on('pointerdown', () => callback());

        return container;
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
