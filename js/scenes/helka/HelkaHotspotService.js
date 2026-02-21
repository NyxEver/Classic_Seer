/**
 * HelkaHotspotService - 赫尔卡星热点服务
 * 职责：创建场景热点并处理子场景切换。
 */
class HelkaHotspotService {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * 创建当前子场景热点
     */
    createHotspots() {
        const hotspots = this.scene.runtimeSceneConfig.hotspots || [];

        hotspots.forEach((hotspot) => {
            const zone = this.scene.add.zone(
                hotspot.x + hotspot.width / 2,
                hotspot.y + hotspot.height / 2,
                hotspot.width,
                hotspot.height
            );
            zone.setInteractive({ useHandCursor: true });
            zone.setDepth(15);

            const marker = this.scene.add.container(
                hotspot.x + hotspot.width / 2,
                hotspot.y + hotspot.height / 2
            );

            const arrow = this.scene.add.text(0, -20, hotspot.arrow === 'left' ? '←' : '→', {
                fontSize: '24px',
                color: '#ffdd66',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            const label = this.scene.add.text(0, 12, hotspot.label || '', {
                fontSize: '13px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            marker.add([arrow, label]);
            marker.setDepth(15);

            this.scene.tweens.add({
                targets: arrow,
                alpha: 0.3,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            zone.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
                this.goToSubScene(hotspot.targetScene, hotspot.targetEntry || null);
            });
        });
    }

    /**
     * 跳转到目标子场景
     * @param {number} subSceneId
     * @param {{x:number,y:number}|null} customEntryPoint
     */
    goToSubScene(subSceneId, customEntryPoint = null) {
        this.scene.scene.restart({
            subScene: subSceneId,
            customEntry: customEntryPoint
        });
    }
}

window.HelkaHotspotService = HelkaHotspotService;
