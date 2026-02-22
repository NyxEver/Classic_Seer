/**
 * SettingsModalUi - 设置弹窗 UI 辅助方法
 */
const SettingsModalUi = {
    createActionButton(scene, x, y, label, onClick) {
        const width = 240;
        const height = 40;

        const container = scene.add.container(0, 0);
        scene.root.add(container);

        const bg = scene.add.graphics();
        bg.fillStyle(0x2f77c0, 1);
        bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
        bg.lineStyle(1.5, 0xb8daf9, 1);
        bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
        container.add(bg);

        const text = scene.add.text(x, y, label, {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        const hit = scene.add.rectangle(x, y, width, height, 0x000000, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x3f8fe0, 1);
            bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
            bg.lineStyle(1.5, 0xd5ecff, 1);
            bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
        });
        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2f77c0, 1);
            bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
            bg.lineStyle(1.5, 0xb8daf9, 1);
            bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
        });
        hit.on('pointerdown', onClick);
        container.add(hit);
    },

    createToastText(scene) {
        scene.toastText = scene.add.text(scene.modalW / 2, scene.modalH - 22, '', {
            fontSize: '14px',
            color: '#d0e6ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        scene.toastText.setAlpha(0);
        scene.root.add(scene.toastText);
    },

    showToast(scene, message, isError = false) {
        if (!scene.toastText) {
            return;
        }

        scene.toastText.setText(message);
        scene.toastText.setColor(isError ? '#ffc0c0' : '#d0e6ff');

        if (scene.toastTween) {
            scene.toastTween.stop();
            scene.toastTween = null;
        }

        scene.toastText.setAlpha(1);
        scene.toastTween = scene.tweens.add({
            targets: scene.toastText,
            alpha: 0,
            delay: 1600,
            duration: 450,
            ease: 'Sine.easeOut'
        });
    },

    showConfirmDialog(scene, config) {
        this.closeConfirmDialog(scene);

        const title = config && config.title ? config.title : '请确认';
        const message = config && config.message ? config.message : '';
        const confirmLabel = config && config.confirmLabel ? config.confirmLabel : '确认';
        const onConfirm = config && typeof config.onConfirm === 'function' ? config.onConfirm : null;

        const overlay = scene.add.rectangle(scene.W / 2, scene.H / 2, scene.W, scene.H, 0x000000, 0.45)
            .setDepth(scene.baseDepth + 40)
            .setInteractive({ useHandCursor: false });

        const dialog = scene.add.container(scene.W / 2, scene.H / 2).setDepth(scene.baseDepth + 41);

        const bg = scene.add.graphics();
        bg.fillStyle(0x1c3550, 0.98);
        bg.fillRoundedRect(-220, -120, 440, 240, 14);
        bg.lineStyle(2, 0x8abde8, 1);
        bg.strokeRoundedRect(-220, -120, 440, 240, 14);
        dialog.add(bg);

        const titleText = scene.add.text(0, -78, title, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        dialog.add(titleText);

        const msgText = scene.add.text(0, -20, message, {
            fontSize: '17px',
            color: '#d6eaff',
            align: 'center',
            wordWrap: { width: 360 }
        }).setOrigin(0.5);
        dialog.add(msgText);

        const createDialogButton = (x, label, onClick) => {
            const buttonBg = scene.add.graphics();
            buttonBg.fillStyle(0x2f77c0, 1);
            buttonBg.fillRoundedRect(x - 70, 50, 140, 40, 10);
            buttonBg.lineStyle(1.5, 0xb8daf9, 1);
            buttonBg.strokeRoundedRect(x - 70, 50, 140, 40, 10);
            dialog.add(buttonBg);

            const buttonText = scene.add.text(x, 70, label, {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            dialog.add(buttonText);

            const hit = scene.add.rectangle(x, 70, 140, 40, 0x000000, 0.001).setInteractive({ useHandCursor: true });
            hit.on('pointerdown', onClick);
            dialog.add(hit);
        };

        createDialogButton(-84, '取消', () => this.closeConfirmDialog(scene));
        createDialogButton(84, confirmLabel, () => {
            this.closeConfirmDialog(scene);
            if (onConfirm) {
                onConfirm();
            }
        });

        scene.confirmState = {
            overlay: overlay,
            dialog: dialog
        };
    },

    closeConfirmDialog(scene) {
        if (!scene.confirmState) {
            return;
        }

        if (scene.confirmState.overlay && scene.confirmState.overlay.scene) {
            scene.confirmState.overlay.destroy();
        }

        if (scene.confirmState.dialog && scene.confirmState.dialog.scene) {
            scene.confirmState.dialog.destroy(true);
        }

        scene.confirmState = null;
    }
};

window.SettingsModalUi = SettingsModalUi;
