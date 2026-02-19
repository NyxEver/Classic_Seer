/**
 * BattleDialogView — 战斗弹窗、回合计时器与菜单控制模块
 *
 * 职责：管理居中弹窗对话框的创建与显示、回合倒计时器、以及菜单启用/禁用状态。
 * 这些方法在运行时以 BattleScene 作为 `this` 调用（mixin 模式）。
 */

const BattleDialogView = {
    /**
     * 创建居中弹窗对话框（含遮罩、文本区域和确认按钮）。
     * 弹窗默认不可见，通过 showPopup() 显示。
     */
    createCenterPopupDialog() {
        this.popupContainer = this.add.container(this.W / 2, this.H / 2);
        this.popupContainer.setVisible(false);
        this.popupContainer.setDepth(100);

        const w = 400;
        const h = 200;

        const mask = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.6).setOrigin(0.5);
        this.popupContainer.add(mask);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(3, 0x4a8aca);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        this.popupContainer.add(bg);

        this.popupText = this.add.text(0, -30, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: w - 40 }
        }).setOrigin(0.5);
        this.popupContainer.add(this.popupText);

        const btnW = 120;
        const btnH = 40;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x3a7aba, 1);
        btnBg.fillRoundedRect(-btnW / 2, 40, btnW, btnH, 6);
        btnBg.lineStyle(2, 0x5aaaee);
        btnBg.strokeRoundedRect(-btnW / 2, 40, btnW, btnH, 6);
        this.popupContainer.add(btnBg);

        const btnText = this.add.text(0, 60, '确认', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.popupContainer.add(btnText);

        const btnHit = this.add.rectangle(0, 60, btnW, btnH).setInteractive({ useHandCursor: true });
        this.popupContainer.add(btnHit);

        this.popupConfirmBg = btnBg;
        this.popupConfirmText = btnText;
        this.popupConfirmHit = btnHit;
        this.popupConsumed = false;

        btnHit.on('pointerdown', () => {
            if (this.popupConsumed) {
                return;
            }

            this.popupConsumed = true;
            if (this.popupConfirmHit) {
                this.popupConfirmHit.disableInteractive();
            }
            if (this.popupConfirmBg) {
                this.popupConfirmBg.setAlpha(0.65);
            }
            if (this.popupConfirmText) {
                this.popupConfirmText.setAlpha(0.65);
            }

            this.popupContainer.setVisible(false);
            if (this.popupCallback) {
                const callback = this.popupCallback;
                this.popupCallback = null;
                callback();
            } else {
                if (typeof this.finalizeBattleOnce === 'function') {
                    this.finalizeBattleOnce('return_to_map', { reason: 'popup_default_confirm' });
                } else if (typeof this.returnToMap === 'function') {
                    this.returnToMap();
                }
            }
        });
    },

    /**
     * 显示弹窗并设置标题、内容文本和确认回调。
     * @param {string} title - 弹窗标题
     * @param {string} message - 弹窗内容
     * @param {Function|null} [callback=null] - 确认按钮回调，为 null 时使用默认收口
     */
    showPopup(title, message, callback = null) {
        this.popupText.setText(`${title}\n\n${message}`);
        this.popupCallback = callback;
        this.popupConsumed = false;
        if (this.popupConfirmHit) {
            this.popupConfirmHit.setInteractive({ useHandCursor: true });
        }
        if (this.popupConfirmBg) {
            this.popupConfirmBg.setAlpha(1);
        }
        if (this.popupConfirmText) {
            this.popupConfirmText.setAlpha(1);
        }
        this.popupContainer.setVisible(true);
    },

    /**
     * 启动回合倒计时器（10 秒），超时后自动使用第一个可用技能。
     */
    startTurnTimer() {
        this.turnTimeLeft = 10;
        this.updateTimerDisplay();

        if (this.turnTimer) {
            this.turnTimer.remove();
        }

        this.turnTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.turnTimeLeft--;
                this.updateTimerDisplay();

                if (this.turnTimeLeft <= 0 && this.menuEnabled && !this.battleEnded) {
                    this.addLog('时间到！自动使用技能！');
                    const skills = this.playerElf.getSkillDetails();
                    if (skills.length > 0 && skills[0].currentPP > 0) {
                        this.doSkill(skills[0].id);
                    } else {
                        for (const skill of skills) {
                            if (skill.currentPP > 0) {
                                this.doSkill(skill.id);
                                return;
                            }
                        }
                    }
                }
            },
            loop: true
        });
    },

    /**
     * 停止回合倒计时器并清除显示。
     */
    stopTurnTimer() {
        if (this.turnTimer) {
            this.turnTimer.remove();
            this.turnTimer = null;
        }
        this.timerText.setText('');
    },

    /**
     * 刷新计时器文本显示（菜单启用且未结束时显示，否则隐藏）。
     */
    updateTimerDisplay() {
        if (this.menuEnabled && !this.battleEnded) {
            this.timerText.setText(`⏱ ${this.turnTimeLeft}s`);
            this.timerText.setVisible(true);
        } else {
            this.timerText.setVisible(false);
        }
    },

    /**
     * 启用菜单（技能面板和动作按钮恢复可用状态）。
     */
    enableMenu() {
        this.menuEnabled = true;
        if (typeof this.refreshActionButtons === 'function') {
            this.refreshActionButtons();
            return;
        }
        if (this.skillContainer) {
            this.skillContainer.setAlpha(1);
        }
        if (this.actionContainer) {
            this.actionContainer.setAlpha(1);
        }
    },

    /**
     * 禁用菜单（技能面板和动作按钮变灰）并停止计时器。
     */
    disableMenu() {
        this.menuEnabled = false;
        this.stopTurnTimer();
        if (typeof this.refreshActionButtons === 'function') {
            this.refreshActionButtons();
            return;
        }
        if (this.skillContainer) {
            this.skillContainer.setAlpha(0.4);
        }
        if (this.actionContainer) {
            this.actionContainer.setAlpha(0.4);
        }
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleDialogView', BattleDialogView);
}

window.BattleDialogView = BattleDialogView;
