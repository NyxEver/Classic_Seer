/**
 * HelkaScene - 赫尔卡星场景
 * 采用一个 Scene + subScene 参数的子场景切换模式。
 */
function getHelkaSceneDependency(name) {
    if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
        const dep = AppContext.get(name, null);
        if (dep) {
            return dep;
        }
    }
    if (typeof window !== 'undefined') {
        return window[name] || null;
    }
    return null;
}

class HelkaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HelkaScene' });

        this.currentSubScene = 1;
        this.playerX = 500;
        this.playerY = 400;
        this.playerDirection = 'front';
        this.customEntry = null;
        this.sceneConfig = null;
        this.runtimeSceneConfig = null;
        this.playerAnimator = null;
    }

    init(data = {}) {
        this.currentSubScene = Number.isFinite(data.subScene) ? data.subScene : 1;
        this.customEntry = data.customEntry || null;
        this.playerDirection = data.playerDirection || 'front';
    }

    create() {
        const { width, height } = this.cameras.main;

        this.sceneConfig = AssetMappings.helkaScenes[this.currentSubScene];
        if (!this.sceneConfig) {
            console.error(`[HelkaScene] 未找到子场景 ${this.currentSubScene} 配置`);
            SceneRouter.start(this, 'TeleportScene');
            return;
        }

        this.runtimeSceneConfig = this.buildRuntimeSceneConfig(this.sceneConfig, width, height);

        if (this.customEntry && Number.isFinite(this.customEntry.x) && Number.isFinite(this.customEntry.y)) {
            this.playerX = this.customEntry.x;
            this.playerY = this.customEntry.y;
        } else {
            this.playerX = this.runtimeSceneConfig.entryPoint.x;
            this.playerY = this.runtimeSceneConfig.entryPoint.y;
        }

        this.playerX = Phaser.Math.Clamp(this.playerX, 50, width - 50);
        this.playerY = Phaser.Math.Clamp(this.playerY, 96, height - 70);

        this.createBackground(width, height);
        this.createPlayer();
        this.playHelkaBgm();

        this.moveController = new HelkaMoveController(this);
        this.hotspotService = new HelkaHotspotService(this);
        this.hotspotService.createHotspots();
        this.moveController.createMoveArea(width, height);
        this.createBottomBar();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.playerAnimator && typeof this.playerAnimator.destroy === 'function') {
                this.playerAnimator.destroy();
            }
            this.playerAnimator = null;
        });

        PlayerData.currentMapId = `helka_${this.currentSubScene}`;
        PlayerData.saveToStorage();

        console.log(`[HelkaScene] 子场景 ${this.currentSubScene} 创建完成`);
    }

    /**
     * 构建运行时配置（将设计坐标换算为当前画布坐标）
     * @param {Object} rawConfig
     * @param {number} width
     * @param {number} height
     * @returns {Object}
     */
    buildRuntimeSceneConfig(rawConfig, width, height) {
        const designWidth = Number(rawConfig.designWidth) || 1920;
        const designHeight = Number(rawConfig.designHeight) || 1120;
        const scaleX = width / designWidth;
        const scaleY = height / designHeight;

        const scalePoint = (point) => ({
            x: Math.round(point.x * scaleX),
            y: Math.round(point.y * scaleY)
        });

        const scaleRect = (rect) => ({
            x: Math.round(rect.x * scaleX),
            y: Math.round(rect.y * scaleY),
            width: Math.max(1, Math.round(rect.width * scaleX)),
            height: Math.max(1, Math.round(rect.height * scaleY))
        });

        const scaleWalkableRect = (rect) => {
            if (!rect || !Number.isFinite(rect.x) || !Number.isFinite(rect.y)
                || !Number.isFinite(rect.width) || !Number.isFinite(rect.height)) {
                return null;
            }

            return {
                x: Math.round(rect.x * scaleX),
                y: Math.round(rect.y * scaleY),
                width: Math.max(1, Math.round(rect.width * scaleX)),
                height: Math.max(1, Math.round(rect.height * scaleY))
            };
        };

        const scalePolygon = (polygon) => {
            if (!Array.isArray(polygon)) {
                return [];
            }
            return polygon
                .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
                .map((point) => scalePoint(point));
        };

        return {
            ...rawConfig,
            entryPoint: scalePoint(rawConfig.entryPoint),
            hotspots: (rawConfig.hotspots || []).map((hotspot) => ({
                ...hotspot,
                ...scaleRect(hotspot),
                targetEntry: hotspot.targetEntry ? scalePoint(hotspot.targetEntry) : null
            })),
            walkableRects: (rawConfig.walkableRects || [])
                .map((rect) => scaleWalkableRect(rect))
                .filter((rect) => !!rect),
            walkableZones: (rawConfig.walkableZones || [])
                .map((polygon) => scalePolygon(polygon))
                .filter((polygon) => polygon.length >= 3)
        };
    }

    createBackground(width, height) {
        const bgKey = this.runtimeSceneConfig.background;
        if (this.textures.exists(bgKey)) {
            const bg = this.add.image(width / 2, height / 2, bgKey);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1);
        } else {
            const graphics = this.add.graphics();
            graphics.fillGradientStyle(0x1b2431, 0x1b2431, 0x0c1118, 0x0c1118, 1);
            graphics.fillRect(0, 0, width, height);
            console.warn(`[HelkaScene] 背景 ${bgKey} 未找到，使用后备背景`);
        }

        const sceneNames = {
            1: '赫尔卡星',
            2: '赫尔卡星遗迹',
            3: '赫尔卡星荒地'
        };

        this.add.text(width / 2, 30, sceneNames[this.currentSubScene] || '赫尔卡星', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
    }

    createPlayer() {
        const playerName = PlayerData.name || PlayerData.playerName || '赛尔';
        this.playerDirection = 'front';

        const atlasKeyResolver = (direction) => {
            if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getSeerDynamicAtlasKey !== 'function') {
                return null;
            }
            return AssetMappings.getSeerDynamicAtlasKey(direction);
        };

        this.playerAnimator = new PlayerAnimatorSystem(this, {
            atlasKeyResolver,
            targetHeight: 86,
            spriteScale: 0.68,
            loopDistanceThreshold: 70,
            animKeyPrefix: 'helka_seer_move_'
        });

        const animatedPlayer = this.playerAnimator.createPlayer(this.playerX, this.playerY, playerName);
        if (animatedPlayer) {
            this.player = animatedPlayer;
            this.player.setDepth(10);
            return;
        }

        this.playerAnimator = null;
        this.player = this.add.container(this.playerX, this.playerY);

        const graphics = this.add.graphics();
        graphics.fillStyle(0x4a7aaa, 1);
        graphics.fillRoundedRect(-15, -20, 30, 40, 8);
        graphics.fillStyle(0xffcc99, 1);
        graphics.fillCircle(0, -35, 20);
        graphics.fillStyle(0x3a5a8a, 1);
        graphics.fillRoundedRect(-22, -55, 44, 25, 8);
        graphics.fillStyle(0x88ccff, 0.6);
        graphics.fillCircle(0, -35, 12);
        this.player.add(graphics);

        const nameTag = this.add.text(0, 35, playerName, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        this.player.add(nameTag);
        this.player.setDepth(10);
    }

    createBottomBar() {
        WorldSceneModalMixin.apply(this, 'HelkaScene', () => this.getHelkaReturnData());
        this.worldBottomBar = WorldBottomBar.create(this, {
            onMap: () => this.openSpaceshipFromBottomBar(),
            onBag: () => this.openItemBagModal(),
            onElfManage: () => this.openElfManageModal()
        });
    }

    getHelkaReturnData() {
        const entryX = this.player && Number.isFinite(this.player.x) ? this.player.x : this.playerX;
        const entryY = this.player && Number.isFinite(this.player.y) ? this.player.y : this.playerY;
        return {
            subScene: this.currentSubScene,
            customEntry: {
                x: Math.floor(entryX),
                y: Math.floor(entryY)
            }
        };
    }

    playHelkaBgm() {
        const bgmManager = getHelkaSceneDependency('BgmManager');
        if (!bgmManager || typeof bgmManager.transitionTo !== 'function') {
            return;
        }
        bgmManager.transitionTo('HelkaScene', this);
    }
}

window.HelkaScene = HelkaScene;
