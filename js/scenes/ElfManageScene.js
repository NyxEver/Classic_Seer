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
        this.returnData = data.returnData || {};
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;
        this.selectedElfIndex = 0;
        this.healAllCost = 120;
        this.maxSlots = 6;

        this.createModalLayout();
        this.refreshView();
    }

    createModalLayout() {
        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5300 });
        this.modalDepth = overlayState && Number.isFinite(overlayState.depth)
            ? overlayState.depth + 1
            : 5301;

        this.modalW = Math.min(960, this.W - 60);
        this.modalH = Math.min(560, this.H - 50);
        this.modalX = (this.W - this.modalW) / 2;
        this.modalY = (this.H - this.modalH) / 2;
        this.leftW = Math.floor(this.modalW * 0.4);
        this.splitOffset = 12; // 让中线和组件留出更舒适间距
        this.splitX = this.leftW + this.splitOffset;
        this.rightStartX = this.splitX + 8;
        this.rightW = this.modalW - this.rightStartX;

        const panel = this.add.graphics();
        panel.fillStyle(0x122133, 0.98);
        panel.fillRoundedRect(this.modalX, this.modalY, this.modalW, this.modalH, 14);
        panel.lineStyle(2, 0x4f6f8f, 1);
        panel.strokeRoundedRect(this.modalX, this.modalY, this.modalW, this.modalH, 14);
        panel.setDepth(this.modalDepth);

        // 左右分隔线
        panel.lineStyle(2, 0x2a425f, 1);
        panel.lineBetween(this.modalX + this.splitX, this.modalY + 14, this.modalX + this.splitX, this.modalY + this.modalH - 14);

        this.leftContainer = this.add.container(this.modalX, this.modalY).setDepth(this.modalDepth + 1);
        this.rightContainer = this.add.container(this.modalX + this.rightStartX, this.modalY).setDepth(this.modalDepth + 1);

        this.createLeftPanelSkeleton();
        this.createRightPanelSkeleton();
    }

    createLeftPanelSkeleton() {
        // 标题栏
        const headerH = 56;
        const g = this.add.graphics();
        g.fillStyle(0x20384f, 0.95);
        g.fillRoundedRect(0, 0, this.leftW, headerH, 14);
        g.fillRect(0, 24, this.leftW, headerH - 24);
        this.leftContainer.add(g);

        const title = this.add.text(18, 16, '精灵背包', {
            fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        });
        this.leftContainer.add(title);

        // 关闭按钮
        const closeBg = this.add.circle(this.leftW - 24, 24, 14, 0x7a3a3a).setInteractive({ useHandCursor: true });
        const closeText = this.add.text(this.leftW - 24, 24, 'X', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        closeBg.on('pointerdown', () => this.closePanel());
        closeBg.on('pointerover', () => closeBg.setFillStyle(0xaa4a4a));
        closeBg.on('pointerout', () => closeBg.setFillStyle(0x7a3a3a));
        this.leftContainer.add(closeBg);
        this.leftContainer.add(closeText);

        // 网格容器
        this.gridContainer = this.add.container(0, 0);
        this.leftContainer.add(this.gridContainer);

        // 底部功能按钮容器
        this.leftActionContainer = this.add.container(0, 0);
        this.leftContainer.add(this.leftActionContainer);
    }

    createRightPanelSkeleton() {
        this.rightContent = this.add.container(0, 0);
        this.rightContainer.add(this.rightContent);
    }

    refreshView() {
        const elfCount = PlayerData.elves.length;
        if (elfCount === 0) {
            this.selectedElfIndex = -1;
        } else if (this.selectedElfIndex < 0 || this.selectedElfIndex >= elfCount) {
            this.selectedElfIndex = 0;
        }
        this.renderLeftGrid();
        this.renderLeftActions();
        this.renderRightDetail();
    }

    renderLeftGrid() {
        this.gridContainer.removeAll(true);

        const topY = 72;
        const bottomActionH = 110;
        const contentH = this.modalH - topY - bottomActionH - 20;
        const cols = 2;
        const rows = 3;
        const gap = 12;
        const cardW = Math.floor((this.leftW - 32 - gap) / cols);
        const cardH = Math.floor((contentH - (rows - 1) * gap) / rows);
        const startX = 16;
        const startY = topY;

        for (let i = 0; i < this.maxSlots; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY + row * (cardH + gap);
            const elfData = PlayerData.elves[i] || null;
            const card = this.createElfCard(x, y, cardW, cardH, elfData, i);
            this.gridContainer.add(card);
        }
    }

    createElfCard(x, y, w, h, elfData, index) {
        const container = this.add.container(x, y);
        const selected = index === this.selectedElfIndex;
        const hasElf = !!elfData;

        const bg = this.add.graphics();
        if (selected && hasElf) {
            bg.fillStyle(0xc2702f, 1);
            bg.lineStyle(2, 0xffffff, 1);
        } else {
            bg.fillStyle(hasElf ? 0x27435d : 0x1a2a3a, hasElf ? 1 : 0.65);
            bg.lineStyle(1, hasElf ? 0x456685 : 0x2a3a4a, 1);
        }
        bg.fillRoundedRect(0, 0, w, h, 8);
        bg.strokeRoundedRect(0, 0, w, h, 8);
        container.add(bg);

        if (!hasElf) {
            const emptyText = this.add.text(w / 2, h / 2, '--', {
                fontSize: '16px', color: '#445566'
            }).setOrigin(0.5);
            container.add(emptyText);
            return container;
        }

        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) return container;
        const elf = new Elf(baseData, elfData);

        // 左侧立绘
        if (!this.addElfPortrait(container, 32, h / 2 - 2, baseData.id, 58, h - 18)) {
            const icon = this.add.circle(32, h / 2 - 2, 24, 0x4a7aaa);
            const txt = this.add.text(32, h / 2 - 2, baseData.name.charAt(0), {
                fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(icon);
            container.add(txt);
        }

        const name = elfData.nickname || baseData.name;
        const nameY = 10;
        container.add(this.add.text(66, nameY, name, {
            fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }));

        // 血条放在名称与等级之间（避免与右下 HP 文本重叠）
        const hpBarX = 66;
        const hpBarH = 8;
        const metaY = h - 16;
        const hpBarY = Math.floor((nameY + metaY) / 2) - Math.floor(hpBarH / 2);
        const hpBarW = Math.max(30, w - hpBarX - 10);
        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x1a1a1a, 1);
        hpBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 3);
        container.add(hpBg);

        const hpPct = elf.getMaxHp() > 0 ? (elfData.currentHp / elf.getMaxHp()) : 0;
        if (hpPct > 0) {
            const hpFill = this.add.graphics();
            hpFill.fillStyle(this.getHpBarColor(hpPct), 1);
            hpFill.fillRoundedRect(hpBarX + 1, hpBarY + 1, (hpBarW - 2) * hpPct, hpBarH - 2, 2);
            container.add(hpFill);
        }

        // 等级与右下 HP 文本保持同一水平线
        container.add(this.add.text(66, metaY, `Lv.${elfData.level}`, {
            fontSize: '12px', color: '#d6ecff'
        }).setOrigin(0, 0.5));

        container.add(this.add.text(w - 8, metaY, `${elfData.currentHp}/${elf.getMaxHp()}`, {
            fontSize: '12px', color: '#ffffff'
        }).setOrigin(1, 0.5));

        const hit = this.add.rectangle(w / 2, h / 2, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
            this.selectedElfIndex = index;
            this.refreshView();
        });
        container.add(hit);

        return container;
    }

    renderLeftActions() {
        this.leftActionContainer.removeAll(true);

        const y = this.modalH - 78;
        const selectedIsStarter = this.selectedElfIndex === 0;
        const canHealAll = this.canHealAnyElf();

        const actions = [
            {
                label: '首发',
                icon: 'S',
                iconKey: 'elf_manage_btn_first',
                enabled: this.selectedElfIndex >= 0 && !selectedIsStarter,
                onClick: () => this.setStarterElf()
            },
            {
                label: `回复(${this.healAllCost})`,
                icon: '+',
                iconKey: 'elf_manage_btn_cure',
                enabled: canHealAll,
                onClick: () => this.healAllElves()
            },
            {
                label: '仓库',
                icon: 'B',
                iconKey: 'elf_manage_btn_storage',
                enabled: false,
                onClick: () => {}
            },
            {
                label: '图鉴',
                icon: 'P',
                iconKey: 'elf_manage_btn_handbook',
                enabled: true,
                onClick: () => this.openPokedexModal()
            }
        ];

        if (typeof DevMode !== 'undefined' && DevMode.enabled) {
            actions.push({
                label: '+5000经验',
                icon: 'D',
                iconKey: 'elf_manage_btn_exp',
                enabled: this.selectedElfIndex >= 0,
                onClick: () => this.giveDevExp()
            });
        }

        const gap = 72;
        const startX = this.leftW / 2 - ((actions.length - 1) * gap) / 2;
        actions.forEach((action, index) => {
            const btn = this.createCircleActionButton(startX + index * gap, y, action);
            this.leftActionContainer.add(btn);
        });

        this.seerBeansText = this.add.text(12, this.modalH - 20, `赛尔豆: ${PlayerData.seerBeans}`, {
            fontSize: '12px', color: '#ffdd66'
        });
        this.leftActionContainer.add(this.seerBeansText);
    }

    createCircleActionButton(x, y, config) {
        const container = this.add.container(x, y);
        const enabled = !!config.enabled;
        const baseColor = enabled ? 0x3f6f96 : 0x5a5a5a;
        const hoverColor = enabled ? 0x5590c0 : 0x5a5a5a;

        const circle = this.add.circle(0, 0, 24, baseColor).setStrokeStyle(2, enabled ? 0xcfe9ff : 0x888888);

        let icon;
        if (config.iconKey && this.textures.exists(config.iconKey)) {
            icon = this.add.image(0, 0, config.iconKey).setOrigin(0.5);
            const scale = Math.min(20 / icon.width, 20 / icon.height);
            icon.setScale(scale);
            if (!enabled) {
                icon.setTint(0x999999);
            }
        } else {
            icon = this.add.text(0, 0, config.icon, {
                fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        const label = this.add.text(0, 34, config.label, {
            fontSize: '11px', color: enabled ? '#d6ecff' : '#9a9a9a'
        }).setOrigin(0.5);
        container.add(circle);
        container.add(icon);
        container.add(label);

        if (enabled) {
            const hit = this.add.circle(0, 0, 24).setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => circle.setFillStyle(hoverColor));
            hit.on('pointerout', () => circle.setFillStyle(baseColor));
            hit.on('pointerdown', () => config.onClick());
            container.add(hit);
        }

        return container;
    }

    openPokedexModal() {
        if (this.scene.isActive('PokedexScene')) {
            return;
        }

        SceneRouter.launch(this, 'PokedexScene', {
            returnScene: 'ElfManageScene',
            returnData: {
                returnScene: this.returnScene,
                returnData: this.returnData
            }
        }, {
            bgmStrategy: 'inherit'
        });
        this.scene.bringToTop('PokedexScene');
    }

    setStarterElf() {
        if (this.selectedElfIndex <= 0 || this.selectedElfIndex >= PlayerData.elves.length) return;
        const selected = PlayerData.elves[this.selectedElfIndex];
        PlayerData.elves.splice(this.selectedElfIndex, 1);
        PlayerData.elves.unshift(selected);
        this.selectedElfIndex = 0;
        PlayerData.saveToStorage();
        this.refreshView();
    }

    healAllElves() {
        if (!PlayerData.spendSeerBeans(this.healAllCost)) {
            return;
        }
        PlayerData.elves.forEach((elfData) => {
            const baseData = DataLoader.getElf(elfData.elfId);
            if (!baseData) return;
            const elf = new Elf(baseData, elfData);
            elfData.currentHp = elf.getMaxHp();
            elfData.skills.forEach(skillId => {
                const skillData = DataLoader.getSkill(skillId);
                if (skillData) {
                    elfData.skillPP[skillId] = skillData.pp;
                }
            });

            if (typeof StatusEffect !== 'undefined' && StatusEffect && typeof StatusEffect.clearAllOnInstanceData === 'function') {
                StatusEffect.clearAllOnInstanceData(elfData);
            } else {
                elfData.status = { weakening: {}, control: null };
            }
        });
        PlayerData.saveToStorage();
        this.refreshView();
    }

    giveDevExp() {
        if (typeof window.dev === 'undefined') return;
        if (this.selectedElfIndex < 0) return;
        window.dev.giveExp(this.selectedElfIndex, 5000);
        this.refreshView();
    }

    canHealAnyElf() {
        if (PlayerData.elves.length === 0) return false;
        return PlayerData.elves.some((elfData) => {
            const baseData = DataLoader.getElf(elfData.elfId);
            if (!baseData) return false;
            const elf = new Elf(baseData, elfData);
            const hasStatus = (typeof StatusEffect !== 'undefined' && StatusEffect && typeof StatusEffect.hasAnyStatus === 'function')
                ? StatusEffect.hasAnyStatus(elfData)
                : false;
            return elfData.currentHp < elf.getMaxHp() || hasStatus;
        });
    }

    renderRightDetail() {
        this.rightContent.removeAll(true);
        const index = this.selectedElfIndex;
        if (index < 0 || index >= PlayerData.elves.length) {
            const empty = this.add.text(this.rightW / 2, this.modalH / 2, '请选择一只精灵', {
                fontSize: '20px', color: '#8ea9c6'
            }).setOrigin(0.5);
            this.rightContent.add(empty);
            return;
        }

        const elfData = PlayerData.elves[index];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) return;
        const elf = new Elf(baseData, elfData);

        const padding = 16;
        const topY = 12;
        const topH = 196;
        const statY = topY + topH + 12;
        const statH = 108;
        const skillY = statY + statH + 12;
        const skillH = this.modalH - skillY - 12;

        this.drawPanelBlock(this.rightContent, padding, topY, this.rightW - padding * 2, topH, 0x1b3248);
        this.drawPanelBlock(this.rightContent, padding, statY, this.rightW - padding * 2, statH, 0x1a2d42);
        this.drawPanelBlock(this.rightContent, padding, skillY, this.rightW - padding * 2, skillH, 0x17293d);

        this.renderTopInfo(elfData, baseData, elf, padding + 12, 20, this.rightW - padding * 2 - 24);
        this.renderStats(elf, padding + 12, statY + 10, this.rightW - padding * 2 - 24);
        this.renderSkills(elfData, padding + 12, skillY + 10, this.rightW - padding * 2 - 24, skillH - 20);
    }

    renderTopInfo(elfData, baseData, elf, x, y, w) {
        // 大图
        if (!this.addElfPortrait(this.rightContent, x + 95, y + 90, baseData.id, 150, 150)) {
            const fallback = this.add.circle(x + 95, y + 90, 55, 0x4a7aaa);
            this.rightContent.add(fallback);
        }

        const tx = x + 195;
        let ty = y + 8;
        const expNeed = elf.getExpToNextLevel();
        const lineNo = this.add.text(tx, ty, `编号: ${baseData.id.toString().padStart(3, '0')}`, {
            fontSize: '14px', color: '#d6ecff'
        });
        this.rightContent.add(lineNo);
        ty += 28;

        // 名字 + 属性图标
        const lineName = this.add.text(tx, ty, `名字: ${elfData.nickname || baseData.name}`, {
            fontSize: '14px', color: '#d6ecff'
        });
        this.rightContent.add(lineName);
        const nameTypeKey = AssetMappings.getTypeIconKey(baseData.type);
        const iconX = tx + lineName.width + 10;
        const iconY = lineName.y + lineName.height / 2;
        if (nameTypeKey && this.textures.exists(nameTypeKey)) {
            const typeIcon = this.add.image(iconX, iconY, nameTypeKey).setOrigin(0, 0.5);
            const scale = Math.min(18 / typeIcon.width, 18 / typeIcon.height);
            typeIcon.setScale(scale);
            this.rightContent.add(typeIcon);
        } else {
            const fallback = this.add.circle(iconX + 8, iconY, 7, DataLoader.getTypeColor(baseData.type), 1).setOrigin(0, 0.5);
            fallback.setStrokeStyle(1, 0xffffff, 0.7);
            this.rightContent.add(fallback);
        }
        ty += 28;

        const restRows = [
            `等级: Lv.${elfData.level}`,
            `升级所需经验值: ${expNeed > 0 ? expNeed : '已满级'}`,
            '性格: ',
            `获得时间: ${this.formatObtainedTime(elfData)}`
        ];
        restRows.forEach((text) => {
            const line = this.add.text(tx, ty, text, {
                fontSize: '14px', color: '#d6ecff'
            });
            this.rightContent.add(line);
            ty += 28;
        });
    }

    renderStats(elf, x, y, w) {
        const stats = [
            { name: '攻击', value: elf.getAtk() },
            { name: '防御', value: elf.getDef() },
            { name: '特攻', value: elf.getSpAtk() },
            { name: '特防', value: elf.getSpDef() },
            { name: '速度', value: elf.getSpd() },
            { name: '体力', value: elf.getMaxHp() }
        ];
        const colW = Math.floor(w / 2);
        const rowH = 34;

        stats.forEach((item, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = x + col * colW;
            const sy = y + row * rowH;
            const dot = this.add.circle(sx + 8, sy + 12, 4, 0x88c8ff);
            const label = this.add.text(sx + 18, sy + 3, `${item.name}:`, {
                fontSize: '14px', color: '#aac8e8'
            });
            const value = this.add.text(sx + colW - 14, sy + 3, `${item.value}`, {
                fontSize: '14px', color: '#ffffff'
            }).setOrigin(1, 0);
            this.rightContent.add(dot);
            this.rightContent.add(label);
            this.rightContent.add(value);
        });
    }

    renderSkills(elfData, x, y, w, h) {
        const skillIds = elfData.skills || [];
        const cols = 2;
        const rows = 2;
        const gap = 8;
        const cardW = Math.floor((w - gap) / cols);
        const cardH = Math.floor((h - gap) / rows);

        for (let i = 0; i < cols * rows; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const sx = x + col * (cardW + gap);
            const sy = y + row * (cardH + gap);
            const skillId = skillIds[i];
            const skill = skillId ? DataLoader.getSkill(skillId) : null;

            const bg = this.add.graphics();
            bg.fillStyle(skill ? 0x24415d : 0x1c2f43, 1);
            bg.fillRoundedRect(sx, sy, cardW, cardH, 6);
            bg.lineStyle(1, skill ? 0x76a9d4 : 0x35516b);
            bg.strokeRoundedRect(sx, sy, cardW, cardH, 6);
            this.rightContent.add(bg);

            if (!skill) {
                const empty = this.add.text(sx + cardW / 2, sy + cardH / 2, '--', {
                    fontSize: '14px', color: '#6c87a2'
                }).setOrigin(0.5);
                this.rightContent.add(empty);
                continue;
            }

            const ppNow = elfData.skillPP[skill.id] || 0;
            const name = this.add.text(sx + 8, sy + 6, skill.name, {
                fontSize: '13px', color: '#ffffff', fontStyle: 'bold'
            });
            this.rightContent.add(name);

            this.addTypeVisual(this.rightContent, sx + cardW - 10, sy + 10, skill.type);

            const power = this.add.text(sx + 8, sy + cardH - 18, `威力 ${skill.power || '-'}`, {
                fontSize: '12px', color: '#bcd8ef'
            });
            const pp = this.add.text(sx + cardW - 8, sy + cardH - 18, `PP ${ppNow}/${skill.pp}`, {
                fontSize: '12px', color: '#d2f0a8'
            }).setOrigin(1, 0);
            this.rightContent.add(power);
            this.rightContent.add(pp);
        }
    }

    addTypeVisual(container, x, y, type) {
        const key = AssetMappings.getTypeIconKey(type);
        if (key && this.textures.exists(key)) {
            const icon = this.add.image(x, y, key).setOrigin(1, 0);
            const scale = Math.min(16 / icon.width, 16 / icon.height);
            icon.setScale(scale);
            container.add(icon);
            return;
        }
        const fallback = this.add.circle(x - 7, y + 7, 7, DataLoader.getTypeColor(type), 1).setOrigin(1, 0);
        fallback.setStrokeStyle(1, 0xffffff, 0.7);
        container.add(fallback);
    }

    drawPanelBlock(container, x, y, w, h, color) {
        const g = this.add.graphics();
        g.fillStyle(color, 0.95);
        g.fillRoundedRect(x, y, w, h, 8);
        g.lineStyle(1, 0x35506b, 1);
        g.strokeRoundedRect(x, y, w, h, 8);
        container.add(g);
    }

    addElfPortrait(container, x, y, elfId, maxWidth, maxHeight) {
        let stillKey = null;
        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getExternalStillKey === 'function') {
            stillKey = AssetMappings.getExternalStillKey(elfId);
        }

        if (stillKey && this.textures.exists(stillKey)) {
            const image = this.add.image(x, y, stillKey).setOrigin(0.5);
            const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
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
                const scale = Math.min(maxWidth / sprite.width, maxHeight / sprite.height);
                sprite.setScale(scale);
                container.add(sprite);
                return true;
            }
        }

        if (!this._missingPortraitWarned) {
            this._missingPortraitWarned = new Set();
        }
        if (!this._missingPortraitWarned.has(elfId)) {
            console.warn(`[ElfManageScene] 精灵图片缺失: elfId=${elfId}, stillKey=${stillKey || 'null'}`);
            this._missingPortraitWarned.add(elfId);
        }
        return false;
    }

    getHpBarColor(pct) {
        if (pct <= 0.2) return 0xdd4b4b;
        if (pct <= 0.5) return 0xe0b34a;
        return 0x53c56b;
    }

    formatObtainedTime(elfData) {
        if (!elfData.obtainedAt) return '未知';
        const date = new Date(elfData.obtainedAt);
        if (Number.isNaN(date.getTime())) return '未知';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d} ${hh}:${mm}`;
    }

    closePanel() {
        ModalOverlayLayer.unmount(this);

        if (this.scene.isActive(this.returnScene)) {
            this.scene.stop();
            return;
        }

        SceneRouter.start(this, this.returnScene, this.returnData || {});
    }
}

window.ElfManageScene = ElfManageScene;
