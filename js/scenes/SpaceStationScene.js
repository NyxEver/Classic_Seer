/**
 * SpaceStationScene - 空间站场景
 * 展示空间站地图，支持角色移动与世界底栏入口。
 */
function getSpaceStationDependency(name) {
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

class SpaceStationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SpaceStationScene' });

        this.player = null;
        this.playerAnimator = null;
        this.playerDirection = 'front';
        this.playerX = 0;
        this.playerY = 0;
        this.playerMoveState = {
            tween: null,
            target: null,
            direction: null
        };
    }

    /** 场景创建：背景、玩家、移动区与底栏 */
    create() {
        const { width, height } = this.cameras.main;

        this.playerX = Math.round(width / 2);
        this.playerY = Math.round(height / 2);
        this.playerDirection = 'front';

        this.createBackground(width, height);
        this.createPlayer(this.playerX, this.playerY);
        this.createMoveArea(width, height);
        this.createBottomBar();
        this.playSpaceStationBgm();

        PlayerData.currentMapId = 'space_station';
        PlayerData.saveToStorage();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.destroyPlayerAnimator();
        });

        console.log('[SpaceStationScene] created');
    }

    /**
     * 创建场景背景
     * @param {number} width
     * @param {number} height
     */
    createBackground(width, height) {
        const bgKey = 'bg_space_station_1';
        if (this.textures.exists(bgKey)) {
            const bg = this.add.image(width / 2, height / 2, bgKey);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1);
        } else {
            const graphics = this.add.graphics();
            graphics.fillGradientStyle(0x1b2431, 0x1b2431, 0x0f141c, 0x0f141c, 1);
            graphics.fillRect(0, 0, width, height);
            console.warn('[SpaceStationScene] 背景纹理缺失，使用后备底色');
        }

        this.add.text(width / 2, 30, '空间站', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
    }

    /**
     * 创建玩家
     * @param {number} x
     * @param {number} y
     */
    createPlayer(x, y) {
        const playerName = PlayerData.name || PlayerData.playerName || '赛尔';

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
            animKeyPrefix: 'space_station_seer_move_'
        });

        const animatedPlayer = this.playerAnimator.createPlayer(x, y, playerName);
        if (animatedPlayer) {
            this.player = animatedPlayer;
            this.player.setDepth(10);
            return;
        }

        this.destroyPlayerAnimator();

        this.player = this.add.container(x, y);

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

    /**
     * 创建全屏可点击移动区
     * @param {number} width
     * @param {number} height
     */
    createMoveArea(width, height) {
        const moveZone = this.add.zone(width / 2, height / 2, width, height);
        moveZone.setDepth(0);
        moveZone.setInteractive();

        moveZone.on('pointerup', (pointer) => {
            this.movePlayerTo(pointer.x, pointer.y);
        });
    }

    /**
     * 玩家点击移动
     * @param {number} targetX
     * @param {number} targetY
     */
    movePlayerTo(targetX, targetY) {
        if (!this.player || !this.player.scene) {
            return;
        }

        const bounds = this.getPlayerMoveBounds();
        const moveResult = MovementSystem.movePlayerTo(
            this,
            this.player,
            targetX,
            targetY,
            bounds,
            {
                msPerPixel: 5.5,
                minDuration: 280,
                maxDuration: 5200,
                startDelay: 0,
                ease: 'Linear',
                _tweenState: this.playerMoveState,
                onDirectionChange: (direction, distance, duration) => {
                    this.playerDirection = direction;
                    if (this.playerAnimator && typeof this.playerAnimator.playMove === 'function') {
                        this.playerAnimator.playMove(direction, distance, duration);
                    }
                },
                onMoveComplete: (direction) => {
                    this.playerX = Math.round(this.player.x);
                    this.playerY = Math.round(this.player.y);
                    if (this.playerAnimator && typeof this.playerAnimator.playIdle === 'function') {
                        this.playerAnimator.playIdle(direction);
                    }
                }
            }
        );

        if (!moveResult && this.playerAnimator && typeof this.playerAnimator.playIdle === 'function') {
            this.playerAnimator.playIdle(this.playerDirection || 'front');
        }
    }

    /**
     * 获取玩家移动边界
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
     */
    getPlayerMoveBounds() {
        const { width, height } = this.cameras.main;
        return {
            minX: 50,
            maxX: width - 50,
            minY: 96,
            maxY: height - 70
        };
    }

    /** 创建底部功能栏 */
    createBottomBar() {
        WorldSceneModalMixin.apply(this, 'SpaceStationScene');
        this.worldBottomBar = WorldBottomBar.create(this, {
            onMap: () => this.openMapModalFromBottomBar(),
            onBag: () => this.openItemBagModal(),
            onElfManage: () => this.openElfManageModal(),
            onSettings: () => this.openSettingsFromBottomBar()
        });
    }

    /** 播放空间站 BGM */
    playSpaceStationBgm() {
        const bgmManager = getSpaceStationDependency('BgmManager');
        if (!bgmManager || typeof bgmManager.transitionTo !== 'function') {
            return;
        }
        bgmManager.transitionTo('SpaceStationScene', this);
    }

    /** 销毁玩家动画器 */
    destroyPlayerAnimator() {
        if (this.playerAnimator && typeof this.playerAnimator.destroy === 'function') {
            this.playerAnimator.destroy();
        }
        this.playerAnimator = null;
    }
}

window.SpaceStationScene = SpaceStationScene;
