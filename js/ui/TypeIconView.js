/**
 * TypeIconView - unified type icon renderer
 * Icon first, colored circle fallback.
 */

const TypeIconView = {
    /**
     * Render a type icon into a container.
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} container
     * @param {number} x
     * @param {number} y
     * @param {string} type
     * @param {object} options
     * @returns {Phaser.GameObjects.GameObject|null}
     */
    render(scene, container, x, y, type, options = {}) {
        if (!scene || !container) {
            return null;
        }

        const iconSize = Number(options.iconSize) || 16;
        const originX = options.originX ?? options.fallbackOriginX ?? 0.5;
        const originY = options.originY ?? 0.5;

        const iconKey = this.getTypeIconKey(type);
        if (iconKey && scene.textures.exists(iconKey)) {
            const icon = scene.add.image(x, y, iconKey).setOrigin(originX, originY);
            const scale = Math.min(iconSize / icon.width, iconSize / icon.height);
            icon.setScale(scale);
            container.add(icon);
            return icon;
        }

        const fallbackColor = this.getTypeColor(type);
        const fallbackRadius = options.fallbackRadius || Math.max(5, Math.floor(iconSize / 2));
        const fallback = scene.add.circle(x, y, fallbackRadius, fallbackColor, 1).setOrigin(originX, originY);
        if (options.stroke !== false) {
            fallback.setStrokeStyle(
                options.strokeWidth || 1,
                options.strokeColor || 0xffffff,
                options.strokeAlpha ?? 0.7
            );
        }

        container.add(fallback);
        return fallback;
    },

    getTypeIconKey(type) {
        if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getTypeIconKey !== 'function') {
            return null;
        }
        return AssetMappings.getTypeIconKey(type);
    },

    getTypeColor(type) {
        if (typeof DataLoader !== 'undefined' && typeof DataLoader.getTypeColor === 'function') {
            return DataLoader.getTypeColor(type);
        }
        return 0x777777;
    }
};

window.TypeIconView = TypeIconView;
