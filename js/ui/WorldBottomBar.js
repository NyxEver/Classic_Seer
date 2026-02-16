/**
 * WorldBottomBar - 非战斗场景通用底栏
 * 按钮顺序固定：地图 -> 背包 -> 精灵背包。
 */
const WorldBottomBar = {
    create(scene, options = {}) {
        this.destroy(scene);

        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        const depth = Number.isFinite(options.depth) ? options.depth : 3200;

        const dockWidth = Math.min(320, width - 190);
        const dockHeight = 66;
        const dockX = width / 2;
        const dockY = height - 34;

        const root = scene.add.container(0, 0);
        root.setDepth(depth);

        root.add(this.createDockBackdrop(scene, dockX, dockY, dockWidth, dockHeight));

        const buttons = {};
        const buttonDefs = [
            {
                type: 'map',
                label: '地图',
                iconKey: 'dock_btn_map',
                fallbackIcon: 'M',
                disabled: !!options.disableMap,
                onClick: options.onMap
            },
            {
                type: 'bag',
                label: '背包',
                iconKey: 'dock_btn_bag',
                fallbackIcon: 'B',
                iconScaleMultiplier: 1.05,
                disabled: false,
                onClick: options.onBag
            },
            {
                type: 'elf',
                label: '精灵背包',
                iconKey: 'dock_btn_elf',
                fallbackIcon: 'E',
                disabled: false,
                onClick: options.onElf
            }
        ];

        const buttonGap = 80;
        const startX = dockX - buttonGap;

        buttonDefs.forEach((def, index) => {
            const btn = this.createButton(scene, {
                x: startX + index * buttonGap,
                y: dockY,
                label: def.label,
                iconKey: def.iconKey,
                fallbackIcon: def.fallbackIcon,
                iconScaleMultiplier: def.iconScaleMultiplier || 1,
                disabled: def.disabled,
                onClick: def.onClick
            });
            root.add(btn.container);
            buttons[def.type] = btn;
        });

        const state = { root, buttons };
        scene.__seerWorldBottomBarState = state;

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.destroy(scene);
        });

        return state;
    },

    destroy(scene) {
        if (!scene || !scene.__seerWorldBottomBarState) {
            return;
        }

        const state = scene.__seerWorldBottomBarState;
        if (state.root && state.root.scene) {
            state.root.destroy(true);
        }

        delete scene.__seerWorldBottomBarState;
    },

    createDockBackdrop(scene, x, y, width, height) {
        const container = scene.add.container(0, 0);

        const shell = scene.add.graphics();
        shell.fillStyle(0x20252d, 0.44);
        shell.fillRoundedRect(x - width / 2, y - height / 2, width, height, 20);
        container.add(shell);

        return container;
    },

    createButton(scene, options) {
        const container = scene.add.container(options.x, options.y);
        const disabled = !!options.disabled;

        const buttonWidth = 108;
        const buttonHeight = 74;

        let iconNode;
        const iconScaleMultiplier = Number.isFinite(options.iconScaleMultiplier)
            ? options.iconScaleMultiplier
            : 1;
        if (scene.textures.exists(options.iconKey)) {
            iconNode = scene.add.image(0, -2, options.iconKey);
            const iconScale = Math.min(46 / iconNode.width, 46 / iconNode.height);
            iconNode.setScale(iconScale * iconScaleMultiplier);
            if (disabled) {
                iconNode.setTint(0x888888);
                iconNode.setAlpha(0.6);
            }
        } else {
            const fallbackFontSize = Math.round(28 * iconScaleMultiplier);
            iconNode = scene.add.text(0, -2, options.fallbackIcon, {
                fontSize: `${fallbackFontSize}px`,
                color: disabled ? '#7f8790' : '#f3f7fb',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }
        container.add(iconNode);

        const hoverLabelBg = scene.add.graphics();
        hoverLabelBg.fillStyle(0x101820, 0.72);
        hoverLabelBg.fillRoundedRect(-44, -63, 88, 24, 10);
        hoverLabelBg.setAlpha(0);
        container.add(hoverLabelBg);

        const hoverLabel = scene.add.text(0, -51, options.label, {
            fontSize: '13px',
            color: disabled ? '#7f8790' : '#edf3f8',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        hoverLabel.setAlpha(0);
        container.add(hoverLabel);

        if (!disabled && typeof options.onClick === 'function') {
            const hit = scene.add.rectangle(0, 0, buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });

            hit.on('pointerover', () => {
                scene.tweens.add({
                    targets: container,
                    scaleX: 1.14,
                    scaleY: 1.14,
                    duration: 120,
                    ease: 'Sine.easeOut'
                });

                scene.tweens.add({
                    targets: [hoverLabel, hoverLabelBg],
                    alpha: 1,
                    duration: 100,
                    ease: 'Sine.easeOut'
                });
            });

            hit.on('pointerout', () => {
                scene.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 120,
                    ease: 'Sine.easeOut'
                });

                scene.tweens.add({
                    targets: [hoverLabel, hoverLabelBg],
                    alpha: 0,
                    duration: 90,
                    ease: 'Sine.easeOut'
                });
            });

            hit.on('pointerdown', () => {
                scene.tweens.add({
                    targets: container,
                    scaleX: 1.04,
                    scaleY: 1.04,
                    duration: 80,
                    ease: 'Sine.easeOut'
                });
            });

            hit.on('pointerup', () => {
                scene.tweens.add({
                    targets: container,
                    scaleX: 1.14,
                    scaleY: 1.14,
                    duration: 80,
                    ease: 'Sine.easeOut'
                });
                options.onClick();
            });

            container.add(hit);
        }

        if (disabled) {
            container.setAlpha(0.55);
        }

        return { container };
    }
};

window.WorldBottomBar = WorldBottomBar;
