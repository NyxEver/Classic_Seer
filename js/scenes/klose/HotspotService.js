/**
 * KloseHotspotService - 克洛斯星热点与跳转控制
 * 职责：创建热点、子场景切换、返回按钮
 */

class KloseHotspotService {
    constructor(scene) {
        this.scene = scene;
    }

    createHotspots() {
        const hotspots = this.scene.sceneConfig.hotspots || [];

        hotspots.forEach((hotspot) => {
            if (hotspot.type !== 'scene' && hotspot.type !== 'entry') return;

            const zone = this.scene.add.zone(
                hotspot.x + hotspot.width / 2,
                hotspot.y + hotspot.height / 2,
                hotspot.width,
                hotspot.height
            );
            zone.setInteractive({ useHandCursor: true });
            zone.setDepth(15);

            const indicator = this.scene.add.container(
                hotspot.x + hotspot.width / 2,
                hotspot.y + hotspot.height / 2
            );

            const arrowSymbol = hotspot.arrow === 'left' ? '←' : '→';
            const arrow = this.scene.add.text(0, -20, arrowSymbol, {
                fontSize: '24px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            const label = this.scene.add.text(0, 10, hotspot.label, {
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            indicator.add([arrow, label]);
            indicator.setDepth(15);

            this.scene.tweens.add({
                targets: arrow,
                alpha: 0.3,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            zone.on('pointerdown', () => {
                const entryPoint = hotspot.targetEntry || null;
                this.goToSubScene(hotspot.targetScene, entryPoint);
            });
        });
    }

    goToSubScene(subSceneId, customEntryPoint = null) {
        console.log(`[KloseScene] 前往子场景 ${subSceneId}`, customEntryPoint);
        this.scene.scene.restart({ subScene: subSceneId, customEntry: customEntryPoint });
    }

    createBackButton() {
        const btn = this.scene.add.container(80, 550);
        btn.setDepth(20);

        const hotspots = this.scene.sceneConfig.hotspots || [];
        const backHotspot = hotspots.find((h) => h.type === 'back');

        let buttonLabel;
        let buttonAction;

        if (this.scene.currentSubScene === 1) {
            buttonLabel = '← 返回传送舱';
            buttonAction = () => SceneManager.changeScene(this.scene, 'TeleportScene');
        } else if (backHotspot) {
            buttonLabel = '← 返回上一区域';
            buttonAction = () => this.goToSubScene(backHotspot.targetScene);
        } else {
            buttonLabel = '← 返回传送舱';
            buttonAction = () => SceneManager.changeScene(this.scene, 'TeleportScene');
        }

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x3a7a3a, 1);
        bg.fillRoundedRect(-70, -20, 140, 40, 8);
        bg.lineStyle(2, 0x5a9a5a, 1);
        bg.strokeRoundedRect(-70, -20, 140, 40, 8);

        const label = this.scene.add.text(0, 0, buttonLabel, {
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

window.KloseHotspotService = KloseHotspotService;
