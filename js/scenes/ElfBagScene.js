/**
 * ElfBagScene - 精灵背包 UI 场景
 * 显示玩家所有精灵，支持查看详情
 */

class ElfBagScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ElfBagScene' });

        this.selectedIndex = 0;
        this.elfCards = [];
        this.detailPanel = null;
    }

    init(data) {
        // 可选：接收返回场景信息
        this.returnScene = data.returnScene || 'BootScene';
    }

    create() {
        console.log('[ElfBagScene] 创建精灵背包界面');

        const { width, height } = this.scale;

        // 背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

        // 标题
        this.add.text(width / 2, 30, '精灵背包', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 分割线
        this.add.rectangle(width / 2, 60, width - 40, 2, 0x4a4a6a);

        // 左侧：精灵列表区域 (x: 20-380)
        this.createElfList();

        // 右侧：详情面板区域 (x: 400-980)
        this.createDetailPanel();

        // 底部：返回按钮
        this.createReturnButton();

        // 初始选中第一只精灵
        if (ElfBag.getCount() > 0) {
            this.selectElf(0);
        }
    }

    /**
     * 创建精灵列表
     */
    createElfList() {
        const elves = ElfBag.getAll();
        const startX = 20;
        const startY = 80;
        const cardHeight = 80;
        const cardWidth = 360;
        const gap = 10;

        this.elfCards = [];

        elves.forEach((elf, index) => {
            const y = startY + index * (cardHeight + gap);
            const card = this.createElfCard(elf, index, startX, y, cardWidth, cardHeight);
            this.elfCards.push(card);
        });

        // 如果没有精灵，显示提示
        if (elves.length === 0) {
            this.add.text(startX + cardWidth / 2, startY + 100, '暂无精灵', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#888888'
            }).setOrigin(0.5);
        }
    }

    /**
     * 创建单个精灵卡片
     */
    createElfCard(elf, index, x, y, cardWidth, cardHeight) {
        const container = this.add.container(x, y);

        // 卡片背景
        const bg = this.add.rectangle(cardWidth / 2, cardHeight / 2, cardWidth, cardHeight, 0x2a2a4e, 0.8);
        bg.setStrokeStyle(2, 0x4a4a6a);
        container.add(bg);

        // 精灵名称
        const nameText = this.add.text(15, 12, elf.getDisplayName(), {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(nameText);

        // 等级
        const levelText = this.add.text(15, 38, `Lv.${elf.level}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        });
        container.add(levelText);

        // 属性类型标签
        const typeColor = this.getTypeColor(elf.type);
        const typeBg = this.add.rectangle(280, 20, 60, 24, typeColor);
        typeBg.setOrigin(0.5);
        container.add(typeBg);

        const typeText = this.add.text(280, 20, this.getTypeName(elf.type), {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(typeText);

        // HP 条
        const hpBarBg = this.add.rectangle(15, 60, 200, 12, 0x333355);
        hpBarBg.setOrigin(0, 0.5);
        container.add(hpBarBg);

        const hpPercent = elf.getHpPercent();
        const hpBarWidth = (hpPercent / 100) * 200;
        const hpColor = this.getHpColor(hpPercent);
        const hpBar = this.add.rectangle(15, 60, hpBarWidth, 12, hpColor);
        hpBar.setOrigin(0, 0.5);
        container.add(hpBar);

        // HP 数值
        const hpText = this.add.text(220, 60, `${elf.currentHp}/${elf.getMaxHp()}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        container.add(hpText);

        // 交互
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
            if (this.selectedIndex !== index) {
                bg.setFillStyle(0x3a3a5e, 0.9);
            }
        });
        bg.on('pointerout', () => {
            if (this.selectedIndex !== index) {
                bg.setFillStyle(0x2a2a4e, 0.8);
            }
        });
        bg.on('pointerdown', () => {
            this.selectElf(index);
        });

        return {
            container,
            bg,
            index
        };
    }

    /**
     * 创建详情面板
     */
    createDetailPanel() {
        const panelX = 400;
        const panelY = 80;
        const panelWidth = 570;
        const panelHeight = 440;

        // 面板容器
        this.detailPanel = this.add.container(panelX, panelY);

        // 面板背景
        const panelBg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0x2a2a4e, 0.6);
        panelBg.setStrokeStyle(2, 0x4a4a6a);
        this.detailPanel.add(panelBg);

        // 占位提示
        this.noSelectionText = this.add.text(panelWidth / 2, panelHeight / 2, '选择一只精灵查看详情', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);
        this.detailPanel.add(this.noSelectionText);
    }

    /**
     * 选中精灵并显示详情
     */
    selectElf(index) {
        // 取消之前的选中状态
        this.elfCards.forEach((card, i) => {
            if (i === this.selectedIndex) {
                card.bg.setFillStyle(0x2a2a4e, 0.8);
                card.bg.setStrokeStyle(2, 0x4a4a6a);
            }
        });

        this.selectedIndex = index;

        // 设置新的选中状态
        if (this.elfCards[index]) {
            this.elfCards[index].bg.setFillStyle(0x4a6aaa, 0.9);
            this.elfCards[index].bg.setStrokeStyle(3, 0x6a8acc);
        }

        // 更新详情面板
        this.updateDetailPanel(index);
    }

    /**
     * 更新详情面板
     */
    updateDetailPanel(index) {
        const elf = ElfBag.getByIndex(index);
        if (!elf) return;

        // 清除之前的内容（保留背景）
        this.detailPanel.each(child => {
            if (child !== this.detailPanel.list[0]) { // 保留背景
                child.destroy();
            }
        });

        const panelWidth = 570;

        // 精灵名称和等级
        const nameText = this.add.text(20, 20, `${elf.getDisplayName()}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.detailPanel.add(nameText);

        const levelText = this.add.text(panelWidth - 20, 20, `Lv.${elf.level}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#88aadd'
        }).setOrigin(1, 0);
        this.detailPanel.add(levelText);

        // 属性类型
        const typeColor = this.getTypeColor(elf.type);
        const typeBg = this.add.rectangle(20 + 40, 60, 80, 28, typeColor);
        typeBg.setOrigin(0.5);
        this.detailPanel.add(typeBg);

        const typeText = this.add.text(20 + 40, 60, this.getTypeName(elf.type), {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.detailPanel.add(typeText);

        // 经验值
        const expNeeded = elf.getExpToNextLevel();
        const expText = this.add.text(130, 52, `EXP: ${elf.exp} / ${expNeeded}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        });
        this.detailPanel.add(expText);

        // 分割线
        const divider = this.add.rectangle(panelWidth / 2, 95, panelWidth - 40, 1, 0x4a4a6a);
        this.detailPanel.add(divider);

        // 数值区域
        this.createStatsSection(elf, 20, 110);

        // 技能区域
        this.createSkillsSection(elf, 20, 280);
    }

    /**
     * 创建数值区域
     */
    createStatsSection(elf, x, y) {
        const stats = elf.getStats();
        const statNames = {
            hp: 'HP',
            atk: '攻击',
            spAtk: '特攻',
            def: '防御',
            spDef: '特防',
            spd: '速度'
        };

        const titleText = this.add.text(x, y, '能力值', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.detailPanel.add(titleText);

        const statKeys = ['hp', 'atk', 'spAtk', 'def', 'spDef', 'spd'];
        const colWidth = 170;

        statKeys.forEach((key, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const sx = x + col * colWidth;
            const sy = y + 30 + row * 35;

            // 属性名
            const nameText = this.add.text(sx, sy, statNames[key], {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#aaaaaa'
            });
            this.detailPanel.add(nameText);

            // 属性值
            let valueStr = `${stats[key]}`;
            if (key === 'hp') {
                valueStr = `${elf.currentHp}/${stats.hp}`;
            }

            const valueText = this.add.text(sx + 60, sy, valueStr, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff'
            });
            this.detailPanel.add(valueText);

            // EV 显示
            const evValue = elf.ev[key];
            if (evValue > 0) {
                const evText = this.add.text(sx + 110, sy, `(+${evValue})`, {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: '#66aa66'
                });
                this.detailPanel.add(evText);
            }
        });

        // IV/EV 总和摘要
        const totalEV = elf.getTotalEV();
        const ivSum = Object.values(elf.iv).reduce((a, b) => a + b, 0);

        const summaryText = this.add.text(x, y + 105, `IV总计: ${ivSum}  |  EV总计: ${totalEV}/510`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#888888'
        });
        this.detailPanel.add(summaryText);
    }

    /**
     * 创建技能区域
     */
    createSkillsSection(elf, x, y) {
        const titleText = this.add.text(x, y, '技能', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.detailPanel.add(titleText);

        const skillDetails = elf.getSkillDetails();
        const skillWidth = 255;
        const skillHeight = 60;
        const gap = 10;

        skillDetails.forEach((skill, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const sx = x + col * (skillWidth + gap);
            const sy = y + 30 + row * (skillHeight + gap);

            // 技能卡片背景
            const typeColor = this.getTypeColor(skill.type);
            const skillBg = this.add.rectangle(sx + skillWidth / 2, sy + skillHeight / 2, skillWidth, skillHeight, 0x333366, 0.8);
            skillBg.setStrokeStyle(2, typeColor);
            this.detailPanel.add(skillBg);

            // 技能名称
            const skillNameText = this.add.text(sx + 10, sy + 8, skill.name, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            this.detailPanel.add(skillNameText);

            // 技能类型标签
            const skillTypeBg = this.add.rectangle(sx + skillWidth - 40, sy + 15, 60, 20, typeColor);
            this.detailPanel.add(skillTypeBg);

            const skillTypeText = this.add.text(sx + skillWidth - 40, sy + 15, this.getTypeName(skill.type), {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.detailPanel.add(skillTypeText);

            // PP
            const ppText = this.add.text(sx + 10, sy + 35, `PP: ${skill.currentPP}/${skill.pp}`, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#aaaaaa'
            });
            this.detailPanel.add(ppText);

            // 威力/命中
            let infoStr = '';
            if (skill.power > 0) {
                infoStr += `威力: ${skill.power}  `;
            }
            if (skill.accuracy !== null) {
                infoStr += `命中: ${skill.accuracy}%`;
            } else {
                infoStr += '必中';
            }

            const infoText = this.add.text(sx + 100, sy + 35, infoStr, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#888888'
            });
            this.detailPanel.add(infoText);
        });

        // 如果技能不足 4 个，显示空槽
        for (let i = skillDetails.length; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = x + col * (skillWidth + gap);
            const sy = y + 30 + row * (skillHeight + gap);

            const emptyBg = this.add.rectangle(sx + skillWidth / 2, sy + skillHeight / 2, skillWidth, skillHeight, 0x222244, 0.5);
            emptyBg.setStrokeStyle(1, 0x333355);
            this.detailPanel.add(emptyBg);

            const emptyText = this.add.text(sx + skillWidth / 2, sy + skillHeight / 2, '空', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#555555'
            }).setOrigin(0.5);
            this.detailPanel.add(emptyText);
        }
    }

    /**
     * 创建返回按钮
     */
    createReturnButton() {
        const { width, height } = this.scale;

        const btnWidth = 120;
        const btnHeight = 40;
        const btnX = width / 2;
        const btnY = height - 40;

        const btnBg = this.add.rectangle(btnX, btnY, btnWidth, btnHeight, 0x4a6aaa);
        btnBg.setStrokeStyle(2, 0x6a8acc);
        btnBg.setInteractive({ useHandCursor: true });

        const btnText = this.add.text(btnX, btnY, '返回', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x5a7aba);
        });
        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x4a6aaa);
        });
        btnBg.on('pointerdown', () => {
            this.returnToPrevious();
        });
    }

    /**
     * 返回上一场景
     */
    returnToPrevious() {
        console.log(`[ElfBagScene] 返回场景: ${this.returnScene}`);
        SceneManager.changeScene(this, this.returnScene);
    }

    /**
     * 获取属性类型颜色
     */
    getTypeColor(type) {
        const colors = {
            normal: 0xa8a878,
            water: 0x6890f0,
            fire: 0xf08030,
            grass: 0x78c850,
            electric: 0xf8d030,
            ice: 0x98d8d8,
            flying: 0xa890f0,
            ground: 0xe0c068,
            mechanical: 0xb8b8d0
        };
        return colors[type] || 0x888888;
    }

    /**
     * 获取属性类型中文名
     */
    getTypeName(type) {
        const names = {
            normal: '普通',
            water: '水',
            fire: '火',
            grass: '草',
            electric: '电',
            ice: '冰',
            flying: '飞行',
            ground: '地面',
            mechanical: '机械'
        };
        return names[type] || type;
    }

    /**
     * 根据 HP 百分比获取颜色
     */
    getHpColor(percent) {
        if (percent > 50) return 0x66cc66;
        if (percent > 20) return 0xcccc66;
        return 0xcc6666;
    }
}

// 导出
window.ElfBagScene = ElfBagScene;
