/**
 * ModalOverlayLayer - 弹窗透明遮罩基座
 * 统一管理全屏遮罩、输入拦截与幂等 mount/unmount。
 */
const ModalOverlayLayer = {
    /**
     * 挂载全屏遮罩（幂等：已存在则复用）
     * @param {Phaser.Scene} scene
     * @param {Object} [options={}] - { color, alpha, depth }
     * @returns {{ overlay, depth }|null}
     */
    mount(scene, options = {}) {
        if (!scene || !scene.add || !scene.cameras || !scene.cameras.main) {
            console.error('[ModalOverlayLayer] 无效场景，无法挂载遮罩');
            return null;
        }

        const stateKey = '__seerModalOverlayState';
        const existingState = scene[stateKey];
        if (existingState && existingState.overlay && existingState.overlay.scene) {
            return existingState;
        }

        const camera = scene.cameras.main;
        const width = camera.width;
        const height = camera.height;
        const color = Number.isFinite(options.color) ? options.color : 0x000000;
        const alpha = Number.isFinite(options.alpha) ? options.alpha : 0;
        const depth = Number.isFinite(options.depth) ? options.depth : 5000;

        const overlay = scene.add
            .rectangle(width / 2, height / 2, width, height, color, alpha)
            .setScrollFactor(0)
            .setDepth(depth)
            .setInteractive({ useHandCursor: false });

        const stopPropagation = (pointer) => {
            if (pointer && pointer.event && typeof pointer.event.stopPropagation === 'function') {
                pointer.event.stopPropagation();
            }
        };

        overlay.on('pointerdown', stopPropagation);
        overlay.on('pointerup', stopPropagation);
        overlay.on('pointermove', stopPropagation);

        const state = { overlay, depth };
        scene[stateKey] = state;

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.unmount(scene);
        });
        scene.events.once(Phaser.Scenes.Events.DESTROY, () => {
            this.unmount(scene);
        });

        return state;
    },

    /**
     * 卸载遮罩（销毁并清除状态）
     * @param {Phaser.Scene} scene
     */
    unmount(scene) {
        if (!scene) {
            return;
        }

        const stateKey = '__seerModalOverlayState';
        const state = scene[stateKey];
        if (!state) {
            return;
        }

        if (state.overlay && state.overlay.scene) {
            state.overlay.destroy();
        }

        delete scene[stateKey];
    }
};

window.ModalOverlayLayer = ModalOverlayLayer;
