/**
 * KloseScene - 克洛斯星场景
 * 支持多个子场景，使用真实背景图片
 */

class KloseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KloseScene' });

        // 当前子场景 (1, 2, 3)
        this.currentSubScene = 1;

        // 玩家位置
        this.playerX = 500;
        this.playerY = 400;

        // 野生精灵数组
        this.wildElves = [];
    }

    init(data) {
        // 接收子场景参数
        this.currentSubScene = data.subScene || 1;
        // 自定义入口点（从其他场景返回时使用）
        this.customEntry = data.customEntry || null;
        console.log(`[KloseScene] 进入子场景 ${this.currentSubScene}`, this.customEntry);
    }

    create() {
        const { width, height } = this.cameras.main;

        // 获取场景配置
        this.sceneConfig = AssetMappings.kloseScenes[this.currentSubScene];
        if (!this.sceneConfig) {
            console.error(`[KloseScene] 未找到子场景 ${this.currentSubScene} 配置`);
            return;
        }

        // 设置玩家入口位置（优先使用自定义入口点）
        if (this.customEntry) {
            this.playerX = this.customEntry.x;
            this.playerY = this.customEntry.y;
        } else {
            this.playerX = this.sceneConfig.entryPoint.x;
            this.playerY = this.sceneConfig.entryPoint.y;
        }

        // 创建背景
        this.createBackground(width, height);

        // 创建玩家角色
        this.createPlayer();

        // 生成野生精灵
        this.spawnWildElves();

        // 创建传送热点
        this.createHotspots();

        // 创建返回按钮
        this.createBackButton();

        // 创建点击移动区域
        this.createMoveArea(width, height);

        // 更新存档位置
        PlayerData.currentMapId = `klose_${this.currentSubScene}`;
        PlayerData.saveToStorage();

        console.log(`[KloseScene] 子场景 ${this.currentSubScene} 创建完成`);
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        const bgKey = this.sceneConfig.background;

        if (this.textures.exists(bgKey)) {
            // 使用真实背景图片
            const bg = this.add.image(width / 2, height / 2, bgKey);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1);
        } else {
            // 后备：绘制简单背景
            const graphics = this.add.graphics();
            graphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x5a9ac0, 0x5a9ac0, 1);
            graphics.fillRect(0, 0, width, height * 0.4);
            graphics.fillGradientStyle(0x4a8a3a, 0x4a8a3a, 0x3a7a2a, 0x3a7a2a, 1);
            graphics.fillRect(0, height * 0.4, width, height * 0.6);
            console.warn(`[KloseScene] 背景 ${bgKey} 未找到，使用后备背景`);
        }

        // 场景名称
        const sceneNames = { 1: '克洛斯星', 2: '克洛斯星沼泽', 3: '克洛斯星林间' };
        this.add.text(width / 2, 30, sceneNames[this.currentSubScene] || '克洛斯星', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
    }

    // ========== 玩家角色 ==========
    createPlayer() {
        this.player = this.add.container(this.playerX, this.playerY);

        const graphics = this.add.graphics();

        // 身体
        graphics.fillStyle(0x4a7aaa, 1);
        graphics.fillRoundedRect(-15, -20, 30, 40, 8);

        // 头部
        graphics.fillStyle(0xffcc99, 1);
        graphics.fillCircle(0, -35, 20);

        // 头盔
        graphics.fillStyle(0x3a5a8a, 1);
        graphics.fillRoundedRect(-22, -55, 44, 25, 8);

        // 面罩
        graphics.fillStyle(0x88ccff, 0.6);
        graphics.fillCircle(0, -35, 12);

        this.player.add(graphics);

        // 玩家名称
        const nameTag = this.add.text(0, 35, PlayerData.playerName || '赛尔', {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.player.add(nameTag);
        this.player.setDepth(10);
    }

    // ========== 移动系统 ==========
    createMoveArea(width, height) {
        const moveZone = this.add.zone(width / 2, height / 2, width, height);
        moveZone.setDepth(0);
        moveZone.setInteractive();

        moveZone.on('pointerup', (pointer) => {
            this.movePlayerTo(pointer.x, pointer.y);
        });
    }

    movePlayerTo(targetX, targetY) {
        const { width, height } = this.cameras.main;
        targetX = Phaser.Math.Clamp(targetX, 50, width - 50);
        targetY = Phaser.Math.Clamp(targetY, 100, height - 80);

        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
        const duration = distance * 2;

        this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear'
        });

        this.playerX = targetX;
        this.playerY = targetY;
    }

    // ========== 野生精灵 ==========
    spawnWildElves() {
        const spawnZones = this.sceneConfig.spawnZones || [];

        spawnZones.forEach(zone => {
            // 每个区域生成 2-4 只精灵
            const count = Phaser.Math.Between(2, 4);

            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(zone.x, zone.x + zone.width);
                const y = Phaser.Math.Between(zone.y, zone.y + zone.height);
                this.createWildElf(x, y);
            }
        });
    }

    createWildElf(x, y) {
        const container = this.add.container(x, y);

        // 皮皮精灵 ID = 10
        const pipiId = 10;
        const imageKey = AssetMappings.getElfImageKey(pipiId);

        if (imageKey && this.textures.exists(imageKey)) {
            const sprite = this.add.image(0, 0, imageKey);
            const maxSize = 60;
            const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
            sprite.setScale(scale);
            container.add(sprite);
        } else {
            // 后备：简单圆形
            const graphics = this.add.graphics();
            graphics.fillStyle(0xffaacc, 1);
            graphics.fillCircle(0, 0, 25);
            graphics.fillStyle(0xff88aa, 1);
            graphics.fillCircle(-8, -8, 8);
            graphics.fillCircle(8, -8, 8);
            container.add(graphics);

            const label = this.add.text(0, 35, '皮皮', {
                fontSize: '10px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            container.add(label);
        }

        container.setDepth(5);
        container.setSize(60, 60);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.startBattle();
        });

        this.addWildElfMovement(container, x, y);
        this.wildElves.push(container);
    }

    addWildElfMovement(container, originX, originY) {
        const moveElf = () => {
            if (!container || !container.scene) return;

            const newX = originX + Phaser.Math.Between(-40, 40);
            const newY = originY + Phaser.Math.Between(-30, 30);

            this.tweens.add({
                targets: container,
                x: newX,
                y: newY,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.time.delayedCall(Phaser.Math.Between(1000, 3000), moveElf);
                }
            });
        };

        this.time.delayedCall(Phaser.Math.Between(500, 2000), moveElf);
    }

    // ========== 传送热点 ==========
    createHotspots() {
        const hotspots = this.sceneConfig.hotspots || [];

        hotspots.forEach(hotspot => {
            // 处理 scene 和 entry 类型热点
            if (hotspot.type !== 'scene' && hotspot.type !== 'entry') return;

            const zone = this.add.zone(
                hotspot.x + hotspot.width / 2,
                hotspot.y + hotspot.height / 2,
                hotspot.width,
                hotspot.height
            );
            zone.setInteractive({ useHandCursor: true });
            zone.setDepth(15);

            // 热点指示器
            const indicator = this.add.container(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);

            // 使用配置的箭头方向
            const arrowSymbol = hotspot.arrow === 'left' ? '←' : '→';
            const arrow = this.add.text(0, -20, arrowSymbol, {
                fontSize: '24px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            const label = this.add.text(0, 10, hotspot.label, {
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            indicator.add([arrow, label]);
            indicator.setDepth(15);

            // 箭头闪烁动画
            this.tweens.add({
                targets: arrow,
                alpha: 0.3,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            zone.on('pointerdown', () => {
                // entry 类型热点：使用 targetEntry 作为目标场景的入口位置
                const entryPoint = hotspot.targetEntry || null;
                this.goToSubScene(hotspot.targetScene, entryPoint);
            });
        });
    }

    goToSubScene(subSceneId, customEntryPoint = null) {
        console.log(`[KloseScene] 前往子场景 ${subSceneId}`, customEntryPoint);
        this.scene.restart({ subScene: subSceneId, customEntry: customEntryPoint });
    }

    // ========== 战斗触发 ==========
    startBattle() {
        console.log('遭遇野生皮皮！');
        const wildElf = EncounterSystem.createWildElf(10, 2, 5);
        EncounterSystem.startWildBattle(this, wildElf);
    }

    /**
     * 返回当前场景背景资源 key（供 BattleScene 复用）
     * @returns {string|null}
     */
    getBattleBackgroundKey() {
        return this.sceneConfig ? this.sceneConfig.background : null;
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btn = this.add.container(80, 550);
        btn.setDepth(20);

        // 根据当前场景决定返回目标
        const hotspots = this.sceneConfig.hotspots || [];
        const backHotspot = hotspots.find(h => h.type === 'back');

        let buttonLabel, buttonAction;

        if (this.currentSubScene === 1) {
            // 场景1：返回传送仓
            buttonLabel = '← 返回传送舱';
            buttonAction = () => SceneManager.changeScene(this, 'TeleportScene');
        } else if (backHotspot) {
            // 其他场景：返回上一个场景
            buttonLabel = '← 返回上一区域';
            buttonAction = () => this.goToSubScene(backHotspot.targetScene);
        } else {
            buttonLabel = '← 返回传送舱';
            buttonAction = () => SceneManager.changeScene(this, 'TeleportScene');
        }

        const bg = this.add.graphics();
        bg.fillStyle(0x3a7a3a, 1);
        bg.fillRoundedRect(-70, -20, 140, 40, 8);
        bg.lineStyle(2, 0x5a9a5a, 1);
        bg.strokeRoundedRect(-70, -20, 140, 40, 8);

        const label = this.add.text(0, 0, buttonLabel, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, label]);

        const hitArea = new Phaser.Geom.Rectangle(-70, -20, 140, 40);
        btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x5a9a5a, 1);
            bg.fillRoundedRect(-70, -20, 140, 40, 8);
            bg.lineStyle(2, 0x7aba7a, 1);
            bg.strokeRoundedRect(-70, -20, 140, 40, 8);
        });

        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3a7a3a, 1);
            bg.fillRoundedRect(-70, -20, 140, 40, 8);
            bg.lineStyle(2, 0x5a9a5a, 1);
            bg.strokeRoundedRect(-70, -20, 140, 40, 8);
        });

        btn.on('pointerup', buttonAction);
    }
}
