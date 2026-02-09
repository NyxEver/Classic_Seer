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

        // 检查是否有多只精灵可切换
        const hasMultipleElves = PlayerData.elves.length > 1;

        const buttons = [
            { label: '战斗', action: () => { }, disabled: true },
            { label: '道具', action: () => this.showItemPanel(), disabled: false },
            { label: '精灵', action: () => this.showElfSwitchPanel(), disabled: !hasMultipleElves },
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
            // 如果有回调函数则执行回调，否则返回地图
            if (this.popupCallback) {
                const callback = this.popupCallback;
                this.popupCallback = null;  // 清除回调
                callback();
            } else {
                this.returnToMap();
            }
        });
    }

    showPopup(title, message, callback = null) {
        this.popupText.setText(`${title}\n\n${message}`);
        this.popupCallback = callback;  // 存储回调
        this.popupContainer.setVisible(true);
    }

    // ========== 胶囊选择面板 ==========
    showCapsulePanel() {
        if (!this.canCatch) {
            this.addLog('无法在此战斗中捕捉！');
            return;
        }

        const capsules = ItemBag.getCapsules();
        if (capsules.length === 0) {
            this.addLog('没有可用的精灵胶囊！');
            return;
        }

        // 创建胶囊选择弹窗
        this.capsulePanelContainer = this.add.container(this.W / 2, this.H / 2);
        this.capsulePanelContainer.setDepth(90);

        const w = 350, h = 250;

        // 背景遮罩
        const mask = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.5).setOrigin(0.5);
        mask.setInteractive(); // 阻止点击穿透
        this.capsulePanelContainer.add(mask);

        // 面板背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(3, 0x4a8aca);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        this.capsulePanelContainer.add(bg);

        // 标题
        const title = this.add.text(0, -h / 2 + 25, '选择胶囊', {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.capsulePanelContainer.add(title);

        // 胶囊列表
        const startY = -h / 2 + 60;
        const itemH = 50;
        capsules.forEach((capsuleInfo, index) => {
            const itemY = startY + index * (itemH + 10);
            const itemContainer = this.add.container(0, itemY);

            // 胶囊按钮背景
            const itemBg = this.add.graphics();
            itemBg.fillStyle(0x2a4a7a, 1);
            itemBg.fillRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            itemBg.lineStyle(2, 0x4a7aba);
            itemBg.strokeRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            itemContainer.add(itemBg);

            // 胶囊名称
            const nameText = this.add.text(-w / 2 + 35, itemH / 2, capsuleInfo.itemData.name, {
                fontSize: '16px', fontFamily: 'Arial', color: '#ffffff'
            }).setOrigin(0, 0.5);
            itemContainer.add(nameText);

            // 数量
            const countText = this.add.text(w / 2 - 35, itemH / 2, `x${capsuleInfo.count}`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#aaddaa'
            }).setOrigin(1, 0.5);
            itemContainer.add(countText);

            // 点击区域
            const hit = this.add.rectangle(0, itemH / 2, w - 40, itemH).setInteractive({ useHandCursor: true });
            itemContainer.add(hit);

            hit.on('pointerover', () => {
                itemBg.clear();
                itemBg.fillStyle(0x3a6aaa, 1);
                itemBg.fillRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
                itemBg.lineStyle(2, 0x5a9ada);
                itemBg.strokeRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            });

            hit.on('pointerout', () => {
                itemBg.clear();
                itemBg.fillStyle(0x2a4a7a, 1);
                itemBg.fillRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
                itemBg.lineStyle(2, 0x4a7aba);
                itemBg.strokeRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            });

            hit.on('pointerdown', () => {
                this.closeCapsulePanel();
                this.doCatch(capsuleInfo.itemData);
            });

            this.capsulePanelContainer.add(itemContainer);
        });

        // 取消按钮
        const cancelY = h / 2 - 35;
        const cancelBg = this.add.graphics();
        cancelBg.fillStyle(0x5a3a3a, 1);
        cancelBg.fillRoundedRect(-50, cancelY - 15, 100, 30, 6);
        this.capsulePanelContainer.add(cancelBg);

        const cancelText = this.add.text(0, cancelY, '取消', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5);
        this.capsulePanelContainer.add(cancelText);

        const cancelHit = this.add.rectangle(0, cancelY, 100, 30).setInteractive({ useHandCursor: true });
        this.capsulePanelContainer.add(cancelHit);
        cancelHit.on('pointerdown', () => this.closeCapsulePanel());
    }

    closeCapsulePanel() {
        if (this.capsulePanelContainer) {
            this.capsulePanelContainer.destroy();
            this.capsulePanelContainer = null;
        }
    }

    doCatch(capsule) {
        this.disableMenu();
        this.battleManager.setPlayerAction(BattleManager.ACTION.CATCH, { capsule });
        this.executeTurn();
    }

    // ========== 道具面板 ==========
    showItemPanel() {
        this.closeItemPanel();
        this.closeElfSwitchPanel();
        this.closeCapsulePanel();

        // 隐藏技能面板
        if (this.skillContainer) {
            this.skillContainer.setVisible(false);
        }

        // 面板容器（放置在中间技能区域位置）
        const panelY = 430;
        this.itemPanelContainer = this.add.container(310, panelY + 10);
        this.itemPanelContainer.setDepth(50);

        const panelW = 330, panelH = 140;

        // 背景（与技能面板一致）
        const bg = this.add.graphics();
        bg.fillStyle(0x0a1a2a, 0.95);
        bg.fillRoundedRect(0, 0, panelW, panelH, 8);
        bg.lineStyle(2, 0x3a5a7a);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 8);
        this.itemPanelContainer.add(bg);

        // 当前分类
        this.itemCategory = 'all';
        this.itemScrollOffset = 0;

        // ========== 右侧分类栏 ==========
        const categories = [
            { key: 'hp', label: '血药', icon: '❤️' },
            { key: 'pp', label: 'PP药', icon: '💧' },
            { key: 'capsule', label: '胶囊', icon: '🔴' }
        ];

        const catX = panelW - 55;
        const catY = 5;
        const catBtnW = 50, catBtnH = 40;

        this.categoryButtons = [];
        categories.forEach((cat, i) => {
            const btn = this.createCategoryButton(catX, catY + i * (catBtnH + 5), catBtnW, catBtnH, cat);
            this.itemPanelContainer.add(btn);
            this.categoryButtons.push(btn);
        });

        // ========== 主物品网格区 ==========
        this.itemGridContainer = this.add.container(10, 10);
        this.itemPanelContainer.add(this.itemGridContainer);

        // 加载物品
        this.updateItemGrid();
    }

    createCategoryButton(x, y, w, h, cat) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(this.itemCategory === cat.key ? 0x3a6a9a : 0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 5);
        bg.lineStyle(1, 0x4a7aaa);
        bg.strokeRoundedRect(0, 0, w, h, 5);
        container.add(bg);

        const icon = this.add.text(w / 2, h / 2 - 6, cat.icon, {
            fontSize: '16px'
        }).setOrigin(0.5);
        container.add(icon);

        const label = this.add.text(w / 2, h / 2 + 10, cat.label, {
            fontSize: '10px', fontFamily: 'Arial', color: '#aaddcc'
        }).setOrigin(0.5);
        container.add(label);

        const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerdown', () => {
            this.itemCategory = cat.key;
            this.itemScrollOffset = 0;
            this.updateCategoryHighlight();
            this.updateItemGrid();
        });

        container._bg = bg;
        container._cat = cat;

        return container;
    }

    updateCategoryHighlight() {
        this.categoryButtons.forEach(btn => {
            const bg = btn._bg;
            const cat = btn._cat;
            bg.clear();
            bg.fillStyle(this.itemCategory === cat.key ? 0x3a6a9a : 0x2a4a6a, 1);
            bg.fillRoundedRect(0, 0, 55, 45, 5);
            bg.lineStyle(1, this.itemCategory === cat.key ? 0x6a9aca : 0x4a7aaa);
            bg.strokeRoundedRect(0, 0, 55, 45, 5);
        });
    }

    updateItemGrid() {
        this.itemGridContainer.removeAll(true);

        // 获取物品列表
        const allItems = ItemBag.getAll();
        let items = [];

        Object.entries(allItems).forEach(([itemId, count]) => {
            if (count <= 0) return;
            const itemData = DataLoader.getItem(parseInt(itemId));
            if (!itemData) return;

            // 根据分类过滤
            let category = 'other';
            if (itemData.type === 'capsule') category = 'capsule';
            else if (itemData.type === 'hpPotion') category = 'hp';
            else if (itemData.type === 'ppPotion') category = 'pp';

            if (this.itemCategory === 'all' || this.itemCategory === category) {
                items.push({ itemId: parseInt(itemId), itemData, count, category });
            }
        });

        // 4列 x 2行 网格（适应较小面板）
        const cols = 4, rows = 2;
        const slotW = 55, slotH = 55;
        const gapX = 6, gapY = 6;
        const visibleItems = items.slice(this.itemScrollOffset, this.itemScrollOffset + cols * rows);

        visibleItems.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * (slotW + gapX);
            const y = row * (slotH + gapY);

            const slot = this.createItemSlot(x, y, slotW, slotH, item);
            this.itemGridContainer.add(slot);
        });

        // 如果没有物品显示提示
        if (visibleItems.length === 0) {
            const emptyText = this.add.text(150, 60, '没有此类道具', {
                fontSize: '14px', fontFamily: 'Arial', color: '#888888'
            }).setOrigin(0.5);
            this.itemGridContainer.add(emptyText);
        }

        // 简单滚动指示（如果物品超过10个）
        if (items.length > cols * rows) {
            const scrollInfo = this.add.text(350, 140, `▲ ▼ (${this.itemScrollOffset / (cols * rows) + 1}/${Math.ceil(items.length / (cols * rows))})`, {
                fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa'
            }).setOrigin(0.5);
            this.itemGridContainer.add(scrollInfo);
        }
    }

    createItemSlot(x, y, w, h, item) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(1, 0x4a7aaa);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        // 物品图标（用首字母或类型图标表示）
        let iconChar = '📦';
        if (item.category === 'capsule') iconChar = '🔴';
        else if (item.category === 'hp') iconChar = '❤️';
        else if (item.category === 'pp') iconChar = '💧';

        const icon = this.add.text(w / 2, h / 2 - 5, iconChar, {
            fontSize: '24px'
        }).setOrigin(0.5);
        container.add(icon);

        // 数量徽章（右下角）
        const countBg = this.add.graphics();
        countBg.fillStyle(0x1a1a2a, 0.9);
        countBg.fillRoundedRect(w - 22, h - 18, 20, 16, 3);
        container.add(countBg);

        const countText = this.add.text(w - 12, h - 10, `${item.count}`, {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5);
        container.add(countText);

        // 交互
        const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x3a6a9a, 1);
            bg.fillRoundedRect(0, 0, w, h, 6);
            bg.lineStyle(2, 0x6a9aca);
            bg.strokeRoundedRect(0, 0, w, h, 6);
        });

        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2a4a6a, 1);
            bg.fillRoundedRect(0, 0, w, h, 6);
            bg.lineStyle(1, 0x4a7aaa);
            bg.strokeRoundedRect(0, 0, w, h, 6);
        });

        hit.on('pointerdown', () => {
            this.useItem(item);
        });

        return container;
    }

    useItem(item) {
        const itemData = item.itemData;

        if (itemData.type === 'capsule') {
            // 胶囊用于捕捉
            if (!this.canCatch) {
                this.addLog('无法在此战斗中使用胶囊！');
                return;
            }
            this.closeItemPanel();
            this.doCatch(itemData);
        } else if (itemData.type === 'hpPotion' && itemData.effect) {
            // HP恢复药剂
            const healAmount = itemData.effect.hpRestore || 20;
            const maxHp = this.playerElf.getMaxHp();
            const oldHp = this.playerElf.currentHp;
            this.playerElf.currentHp = Math.min(maxHp, oldHp + healAmount);
            const healed = this.playerElf.currentHp - oldHp;

            if (healed > 0) {
                // 消耗物品
                ItemBag.removeItem(item.itemId, 1);
                this.addLog(`使用了 ${itemData.name}，恢复了 ${healed} HP！`);

                // 更新 UI
                this.updateStatusHp('player');
                this.playerElf._syncInstanceData();
                PlayerData.saveToStorage();

                this.closeItemPanel();
                // 使用物品消耗回合
                this.disableMenu();
                this.battleManager.setPlayerAction(BattleManager.ACTION.ITEM, { itemId: item.itemId });
                this.executeTurn();
            } else {
                this.addLog(`${this.playerElf.getDisplayName()} 的 HP 已满！`);
            }
        } else if (itemData.type === 'ppPotion' && itemData.effect) {
            // PP恢复逻辑（简化：恢复所有技能PP）
            const restoreAmount = itemData.effect.ppRestore || 5;
            const skills = this.playerElf.getSkillDetails();
            let restored = false;

            skills.forEach(skill => {
                if (this.playerElf.skillPP[skill.id] < skill.pp) {
                    this.playerElf.skillPP[skill.id] = Math.min(skill.pp, this.playerElf.skillPP[skill.id] + restoreAmount);
                    restored = true;
                }
            });

            if (restored) {
                ItemBag.removeItem(item.itemId, 1);
                this.addLog(`使用了 ${itemData.name}，恢复了技能 PP！`);
                this.updateSkillPP();
                this.playerElf._syncInstanceData();
                PlayerData.saveToStorage();

                this.closeItemPanel();
                this.disableMenu();
                this.battleManager.setPlayerAction(BattleManager.ACTION.ITEM, { itemId: item.itemId });
                this.executeTurn();
            } else {
                this.addLog('所有技能 PP 已满！');
            }
        }
    }

    closeItemPanel() {
        if (this.itemPanelContainer) {
            this.itemPanelContainer.destroy();
            this.itemPanelContainer = null;
        }
        // 恢复技能面板
        if (this.skillContainer) {
            this.skillContainer.setVisible(true);
        }
    }

    // ========== 精灵切换面板 ==========
    showElfSwitchPanel(forceSwitch = false) {
        this.closeElfSwitchPanel();
        this.closeCapsulePanel();

        // 面板容器（覆盖中间技能区域）
        const panelY = 430;
        this.elfSwitchContainer = this.add.container(0, panelY);
        this.elfSwitchContainer.setDepth(80);

        const panelW = 700, panelH = 165;
        const panelX = 300;

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 0.98);
        bg.fillRoundedRect(panelX, 5, panelW, panelH, 10);
        bg.lineStyle(2, 0x4a7aaa);
        bg.strokeRoundedRect(panelX, 5, panelW, panelH, 10);
        this.elfSwitchContainer.add(bg);

        // ========== 顶部精灵选择栏 ==========
        const topBarY = 12;
        const slotSize = 40;
        const slotGap = 8;
        const elves = PlayerData.elves;

        this.elfSlots = [];
        this.selectedSwitchIndex = 0; // 默认选中第一只（跳过出战精灵）

        // 找到第一只不是当前出战精灵的
        for (let i = 0; i < elves.length; i++) {
            const slot = this.createElfSlot(panelX + 15 + i * (slotSize + slotGap), topBarY, slotSize, elves[i], i);
            this.elfSwitchContainer.add(slot);
            this.elfSlots.push(slot);
        }

        // ========== 左侧信息区 ==========
        this.elfInfoContainer = this.add.container(panelX + 15, topBarY + slotSize + 15);
        this.elfSwitchContainer.add(this.elfInfoContainer);

        // ========== 右侧技能区 ==========
        this.elfSkillContainer = this.add.container(panelX + 250, topBarY + slotSize + 15);
        this.elfSwitchContainer.add(this.elfSkillContainer);

        // 选中第一只不是当前出战的精灵
        for (let i = 0; i < elves.length; i++) {
            if (elves[i] !== this.playerElf._instanceData) {
                this.selectSwitchElf(i);
                break;
            }
        }

        // 关闭按钮（如果不是强制切换）
        if (!forceSwitch) {
            const closeBtn = this.add.text(panelX + panelW - 15, 15, '✕', {
                fontSize: '20px', color: '#ff6666'
            }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
            closeBtn.on('pointerdown', () => this.closeElfSwitchPanel());
            this.elfSwitchContainer.add(closeBtn);
        }

        this.forceSwitchMode = forceSwitch;
    }

    createElfSlot(x, y, size, elfData, index) {
        const container = this.add.container(x, y);
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) return container;

        const elf = new Elf(baseData, elfData);
        const isCurrent = elfData === this.playerElf._instanceData;
        const canFight = elfData.currentHp > 0;

        // 背景
        const bg = this.add.graphics();
        const bgColor = isCurrent ? 0x4a6a8a : (canFight ? 0x2a4a6a : 0x3a3a3a);
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(0, 0, size, size, 6);
        if (isCurrent) {
            bg.lineStyle(3, 0xffdd44);
        } else {
            bg.lineStyle(2, canFight ? 0x4a8aca : 0x555555);
        }
        bg.strokeRoundedRect(0, 0, size, size, 6);
        container.add(bg);

        // 精灵图标（首字母）
        const iconText = this.add.text(size / 2, size / 2, baseData.name.charAt(0), {
            fontSize: '18px', fontFamily: 'Arial',
            color: canFight ? '#ffffff' : '#666666', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(iconText);

        // 等级标签
        const lvText = this.add.text(size - 2, size - 2, `${elf.level}`, {
            fontSize: '10px', fontFamily: 'Arial', color: '#aaddaa'
        }).setOrigin(1, 1);
        container.add(lvText);

        // 交互
        if (!isCurrent && canFight) {
            const hit = this.add.rectangle(size / 2, size / 2, size, size).setInteractive({ useHandCursor: true });
            container.add(hit);
            hit.on('pointerdown', () => this.selectSwitchElf(index));
        }

        container._bg = bg;
        container._index = index;
        container._elfData = elfData;
        container._isCurrent = isCurrent;

        return container;
    }

    selectSwitchElf(index) {
        this.selectedSwitchIndex = index;

        // 更新槽位高亮
        this.elfSlots.forEach((slot, i) => {
            const bg = slot._bg;
            if (!bg) return;
            const isCurrent = slot._isCurrent;
            const canFight = slot._elfData.currentHp > 0;
            const isSelected = i === index;

            bg.clear();
            const bgColor = isCurrent ? 0x4a6a8a : (isSelected ? 0x3a6a9a : (canFight ? 0x2a4a6a : 0x3a3a3a));
            bg.fillStyle(bgColor, 1);
            bg.fillRoundedRect(0, 0, 40, 40, 6);
            if (isCurrent) {
                bg.lineStyle(3, 0xffdd44);
            } else if (isSelected) {
                bg.lineStyle(3, 0x88ccff);
            } else {
                bg.lineStyle(2, canFight ? 0x4a8aca : 0x555555);
            }
            bg.strokeRoundedRect(0, 0, 40, 40, 6);
        });

        // 更新左侧信息和右侧技能
        this.updateElfSwitchInfo(index);
    }

    updateElfSwitchInfo(index) {
        // 清空
        this.elfInfoContainer.removeAll(true);
        this.elfSkillContainer.removeAll(true);

        const elfData = PlayerData.elves[index];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) return;

        const elf = new Elf(baseData, elfData);
        const canFight = elfData.currentHp > 0;
        const isCurrent = elfData === this.playerElf._instanceData;

        // ========== 左侧信息 ==========
        const w = 220, h = 90;

        // 名字
        const name = elfData.nickname || baseData.name;
        const nameText = this.add.text(0, 0, name, {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        this.elfInfoContainer.add(nameText);

        // HP 文字
        const hpLabel = this.add.text(0, 25, `HP: ${elfData.currentHp}/${elf.getMaxHp()}`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#88ddaa'
        });
        this.elfInfoContainer.add(hpLabel);

        // HP 条
        const hpBarW = 180, hpBarH = 12;
        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x222222, 1);
        hpBg.fillRoundedRect(0, 45, hpBarW, hpBarH, 4);
        this.elfInfoContainer.add(hpBg);

        const hpPct = elfData.currentHp / elf.getMaxHp();
        if (hpPct > 0) {
            const hpBar = this.add.graphics();
            let hpColor = 0x44dd44;
            if (hpPct <= 0.2) hpColor = 0xdd4444;
            else if (hpPct <= 0.5) hpColor = 0xddaa44;
            hpBar.fillStyle(hpColor, 1);
            hpBar.fillRoundedRect(2, 47, (hpBarW - 4) * hpPct, hpBarH - 4, 3);
            this.elfInfoContainer.add(hpBar);
        }

        // 出战按钮
        const btnY = 65;
        const btnW = 80, btnH = 30;
        const btnEnabled = canFight && !isCurrent;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(btnEnabled ? 0x44aa66 : 0x444444, 1);
        btnBg.fillRoundedRect(0, btnY, btnW, btnH, 6);
        this.elfInfoContainer.add(btnBg);

        const btnText = this.add.text(btnW / 2, btnY + btnH / 2, '出战', {
            fontSize: '14px', fontFamily: 'Arial',
            color: btnEnabled ? '#ffffff' : '#888888', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elfInfoContainer.add(btnText);

        if (btnEnabled) {
            const btnHit = this.add.rectangle(btnW / 2, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
            this.elfInfoContainer.add(btnHit);
            btnHit.on('pointerdown', () => this.doSwitch(index));
        }

        // ========== 右侧技能 (2x2) ==========
        const skillW = 210, skillH = 40;
        const skillGapX = 5, skillGapY = 5;

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = col * (skillW + skillGapX);
            const sy = row * (skillH + skillGapY);

            if (i < elfData.skills.length) {
                const skillId = elfData.skills[i];
                const skillData = DataLoader.getSkill(skillId);
                const currentPP = elfData.skillPP[skillId] || 0;

                if (skillData) {
                    const skillCard = this.createSwitchSkillCard(sx, sy, skillW, skillH, skillData, currentPP);
                    this.elfSkillContainer.add(skillCard);
                }
            } else {
                // 空技能槽
                const emptyCard = this.add.graphics();
                emptyCard.fillStyle(0x222222, 0.5);
                emptyCard.fillRoundedRect(sx, sy, skillW, skillH, 4);
                this.elfSkillContainer.add(emptyCard);

                const dash = this.add.text(sx + skillW / 2, sy + skillH / 2, '-', {
                    fontSize: '16px', color: '#444444'
                }).setOrigin(0.5);
                this.elfSkillContainer.add(dash);
            }
        }
    }

    createSwitchSkillCard(x, y, w, h, skill, currentPP) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(1, 0x4a6a8a);
        bg.strokeRoundedRect(0, 0, w, h, 4);
        container.add(bg);

        // 技能名
        const nameText = this.add.text(8, 5, skill.name, {
            fontSize: '13px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        container.add(nameText);

        // 威力 + PP
        const metaText = this.add.text(8, 23, `威力${skill.power}  PP${currentPP}/${skill.pp}`, {
            fontSize: '11px', fontFamily: 'Arial', color: '#88aacc'
        });
        container.add(metaText);

        // 属性图标
        const typeName = DataLoader.getTypeName(skill.type);
        const typeText = this.add.text(w - 8, h / 2, typeName, {
            fontSize: '10px', fontFamily: 'Arial', color: '#aaddaa'
        }).setOrigin(1, 0.5);
        container.add(typeText);

        return container;
    }

    closeElfSwitchPanel() {
        if (this.elfSwitchContainer) {
            this.elfSwitchContainer.destroy();
            this.elfSwitchContainer = null;
        }
        this.forceSwitchMode = false;
    }

    doSwitch(elfIndex) {
        const elfData = PlayerData.elves[elfIndex];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData || elfData.currentHp <= 0) return;

        // 创建新的精灵实例
        const newElf = new Elf(baseData, elfData);

        this.closeElfSwitchPanel();
        this.disableMenu();

        // 添加切换日志
        this.addLog(`${this.playerElf.getDisplayName()}，回来吧！`);
        this.addLog(`去吧，${newElf.getDisplayName()}！`);

        // 更新玩家精灵
        this.playerElf = newElf;
        this.battleManager.playerElf = newElf;

        // 更新 UI
        this.updatePlayerSpriteAndStatus();

        // 如果是强制切换（精灵倒下），不触发敌方攻击
        if (this.forceSwitchMode) {
            this.showLogs(() => {
                this.enableMenu();
                this.startTurnTimer();
            });
        } else {
            // 正常切换，敌方可以攻击
            this.battleManager.setPlayerAction(BattleManager.ACTION.SWITCH, { elfIndex });
            this.executeTurn();
        }
    }

    updatePlayerSpriteAndStatus() {
        // 更新玩家精灵显示
        if (this.playerSprite) {
            this.playerSprite.destroy();
        }
        this.playerSprite = this.createCharacterSprite(200, 230, this.playerElf, true);

        // 重建玩家状态栏
        if (this.playerStatus && this.playerStatus.container) {
            this.playerStatus.container.destroy();
        }
        this.createStatusBar(this.playerElf, 20, 10, true);

        // 重建技能面板
        this.rebuildSkillPanel();
    }

    rebuildSkillPanel() {
        // 清除旧技能按钮
        if (this.skillContainer) {
            this.skillContainer.removeAll(true);
        }

        // 重新创建技能按钮（使用与 createMiddleSkillPanel 相同的坐标）
        const skills = this.playerElf.getSkillDetails();
        const panelY = 430;
        const x = 310, y = panelY + 10;
        const skillBtnW = 175, skillBtnH = 55;
        const startX = x + 15, startY = y + 20;
        const gapX = 10, gapY = 10;

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

    // 强制切换（精灵倒下时）
    showForceSwitchPanel() {
        // 检查是否有其他能战斗的精灵
        const availableElves = PlayerData.elves.filter(e => e.currentHp > 0);

        if (availableElves.length === 0) {
            // 没有精灵可战斗，战斗失败
            return false;
        }

        this.addLog('必须选择一只精灵出战！');
        this.showElfSwitchPanel(true);
        return true;
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

        // 检查是否是捕捉操作
        if (result.catchAttempt) {
            await this.playCatchAnimation(result.catchResult);

            if (result.catchResult.success) {
                // 捕捉成功
                this.showPopup('🎉 捕捉成功！', `成功捕捉了 ${this.enemyElf.getDisplayName()}！`);
                return;
            } else {
                // 捕捉失败，敌方攻击
                this.addLog(`${this.enemyElf.getDisplayName()} 挣脱了胶囊！`);
            }
        }

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

        // 检查是否需要强制切换（玩家精灵倒下但还有其他精灵）
        if (result.needSwitch) {
            // 同步更新存档中的精灵 HP
            this.playerElf._instanceData.currentHp = 0;
            PlayerData.saveToStorage();

            this.addLog(`${this.playerElf.getDisplayName()} 倒下了！`);
            await new Promise(resolve => this.showLogs(resolve));
            this.showForceSwitchPanel();
            return;
        }

        // 继续战斗
        if (!this.battleEnded) {
            this.enableMenu();
            this.startTurnTimer();
        }
    }

    // ========== 捕捉动画 ==========
    playCatchAnimation(catchResult) {
        return new Promise(resolve => {
            const shakes = catchResult.shakes;
            const success = catchResult.success;

            // 创建胶囊精灵
            const capsule = this.add.graphics();
            const capsuleX = this.playerSprite.x + 50;
            const capsuleY = this.playerSprite.y - 50;
            const targetX = this.enemySprite.x;
            const targetY = this.enemySprite.y - 30;

            // 绘制胶囊（红白色精灵球样式）
            capsule.fillStyle(0xee4444, 1);
            capsule.fillCircle(0, -8, 15);
            capsule.fillStyle(0xffffff, 1);
            capsule.fillCircle(0, 8, 15);
            capsule.fillStyle(0x222222, 1);
            capsule.fillRect(-18, -3, 36, 6);
            capsule.fillStyle(0xffffff, 1);
            capsule.fillCircle(0, 0, 6);
            capsule.setPosition(capsuleX, capsuleY);
            capsule.setDepth(50);

            // 投掷动画（抛物线）
            this.tweens.add({
                targets: capsule,
                x: targetX,
                y: targetY,
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    // 精灵缩小进入胶囊
                    this.tweens.add({
                        targets: this.enemySprite,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 300,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            // 胶囊落地
                            this.tweens.add({
                                targets: capsule,
                                y: targetY + 50,
                                duration: 200,
                                ease: 'Bounce.easeOut',
                                onComplete: () => {
                                    // 晃动动画
                                    this.playCapsuleShake(capsule, shakes, () => {
                                        if (success) {
                                            // 成功：星星特效
                                            this.playSuccessEffect(capsule.x, capsule.y, () => {
                                                capsule.destroy();
                                                resolve();
                                            });
                                        } else {
                                            // 失败：精灵跳出
                                            this.playFailEffect(capsule, () => {
                                                capsule.destroy();
                                                // 恢复精灵显示
                                                this.enemySprite.setScale(1);
                                                this.enemySprite.setAlpha(1);
                                                resolve();
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    playCapsuleShake(capsule, times, onComplete) {
        let shakeCount = 0;
        const doShake = () => {
            if (shakeCount >= times) {
                onComplete();
                return;
            }
            shakeCount++;

            this.tweens.add({
                targets: capsule,
                angle: 15,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: capsule,
                        angle: -15,
                        duration: 150,
                        yoyo: true,
                        ease: 'Sine.easeInOut',
                        onComplete: () => {
                            this.time.delayedCall(300, doShake);
                        }
                    });
                }
            });
        };
        doShake();
    }

    playSuccessEffect(x, y, onComplete) {
        // 星星特效
        const stars = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const star = this.add.text(x, y, '✨', { fontSize: '24px' }).setOrigin(0.5);
            stars.push(star);

            this.tweens.add({
                targets: star,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => star.destroy()
            });
        }

        // 成功文字
        const successText = this.add.text(x, y - 40, 'GET!', {
            fontSize: '32px', fontFamily: 'Arial', color: '#ffdd44', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(60);

        this.tweens.add({
            targets: successText,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                successText.destroy();
                onComplete();
            }
        });
    }

    playFailEffect(capsule, onComplete) {
        // 胶囊打开
        this.tweens.add({
            targets: capsule,
            scaleX: 1.5,
            scaleY: 0.5,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                // 精灵跳出
                this.enemySprite.setPosition(capsule.x, capsule.y);
                this.tweens.add({
                    targets: this.enemySprite,
                    x: this.W - 200,
                    y: 230,
                    scaleX: 1,
                    scaleY: 1,
                    alpha: 1,
                    duration: 400,
                    ease: 'Back.easeOut',
                    onComplete: onComplete
                });
            }
        });
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

            // 提示待学习技能（技能槽已满）
            if (result.pendingSkills && result.pendingSkills.length > 0) {
                msg += `\n\n有 ${result.pendingSkills.length} 个新技能待学习...`;
            }

            // 检查是否可以进化
            if (result.canEvolve && result.evolveTo && result.playerElf) {
                msg += `\n\n咦？${result.playerElf.getDisplayName()} 好像要进化了！`;
            }

            // 存储结果用于后续处理
            this.pendingResult = result;

            this.time.delayedCall(500, () => {
                this.showPopup('🎉 战斗胜利！', msg, () => {
                    // 开始后续处理流程：技能学习 → 进化 → 返回
                    this.processPostBattle();
                });
            });
        } else {
            this.time.delayedCall(500, () => {
                this.showPopup('战斗失败', `${this.playerElf.getDisplayName()} 倒下了...`);
            });
        }
    }

    /**
     * 处理战斗后续流程：技能学习 → 进化 → 返回地图
     */
    processPostBattle() {
        const result = this.pendingResult;

        // 第一步：处理待学习技能（逐个处理）
        if (result.pendingSkills && result.pendingSkills.length > 0) {
            this.processNextPendingSkill(result.pendingSkills, 0, () => {
                // 所有技能处理完成，检查进化
                this.processEvolution();
            });
        } else {
            // 没有待学习技能，直接检查进化
            this.processEvolution();
        }
    }

    /**
     * 处理下一个待学习技能
     */
    processNextPendingSkill(pendingSkills, index, onComplete) {
        if (index >= pendingSkills.length) {
            // 所有技能处理完成
            onComplete();
            return;
        }

        const skillId = pendingSkills[index];
        const result = this.pendingResult;

        // 使用 chainData 让 SkillLearnScene 自己处理后续流程
        // 注意：不再传递 pendingSkills 数组，SkillLearnScene 会使用 elf.getPendingSkills() 获取最新列表
        this.scene.start('SkillLearnScene', {
            elf: result.playerElf,
            newSkillId: skillId,
            returnScene: this.returnScene,
            returnData: {},
            chainData: {
                canEvolve: result.canEvolve,
                evolveTo: result.evolveTo,
                playerElf: result.playerElf,
                returnScene: this.returnScene
            }
        });
    }

    /**
     * 处理进化
     */
    processEvolution() {
        const result = this.pendingResult;

        if (result.canEvolve && result.evolveTo && result.playerElf) {
            const elfBeforeEvolution = result.playerElf;
            const newElfId = result.evolveTo;

            this.scene.start('EvolutionScene', {
                elf: elfBeforeEvolution,
                newElfId: newElfId,
                returnScene: this.returnScene,
                returnData: {},
                callback: (evolvedElfId) => {
                    // 进化完成后的回调：执行evolve()更新数据
                    elfBeforeEvolution.evolve();
                    PlayerData.saveToStorage();
                    console.log(`[BattleScene] 进化完成: ${elfBeforeEvolution.name}`);
                }
            });
        } else {
            // 没有进化，直接返回地图
            this.returnToMap();
        }
    }

    returnToMap() {
        this.scene.start(this.returnScene);
    }
}

window.BattleScene = BattleScene;
