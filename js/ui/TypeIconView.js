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

    /**
     * Resolve display type for a skill icon.
     * Status category uses dedicated status icon.
     * 注意：这里只影响 UI 图标展示，不会改动技能真实 type/category 业务语义。
     * @param {{type?: string, category?: string}|null} skill
     * @returns {string|null}
     */
    resolveSkillDisplayType(skill) {
        if (!skill || typeof skill !== 'object') {
            return null;
        }

        if (skill.category === 'status') {
            return 'status';
        }

        return typeof skill.type === 'string' ? skill.type : null;
    },

    getSkillIconKey(skill) {
        const displayType = this.resolveSkillDisplayType(skill);
        return this.getTypeIconKey(displayType);
    },

    renderSkill(scene, container, x, y, skill, options = {}) {
        const displayType = this.resolveSkillDisplayType(skill);
        return this.render(scene, container, x, y, displayType, options);
    },

    getTypeIconKey(type) {
        if (!type) {
            return null;
        }
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
