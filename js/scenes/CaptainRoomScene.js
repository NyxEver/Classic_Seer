/**
 * CaptainRoomScene - 船长室场景
 * Step2 版本：点击船长打开任务弹窗场景
 */

class CaptainRoomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CaptainRoomScene' });

        this.captainBaseScale = 1;
    }

    create() {
        const { width, height } = this.cameras.main;

        this.createBackground(width, height);
        this.createCaptainEntry(width, height);
        this.createBottomBar();

        PlayerData.currentMapId = 'captain';
        PlayerData.saveToStorage();

        console.log('[CaptainRoomScene] created');
    }

    createBackground(width, height) {
        const bgKey = 'bg_captain_room';
        if (this.textures.exists(bgKey)) {
            const bg = this.add.image(width / 2, height / 2, bgKey);
            bg.setDisplaySize(width, height);
            bg.setDepth(-1);
            return;
        }

        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x3a3020, 0x3a3020, 0x2a2010, 0x2a2010, 1);
        graphics.fillRect(0, 0, width, height);
        console.warn('[CaptainRoomScene] 背景纹理缺失，使用后备底色');
    }

    createCaptainEntry(width, height) {
        const iconKey = 'npc_captain_main';

        // 红框中心锚点（归一化坐标，便于后续微调）
        const anchor = { x: 0.74, y: 0.59 };
        // 红框允许范围（保证图标外接矩形不超边界）
        const bounds = { width: 120, height: 176 };

        const x = Math.round(width * anchor.x);
        const y = Math.round(height * anchor.y);

        let captainIcon = null;
        if (this.textures.exists(iconKey)) {
            captainIcon = this.add.image(x, y, iconKey).setOrigin(0.5, 0.5);

            const scale = Math.min(
                bounds.width / captainIcon.width,
                bounds.height / captainIcon.height
            );
            this.captainBaseScale = Number.isFinite(scale) ? scale : 1;
            captainIcon.setScale(this.captainBaseScale);
        } else {
            const fallback = this.add.graphics();
            fallback.fillStyle(0x2f5ea0, 1);
            fallback.fillRoundedRect(-30, -48, 60, 96, 16);
            fallback.fillStyle(0xffcc99, 1);
            fallback.fillCircle(0, -54, 22);

            captainIcon = this.add.container(x, y, [fallback]);
            captainIcon.setSize(80, 120);
            this.captainBaseScale = 1;

            console.warn('[CaptainRoomScene] 船长图标纹理缺失，使用后备图形');
        }

        captainIcon.setDepth(30);
        captainIcon.setInteractive({ useHandCursor: true });

        captainIcon.on('pointerover', () => {
            if (typeof captainIcon.setTint === 'function') {
                captainIcon.setTint(0xf2f9ff);
            }
            if (typeof captainIcon.setScale === 'function') {
                captainIcon.setScale(this.captainBaseScale * 1.03);
            }
        });

        captainIcon.on('pointerout', () => {
            if (typeof captainIcon.clearTint === 'function') {
                captainIcon.clearTint();
            }
            if (typeof captainIcon.setScale === 'function') {
                captainIcon.setScale(this.captainBaseScale);
            }
        });

        captainIcon.on('pointerup', () => {
            this.openCaptainQuestModal();
        });
    }

    openCaptainQuestModal() {
        if (this.scene.isActive('CaptainQuestModalScene')) {
            this.scene.bringToTop('CaptainQuestModalScene');
            return;
        }

        const launched = SceneRouter.launch(this, 'CaptainQuestModalScene', {
            returnScene: 'CaptainRoomScene',
            returnData: {}
        }, {
            bgmStrategy: 'inherit'
        });

        if (launched) {
            this.scene.bringToTop('CaptainQuestModalScene');
        }
    }

    createBottomBar() {
        WorldSceneModalMixin.apply(this, 'CaptainRoomScene');
        this.worldBottomBar = WorldBottomBar.create(this, {
            onMap: () => this.openSpaceshipFromBottomBar(),
            onBag: () => this.openItemBagModal(),
            onElfManage: () => this.openElfManageModal()
        });
    }

}
