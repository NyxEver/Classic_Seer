/**
 * CaptainRoomScene - 船长室场景
 * Step1 版本：背景与船长入口重构，旧任务面板移除
 */

class CaptainRoomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CaptainRoomScene' });

        this.captainBaseScale = 1;
        this.captainHintContainer = null;
        this.captainHintTimer = null;
    }

    create() {
        const { width, height } = this.cameras.main;

        this.createBackground(width, height);
        this.createCaptainEntry(width, height);
        this.createBottomBar();

        PlayerData.currentMapId = 'captain';
        PlayerData.saveToStorage();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.clearCaptainHint();
        });

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
            this.showCaptainQuestEntryHint(width, height);
        });
    }

    showCaptainQuestEntryHint(width, height) {
        this.clearCaptainHint();

        const panelWidth = 420;
        const panelHeight = 130;
        const panelX = Math.round(width * 0.58);
        const panelY = Math.round(height * 0.2);

        const container = this.add.container(panelX, panelY);
        container.setDepth(120);

        const bg = this.add.graphics();
        bg.fillStyle(0x0f1f33, 0.92);
        bg.lineStyle(2, 0x7cb8ff, 0.95);
        bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14);
        bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 14);

        const title = this.add.text(0, -28, '船长任务弹窗入口', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const desc = this.add.text(0, 18, 'Step1 仅保留点击船长触发弹窗交互\nStep2 将接入完整任务列表与对话弹窗。', {
            fontSize: '16px',
            color: '#d8e8ff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        container.add([bg, title, desc]);

        this.captainHintContainer = container;
        this.captainHintTimer = this.time.delayedCall(1800, () => {
            this.clearCaptainHint();
        });
    }

    clearCaptainHint() {
        if (this.captainHintTimer) {
            this.captainHintTimer.remove(false);
            this.captainHintTimer = null;
        }

        if (this.captainHintContainer && this.captainHintContainer.scene) {
            this.captainHintContainer.destroy(true);
        }
        this.captainHintContainer = null;
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
