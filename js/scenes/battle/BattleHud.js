/**
 * BattleHud - BattleScene HUD and interaction facade methods.
 *
 * These methods run with BattleScene as `this`.
 */

const BattleHud = {
    createTopBar() {
        this.createStatusBar(this.playerElf, 20, 10, true);
        this.createStatusBar(this.enemyElf, this.W - 270, 10, false);

        this.timerText = this.add.text(this.W / 2, 40, '', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    },

    createStatusBar(elf, x, y, isPlayer) {
        const container = this.add.container(x, y);
        const w = 250;
        const h = 60;

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 0.9);
        bg.fillRoundedRect(0, 0, w, h, 8);
        bg.lineStyle(2, 0x3a5a8a);
        bg.strokeRoundedRect(0, 0, w, h, 8);
        container.add(bg);

        const iconBg = this.add.graphics();
        const iconColor = isPlayer ? 0x3388dd : 0xdd4444;
        iconBg.fillStyle(iconColor, 1);
        iconBg.fillCircle(30, 30, 22);
        iconBg.lineStyle(2, 0xffffff, 0.8);
        iconBg.strokeCircle(30, 30, 22);
        container.add(iconBg);

        const iconText = this.add.text(30, 30, elf.name.charAt(0), {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(iconText);

        const nameText = this.add.text(60, 8, elf.getDisplayName(), {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(nameText);

        const lvText = this.add.text(w - 10, 8, `Lv.${elf.level}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(1, 0);
        container.add(lvText);

        const hpBarW = w - 70;
        const hpBarH = 14;
        const hpBarX = 60;
        const hpBarY = 32;

        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x222222, 1);
        hpBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
        container.add(hpBg);

        const hpBar = this.add.graphics();
        container.add(hpBar);

        const hpText = this.add.text(hpBarX + hpBarW / 2, hpBarY + hpBarH + 3,
            `${elf.currentHp} / ${elf.getMaxHp()}`, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0.5, 0);
        container.add(hpText);

        const info = { container, hpBar, hpText, lvText, hpBarX, hpBarY, hpBarW, hpBarH };
        if (isPlayer) {
            this.playerStatus = info;
        } else {
            this.enemyStatus = info;
        }

        this.updateStatusHp(isPlayer ? 'player' : 'enemy');
    },

    updateStatusHp(side) {
        const elf = side === 'player' ? this.playerElf : this.enemyElf;
        const info = side === 'player' ? this.playerStatus : this.enemyStatus;

        const hp = Math.max(0, elf.currentHp);
        const maxHp = elf.getMaxHp();
        const pct = hp / maxHp;

        let color = 0x44dd44;
        if (pct <= 0.2) {
            color = 0xdd4444;
        } else if (pct <= 0.5) {
            color = 0xddaa44;
        }

        info.hpBar.clear();
        if (pct > 0) {
            info.hpBar.fillStyle(color, 1);
            info.hpBar.fillRoundedRect(info.hpBarX + 2, info.hpBarY + 2, (info.hpBarW - 4) * pct, info.hpBarH - 4, 3);
        }
        info.hpText.setText(`${hp} / ${maxHp}`);
    },

    createLeftInfoPanel(panelY) {
        const x = 15;
        const y = panelY + 10;
        const w = 280;
        const h = 150;

        const logBg = this.add.graphics();
        logBg.fillStyle(0x0a1520, 1);
        logBg.fillRoundedRect(x, y, w, h, 6);
        logBg.lineStyle(2, 0x2a4a6a);
        logBg.strokeRoundedRect(x, y, w, h, 6);

        this.logText = this.add.text(x + 10, y + 10, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#44dd88',
            wordWrap: { width: w - 20 },
            lineSpacing: 4
        });
    },

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

        btnHit.on('pointerdown', () => {
            this.popupContainer.setVisible(false);
            if (this.popupCallback) {
                const callback = this.popupCallback;
                this.popupCallback = null;
                callback();
            } else {
                this.returnToMap();
            }
        });
    },

    showPopup(title, message, callback = null) {
        this.popupText.setText(`${title}\n\n${message}`);
        this.popupCallback = callback;
        this.popupContainer.setVisible(true);
    },

    addLog(msg) {
        if (msg && msg.trim()) {
            this.messageQueue.push(msg);
        }
    },

    showLogs(onComplete) {
        if (this.messageQueue.length === 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        const msg = this.messageQueue.shift();
        const current = this.logText.text;
        const lines = current ? current.split('\n') : [];
        lines.push(`> ${msg}`);
        if (lines.length > 6) {
            lines.shift();
        }
        this.logText.setText(lines.join('\n'));

        const delay = Math.max(600, 400 + msg.length * 35);
        this.time.delayedCall(delay, () => {
            this.showLogs(onComplete);
        });
    },

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

    stopTurnTimer() {
        if (this.turnTimer) {
            this.turnTimer.remove();
            this.turnTimer = null;
        }
        this.timerText.setText('');
    },

    updateTimerDisplay() {
        if (this.menuEnabled && !this.battleEnded) {
            this.timerText.setText(`⏱ ${this.turnTimeLeft}s`);
            this.timerText.setVisible(true);
        } else {
            this.timerText.setVisible(false);
        }
    },

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
    AppContext.register('BattleHud', BattleHud);
}

window.BattleHud = BattleHud;
