/**
 * ElfManageScene - 精灵管理场景
 * 显示玩家精灵列表，支持治疗和查看详情
 */

class ElfManageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ElfManageScene' });
    }

    init(data) {
        this.returnScene = data.returnScene || 'SpaceshipScene';
    }

    create() {
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;
        this.selectedElfIndex = 0;
        this.healCost = 50; // 每次治疗花费 50 赛尔豆

        this.createBackground();
        this.createHeader();
        this.createElfList();
        this.createDetailPanel();
        this.createBackButton();

        // 默认选中第一只精灵
        if (PlayerData.elves.length > 0) {
            this.selectElf(0);
        }
    }

    // ========== 背景 ==========
    createBackground() {
        const g = this.add.graphics();
        g.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x0a1a2a, 0x0a1a2a, 1);
        g.fillRect(0, 0, this.W, this.H);
    }

    // ========== 顶部信息栏 ==========
    createHeader() {
        const headerH = 60;
        const g = this.add.graphics();
        g.fillStyle(0x2a4a6a, 0.9);
        g.fillRect(0, 0, this.W, headerH);
        g.lineStyle(2, 0x4a7a9a);
        g.lineBetween(0, headerH, this.W, headerH);

        // 标题
        this.add.text(20, 30, '精灵管理', {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // 赛尔豆显示
        this.seerBeansText = this.add.text(this.W - 20, 30, `💰 ${PlayerData.seerBeans}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffdd44'
        }).setOrigin(1, 0.5);
    }

    // ========== 精灵列表（左侧） ==========
    createElfList() {
        const listX = 20;
        const listY = 80;
        const listW = 320;
        const listH = this.H - 150;

        // 列表背景
        const listBg = this.add.graphics();
        listBg.fillStyle(0x1a2a3a, 0.9);
        listBg.fillRoundedRect(listX, listY, listW, listH, 10);
        listBg.lineStyle(2, 0x3a5a7a);
        listBg.strokeRoundedRect(listX, listY, listW, listH, 10);

        this.elfListContainer = this.add.container(listX, listY);

        const elves = PlayerData.elves;
        const itemH = 80;
        const padding = 10;

        if (elves.length === 0) {
            const emptyText = this.add.text(listW / 2, listH / 2, '没有精灵', {
                fontSize: '18px', fontFamily: 'Arial', color: '#666666'
            }).setOrigin(0.5);
            this.elfListContainer.add(emptyText);
            return;
        }

        this.elfListItems = [];

        elves.forEach((elfData, index) => {
            const itemY = padding + index * (itemH + 10);
            const item = this.createElfListItem(padding, itemY, listW - padding * 2, itemH, elfData, index);
            this.elfListContainer.add(item);
            this.elfListItems.push(item);
        });
    }

    createElfListItem(x, y, w, h, elfData, index) {
        const container = this.add.container(x, y);

        // 获取精灵基础数据
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) return container;

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 8);
        container.add(bg);
        container._bg = bg;

        // 精灵图标
        const iconBg = this.add.graphics();
        const iconColor = this.getTypeColor(baseData.type);
        iconBg.fillStyle(iconColor, 1);
        iconBg.fillCircle(40, h / 2, 28);
        container.add(iconBg);

        const iconText = this.add.text(40, h / 2, baseData.name.charAt(0), {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(iconText);

        // 精灵名称
        const name = elfData.nickname || baseData.name;
        const nameText = this.add.text(80, 15, name, {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        container.add(nameText);

        // 等级
        const lvText = this.add.text(80, 38, `Lv.${elfData.level}`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#aaddaa'
        });
        container.add(lvText);

        // HP 条
        const elf = new Elf(baseData, elfData);
        const maxHp = elf.getMaxHp();
        const currentHp = elfData.currentHp;
        const hpPct = currentHp / maxHp;

        const hpBarW = 120, hpBarH = 12;
        const hpBarX = 80, hpBarY = 58;

        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x222222, 1);
        hpBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
        container.add(hpBg);

        const hpBar = this.add.graphics();
        let hpColor = 0x44dd44;
        if (hpPct <= 0.2) hpColor = 0xdd4444;
        else if (hpPct <= 0.5) hpColor = 0xddaa44;
        if (hpPct > 0) {
            hpBar.fillStyle(hpColor, 1);
            hpBar.fillRoundedRect(hpBarX + 2, hpBarY + 2, (hpBarW - 4) * hpPct, hpBarH - 4, 3);
        }
        container.add(hpBar);
        container._hpBar = hpBar;
        container._hpBarX = hpBarX;
        container._hpBarY = hpBarY;
        container._hpBarW = hpBarW;
        container._hpBarH = hpBarH;

        // HP 文字
        const hpText = this.add.text(hpBarX + hpBarW + 10, hpBarY + hpBarH / 2, `${currentHp}/${maxHp}`, {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0, 0.5);
        container.add(hpText);
        container._hpText = hpText;

        // 点击区域
        const hit = this.add.rectangle(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerdown', () => {
            this.selectElf(index);
        });

        container._index = index;
        container._elfData = elfData;
        container._baseData = baseData;

        return container;
    }

    selectElf(index) {
        this.selectedElfIndex = index;

        // 更新列表选中状态
        if (this.elfListItems) {
            this.elfListItems.forEach((item, i) => {
                const bg = item._bg;
                if (bg) {
                    bg.clear();
                    if (i === index) {
                        bg.fillStyle(0x4a7aaa, 1);
                        bg.lineStyle(2, 0x6aaadd);
                    } else {
                        bg.fillStyle(0x2a4a6a, 1);
                    }
                    bg.fillRoundedRect(0, 0, 300, 80, 8);
                    if (i === index) bg.strokeRoundedRect(0, 0, 300, 80, 8);
                }
            });
        }

        // 更新详情面板
        this.updateDetailPanel(index);
    }

    // ========== 详情面板（右侧） ==========
    createDetailPanel() {
        const panelX = 360;
        const panelY = 80;
        const panelW = this.W - panelX - 20;
        const panelH = this.H - 150;

        // 面板背景
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a2a3a, 0.9);
        panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
        panelBg.lineStyle(2, 0x3a5a7a);
        panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

        this.detailContainer = this.add.container(panelX + 20, panelY + 20);
    }

    updateDetailPanel(index) {
        // 清空现有内容
        this.detailContainer.removeAll(true);

        const elves = PlayerData.elves;
        if (index >= elves.length) return;

        const elfData = elves[index];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) return;

        const elf = new Elf(baseData, elfData);
        const panelW = this.W - 400;

        let y = 0;

        // 精灵名称和类型
        const name = elfData.nickname || baseData.name;
        const nameText = this.add.text(0, y, name, {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        this.detailContainer.add(nameText);

        const typeName = DataLoader.getTypeName(baseData.type);
        const typeText = this.add.text(panelW - 40, y + 5, typeName, {
            fontSize: '16px', fontFamily: 'Arial', color: '#88aacc'
        }).setOrigin(1, 0);
        this.detailContainer.add(typeText);

        y += 40;

        // 等级和经验
        const lvText = this.add.text(0, y, `等级: ${elfData.level}`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#aaddaa'
        });
        this.detailContainer.add(lvText);

        const expToNext = elf.getExpToNextLevel();
        const expText = this.add.text(100, y, `经验: ${elfData.exp}/${expToNext}`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#888888'
        });
        this.detailContainer.add(expText);

        y += 35;

        // 属性
        const stats = [
            { label: 'HP', value: `${elfData.currentHp}/${elf.getMaxHp()}`, color: '#44dd44' },
            { label: '攻击', value: elf.getAtk(), color: '#ff8844' },
            { label: '防御', value: elf.getDef(), color: '#4488ff' },
            { label: '特攻', value: elf.getSpAtk(), color: '#ff44aa' },
            { label: '特防', value: elf.getSpDef(), color: '#44ffaa' },
            { label: '速度', value: elf.getSpd(), color: '#ffff44' }
        ];

        this.add.text(this.detailContainer.x, this.detailContainer.y + y, '属性', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        y += 25;

        stats.forEach((stat, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const statX = col * 100;
            const statY = y + row * 25;

            const labelText = this.add.text(statX, statY, `${stat.label}:`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa'
            });
            this.detailContainer.add(labelText);

            const valueText = this.add.text(statX + 45, statY, stat.value.toString(), {
                fontSize: '14px', fontFamily: 'Arial', color: stat.color
            });
            this.detailContainer.add(valueText);
        });

        y += 60;

        // 技能列表
        this.add.text(this.detailContainer.x, this.detailContainer.y + y, '技能', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        y += 25;

        elfData.skills.forEach((skillId, i) => {
            const skillData = DataLoader.getSkill(skillId);
            if (!skillData) return;

            const currentPP = elfData.skillPP[skillId] || 0;
            const skillText = this.add.text(0, y, `${skillData.name}  PP: ${currentPP}/${skillData.pp}`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#88aacc'
            });
            this.detailContainer.add(skillText);
            y += 22;
        });

        y += 20;

        // 治疗按钮（如果 HP 未满）
        const maxHp = elf.getMaxHp();
        if (elfData.currentHp < maxHp) {
            this.createHealButton(0, y, index);
            y += 55;
        }

        // 开发者模式调试按钮
        if (typeof DevMode !== 'undefined' && DevMode.enabled) {
            this.createDevExpButton(0, y, index);
        }
    }

    createDevExpButton(x, y, elfIndex) {
        const btnW = 160, btnH = 40;
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x8a6a4a, 1);
        bg.fillRoundedRect(0, 0, btnW, btnH, 8);
        bg.lineStyle(2, 0xaa8a6a);
        bg.strokeRoundedRect(0, 0, btnW, btnH, 8);
        container.add(bg);

        const text = this.add.text(btnW / 2, btnH / 2, '🔧 +5000 经验', {
            fontSize: '15px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        const hit = this.add.rectangle(btnW / 2, btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0xaa8a6a, 1);
            bg.fillRoundedRect(0, 0, btnW, btnH, 8);
            bg.lineStyle(2, 0xccaa8a);
            bg.strokeRoundedRect(0, 0, btnW, btnH, 8);
        });

        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x8a6a4a, 1);
            bg.fillRoundedRect(0, 0, btnW, btnH, 8);
            bg.lineStyle(2, 0xaa8a6a);
            bg.strokeRoundedRect(0, 0, btnW, btnH, 8);
        });

        hit.on('pointerdown', () => {
            if (window.dev) {
                window.dev.giveExp(elfIndex, 5000);
                // 刷新当前详情面板和列表
                this.updateDetailPanel(elfIndex);
                this.refreshElfList();
            }
        });

        this.detailContainer.add(container);
    }

    refreshElfList() {
        // 销毁现有列表
        if (this.elfListContainer) {
            this.elfListContainer.removeAll(true);
        }
        this.elfListItems = [];

        // 重新创建列表
        const listW = 320;
        const elves = PlayerData.elves;
        const itemH = 80;
        const padding = 10;

        if (elves.length === 0) {
            const emptyText = this.add.text(listW / 2, (this.H - 150) / 2, '没有精灵', {
                fontSize: '18px', fontFamily: 'Arial', color: '#666666'
            }).setOrigin(0.5);
            this.elfListContainer.add(emptyText);
            return;
        }

        elves.forEach((elfData, index) => {
            const itemY = padding + index * (itemH + 10);
            const item = this.createElfListItem(padding, itemY, listW - padding * 2, itemH, elfData, index);
            this.elfListContainer.add(item);
            this.elfListItems.push(item);
        });

        // 重新高亮选中项
        this.selectElf(this.selectedElfIndex);
    }

    createHealButton(x, y, elfIndex) {
        const btnW = 180, btnH = 45;
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x44aa66, 1);
        bg.fillRoundedRect(0, 0, btnW, btnH, 8);
        bg.lineStyle(2, 0x66cc88);
        bg.strokeRoundedRect(0, 0, btnW, btnH, 8);
        container.add(bg);

        const text = this.add.text(btnW / 2, btnH / 2, `治疗 (${this.healCost} 💰)`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        const hit = this.add.rectangle(btnW / 2, btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x55bb77, 1);
            bg.fillRoundedRect(0, 0, btnW, btnH, 8);
            bg.lineStyle(2, 0x77dd99);
            bg.strokeRoundedRect(0, 0, btnW, btnH, 8);
        });

        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x44aa66, 1);
            bg.fillRoundedRect(0, 0, btnW, btnH, 8);
            bg.lineStyle(2, 0x66cc88);
            bg.strokeRoundedRect(0, 0, btnW, btnH, 8);
        });

        hit.on('pointerdown', () => {
            this.healElf(elfIndex);
        });

        this.detailContainer.add(container);
    }

    healElf(elfIndex) {
        if (!PlayerData.spendSeerBeans(this.healCost)) {
            // 赛尔豆不足
            console.log('赛尔豆不足！');
            return;
        }

        const elfData = PlayerData.elves[elfIndex];
        const baseData = DataLoader.getElf(elfData.elfId);
        const elf = new Elf(baseData, elfData);

        // 完全恢复 HP
        elfData.currentHp = elf.getMaxHp();

        // 恢复所有技能 PP
        elfData.skills.forEach(skillId => {
            const skillData = DataLoader.getSkill(skillId);
            if (skillData) {
                elfData.skillPP[skillId] = skillData.pp;
            }
        });

        // 保存
        PlayerData.saveToStorage();

        // 更新 UI
        this.seerBeansText.setText(`💰 ${PlayerData.seerBeans}`);
        this.updateElfListItem(elfIndex);
        this.updateDetailPanel(elfIndex);

        console.log(`治疗了 ${baseData.name}！`);
    }

    updateElfListItem(index) {
        if (!this.elfListItems || !this.elfListItems[index]) return;

        const item = this.elfListItems[index];
        const elfData = PlayerData.elves[index];
        const baseData = DataLoader.getElf(elfData.elfId);
        const elf = new Elf(baseData, elfData);

        const maxHp = elf.getMaxHp();
        const currentHp = elfData.currentHp;
        const hpPct = currentHp / maxHp;

        // 更新 HP 条
        const hpBar = item._hpBar;
        if (hpBar) {
            hpBar.clear();
            let hpColor = 0x44dd44;
            if (hpPct <= 0.2) hpColor = 0xdd4444;
            else if (hpPct <= 0.5) hpColor = 0xddaa44;
            if (hpPct > 0) {
                hpBar.fillStyle(hpColor, 1);
                hpBar.fillRoundedRect(
                    item._hpBarX + 2, item._hpBarY + 2,
                    (item._hpBarW - 4) * hpPct, item._hpBarH - 4, 3
                );
            }
        }

        // 更新 HP 文字
        const hpText = item._hpText;
        if (hpText) {
            hpText.setText(`${currentHp}/${maxHp}`);
        }
    }

    getTypeColor(type) {
        const colors = {
            water: 0x4488dd,
            fire: 0xdd4444,
            grass: 0x44aa44,
            electric: 0xdddd44,
            normal: 0xaaaaaa,
            flying: 0x88aadd,
            ground: 0xaa8844,
            ice: 0x66dddd,
            mechanical: 0x888899
        };
        return colors[type] || 0x666666;
    }

    // ========== 返回按钮 ==========
    createBackButton() {
        const btnW = 120, btnH = 45;
        const x = this.W / 2, y = this.H - 50;

        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x5a3a3a, 1);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        bg.lineStyle(2, 0x8a5a5a);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        container.add(bg);

        const text = this.add.text(0, 0, '返回', {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);

        const hit = this.add.rectangle(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x7a5a5a, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            bg.lineStyle(2, 0xaa7a7a);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        });

        hit.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x5a3a3a, 1);
            bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            bg.lineStyle(2, 0x8a5a5a);
            bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        });

        hit.on('pointerdown', () => {
            SceneManager.changeScene(this, this.returnScene);
        });
    }
}

window.ElfManageScene = ElfManageScene;
