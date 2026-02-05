/**
 * KloseScene - 克洛斯星场景
 * 探索星球，遭遇野生精灵
 */

class KloseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KloseScene' });

        // 玩家位置
        this.playerX = 500;
        this.playerY = 400;

        // 野生精灵数组
        this.wildElves = [];
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建玩家角色
        this.createPlayer();

        // 生成野生精灵
        this.spawnWildElves();

        // 创建返回按钮
        this.createBackButton();

        // 创建点击移动区域
        this.createMoveArea(width, height);

        // 更新存档位置
        PlayerData.currentMapId = 'klose';
        PlayerData.saveToStorage();

        console.log('KloseScene created');
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        const graphics = this.add.graphics();

        // 天空渐变
        graphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x5a9ac0, 0x5a9ac0, 1);
        graphics.fillRect(0, 0, width, height * 0.4);

        // 草地
        graphics.fillGradientStyle(0x4a8a3a, 0x4a8a3a, 0x3a7a2a, 0x3a7a2a, 1);
        graphics.fillRect(0, height * 0.4, width, height * 0.6);

        // 地平线
        graphics.lineStyle(3, 0x3a6a2a, 1);
        graphics.lineBetween(0, height * 0.4, width, height * 0.4);

        // 草丛装饰
        this.createGrassPatches(width, height);

        // 云朵
        this.createClouds(width);

        // 场景名称
        this.add.text(width / 2, 30, '克洛斯星', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#2a5a2a',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createGrassPatches(width, height) {
        const graphics = this.add.graphics();

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(height * 0.45, height - 50);

            graphics.fillStyle(0x5a9a4a, 0.8);
            graphics.fillTriangle(x, y, x - 5, y + 15, x + 5, y + 15);
            graphics.fillTriangle(x + 8, y + 3, x + 3, y + 18, x + 13, y + 18);
        }
    }

    createClouds(width) {
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(50, 180);

            this.createCloud(x, y);
        }
    }

    createCloud(x, y) {
        const cloud = this.add.container(x, y);
        const graphics = this.add.graphics();

        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(0, 0, 25);
        graphics.fillCircle(-20, 5, 20);
        graphics.fillCircle(20, 5, 20);
        graphics.fillCircle(-10, -10, 18);
        graphics.fillCircle(10, -10, 18);

        cloud.add(graphics);

        // 云朵飘动动画
        this.tweens.add({
            targets: cloud,
            x: x + 50,
            duration: Phaser.Math.Between(15000, 25000),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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

        // 头盔（使用简单形状）
        graphics.fillStyle(0x3a5a8a, 1);
        graphics.fillRoundedRect(-22, -55, 44, 25, 8);

        // 面罩
        graphics.fillStyle(0x88ccff, 0.6);
        graphics.fillCircle(0, -35, 12);

        this.player.add(graphics);

        // 玩家名称
        const nameTag = this.add.text(0, 35, '赛尔', {
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
        // 创建点击移动区域（排除 UI 区域）
        const moveZone = this.add.zone(width / 2, height * 0.6, width, height * 0.5);
        moveZone.setDepth(0); // 最低层，确保野生精灵可以被点击
        moveZone.setInteractive();

        moveZone.on('pointerup', (pointer) => {
            this.movePlayerTo(pointer.x, pointer.y);
        });
    }

    movePlayerTo(targetX, targetY) {
        // 限制移动范围
        const { width, height } = this.cameras.main;
        targetX = Phaser.Math.Clamp(targetX, 50, width - 50);
        targetY = Phaser.Math.Clamp(targetY, height * 0.45, height - 80);

        // 计算距离和时间
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
        const duration = distance * 2; // 速度

        // 移动动画
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
        const { width, height } = this.cameras.main;

        // 生成 3-5 只皮皮
        const count = Phaser.Math.Between(3, 5);

        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(100, width - 100);
            const y = Phaser.Math.Between(height * 0.5, height - 100);

            this.createWildElf(x, y);
        }
    }

    createWildElf(x, y) {
        const container = this.add.container(x, y);

        // 皮皮外形（简化版小鸟）
        const graphics = this.add.graphics();

        // 身体
        graphics.fillStyle(0xffcc88, 1);
        graphics.fillEllipse(0, 0, 35, 30);

        // 翅膀
        graphics.fillStyle(0xeeaa66, 1);
        graphics.fillTriangle(-18, 0, -30, -10, -25, 10);
        graphics.fillTriangle(18, 0, 30, -10, 25, 10);

        // 眼睛
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(-6, -5, 4);
        graphics.fillCircle(6, -5, 4);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(-5, -6, 1.5);
        graphics.fillCircle(7, -6, 1.5);

        // 喙
        graphics.fillStyle(0xff8844, 1);
        graphics.fillTriangle(0, 0, -4, 8, 4, 8);

        // 脚
        graphics.lineStyle(2, 0xff8844, 1);
        graphics.lineBetween(-5, 15, -8, 22);
        graphics.lineBetween(5, 15, 8, 22);

        container.add(graphics);

        // 名称
        const name = this.add.text(0, 25, '皮皮', {
            fontSize: '11px',
            color: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 3, y: 1 }
        }).setOrigin(0.5);
        container.add(name);

        // 设置容器深度，确保在移动区域之上
        container.setDepth(100);

        // 设置容器大小以便点击检测
        container.setSize(60, 60);

        // 交互 - 使用手型光标
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            console.log('鼠标悬停在皮皮上');
            container.setScale(1.15);
        });

        container.on('pointerout', () => {
            container.setScale(1);
        });

        container.on('pointerdown', () => {
            console.log('点击了皮皮');
            this.startBattle();
        });

        // 随机移动动画
        this.addWildElfMovement(container, x, y);

        this.wildElves.push(container);
    }

    addWildElfMovement(container, originX, originY) {
        const { width, height } = this.cameras.main;

        const moveElf = () => {
            const newX = Phaser.Math.Clamp(
                originX + Phaser.Math.Between(-80, 80),
                50, width - 50
            );
            const newY = Phaser.Math.Clamp(
                originY + Phaser.Math.Between(-50, 50),
                height * 0.5, height - 80
            );

            this.tweens.add({
                targets: container,
                x: newX,
                y: newY,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    // 停顿后继续移动
                    this.time.delayedCall(Phaser.Math.Between(1000, 3000), moveElf);
                }
            });
        };

        // 延迟启动移动
        this.time.delayedCall(Phaser.Math.Between(500, 2000), moveElf);
    }

    // ========== 战斗触发 ==========
    startBattle() {
        console.log('遭遇野生皮皮！');

        // 使用 EncounterSystem 创建野生精灵并启动战斗
        const wildElf = EncounterSystem.createWildElf(2, 2, 5); // 皮皮 ID=2, Lv.2-5

        EncounterSystem.startWildBattle(this, wildElf);
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btn = this.add.container(80, 550);
        btn.setDepth(20);

        const bg = this.add.graphics();
        bg.fillStyle(0x3a7a3a, 1);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        bg.lineStyle(2, 0x5a9a5a, 1);
        bg.strokeRoundedRect(-60, -20, 120, 40, 8);

        const label = this.add.text(0, 0, '← 返回传送舱', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, label]);

        const hitArea = new Phaser.Geom.Rectangle(-60, -20, 120, 40);
        btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x5a9a5a, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0x7aba7a, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3a7a3a, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0x5a9a5a, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerup', () => {
            SceneManager.changeScene(this, 'TeleportScene');
        });
    }
}
