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

        // 属性类型标签（四属性显示图标，其他属性保留文字）
        this.addTypeVisual(container, 280, 20, elf.type, {
            iconSize: 24,
            fallbackWidth: 60,
            fallbackHeight: 24,
            fallbackFontSize: '12px'
        });

        // 精灵静态图（external_scene/still）
        if (!this.addElfStillImage(container, 325, 42, elf.id, 54)) {
            const fallback = this.add.circle(325, 42, 22, 0x5a6a8a, 0.9);
            fallback.setStrokeStyle(2, 0x9ab0d0, 0.8);
            container.add(fallback);
        }

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

        // 右侧精灵展示图（external_scene/still）
        if (!this.addElfStillImage(this.detailPanel, panelWidth - 90, 88, elf.id, 130)) {
            const fallback = this.add.circle(panelWidth - 90, 88, 42, 0x4a5a7a, 0.9);
            fallback.setStrokeStyle(2, 0x8aa0c0, 0.8);
            this.detailPanel.add(fallback);
        }

        // 属性类型（四属性显示图标，其他属性保留文字）
        this.addTypeVisual(this.detailPanel, 60, 60, elf.type, {
            iconSize: 28,
            fallbackWidth: 80,
            fallbackHeight: 28,
            fallbackFontSize: '14px'
        });

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

        // 开发者模式调试按钮
        if (typeof DevMode !== 'undefined' && DevMode.enabled) {
            this.createDevModeButtons(elf, index, panelWidth);
        }
    }

    /**
     * 创建开发者模式调试按钮
     */
    createDevModeButtons(elf, elfIndex, panelWidth) {
        const btnY = 420;

        // 获得 5000 经验按钮
        const expBtnW = 140;
        const expBtnH = 32;
        const expBtnX = panelWidth - expBtnW / 2 - 20;

        const expBtnBg = this.add.rectangle(expBtnX, btnY, expBtnW, expBtnH, 0x8a6a4a);
        expBtnBg.setStrokeStyle(2, 0xaa8a6a);
        expBtnBg.setInteractive({ useHandCursor: true });
        this.detailPanel.add(expBtnBg);

        const expBtnText = this.add.text(expBtnX, btnY, '🔧 +5000 经验', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.detailPanel.add(expBtnText);

        expBtnBg.on('pointerover', () => {
            expBtnBg.setFillStyle(0xaa8a6a);
        });
        expBtnBg.on('pointerout', () => {
            expBtnBg.setFillStyle(0x8a6a4a);
        });
        expBtnBg.on('pointerdown', () => {
            if (window.dev) {
                window.dev.giveExp(elfIndex, 5000);
                // 刷新界面
                this.updateDetailPanel(elfIndex);
                // 刷新左侧列表
                this.refreshElfList();
            }
        });
    }

    /**
     * 刷新精灵列表
     */
    refreshElfList() {
        // 销毁现有卡片
        this.elfCards.forEach(card => {
            card.container.destroy();
        });

        // 重新创建列表
        this.createElfList();

        // 重新选中当前精灵
        if (ElfBag.getCount() > 0 && this.selectedIndex < ElfBag.getCount()) {
            this.selectElf(this.selectedIndex);
        }
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

            // 技能类型标签（四属性显示图标，其他属性保留文字）
            this.addTypeVisual(this.detailPanel, sx + skillWidth - 40, sy + 15, skill.type, {
                iconSize: 20,
                fallbackWidth: 60,
                fallbackHeight: 20,
                fallbackFontSize: '10px'
            });

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
        return DataLoader.getTypeColor(type);
    }

    /**
     * 获取属性类型中文名
     */
    getTypeName(type) {
        return DataLoader.getTypeName(type);
    }

    /**
     * 添加属性显示：优先图标，缺失时回退为无文字色块图标
     */
    addTypeVisual(container, x, y, type, options = {}) {
        const iconKey = AssetMappings.getTypeIconKey(type);
        const iconSize = options.iconSize || 24;
        if (iconKey && this.textures.exists(iconKey)) {
            const icon = this.add.image(x, y, iconKey).setOrigin(0.5);
            const scale = Math.min(iconSize / icon.width, iconSize / icon.height);
            icon.setScale(scale);
            container.add(icon);
            return;
        }

        const typeColor = this.getTypeColor(type);
        const radius = Math.max(6, Math.floor(iconSize / 2));
        const fallback = this.add.circle(x, y, radius, typeColor).setOrigin(0.5);
        fallback.setStrokeStyle(1, 0xffffff, 0.7);
        container.add(fallback);
    }

    /**
     * 添加精灵静态图（external_scene/still）
     * @returns {boolean} 是否成功添加
     */
    addElfStillImage(container, x, y, elfId, maxSize) {
        let stillKey = null;
        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getExternalStillKey === 'function') {
            stillKey = AssetMappings.getExternalStillKey(elfId);
        }

        if (stillKey && this.textures.exists(stillKey)) {
            const image = this.add.image(x, y, stillKey).setOrigin(0.5);
            const scale = Math.min(maxSize / image.width, maxSize / image.height);
            image.setScale(scale);
            container.add(image);
            return true;
        }

        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getBattleClipKeys === 'function') {
            const battleStillKeys = AssetMappings.getBattleClipKeys(elfId, 'still');
            for (const atlasKey of battleStillKeys) {
                if (!this.textures.exists(atlasKey)) continue;

                const texture = this.textures.get(atlasKey);
                if (!texture) continue;

                let frameNames = [];
                const atlasJson = this.cache && this.cache.json ? this.cache.json.get(atlasKey) : null;
                if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
                    frameNames = Object.keys(atlasJson.frames);
                } else {
                    frameNames = texture.getFrameNames().filter((name) => name !== '__BASE');
                }
                if (!frameNames.length) continue;

                const sprite = this.add.sprite(x, y, atlasKey, frameNames[0]).setOrigin(0.5);
                const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
                sprite.setScale(scale);
                container.add(sprite);
                return true;
            }
        }

        if (!this._missingPortraitWarned) {
            this._missingPortraitWarned = new Set();
        }
        if (!this._missingPortraitWarned.has(elfId)) {
            console.warn(`[ElfBagScene] 精灵图片缺失: elfId=${elfId}, stillKey=${stillKey || 'null'}`);
            this._missingPortraitWarned.add(elfId);
        }
        return false;
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
