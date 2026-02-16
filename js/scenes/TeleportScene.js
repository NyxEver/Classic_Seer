/**
 * TeleportScene - 传送舱场景
 * 星系地图，选择星球进行探索
 */

class TeleportScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TeleportScene' });
        this.returnScene = 'SpaceshipScene';
        this.returnData = {};
    }

    init(data) {
        this.returnScene = data.returnScene || 'SpaceshipScene';
        this.returnData = data.returnData || {};
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建星系地图
        this.createGalaxyMap(width, height);

        // 创建返回按钮
        this.createBackButton();

        // 创建底部功能栏
        this.createBottomBar();

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
            { name: '克洛斯星', enabled: true, scene: 'KloseScene', x: width * 0.5, y: height * 0.4, color: 0x44aa44, size: 60, icon: 'klose_icon' },
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

        // 检查是否有真实图标
        const iconKey = planet.icon ? `ui_${planet.icon}` : null;
        let body;
        let glow = null;

        if (iconKey && this.textures.exists(iconKey)) {
            // 使用真实图标（不需要光晕）
            body = this.add.image(0, 0, iconKey);
            // 放大图标（增加 30%）
            const scale = (planet.size * 2.6) / Math.max(body.width, body.height);
            body.setScale(scale);
            if (!planet.enabled) {
                body.setTint(0x555555);
                body.setAlpha(0.6);
            }
        } else {
            // 后备：绘制星球（带光晕）
            glow = this.add.graphics();
            if (planet.enabled) {
                glow.fillStyle(planet.color, 0.3);
                glow.fillCircle(0, 0, planet.size + 10);
            }

            body = this.add.graphics();
            if (planet.enabled) {
                body.fillStyle(planet.color, 1);
            } else {
                body.fillStyle(0x555555, 0.6);
            }
            body.fillCircle(0, 0, planet.size);
            body.lineStyle(1, planet.enabled ? 0xffffff : 0x777777, 0.3);
            body.arc(0, 0, planet.size * 0.8, 0.5, 2.5);
            body.arc(0, 0, planet.size * 0.6, -0.5, 1.5);
        }

        // 名称
        const nameText = this.add.text(0, planet.size + 35, planet.name, {
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

        // 添加到容器
        if (glow) container.add(glow);
        container.add([body, nameText]);
        if (lockIcon) container.add(lockIcon);

        // 交互区域
        const hitArea = new Phaser.Geom.Circle(0, 0, planet.size + 25);

        if (planet.enabled) {
            // 启用星球：手型光标 + 悬停放大
            container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
            this.input.setDefaultCursor('default');

            container.on('pointerover', () => {
                this.game.canvas.style.cursor = 'pointer';
                this.tweens.add({
                    targets: container,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            container.on('pointerout', () => {
                this.game.canvas.style.cursor = 'default';
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            container.on('pointerup', () => {
                console.log(`前往 ${planet.name}`);
                SceneRouter.start(this, planet.scene);
            });
        } else {
            // 锁定星球
            container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
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

        const fallbackToSpaceship = this.resolveReturnScene() === 'SpaceshipScene';
        const label = this.add.text(0, 0, fallbackToSpaceship ? '← 返回飞船' : '← 返回来源', {
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
            this.returnToSourceScene();
        });
    }

    createBottomBar() {
        this.worldBottomBar = WorldBottomBar.create(this, {
            disableMap: true,
            onBag: () => this.openItemBagModal(),
            onElf: () => this.openElfManageModal()
        });
    }

    openItemBagModal() {
        if (this.scene.isActive('ItemBagScene')) {
            return;
        }

        SceneRouter.launch(this, 'ItemBagScene', {
            returnScene: 'TeleportScene',
            returnData: this.getTeleportReturnPayload()
        }, {
            bgmStrategy: 'inherit'
        });
        this.scene.bringToTop('ItemBagScene');
    }

    openElfManageModal() {
        if (this.scene.isActive('ElfManageScene')) {
            return;
        }

        SceneRouter.launch(this, 'ElfManageScene', {
            returnScene: 'TeleportScene',
            returnData: this.getTeleportReturnPayload()
        }, {
            bgmStrategy: 'inherit'
        });
        this.scene.bringToTop('ElfManageScene');
    }

    getTeleportReturnPayload() {
        return {
            returnScene: this.returnScene,
            returnData: this.returnData
        };
    }

    resolveReturnScene() {
        const candidate = this.returnScene;
        if (!candidate || candidate === 'TeleportScene') {
            return 'SpaceshipScene';
        }

        const exists = this.scene.get(candidate);
        if (!exists) {
            return 'SpaceshipScene';
        }

        return candidate;
    }

    returnToSourceScene() {
        const targetScene = this.resolveReturnScene();
        const data = targetScene === 'SpaceshipScene' ? {} : (this.returnData || {});
        SceneRouter.start(this, targetScene, data);
    }
}
