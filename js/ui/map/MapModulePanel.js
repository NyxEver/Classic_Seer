/**
 * MapModulePanel - 地图弹窗功能模块面板
 */
const MapModulePanel = {
    /**
     * 渲染模块面板
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Container} root
     * @param {Object} options
     * @returns {Phaser.GameObjects.Container}
     */
    render(scene, root, options = {}) {
        const container = scene.add.container(0, 0);
        root.add(container);

        const x = Number.isFinite(options.x) ? options.x : 30;
        const y = Number.isFinite(options.y) ? options.y : 246;
        const width = Number.isFinite(options.width) ? options.width : 420;
        const height = Number.isFinite(options.height) ? options.height : 124;
        const modules = Array.isArray(options.modules) ? options.modules : [];
        const onModuleClick = typeof options.onModuleClick === 'function' ? options.onModuleClick : null;

        container.add(this.createTrapezoidShell(scene, x, y, width, height));

        const cols = 4;
        const rows = 2;
        const gap = 10;
        const leftPadding = 22;
        const rightPadding = 62;
        const topPadding = 22;
        const bottomPadding = 18;

        const innerW = width - leftPadding - rightPadding;
        const innerH = height - topPadding - bottomPadding;

        const cellW = Math.floor((innerW - gap * (cols - 1)) / cols);
        const cellH = Math.floor((innerH - gap * (rows - 1)) / rows);

        const hoverLabel = this.createHoverLabel(scene, x + Math.floor(width * 0.36), y - 14);
        container.add(hoverLabel.root);

        for (let i = 0; i < rows * cols; i++) {
            const item = modules[i] || this.createLockedModule(`locked_${i}`, '未开放');
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cellX = x + leftPadding + col * (cellW + gap);
            const cellY = y + topPadding + row * (cellH + gap);

            const card = this.createModuleCard(scene, {
                x: cellX,
                y: cellY,
                width: cellW,
                height: cellH,
                module: item,
                hoverLabel,
                onClick: onModuleClick
            });
            container.add(card);
        }

        return container;
    },

    /**
     * 创建左下角直角梯形底板
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @returns {Phaser.GameObjects.Graphics}
     */
    createTrapezoidShell(scene, x, y, width, height) {
        const shape = scene.add.graphics();
        shape.fillStyle(0xebf5ff, 0.97);
        this.drawTrapezoidPath(shape, x, y, width, height);
        shape.fillPath();

        shape.lineStyle(2, 0x5f95c3, 1);
        this.drawTrapezoidPath(shape, x, y, width, height);
        shape.strokePath();

        return shape;
    },

    /**
     * 生成带圆角的直角梯形路径
     * @param {Phaser.GameObjects.Graphics} shape
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    drawTrapezoidPath(shape, x, y, width, height) {
        const cut = 66;
        const rLeft = 10;
        const rTopRight = 12;
        const rBottomRight = 13;

        const topRightX = x + width - cut;
        const bottomRightX = x + width;
        const topY = y;
        const bottomY = y + height;

        shape.beginPath();
        shape.moveTo(x + rLeft, topY);
        shape.lineTo(topRightX - rTopRight, topY);
        shape.lineTo(topRightX - Math.floor(rTopRight * 0.32), topY + Math.floor(rTopRight * 0.34));
        shape.lineTo(topRightX + Math.floor(rTopRight * 0.54), topY + Math.floor(rTopRight * 0.72));
        shape.lineTo(bottomRightX - Math.floor(rBottomRight * 0.48), bottomY - Math.floor(rBottomRight * 0.48));
        shape.lineTo(bottomRightX - rBottomRight, bottomY);
        shape.lineTo(x + rLeft, bottomY);
        shape.lineTo(x, bottomY - rLeft);
        shape.lineTo(x, topY + rLeft);
        shape.lineTo(x + rLeft, topY);
        shape.closePath();
    },

    /**
     * 创建单个模块卡片
     * @param {Phaser.Scene} scene
     * @param {Object} options
     * @returns {Phaser.GameObjects.Container}
     */
    createModuleCard(scene, options) {
        const x = options.x;
        const y = options.y;
        const w = options.width;
        const h = options.height;
        const node = scene.add.container(x + Math.floor(w / 2), y + Math.floor(h / 2));
        const module = options.module || this.createLockedModule('locked', '未开放');
        const enabled = !module.locked;

        const bg = scene.add.graphics();
        bg.fillStyle(enabled ? 0x2a4d6f : 0x747b84, 1);
        bg.fillRoundedRect(-Math.floor(w / 2), -Math.floor(h / 2), w, h, 8);
        bg.lineStyle(1.5, enabled ? 0xb8d8f4 : 0xa1a8b1, 1);
        bg.strokeRoundedRect(-Math.floor(w / 2), -Math.floor(h / 2), w, h, 8);
        node.add(bg);

        const inlineLabel = scene.add.text(0, 0, module.label || '模块', {
            fontSize: '12px',
            color: enabled ? '#f1f7fd' : '#d0d4d9',
            fontStyle: enabled ? 'bold' : 'normal'
        }).setOrigin(0.5);
        node.add(inlineLabel);

        if (module.isHere) {
            node.add(this.createHereBadge(scene, -Math.floor(w / 2) + 10, -Math.floor(h / 2) + 10));
        }

        const hit = scene.add.rectangle(0, 0, w, h, 0x000000, 0.001)
            .setInteractive({ useHandCursor: enabled });
        hit.on('pointerover', () => {
            this.showHoverLabel(options.hoverLabel, module.label || '模块');
            if (!enabled) {
                return;
            }
            scene.tweens.killTweensOf(node);
            scene.tweens.add({
                targets: node,
                scaleX: 1.04,
                scaleY: 1.04,
                duration: 90,
                ease: 'Sine.easeOut'
            });
        });
        hit.on('pointerout', () => {
            this.hideHoverLabel(options.hoverLabel);
            if (!enabled) {
                return;
            }
            scene.tweens.killTweensOf(node);
            scene.tweens.add({
                targets: node,
                scaleX: 1,
                scaleY: 1,
                duration: 90,
                ease: 'Sine.easeOut'
            });
        });
        hit.on('pointerdown', (pointer) => {
            if (pointer && pointer.event && typeof pointer.event.stopPropagation === 'function') {
                pointer.event.stopPropagation();
            }
            if (!enabled || typeof options.onClick !== 'function') {
                return;
            }
            options.onClick(module);
        });
        node.add(hit);

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
            const scale = Math.min(26 / icon.width, 26 / icon.height);
            icon.setScale(scale);
            badge.add(icon);
            return badge;
        }

        badge.add(scene.add.circle(x, y, 14, 0x2e88d8, 1));
        badge.add(scene.add.text(x, y, '在', {
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5));
        return badge;
    },

    /**
     * 创建悬停标签
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @returns {{root: Phaser.GameObjects.Container, text: Phaser.GameObjects.Text, bg: Phaser.GameObjects.Graphics}}
     */
    createHoverLabel(scene, x, y) {
        const root = scene.add.container(0, 0);
        root.setAlpha(0);

        const bg = scene.add.graphics();
        root.add(bg);

        const text = scene.add.text(x, y, '', {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        root.add(text);

        return { root, text, bg, x, y };
    },

    /**
     * 显示悬停标签
     * @param {Object} hoverLabel
     * @param {string} label
     */
    showHoverLabel(hoverLabel, label) {
        if (!hoverLabel || !hoverLabel.text || !hoverLabel.bg || !hoverLabel.root) {
            return;
        }

        hoverLabel.text.setText(label || '模块');
        const textWidth = hoverLabel.text.width;
        const textHeight = hoverLabel.text.height;
        const boxW = Math.max(56, textWidth + 18);
        const boxH = Math.max(20, textHeight + 8);

        hoverLabel.bg.clear();
        hoverLabel.bg.fillStyle(0x5b6470, 0.92);
        hoverLabel.bg.fillRoundedRect(hoverLabel.x - boxW / 2, hoverLabel.y - boxH / 2, boxW, boxH, 7);
        hoverLabel.bg.lineStyle(1, 0xc4c9cf, 0.9);
        hoverLabel.bg.strokeRoundedRect(hoverLabel.x - boxW / 2, hoverLabel.y - boxH / 2, boxW, boxH, 7);

        hoverLabel.root.setAlpha(1);
    },

    /**
     * 隐藏悬停标签
     * @param {Object} hoverLabel
     */
    hideHoverLabel(hoverLabel) {
        if (!hoverLabel || !hoverLabel.root) {
            return;
        }
        hoverLabel.root.setAlpha(0);
    },

    /**
     * 创建锁定模块默认配置
     * @param {string} id
     * @param {string} label
     * @returns {{id: string, label: string, shortLabel: string, locked: boolean, isHere: boolean}}
     */
    createLockedModule(id, label) {
        return {
            id,
            label,
            shortLabel: 'LOCK',
            locked: true,
            isHere: false
        };
    }
};

window.MapModulePanel = MapModulePanel;
