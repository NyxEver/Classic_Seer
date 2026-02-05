/**
 * TeleportScene - 传送舱场景
 * 星系地图，选择星球进行探索
 */

class TeleportScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TeleportScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建星系地图
        this.createGalaxyMap(width, height);

        // 创建返回按钮
        this.createBackButton();

        // 更新存档位置
        PlayerData.currentMapId = 'teleport';
        PlayerData.saveToStorage();

        console.log('TeleportScene created');
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        const graphics = this.add.graphics();

        // 深空背景
        graphics.fillGradientStyle(0x050510, 0x050510, 0x000005, 0x000005, 1);
        graphics.fillRect(0, 0, width, height);

        // 星星
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.3, 1.5);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }

        // 星云效果
        this.createNebula(width * 0.7, height * 0.3, 0x3a2a5a);
        this.createNebula(width * 0.2, height * 0.7, 0x2a3a5a);
    }

    createNebula(x, y, color) {
        const graphics = this.add.graphics();

        for (let i = 0; i < 20; i++) {
            const offsetX = Phaser.Math.Between(-100, 100);
            const offsetY = Phaser.Math.Between(-80, 80);
            const size = Phaser.Math.Between(20, 60);
            const alpha = Phaser.Math.FloatBetween(0.05, 0.15);

            graphics.fillStyle(color, alpha);
            graphics.fillCircle(x + offsetX, y + offsetY, size);
        }
    }

    // ========== 星系地图 ==========
    createGalaxyMap(width, height) {
        // 标题
        this.add.text(width / 2, 40, '帕诺星系', {
            fontSize: '32px',
            color: '#88ccff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 星球配置
        const planets = [
            { name: '克洛斯星', enabled: true, scene: 'KloseScene', x: width * 0.5, y: height * 0.4, color: 0x44aa44, size: 45 },
            { name: '赫尔卡星', enabled: false, scene: null, x: width * 0.25, y: height * 0.3, color: 0x884422, size: 35 },
            { name: '海洋星', enabled: false, scene: null, x: width * 0.75, y: height * 0.35, color: 0x2266aa, size: 40 },
            { name: '火山星', enabled: false, scene: null, x: width * 0.2, y: height * 0.6, color: 0xaa4422, size: 38 },
            { name: '云霄星', enabled: false, scene: null, x: width * 0.8, y: height * 0.55, color: 0x88aacc, size: 32 },
            { name: '斯诺星', enabled: false, scene: null, x: width * 0.35, y: height * 0.7, color: 0xaaccee, size: 30 }
        ];

        planets.forEach(planet => {
            this.createPlanet(planet);
        });
    }

    createPlanet(planet) {
        const container = this.add.container(planet.x, planet.y);

        // 星球光晕
        const glow = this.add.graphics();
        if (planet.enabled) {
            glow.fillStyle(planet.color, 0.3);
            glow.fillCircle(0, 0, planet.size + 10);
        }

        // 星球本体
        const body = this.add.graphics();

        if (planet.enabled) {
            // 可用星球 - 彩色
            body.fillStyle(planet.color, 1);
        } else {
            // 锁定星球 - 灰色
            body.fillStyle(0x555555, 0.6);
        }
        body.fillCircle(0, 0, planet.size);

        // 星球表面纹理
        body.lineStyle(1, planet.enabled ? 0xffffff : 0x777777, 0.3);
        body.arc(0, 0, planet.size * 0.8, 0.5, 2.5);
        body.arc(0, 0, planet.size * 0.6, -0.5, 1.5);

        // 名称
        const nameText = this.add.text(0, planet.size + 20, planet.name, {
            fontSize: '14px',
            color: planet.enabled ? '#ffffff' : '#666666',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 锁定图标
        let lockIcon = null;
        if (!planet.enabled) {
            lockIcon = this.add.text(0, 0, '🔒', {
                fontSize: '20px'
            }).setOrigin(0.5);
        }

        container.add([glow, body, nameText]);
        if (lockIcon) container.add(lockIcon);

        // 交互
        const hitArea = new Phaser.Geom.Circle(0, 0, planet.size + 10);
        container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

        if (planet.enabled) {
            // 悬停动画
            container.on('pointerover', () => {
                container.setScale(1.1);
                glow.clear();
                glow.fillStyle(planet.color, 0.5);
                glow.fillCircle(0, 0, planet.size + 15);
            });

            container.on('pointerout', () => {
                container.setScale(1);
                glow.clear();
                glow.fillStyle(planet.color, 0.3);
                glow.fillCircle(0, 0, planet.size + 10);
            });

            container.on('pointerup', () => {
                console.log(`前往 ${planet.name}`);
                SceneManager.changeScene(this, planet.scene);
            });

            // 呼吸动画
            this.tweens.add({
                targets: container,
                scaleX: 1.02,
                scaleY: 1.02,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            container.on('pointerup', () => {
                this.showLockedMessage(planet.name);
            });
        }
    }

    showLockedMessage(planetName) {
        const { width, height } = this.cameras.main;

        const msgBg = this.add.graphics();
        msgBg.fillStyle(0x000000, 0.85);
        msgBg.fillRoundedRect(width / 2 - 120, height / 2 - 30, 240, 60, 10);
        msgBg.lineStyle(1, 0xff6666, 1);
        msgBg.strokeRoundedRect(width / 2 - 120, height / 2 - 30, 240, 60, 10);

        const msgText = this.add.text(width / 2, height / 2, `${planetName} 尚未开放`, {
            fontSize: '18px',
            color: '#ff8888'
        }).setOrigin(0.5);

        this.time.delayedCall(1500, () => {
            msgBg.destroy();
            msgText.destroy();
        });
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btn = this.add.container(80, 550);

        const bg = this.add.graphics();
        bg.fillStyle(0x3a4a5a, 1);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        bg.lineStyle(2, 0x6a8aaa, 1);
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
            bg.fillStyle(0x5a6a7a, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0x8aaaca, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3a4a5a, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0x6a8aaa, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerup', () => {
            SceneManager.changeScene(this, 'SpaceshipScene');
        });
    }
}
