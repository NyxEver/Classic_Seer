/**
 * MapPlanetPanel - 地图弹窗星球展示区
 */
const MapPlanetPanel = {
    /**
     * 渲染星球展示区
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} root
     * @param {Object} options
     * @returns {Phaser.GameObjects.Container}
     */
    render(scene, root, options = {}) {
        const container = scene.add.container(0, 0);
        root.add(container);

        const x = Number.isFinite(options.x) ? options.x : 40;
        const y = Number.isFinite(options.y) ? options.y : 82;
        const width = Number.isFinite(options.width) ? options.width : 820;
        const height = Number.isFinite(options.height) ? options.height : 176;
        const planets = Array.isArray(options.planets) ? options.planets : [];
        const onPlanetClick = typeof options.onPlanetClick === 'function' ? options.onPlanetClick : null;

        const slotCount = Math.max(4, planets.length || 0);
        const slotW = Math.floor(width / slotCount);
        const centerY = y + Math.floor(height * 0.48);

        for (let i = 0; i < slotCount; i++) {
            const planet = planets[i] || this.createUnknownPlanet(i + 1);
            const centerX = x + Math.floor(slotW * i + slotW / 2);
            const node = this.createPlanetNode(scene, {
                x: centerX,
                y: centerY,
                slotWidth: slotW,
                slotHeight: height,
                planet,
                onClick: onPlanetClick
            });
            container.add(node);
        }

        return container;
    },

    /**
     * 创建单颗星球节点
     * @param {Phaser.Scene} scene
     * @param {Object} options
     * @returns {Phaser.GameObjects.Container}
     */
    createPlanetNode(scene, options) {
        const node = scene.add.container(0, 0);
        const planet = options.planet || this.createUnknownPlanet(0);
        const slotWidth = Number.isFinite(options.slotWidth) ? options.slotWidth : 200;
        const slotHeight = Number.isFinite(options.slotHeight) ? options.slotHeight : 170;
        const iconMaxWidth = Math.max(96, Math.floor(slotWidth * 0.61));
        const iconMaxHeight = Math.max(64, Math.floor(slotHeight * 0.62));

        let iconWidth = iconMaxWidth;
        let iconHeight = iconMaxHeight;

        if (planet.iconKey && scene.textures.exists(planet.iconKey)) {
            const icon = scene.add.image(options.x, options.y, planet.iconKey);
            const scale = Math.min(iconMaxWidth / icon.width, iconMaxHeight / icon.height);
            icon.setScale(scale);
            iconWidth = icon.displayWidth;
            iconHeight = icon.displayHeight;
            if (planet.locked) {
                icon.setTint(0x808080);
                icon.setAlpha(0.68);
            }
            node.add(icon);
        } else {
            const placeholder = scene.add.graphics();
            const baseRadius = Math.max(34, Math.floor(Math.min(iconMaxWidth, iconMaxHeight) * 0.48));
            const radius = planet.locked
                ? Math.max(20, Math.floor(baseRadius * 0.68))
                : baseRadius;

            placeholder.fillStyle(planet.locked ? 0x7a818c : 0x5f89b0, 0.96);
            placeholder.fillCircle(options.x, options.y, radius);
            node.add(placeholder);
            iconWidth = radius * 2;
            iconHeight = radius * 2;

            const lockOrText = scene.add.text(options.x, options.y, planet.locked ? 'LOCK' : '?', {
                fontSize: planet.locked ? '14px' : '20px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            node.add(lockOrText);
        }

        const labelY = options.y + Math.floor(iconHeight / 2) + 16;
        const label = scene.add.text(options.x, labelY, planet.label || '未知星球', {
            fontSize: '14px',
            color: planet.locked ? '#9ea5af' : '#f0f7ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        node.add(label);

        if (planet.isHere) {
            node.add(this.createHereBadge(
                scene,
                options.x - Math.floor(iconWidth / 2) + 10 + Math.floor(iconWidth * 0.3),
                options.y - Math.floor(iconHeight / 2) + 10
            ));
        }

        if (!planet.locked && typeof options.onClick === 'function') {
            const hit = scene.add.rectangle(
                options.x,
                options.y,
                Math.max(iconWidth + 26, 112),
                Math.max(iconHeight + 22, 86),
                0x000000,
                0.001
            )
                .setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => {
                scene.tweens.add({
                    targets: node,
                    scaleX: 1.06,
                    scaleY: 1.06,
                    duration: 110,
                    ease: 'Sine.easeOut'
                });
            });
            hit.on('pointerout', () => {
                scene.tweens.add({
                    targets: node,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 110,
                    ease: 'Sine.easeOut'
                });
            });
            hit.on('pointerdown', (pointer) => {
                if (pointer && pointer.event && typeof pointer.event.stopPropagation === 'function') {
                    pointer.event.stopPropagation();
                }
                options.onClick(planet);
            });
            node.add(hit);
        }

        return node;
    },

    /**
     * 创建当前位置标记
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @returns {Phaser.GameObjects.Container}
     */
    createHereBadge(scene, x, y) {
        const badge = scene.add.container(0, 0);
        if (scene.textures.exists('map_here_icon')) {
            const icon = scene.add.image(x, y, 'map_here_icon');
            const scale = Math.min(31 / icon.width, 31 / icon.height);
            icon.setScale(scale);
            badge.add(icon);
            return badge;
        }

        const bg = scene.add.circle(x, y, 14, 0x2e88d8, 1);
        const text = scene.add.text(x, y, '在', {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        badge.add(bg);
        badge.add(text);
        return badge;
    },

    /**
     * 创建默认锁定星球
     * @param {number} index
     * @returns {{id: string, label: string, locked: boolean, iconKey: null, isHere: boolean}}
     */
    createUnknownPlanet(index) {
        return {
            id: `unknown_${index}`,
            label: '未知星球',
            locked: true,
            iconKey: null,
            isHere: false
        };
    }
};

window.MapPlanetPanel = MapPlanetPanel;
