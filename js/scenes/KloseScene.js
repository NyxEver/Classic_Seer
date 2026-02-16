/**
 * KloseScene - 克洛斯星场景
 * 仅保留场景生命周期与服务协调
 */

function getKloseSceneDependency(name) {
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

class KloseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KloseScene' });

        this.currentSubScene = 1;
        this.playerX = 500;
        this.playerY = 400;
        this.playerDirection = 'front';
        this.wildElves = [];
    }

    init(data) {
        this.currentSubScene = data.subScene || 1;
        this.customEntry = data.customEntry || null;
        this.wildElves = [];

        console.log(`[KloseScene] 进入子场景 ${this.currentSubScene}`, this.customEntry);
    }

    create() {
        const { width, height } = this.cameras.main;

        this.sceneConfig = AssetMappings.kloseScenes[this.currentSubScene];
        if (!this.sceneConfig) {
            console.error(`[KloseScene] 未找到子场景 ${this.currentSubScene} 配置`);
            return;
        }

        if (this.customEntry) {
            this.playerX = this.customEntry.x;
            this.playerY = this.customEntry.y;
        } else {
            this.playerX = this.sceneConfig.entryPoint.x;
            this.playerY = this.sceneConfig.entryPoint.y;
        }

        this.createBackground(width, height);
        this.createPlayer();

        this.playKloseBgm();

        this.moveController = new KloseMoveController(this);
        this.spawnService = new KloseSpawnService(this, this.moveController);
        this.hotspotService = new KloseHotspotService(this);

        this.spawnService.spawnWildElves();
        this.hotspotService.createHotspots();
        this.hotspotService.createBackButton();
        this.moveController.createMoveArea(width, height);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.playerAnimator && typeof this.playerAnimator.destroy === 'function') {
                this.playerAnimator.destroy();
            }
            this.playerAnimator = null;
        });

        PlayerData.currentMapId = `klose_${this.currentSubScene}`;
        PlayerData.saveToStorage();

        console.log(`[KloseScene] 子场景 ${this.currentSubScene} 创建完成`);
    }

    createBackground(width, height) {
        const bgKey = this.sceneConfig.background;

        if (this.textures.exists(bgKey)) {
            const bg = this.add.image(width / 2, height / 2, bgKey);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1);
        } else {
            const graphics = this.add.graphics();
            graphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x5a9ac0, 0x5a9ac0, 1);
            graphics.fillRect(0, 0, width, height * 0.4);
            graphics.fillGradientStyle(0x4a8a3a, 0x4a8a3a, 0x3a7a2a, 0x3a7a2a, 1);
            graphics.fillRect(0, height * 0.4, width, height * 0.6);
            console.warn(`[KloseScene] 背景 ${bgKey} 未找到，使用后备背景`);
        }

        const sceneNames = { 1: '克洛斯星', 2: '克洛斯星沼泽', 3: '克洛斯星林间' };
        this.add.text(width / 2, 30, sceneNames[this.currentSubScene] || '克洛斯星', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
    }

    createPlayer() {
        const playerName = PlayerData.playerName || '赛尔';
        this.playerDirection = 'front';

        if (typeof KlosePlayerAnimator !== 'undefined') {
            this.playerAnimator = new KlosePlayerAnimator(this);
            const animatedPlayer = this.playerAnimator.createPlayer(this.playerX, this.playerY, playerName);
            if (animatedPlayer) {
                this.player = animatedPlayer;
                this.player.setDepth(10);
                return;
            }

            console.warn('[KloseScene] 赛尔方向图集不可用，回退为图形玩家模型');
            this.playerAnimator = null;
        }

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

    startBattle(elfId = 10) {
        const baseData = DataLoader.getElf(elfId);
        const displayName = baseData ? baseData.name : `#${elfId}`;
        console.log(`遭遇野生${displayName}！`);

        const wildElf = EncounterSystem.createWildElf(elfId, 2, 5);
        EncounterSystem.startWildBattle(this, wildElf);
    }

    getBattleBackgroundKey() {
        return this.sceneConfig ? this.sceneConfig.background : null;
    }

    playKloseBgm() {
        const bgmManager = getKloseSceneDependency('BgmManager');
        if (!bgmManager || typeof bgmManager.transitionTo !== 'function') {
            return;
        }
        bgmManager.transitionTo('KloseScene', this);
    }
}
