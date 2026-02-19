/**
 * CaptainRoomScene - 船长室场景（临时）
 * 任务系统中心，与船长对话接取任务
 */

class CaptainRoomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CaptainRoomScene' });
        this.currentTab = 'available'; // 'available', 'active', 'completed'
        this.selectedQuest = null;
        this.questUIElements = [];
    }

    create() {
        const { width, height } = this.cameras.main;

        // 创建背景
        this.createBackground(width, height);

        // 创建船长 NPC
        this.createCaptain(width, height);

        // 创建任务面板
        this.createQuestPanel(width, height);

        // 创建返回按钮
        this.createBackButton();

        // 创建底部功能栏
        this.createBottomBar();

        // 更新存档位置
        PlayerData.currentMapId = 'captain';
        PlayerData.saveToStorage();

        console.log('CaptainRoomScene created');
    }

    // ========== 背景 ==========
    createBackground(width, height) {
        const graphics = this.add.graphics();

        // 船长室背景 - 暖色调
        graphics.fillGradientStyle(0x3a3020, 0x3a3020, 0x2a2010, 0x2a2010, 1);
        graphics.fillRect(0, 0, width, height);

        // 装饰 - 墙面纹理
        graphics.lineStyle(1, 0x5a5040, 0.3);
        for (let i = 0; i < 20; i++) {
            const y = i * 30;
            graphics.lineBetween(0, y, width, y);
        }

        // 地板
        graphics.fillStyle(0x4a4030, 1);
        graphics.fillRect(0, height - 80, width, 80);
        graphics.lineStyle(2, 0x6a6050, 1);
        graphics.lineBetween(0, height - 80, width, height - 80);
    }

    // ========== 船长 NPC ==========
    createCaptain(width, height) {
        const captainX = 200;
        const captainY = height - 200;

        // 船长形象（简化版）
        const captainContainer = this.add.container(captainX, captainY);

        // 身体
        const body = this.add.graphics();
        body.fillStyle(0x2a4a8a, 1);
        body.fillRoundedRect(-40, -30, 80, 100, 10);

        // 头部
        body.fillStyle(0xffcc99, 1);
        body.fillCircle(0, -50, 30);

        // 帽子
        body.fillStyle(0x1a3a7a, 1);
        body.fillRect(-35, -85, 70, 15);
        body.fillRect(-25, -95, 50, 15);

        // 徽章（使用圆形替代）
        body.fillStyle(0xffdd00, 1);
        body.fillCircle(0, 10, 10);

        captainContainer.add(body);

        // 名称
        this.add.text(captainX, captainY + 80, '船长 罗杰', {
            fontSize: '16px',
            color: '#ffdd88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 对话气泡
        this.createDialogBubble(captainX + 120, captainY - 80);

        // 点击船长交互
        const hitArea = new Phaser.Geom.Rectangle(-50, -100, 100, 180);
        captainContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        captainContainer.on('pointerover', () => {
            captainContainer.setScale(1.05);
        });

        captainContainer.on('pointerout', () => {
            captainContainer.setScale(1);
        });

        captainContainer.on('pointerup', () => {
            this.showCaptainDialog();
        });
    }

    createDialogBubble(x, y) {
        const graphics = this.add.graphics();

        // 气泡背景
        graphics.fillStyle(0xffffff, 0.95);
        graphics.fillRoundedRect(x - 10, y - 25, 180, 50, 10);

        // 气泡尖角
        graphics.fillTriangle(x, y + 25, x + 20, y + 25, x + 10, y + 40);

        // 文字
        this.add.text(x + 80, y, '欢迎回来，赛尔！', {
            fontSize: '14px',
            color: '#333333'
        }).setOrigin(0.5);
    }

    showCaptainDialog() {
        const { width, height } = this.cameras.main;

        // 对话框背景
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x000000, 0.8);
        dialogBg.fillRect(0, height - 150, width, 150);

        // 对话内容
        const dialogText = this.add.text(width / 2, height - 75,
            '船长：年轻的赛尔，去克洛斯星探索吧！\n那里有许多可爱的皮皮精灵等着你捕捉。', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // 关闭按钮
        const closeBtn = this.add.text(width - 30, height - 140, '×', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        closeBtn.setInteractive();
        closeBtn.on('pointerup', () => {
            dialogBg.destroy();
            dialogText.destroy();
            closeBtn.destroy();
        });
    }

    // ========== 任务面板 ==========
    createQuestPanel(width, height) {
        this.panelX = width - 320;
        this.panelY = 60;
        this.panelW = 300;
        this.panelH = 480;

        // 面板背景
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x000000, 0.75);
        panelBg.fillRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 10);
        panelBg.lineStyle(2, 0x886644, 1);
        panelBg.strokeRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 10);

        // 标题
        this.add.text(this.panelX + this.panelW / 2, this.panelY + 25, '任务列表', {
            fontSize: '20px',
            color: '#ffdd88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 创建标签页
        this.createTabs();

        // 刷新任务列表
        this.refreshQuestList();
    }

    createTabs() {
        const tabs = [
            { key: 'available', label: '可接取' },
            { key: 'active', label: '进行中' },
            { key: 'completed', label: '已完成' }
        ];

        const tabWidth = 90;
        const tabHeight = 28;
        const startX = this.panelX + 15;
        const tabY = this.panelY + 55;

        this.tabButtons = [];

        tabs.forEach((tab, index) => {
            const tabX = startX + index * (tabWidth + 5);
            const container = this.add.container(tabX, tabY);

            const bg = this.add.graphics();
            const isActive = this.currentTab === tab.key;
            this.drawTabBackground(bg, isActive, tabWidth, tabHeight);

            const label = this.add.text(tabWidth / 2, tabHeight / 2, tab.label, {
                fontSize: '13px',
                color: isActive ? '#ffffff' : '#888888'
            }).setOrigin(0.5);

            container.add([bg, label]);

            const hitArea = new Phaser.Geom.Rectangle(0, 0, tabWidth, tabHeight);
            container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

            container.on('pointerup', () => {
                this.currentTab = tab.key;
                this.selectedQuest = null;
                this.refreshTabs();
                this.refreshQuestList();
            });

            this.tabButtons.push({ container, bg, label, key: tab.key });
        });
    }

    drawTabBackground(graphics, isActive, width, height) {
        graphics.clear();
        graphics.fillStyle(isActive ? 0x5a7a3a : 0x3a3a3a, 1);
        graphics.fillRoundedRect(0, 0, width, height, 6);
        if (isActive) {
            graphics.lineStyle(1, 0x88aa88, 1);
            graphics.strokeRoundedRect(0, 0, width, height, 6);
        }
    }

    refreshTabs() {
        this.tabButtons.forEach(tab => {
            const isActive = this.currentTab === tab.key;
            this.drawTabBackground(tab.bg, isActive, 90, 28);
            tab.label.setColor(isActive ? '#ffffff' : '#888888');
        });
    }

    refreshQuestList() {
        // 清除旧的任务 UI 元素
        this.questUIElements.forEach(el => el.destroy());
        this.questUIElements = [];

        let quests = [];
        switch (this.currentTab) {
            case 'available':
                quests = QuestManager.getAvailableQuests();
                break;
            case 'active':
                quests = QuestManager.getActiveQuests();
                break;
            case 'completed':
                quests = QuestManager.getCompletedQuests();
                break;
        }

        const listY = this.panelY + 95;
        const itemHeight = 65;
        const maxItems = 5;

        if (quests.length === 0) {
            const emptyText = this.add.text(
                this.panelX + this.panelW / 2,
                listY + 80,
                this.currentTab === 'available' ? '暂无可接取任务' :
                    this.currentTab === 'active' ? '暂无进行中任务' : '暂无已完成任务',
                { fontSize: '14px', color: '#666666' }
            ).setOrigin(0.5);
            this.questUIElements.push(emptyText);
            return;
        }

        quests.slice(0, maxItems).forEach((quest, index) => {
            const itemY = listY + index * itemHeight;
            this.createQuestItem(this.panelX + 10, itemY, this.panelW - 20, quest);
        });

        // 详情面板（如果有选中的任务）
        if (this.selectedQuest) {
            this.createQuestDetail();
        }
    }

    createQuestItem(x, y, w, quest) {
        const container = this.add.container(x, y);
        const isSelected = this.selectedQuest && this.selectedQuest.id === quest.id;
        const isActive = this.currentTab === 'active';

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(isSelected ? 0x4a6a4a : 0x2a2a2a, 0.9);
        bg.fillRoundedRect(0, 0, w, 58, 6);
        if (isSelected) {
            bg.lineStyle(2, 0x88cc88, 1);
            bg.strokeRoundedRect(0, 0, w, 58, 6);
        }

        // 任务类型图标
        const typeIcon = quest.type === 'main' ? '📍' : '📋';
        const icon = this.add.text(12, 29, typeIcon, { fontSize: '20px' }).setOrigin(0, 0.5);

        // 任务名称
        const nameColor = this.currentTab === 'completed' ? '#888888' : '#ffffff';
        const name = this.add.text(40, 15, quest.name, {
            fontSize: '15px',
            color: nameColor,
            fontStyle: 'bold'
        });

        // 任务描述或进度
        let descText = quest.description;
        if (isActive && quest.progress) {
            const progressStr = QuestManager.getProgressText(quest, 0);
            descText = `进度: ${progressStr}`;
        }
        const desc = this.add.text(40, 36, descText, {
            fontSize: '12px',
            color: '#aaaaaa'
        });

        container.add([bg, icon, name, desc]);

        // 可完成标识
        if (isActive && QuestManager.checkCompletion(quest.id)) {
            const completeIcon = this.add.text(w - 15, 29, '✓', {
                fontSize: '20px',
                color: '#88ff88'
            }).setOrigin(1, 0.5);
            container.add(completeIcon);
        }

        // 点击选择任务
        const hitArea = new Phaser.Geom.Rectangle(0, 0, w, 58);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerup', () => {
            this.selectedQuest = quest;
            this.refreshQuestList();
        });

        this.questUIElements.push(container);
    }

    createQuestDetail() {
        const quest = this.selectedQuest;
        const detailY = this.panelY + this.panelH - 140;
        const detailH = 125;

        // 分隔线
        const separator = this.add.graphics();
        separator.lineStyle(1, 0x555555, 1);
        separator.lineBetween(this.panelX + 15, detailY - 10, this.panelX + this.panelW - 15, detailY - 10);
        this.questUIElements.push(separator);

        // 详情标题
        const title = this.add.text(this.panelX + 15, detailY, quest.name, {
            fontSize: '14px',
            color: '#ffdd88',
            fontStyle: 'bold'
        });
        this.questUIElements.push(title);

        // 目标描述
        const objectiveDesc = QuestManager.getObjectiveDescription(quest.objectives[0]);
        const targetCount = quest.objectives[0].count;
        const objective = this.add.text(this.panelX + 15, detailY + 22, `目标: ${objectiveDesc} x${targetCount}`, {
            fontSize: '12px',
            color: '#cccccc'
        });
        this.questUIElements.push(objective);

        // 如果是进行中，显示当前进度
        if (this.currentTab === 'active' && quest.progress) {
            const progressText = QuestManager.getProgressText(quest, 0);
            const progress = this.add.text(this.panelX + 15, detailY + 40, `进度: ${progressText}`, {
                fontSize: '12px',
                color: '#88ff88'
            });
            this.questUIElements.push(progress);
        }

        // 奖励信息
        let rewardText = '奖励:';
        if (quest.rewards.seerBeans > 0) {
            rewardText += ` ${quest.rewards.seerBeans} 赛尔豆`;
        }
        if (quest.rewards.items && quest.rewards.items.length > 0) {
            quest.rewards.items.forEach(item => {
                const itemData = DataLoader.getItem(item.id);
                if (itemData) {
                    rewardText += ` / ${itemData.name} x${item.count}`;
                }
            });
        }
        const reward = this.add.text(this.panelX + 15, detailY + 58, rewardText, {
            fontSize: '11px',
            color: '#ffcc66',
            wordWrap: { width: this.panelW - 30 }
        });
        this.questUIElements.push(reward);

        // 操作按钮
        this.createActionButton(detailY + 90, quest);
    }

    createActionButton(y, quest) {
        const btnWidth = 100;
        const btnHeight = 32;
        const btnX = this.panelX + this.panelW / 2 - btnWidth / 2;

        let btnText = '';
        let btnAction = null;
        let btnEnabled = false;

        if (this.currentTab === 'available') {
            btnText = '接取任务';
            btnEnabled = true;
            btnAction = () => {
                if (QuestManager.acceptQuest(quest.id)) {
                    this.showToast(`已接取任务: ${quest.name}`);
                    this.currentTab = 'active';
                    this.selectedQuest = null;
                    this.refreshTabs();
                    this.refreshQuestList();
                }
            };
        } else if (this.currentTab === 'active') {
            const canComplete = QuestManager.checkCompletion(quest.id);
            btnText = canComplete ? '完成任务' : '进行中...';
            btnEnabled = canComplete;
            btnAction = () => {
                if (canComplete) {
                    const rewards = QuestManager.completeQuest(quest.id);
                    if (rewards) {
                        this.showRewardPopup(quest.name, rewards);
                        this.selectedQuest = null;
                        this.refreshQuestList();
                    }
                }
            };
        }

        if (!btnText) return;

        const btn = this.add.container(btnX, y);

        const bg = this.add.graphics();
        bg.fillStyle(btnEnabled ? 0x5a8a3a : 0x3a3a3a, 1);
        bg.fillRoundedRect(0, 0, btnWidth, btnHeight, 6);
        if (btnEnabled) {
            bg.lineStyle(1, 0x88cc66, 1);
            bg.strokeRoundedRect(0, 0, btnWidth, btnHeight, 6);
        }

        const label = this.add.text(btnWidth / 2, btnHeight / 2, btnText, {
            fontSize: '14px',
            color: btnEnabled ? '#ffffff' : '#666666'
        }).setOrigin(0.5);

        btn.add([bg, label]);

        if (btnEnabled && btnAction) {
            const hitArea = new Phaser.Geom.Rectangle(0, 0, btnWidth, btnHeight);
            btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            btn.on('pointerup', btnAction);

            btn.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0x7aaa5a, 1);
                bg.fillRoundedRect(0, 0, btnWidth, btnHeight, 6);
                bg.lineStyle(1, 0xaaee88, 1);
                bg.strokeRoundedRect(0, 0, btnWidth, btnHeight, 6);
            });

            btn.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0x5a8a3a, 1);
                bg.fillRoundedRect(0, 0, btnWidth, btnHeight, 6);
                bg.lineStyle(1, 0x88cc66, 1);
                bg.strokeRoundedRect(0, 0, btnWidth, btnHeight, 6);
            });
        }

        this.questUIElements.push(btn);
    }

    showToast(message) {
        const { width, height } = this.cameras.main;

        const toast = this.add.container(width / 2, height / 2);

        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85);
        bg.fillRoundedRect(-150, -25, 300, 50, 10);

        const text = this.add.text(0, 0, message, {
            fontSize: '16px',
            color: '#88ff88'
        }).setOrigin(0.5);

        toast.add([bg, text]);
        toast.setAlpha(0);

        this.tweens.add({
            targets: toast,
            alpha: 1,
            y: height / 2 - 50,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: toast,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => toast.destroy()
                    });
                });
            }
        });
    }

    showRewardPopup(questName, rewards) {
        const { width, height } = this.cameras.main;

        // 遮罩层
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        // 弹窗容器
        const popup = this.add.container(width / 2, height / 2);

        // 弹窗背景
        const bg = this.add.graphics();
        bg.fillStyle(0x2a2a2a, 1);
        bg.fillRoundedRect(-150, -100, 300, 200, 15);
        bg.lineStyle(3, 0xffdd88, 1);
        bg.strokeRoundedRect(-150, -100, 300, 200, 15);

        // 标题
        const title = this.add.text(0, -75, '🎉 任务完成！', {
            fontSize: '20px',
            color: '#ffdd88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 任务名称
        const name = this.add.text(0, -45, questName, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 奖励标题
        const rewardTitle = this.add.text(0, -15, '获得奖励:', {
            fontSize: '14px',
            color: '#88ff88'
        }).setOrigin(0.5);

        // 奖励列表
        let rewardY = 10;
        if (rewards.seerBeans > 0) {
            const beans = this.add.text(0, rewardY, `💰 ${rewards.seerBeans} 赛尔豆`, {
                fontSize: '14px',
                color: '#ffcc66'
            }).setOrigin(0.5);
            popup.add(beans);
            rewardY += 22;
        }

        if (rewards.items && rewards.items.length > 0) {
            rewards.items.forEach(item => {
                const itemData = DataLoader.getItem(item.id);
                if (itemData) {
                    const itemText = this.add.text(0, rewardY, `📦 ${itemData.name} x${item.count}`, {
                        fontSize: '14px',
                        color: '#88ccff'
                    }).setOrigin(0.5);
                    popup.add(itemText);
                    rewardY += 22;
                }
            });
        }

        // 确认按钮
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x5a8a3a, 1);
        btnBg.fillRoundedRect(-50, 65, 100, 30, 8);

        const btnText = this.add.text(0, 80, '确定', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        popup.add([bg, title, name, rewardTitle, btnBg, btnText]);

        const btnHitArea = new Phaser.Geom.Rectangle(-50, 65, 100, 30);
        popup.setInteractive(btnHitArea, Phaser.Geom.Rectangle.Contains);

        popup.on('pointerup', () => {
            overlay.destroy();
            popup.destroy();
        });
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btn = this.add.container(80, 550);

        const bg = this.add.graphics();
        bg.fillStyle(0x5a5040, 1);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        bg.lineStyle(2, 0x8a7060, 1);
        bg.strokeRoundedRect(-60, -20, 120, 40, 8);

        const label = this.add.text(0, 0, '← 返回飞船', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, label]);

        const hitArea = new Phaser.Geom.Rectangle(-60, -20, 120, 40);
        btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x7a7060, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0xaa9080, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x5a5040, 1);
            bg.fillRoundedRect(-60, -20, 120, 40, 8);
            bg.lineStyle(2, 0x8a7060, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        });

        btn.on('pointerup', () => {
            SceneRouter.start(this, 'SpaceshipScene');
        });
    }

    createBottomBar() {
        WorldSceneModalMixin.apply(this, 'CaptainRoomScene');
        this.worldBottomBar = WorldBottomBar.create(this, {
            onMap: () => this.openSpaceshipFromBottomBar(),
            onBag: () => this.openItemBagModal(),
            onElfManage: () => this.openElfManageModal()
        });
    }
}
