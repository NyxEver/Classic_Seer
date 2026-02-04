/**
 * BattleScene - 战斗场景
 * 赛尔号风格 2D 战斗界面
 */

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerElf = data.playerElf;
        this.enemyElf = data.enemyElf;
        this.battleType = data.battleType || 'wild';
        this.canEscape = data.canEscape !== false;
        this.canCatch = data.canCatch !== false && this.battleType === 'wild';
        this.returnScene = data.returnScene || 'BootScene';
    }

    create() {
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        // 状态
        this.messageQueue = [];
        this.menuEnabled = false;
        this.battleEnded = false;
        this.turnTimer = null;
        this.turnTimeLeft = 10;

        // 创建 UI
        this.createBackground();
        this.createTopBar();
        this.createMainBattleArea();
        this.createBottomControlPanel();
        this.createCenterPopupDialog();

        // 初始化战斗管理器
        this.battleManager = new BattleManager({
            playerElf: this.playerElf,
            enemyElf: this.enemyElf,
            battleType: this.battleType,
            canEscape: this.canEscape,
            canCatch: this.canCatch,
            onMessage: (msg) => this.addLog(msg),
            onBattleEnd: (result) => this.handleBattleEnd(result)
        });

        // 开场日志
        const startMsg = this.battleType === 'wild'
            ? `野生的 ${this.enemyElf.getDisplayName()} 出现了！`
            : `对手派出了 ${this.enemyElf.getDisplayName()}！`;
        this.addLog(startMsg);
        this.addLog(`去吧！${this.playerElf.getDisplayName()}！`);

        // 显示日志后启用菜单
        this.showLogs(() => {
            this.enableMenu();
            this.startTurnTimer();
        });
    }

    // ========== 背景 ==========
    createBackground() {
        const g = this.add.graphics();
        g.fillGradientStyle(0x5588bb, 0x5588bb, 0x334466, 0x334466, 1);
        g.fillRect(0, 0, this.W, this.H);
        g.fillStyle(0x446633, 1);
        g.fillRect(0, 280, this.W, 150);
        g.lineStyle(2, 0x335522);
        g.lineBetween(0, 280, this.W, 280);
    }

    // ========== 顶部状态栏 ==========
    createTopBar() {
        this.createStatusBar(this.playerElf, 20, 10, true);
        this.createStatusBar(this.enemyElf, this.W - 270, 10, false);

        // 倒计时文本（顶部居中，大字体，白色黑描边）
        this.timerText = this.add.text(this.W / 2, 40, '', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createStatusBar(elf, x, y, isPlayer) {
        const container = this.add.container(x, y);
        const w = 250, h = 60;

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
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(iconText);

        const nameText = this.add.text(60, 8, elf.getDisplayName(), {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        container.add(nameText);

        const lvText = this.add.text(w - 10, 8, `Lv.${elf.level}`, {
            fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa'
        }).setOrigin(1, 0);
        container.add(lvText);

        const hpBarW = w - 70, hpBarH = 14, hpBarX = 60, hpBarY = 32;

        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x222222, 1);
        hpBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
        container.add(hpBg);

        const hpBar = this.add.graphics();
        container.add(hpBar);

        const hpText = this.add.text(hpBarX + hpBarW / 2, hpBarY + hpBarH + 3,
            `${elf.currentHp} / ${elf.getMaxHp()}`, {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5, 0);
        container.add(hpText);

        const info = { container, hpBar, hpText, lvText, hpBarX, hpBarY, hpBarW, hpBarH };

        if (isPlayer) this.playerStatus = info;
        else this.enemyStatus = info;

        this.updateStatusHp(isPlayer ? 'player' : 'enemy');
    }

    updateStatusHp(side) {
        const elf = side === 'player' ? this.playerElf : this.enemyElf;
        const info = side === 'player' ? this.playerStatus : this.enemyStatus;

        const hp = Math.max(0, elf.currentHp);
        const maxHp = elf.getMaxHp();
        const pct = hp / maxHp;

        let color = 0x44dd44;
        if (pct <= 0.2) color = 0xdd4444;
        else if (pct <= 0.5) color = 0xddaa44;

        info.hpBar.clear();
        if (pct > 0) {
            info.hpBar.fillStyle(color, 1);
            info.hpBar.fillRoundedRect(info.hpBarX + 2, info.hpBarY + 2, (info.hpBarW - 4) * pct, info.hpBarH - 4, 3);
        }
        info.hpText.setText(`${hp} / ${maxHp}`);
    }

    // ========== 主战斗区 ==========
    createMainBattleArea() {
        this.playerSprite = this.createCharacterSprite(200, 230, this.playerElf, true);
        this.enemySprite = this.createCharacterSprite(this.W - 200, 230, this.enemyElf, false);
    }

    createCharacterSprite(x, y, elf, isPlayer) {
        const container = this.add.container(x, y);
        const size = 80;
        const circle = this.add.graphics();
        const color = isPlayer ? 0x4499ee : 0xee5544;
        circle.fillStyle(color, 1);
        circle.fillCircle(0, 0, size);
        circle.lineStyle(4, 0xffffff, 0.9);
        circle.strokeCircle(0, 0, size);
        container.add(circle);

        const nameText = this.add.text(0, -10, elf.name, {
            fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(nameText);

        const typeName = DataLoader.getTypeName(elf.type);
        const typeText = this.add.text(0, 20, typeName, {
            fontSize: '14px', fontFamily: 'Arial', color: '#dddddd'
        }).setOrigin(0.5);
        container.add(typeText);

        return container;
    }

    // ========== 底部控制区 ==========
    createBottomControlPanel() {
        const panelY = 430;
        const panelH = 170;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a2a3a, 0.95);
        panelBg.fillRect(0, panelY, this.W, panelH);
        panelBg.lineStyle(3, 0x3a5a7a);
        panelBg.lineBetween(0, panelY, this.W, panelY);

        this.createLeftInfoPanel(panelY);
        this.createMiddleSkillPanel(panelY);
        this.createRightActionButtons(panelY);
    }

    createLeftInfoPanel(panelY) {
        const x = 15, y = panelY + 10;
        const w = 280, h = 150;

        const logBg = this.add.graphics();
        logBg.fillStyle(0x0a1520, 1);
        logBg.fillRoundedRect(x, y, w, h, 6);
        logBg.lineStyle(2, 0x2a4a6a);
        logBg.strokeRoundedRect(x, y, w, h, 6);

        this.logText = this.add.text(x + 10, y + 10, '', {
            fontSize: '14px', fontFamily: 'Arial', color: '#44dd88',
            wordWrap: { width: w - 20 }, lineSpacing: 4
        });
    }

    createMiddleSkillPanel(panelY) {
        const x = 310, y = panelY + 10;
        const w = 380, h = 150;

        const skillBg = this.add.graphics();
        skillBg.fillStyle(0x152030, 1);
        skillBg.fillRoundedRect(x, y, w, h, 6);
        skillBg.lineStyle(2, 0x2a4a6a);
        skillBg.strokeRoundedRect(x, y, w, h, 6);

        this.skillContainer = this.add.container(0, 0);

        // 技能按钮（2x2 布局，填满面板）
        const skills = this.playerElf.getSkillDetails();
        const skillBtnW = 175;
        const skillBtnH = 55;
        const startX = x + 15;
        const startY = y + 20;
        const gapX = 10;
        const gapY = 10;

        this.skillButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = startX + col * (skillBtnW + gapX);
            const btnY = startY + row * (skillBtnH + gapY);

            if (i < skills.length) {
                const skill = skills[i];
                const btn = this.createSkillButton(btnX, btnY, skillBtnW, skillBtnH, skill, i);
                this.skillButtons.push(btn);
                this.skillContainer.add(btn);
            } else {
                const emptyBtn = this.createEmptySkillSlot(btnX, btnY, skillBtnW, skillBtnH);
                this.skillButtons.push(emptyBtn);
                this.skillContainer.add(emptyBtn);
            }
        }
    }

    createSkillButton(x, y, w, h, skill, index) {
        const container = this.add.container(x, y);
        const disabled = skill.currentPP <= 0;

        const bg = this.add.graphics();
        bg.fillStyle(disabled ? 0x333333 : 0x2a4a7a, 1);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(2, disabled ? 0x444444 : 0x4a7aba);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        // 技能名
        const nameText = this.add.text(10, 10, skill.name, {
            fontSize: '16px', fontFamily: 'Arial',
            color: disabled ? '#666666' : '#ffffff', fontStyle: 'bold'
        });
        container.add(nameText);

        // 属性标签
        const typeName = DataLoader.getTypeName(skill.type);
        const typeText = this.add.text(10, 32, typeName, {
            fontSize: '12px', fontFamily: 'Arial', color: '#88aacc'
        });
        container.add(typeText);

        // PP值
        const ppText = this.add.text(w - 10, h / 2, `PP ${skill.currentPP}/${skill.pp}`, {
            fontSize: '13px', fontFamily: 'Arial',
            color: disabled ? '#444444' : '#aaddaa'
        }).setOrigin(1, 0.5);
        container.add(ppText);

        // 交互
        if (!disabled) {
            const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
            container.add(hit);

            hit.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0x3a6aaa, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x5a9ada);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0x2a4a7a, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x4a7aba);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerdown', () => {
                if (this.menuEnabled && !this.battleEnded) {
                    this.doSkill(skill.id);
                }
            });
        }

        container._skill = skill;
        container._ppText = ppText;
        container._index = index;
        return container;
    }

    createEmptySkillSlot(x, y, w, h) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 0.5);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(1, 0x333333);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const text = this.add.text(w / 2, h / 2, '-', {
            fontSize: '18px', fontFamily: 'Arial', color: '#444444'
        }).setOrigin(0.5);
        container.add(text);

        return container;
    }

    // 更新技能 PP 显示
    updateSkillPP() {
        const skills = this.playerElf.getSkillDetails();
        for (let i = 0; i < skills.length && i < this.skillButtons.length; i++) {
            const btn = this.skillButtons[i];
            if (btn._skill && btn._ppText) {
                const skill = skills[i];
                btn._ppText.setText(`PP ${skill.currentPP}/${skill.pp}`);
            }
        }
    }

    createRightActionButtons(panelY) {
        const x = 710, y = panelY + 15;
        const btnW = 120, btnH = 45;
        const gap = 10;

        this.actionContainer = this.add.container(0, 0);

        const buttons = [
            { label: '战斗', action: () => { }, disabled: true },
            { label: '背包', action: () => this.addLog('背包功能尚未开放'), disabled: true },
            { label: '精灵', action: () => this.addLog('精灵切换尚未开放'), disabled: true },
            { label: '逃跑', action: () => this.doEscape(), disabled: false }
        ];

        this.actionButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = x + col * (btnW + gap);
            const btnY = y + row * (btnH + gap);
            const btn = this.createActionButton(btnX, btnY, btnW, btnH, buttons[i]);
            this.actionButtons.push(btn);
            this.actionContainer.add(btn);
        }
    }

    createActionButton(x, y, w, h, config) {
        const container = this.add.container(x, y);
        const disabled = config.disabled;

        const bg = this.add.graphics();
        bg.fillStyle(disabled ? 0x333333 : 0x2a5a8a, 1);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(2, disabled ? 0x444444 : 0x4a8aca);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const text = this.add.text(w / 2, h / 2, config.label, {
            fontSize: '16px', fontFamily: 'Arial',
            color: disabled ? '#666666' : '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        if (!disabled) {
            const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
            container.add(hit);

            hit.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0x3a7aba, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x5aaaee);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0x2a5a8a, 1);
                bg.fillRoundedRect(0, 0, w, h, 6);
                bg.lineStyle(2, 0x4a8aca);
                bg.strokeRoundedRect(0, 0, w, h, 6);
            });

            hit.on('pointerdown', () => {
                if (this.menuEnabled && !this.battleEnded) {
                    config.action();
                }
            });
        }

        return container;
    }

    // ========== 中央弹窗 ==========
    createCenterPopupDialog() {
        this.popupContainer = this.add.container(this.W / 2, this.H / 2);
        this.popupContainer.setVisible(false);
        this.popupContainer.setDepth(100);

        const w = 400, h = 200;

        const mask = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.6).setOrigin(0.5);
        this.popupContainer.add(mask);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(3, 0x4a8aca);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        this.popupContainer.add(bg);

        this.popupText = this.add.text(0, -30, '', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
            align: 'center', wordWrap: { width: w - 40 }
        }).setOrigin(0.5);
        this.popupContainer.add(this.popupText);

        const btnW = 120, btnH = 40;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x3a7aba, 1);
        btnBg.fillRoundedRect(-btnW / 2, 40, btnW, btnH, 6);
        btnBg.lineStyle(2, 0x5aaaee);
        btnBg.strokeRoundedRect(-btnW / 2, 40, btnW, btnH, 6);
        this.popupContainer.add(btnBg);

        const btnText = this.add.text(0, 60, '确认', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.popupContainer.add(btnText);

        const btnHit = this.add.rectangle(0, 60, btnW, btnH).setInteractive({ useHandCursor: true });
        this.popupContainer.add(btnHit);

        btnHit.on('pointerdown', () => {
            this.popupContainer.setVisible(false);
            this.returnToMap();
        });
    }

    showPopup(title, message) {
        this.popupText.setText(`${title}\n\n${message}`);
        this.popupContainer.setVisible(true);
    }

    // ========== 日志系统 ==========
    addLog(msg) {
        if (msg && msg.trim()) {
            this.messageQueue.push(msg);
        }
    }

    showLogs(onComplete) {
        if (this.messageQueue.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const msg = this.messageQueue.shift();
        const current = this.logText.text;
        const lines = current ? current.split('\n') : [];
        lines.push('> ' + msg);
        if (lines.length > 6) lines.shift();
        this.logText.setText(lines.join('\n'));

        const delay = Math.max(600, 400 + msg.length * 35);

        this.time.delayedCall(delay, () => {
            this.showLogs(onComplete);
        });
    }

    // ========== 回合计时器 ==========
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
                    // 超时，自动使用技能1
                    this.addLog('时间到！自动使用技能！');
                    const skills = this.playerElf.getSkillDetails();
                    if (skills.length > 0 && skills[0].currentPP > 0) {
                        this.doSkill(skills[0].id);
                    } else {
                        // 如果技能1没PP，找第一个有PP的技能
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
    }

    stopTurnTimer() {
        if (this.turnTimer) {
            this.turnTimer.remove();
            this.turnTimer = null;
        }
        this.timerText.setText('');
    }

    updateTimerDisplay() {
        if (this.menuEnabled && !this.battleEnded) {
            this.timerText.setText(`⏱ ${this.turnTimeLeft}s`);
            this.timerText.setVisible(true);
        } else {
            this.timerText.setVisible(false);
        }
    }

    // ========== 战斗操作 ==========
    enableMenu() {
        this.menuEnabled = true;
        // 恢复技能面板和操作按钮可见度
        this.skillContainer.setAlpha(1);
        this.actionContainer.setAlpha(1);
    }

    disableMenu() {
        this.menuEnabled = false;
        this.stopTurnTimer();
        // 技能面板和操作按钮变灰
        this.skillContainer.setAlpha(0.4);
        this.actionContainer.setAlpha(0.4);
    }

    doSkill(skillId) {
        this.disableMenu();
        this.battleManager.setPlayerAction(BattleManager.ACTION.SKILL, { skillId });
        this.executeTurn();
    }

    doEscape() {
        this.disableMenu();
        this.battleManager.setPlayerAction(BattleManager.ACTION.ESCAPE);
        this.executeTurn();
    }

    async executeTurn() {
        const result = await this.battleManager.executeTurn();

        // 动画
        for (const event of result.events) {
            if (event.type === 'attack' && event.hit && event.damage > 0) {
                await this.playAttackAnim(event.actor);
            }
        }

        // 更新 HP 和 PP
        this.updateStatusHp('player');
        this.updateStatusHp('enemy');
        this.updateSkillPP();

        // 显示日志
        await new Promise(resolve => this.showLogs(resolve));

        // 检查逃跑成功
        if (result.escaped) {
            this.showPopup('逃跑成功！', '成功逃离了战斗！');
            return;
        }

        // 检查战斗结束
        if (result.battleEnded) {
            return;
        }

        // 继续战斗
        if (!this.battleEnded) {
            this.enableMenu();
            this.startTurnTimer();
        }
    }

    playAttackAnim(actor) {
        return new Promise(resolve => {
            const isPlayer = actor === 'player';
            const atkSprite = isPlayer ? this.playerSprite : this.enemySprite;
            const defSprite = isPlayer ? this.enemySprite : this.playerSprite;
            const moveX = isPlayer ? 60 : -60;

            this.tweens.add({
                targets: atkSprite,
                x: atkSprite.x + moveX,
                duration: 100,
                ease: 'Power2',
                yoyo: true,
                onComplete: () => {
                    this.tweens.add({
                        targets: defSprite,
                        alpha: 0.3,
                        duration: 60,
                        yoyo: true,
                        repeat: 2,
                        onComplete: () => {
                            defSprite.alpha = 1;
                            this.updateStatusHp(isPlayer ? 'enemy' : 'player');
                            resolve();
                        }
                    });
                }
            });
        });
    }

    handleBattleEnd(result) {
        this.battleEnded = true;
        this.disableMenu();

        if (result.victory) {
            let msg = `获得 ${result.expGained} 经验值！`;
            if (result.levelUps && result.levelUps.length > 0) {
                for (const lu of result.levelUps) {
                    msg += `\n升到 ${lu.newLevel} 级！`;
                    for (const sid of lu.newSkills) {
                        const sk = DataLoader.getSkill(sid);
                        if (sk) msg += `\n学会 ${sk.name}！`;
                    }
                }
            }
            this.time.delayedCall(500, () => {
                this.showPopup('🎉 战斗胜利！', msg);
            });
        } else {
            this.time.delayedCall(500, () => {
                this.showPopup('战斗失败', `${this.playerElf.getDisplayName()} 倒下了...`);
            });
        }
    }

    returnToMap() {
        this.scene.start(this.returnScene);
    }
}

window.BattleScene = BattleScene;
