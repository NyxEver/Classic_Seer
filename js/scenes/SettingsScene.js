/**
 * SettingsScene - 设置场景
 * 音量控制、返回主菜单、删除存档
 */

class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    init(data) {
        this.returnScene = data.returnScene || 'SpaceshipScene';
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建设置面板
        this.createSettingsPanel(width, height);

        console.log('SettingsScene created');
    }

    createBackground(width, height) {
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a2a3a, 0x1a2a3a, 0x0a1a2a, 0x0a1a2a, 1);
        graphics.fillRect(0, 0, width, height);
    }

    createSettingsPanel(width, height) {
        const panelW = 500;
        const panelH = 450;
        const panelX = width / 2;
        const panelY = height / 2;

        // 面板容器
        const container = this.add.container(panelX, panelY);

        // 面板背景
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2a3a5a, 0x2a3a5a, 0x1a2a4a, 0x1a2a4a, 1);
        bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
        bg.lineStyle(3, 0x6a9aca, 1);
        bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
        container.add(bg);

        // 标题
        const title = this.add.text(0, -panelH / 2 + 40, '⚙️ 设置', {
            fontSize: '28px',
            color: '#88ccff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(title);

        // 分隔线
        const divider = this.add.graphics();
        divider.lineStyle(2, 0x4a6a8a, 0.8);
        divider.lineBetween(-panelW / 2 + 30, -panelH / 2 + 70, panelW / 2 - 30, -panelH / 2 + 70);
        container.add(divider);

        // 音量控制区域
        this.createVolumeControls(container, -panelH / 2 + 110);

        // 功能按钮区域
        this.createActionButtons(container, 50);

        // 返回按钮
        const backBtn = this.createButton(0, panelH / 2 - 50, '返回游戏', () => {
            SceneManager.changeScene(this, this.returnScene);
        });
        container.add(backBtn);
    }

    createVolumeControls(container, startY) {
        // 背景音乐控制
        const bgmLabel = this.add.text(-180, startY, '🎵 背景音乐', {
            fontSize: '18px',
            color: '#ccddee'
        }).setOrigin(0, 0.5);
        container.add(bgmLabel);

        const bgmSlider = this.createSlider(100, startY, 0.7, (value) => {
            console.log('BGM volume:', value);
            // 暂未实现音频系统
        });
        container.add(bgmSlider);

        // 禁用标记
        const bgmNote = this.add.text(200, startY, '(暂未开放)', {
            fontSize: '12px',
            color: '#666688'
        }).setOrigin(0, 0.5);
        container.add(bgmNote);

        // 音效控制
        const sfxLabel = this.add.text(-180, startY + 50, '🔊 游戏音效', {
            fontSize: '18px',
            color: '#ccddee'
        }).setOrigin(0, 0.5);
        container.add(sfxLabel);

        const sfxSlider = this.createSlider(100, startY + 50, 0.8, (value) => {
            console.log('SFX volume:', value);
            // 暂未实现音频系统
        });
        container.add(sfxSlider);

        const sfxNote = this.add.text(200, startY + 50, '(暂未开放)', {
            fontSize: '12px',
            color: '#666688'
        }).setOrigin(0, 0.5);
        container.add(sfxNote);
    }

    createSlider(x, y, initialValue, onChange) {
        const container = this.add.container(x, y);

        const trackW = 120;
        const trackH = 8;

        // 滑条背景
        const track = this.add.graphics();
        track.fillStyle(0x3a4a5a, 1);
        track.fillRoundedRect(-trackW / 2, -trackH / 2, trackW, trackH, 4);
        container.add(track);

        // 填充部分
        const fill = this.add.graphics();
        const fillW = trackW * initialValue;
        fill.fillStyle(0x6a9aca, 1);
        fill.fillRoundedRect(-trackW / 2, -trackH / 2, fillW, trackH, 4);
        container.add(fill);

        // 滑块（禁用交互样式）
        const knob = this.add.circle(
            -trackW / 2 + fillW,
            0,
            10,
            0x8abada
        );
        knob.setAlpha(0.5); // 禁用状态
        container.add(knob);

        return container;
    }

    createActionButtons(container, startY) {
        // 返回主菜单按钮
        const menuBtn = this.createButton(0, startY, '返回主菜单', () => {
            this.showConfirmDialog(
                '确定返回主菜单吗？',
                '未保存的进度将会丢失',
                () => {
                    SceneManager.changeScene(this, 'MainMenuScene');
                }
            );
        });
        container.add(menuBtn);

        // 删除存档按钮
        const deleteBtn = this.createButton(0, startY + 60, '删除存档', () => {
            this.showConfirmDialog(
                '确定删除存档吗？',
                '此操作不可恢复！',
                () => {
                    SaveSystem.deleteSave();
                    SceneManager.changeScene(this, 'MainMenuScene');
                },
                true // 危险操作
            );
        }, true); // 危险按钮样式
        container.add(deleteBtn);
    }

    createButton(x, y, text, callback, isDanger = false) {
        const container = this.add.container(x, y);
        const btnW = 200;
        const btnH = 45;

        const bg = this.add.graphics();
        if (isDanger) {
            bg.fillGradientStyle(0x8a4a4a, 0x8a4a4a, 0x6a3a3a, 0x6a3a3a, 1);
            bg.lineStyle(2, 0xaa6a6a, 1);
        } else {
            bg.fillGradientStyle(0x4a6a8a, 0x4a6a8a, 0x3a5a7a, 0x3a5a7a, 1);
            bg.lineStyle(2, 0x6a9aca, 1);
        }
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        const hitArea = new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            if (isDanger) {
                bg.clear();
                bg.fillGradientStyle(0xaa6a6a, 0xaa6a6a, 0x8a5a5a, 0x8a5a5a, 1);
                bg.lineStyle(2, 0xcc8a8a, 1);
            } else {
                bg.clear();
                bg.fillGradientStyle(0x6a8aaa, 0x6a8aaa, 0x5a7a9a, 0x5a7a9a, 1);
                bg.lineStyle(2, 0x8abada, 1);
            }
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            container.setScale(1.05);
        });

        container.on('pointerout', () => {
            if (isDanger) {
                bg.clear();
                bg.fillGradientStyle(0x8a4a4a, 0x8a4a4a, 0x6a3a3a, 0x6a3a3a, 1);
                bg.lineStyle(2, 0xaa6a6a, 1);
            } else {
                bg.clear();
                bg.fillGradientStyle(0x4a6a8a, 0x4a6a8a, 0x3a5a7a, 0x3a5a7a, 1);
                bg.lineStyle(2, 0x6a9aca, 1);
            }
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            container.setScale(1);
        });

        container.on('pointerdown', () => callback());

        return container;
    }

    showConfirmDialog(title, message, onConfirm, isDanger = false) {
        const { width, height } = this.cameras.main;

        // 遮罩
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(200);

        // 对话框容器
        const dialogContainer = this.add.container(width / 2, height / 2).setDepth(201);

        // 对话框背景
        const dialogBg = this.add.graphics();
        dialogBg.fillGradientStyle(0x2a3a5a, 0x2a3a5a, 0x1a2a4a, 0x1a2a4a, 1);
        dialogBg.fillRoundedRect(-180, -100, 360, 200, 12);
        dialogBg.lineStyle(3, isDanger ? 0xaa6a6a : 0x6a9aca, 1);
        dialogBg.strokeRoundedRect(-180, -100, 360, 200, 12);
        dialogContainer.add(dialogBg);

        // 标题
        const titleText = this.add.text(0, -60, title, {
            fontSize: '20px',
            color: isDanger ? '#ffaaaa' : '#88ccff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        dialogContainer.add(titleText);

        // 消息
        const msgText = this.add.text(0, -20, message, {
            fontSize: '16px',
            color: '#ccddee'
        }).setOrigin(0.5);
        dialogContainer.add(msgText);

        // 取消按钮
        const cancelBtn = this.createDialogBtn(-80, 50, '取消', () => {
            overlay.destroy();
            dialogContainer.destroy();
        });
        dialogContainer.add(cancelBtn);

        // 确认按钮
        const confirmBtn = this.createDialogBtn(80, 50, '确认', () => {
            overlay.destroy();
            dialogContainer.destroy();
            onConfirm();
        }, isDanger);
        dialogContainer.add(confirmBtn);
    }

    createDialogBtn(x, y, text, callback, isDanger = false) {
        const container = this.add.container(x, y);
        const btnW = 100;
        const btnH = 36;

        const bg = this.add.graphics();
        if (isDanger) {
            bg.fillStyle(0x8a4a4a, 1);
            bg.lineStyle(2, 0xaa6a6a, 1);
        } else {
            bg.fillStyle(0x4a6a8a, 1);
            bg.lineStyle(2, 0x6a9aca, 1);
        }
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(label);

        const hitArea = new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerover', () => {
            container.setScale(1.1);
        });

        container.on('pointerout', () => {
            container.setScale(1);
        });

        container.on('pointerdown', () => callback());

        return container;
    }
}
