/**
 * TypeIconView - 属性图标渲染器
 *
 * 职责：
 * - 统一渲染精灵/技能属性图标
 * - 回退链：属性图标纹理 → 彩色圆形占位
 * - 为技能提供 resolveSkillDisplayType 以区分物理/特殊/属性技能的展示类型
 */

const TypeIconView = {
    /**
     * 渲染属性图标到容器
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} container
     * @param {number} x
     * @param {number} y
     * @param {string} type - 属性类型
     * @param {Object} [options={}] - { iconSize, originX, originY, fallbackRadius, stroke, strokeWidth, strokeColor, strokeAlpha }
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
     * 解析技能的展示属性类型
     * 属性技能(status)使用专用 status 图标，其余使用技能自身 type。
     * 注意：这里只影响 UI 图标展示，不会改动技能真实 type/category 业务语义。
     * @param {{ type?: string, category?: string }|null} skill
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

    /**
     * 获取技能的属性图标纹理键
     * @param {Object} skill
     * @returns {string|null}
     */
    getSkillIconKey(skill) {
        const displayType = this.resolveSkillDisplayType(skill);
        return this.getTypeIconKey(displayType);
    },

    /**
     * 渲染技能属性图标到容器
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} container
     * @param {number} x
     * @param {number} y
     * @param {Object} skill
     * @param {Object} [options={}]
     * @returns {Phaser.GameObjects.GameObject|null}
     */
    renderSkill(scene, container, x, y, skill, options = {}) {
        const displayType = this.resolveSkillDisplayType(skill);
        return this.render(scene, container, x, y, displayType, options);
    },

    /**
     * 获取属性图标纹理键
     * @param {string} type
     * @returns {string|null}
     */
    getTypeIconKey(type) {
        if (!type) {
            return null;
        }
        if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getTypeIconKey !== 'function') {
            return null;
        }
        return AssetMappings.getTypeIconKey(type);
    },

    /**
     * 获取属性颜色（回退用）
     * @param {string} type
     * @returns {number} 0xRRGGBB
     */
    getTypeColor(type) {
        if (typeof DataLoader !== 'undefined' && typeof DataLoader.getTypeColor === 'function') {
            return DataLoader.getTypeColor(type);
        }
        return 0x777777;
    }
};

window.TypeIconView = TypeIconView;
