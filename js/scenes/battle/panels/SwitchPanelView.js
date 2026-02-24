/**
 * BattleSwitchPanelView - 战斗换宠面板
 *
 * 职责：
 * - 展示玩家精灵队伍列表（头像槽位 + 选中高亮）
 * - 展示选中精灵的 HP、技能预览与"出战"按钮
 * - 支持普通换宠与强制换宠（forceSwitchMode）两种模式
 * - 执行换宠后更新精灵容器、状态栏与技能面板
 *
 * 以 BattleScene 的 this 执行所有方法。
 */

const BattleSwitchPanelView = {
    /** 面板挂载时无操作（由 showElfSwitchPanel 按需创建） */
    mount() { },

    /** 面板更新时无操作 */
    update() { },

    /** 面板卸载时关闭换宠面板 */
    unmount() {
        BattleSwitchPanelView.closeElfSwitchPanel.call(this, { allowForceClose: true });
    },

    /**
     * 打开换宠面板
     * @param {boolean} [forceSwitch=false] - 是否为强制换宠模式（玩家精灵倒下后必须选择）
     */
    showElfSwitchPanel(forceSwitch = false) {
        if (!forceSwitch && (!this.menuEnabled || this.battleEnded || this.forceSwitchMode)) {
            return;
        }

        const panelOpen = !!(this.elfSwitchContainer && this.elfSwitchContainer.scene);
        if (panelOpen) {
            if (this.forceSwitchMode === true) {
                return;
            }

            if (!forceSwitch) {
                this.closeElfSwitchPanel();
                this.refreshActionButtons();
                this.refreshPanelVisibility();
                return;
            }

            this.closeElfSwitchPanel({ allowForceClose: true });
        }

        this.closeItemPanel();
        this.closeCapsulePanel();

        const panelY = 430;
        const panelX = 310;
        const panelW = 380;
        const panelH = 150;
        const panelPadding = 10;
        this.elfSwitchContainer = this.add.container(panelX, panelY + 10);
        this.elfSwitchContainer.setDepth(70);

        this.forceSwitchMode = forceSwitch;
        if (forceSwitch) {
            this.disableMenu();
            this.stopTurnTimer();
        }

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 0.98);
        bg.fillRoundedRect(0, 0, panelW, panelH, 10);
        bg.lineStyle(2, 0x4a7aaa);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 10);
        this.elfSwitchContainer.add(bg);

        const topBarY = panelPadding;
        const slotSize = 36;
        const slotGap = 6;
        const elves = PlayerData.elves;

        this.elfSlots = [];
        this.selectedSwitchIndex = 0;

        for (let i = 0; i < elves.length; i++) {
            const slotX = panelPadding + i * (slotSize + slotGap);
            const slot = BattleSwitchPanelView.createElfSlot.call(this, slotX, topBarY, slotSize, elves[i], i);
            this.elfSwitchContainer.add(slot);
            this.elfSlots.push(slot);
        }

        this.elfInfoContainer = this.add.container(panelPadding, topBarY + slotSize + 10);
        this.elfSwitchContainer.add(this.elfInfoContainer);

        this.elfSkillContainer = this.add.container(188, topBarY + slotSize + 8);
        this.elfSwitchContainer.add(this.elfSkillContainer);

        for (let i = 0; i < elves.length; i++) {
            if (elves[i] !== this.playerElf._instanceData) {
                this.selectSwitchElf(i);
                break;
            }
        }

        this.refreshActionButtons();
        this.refreshPanelVisibility();
    },

    /**
     * 创建单个精灵头像槽位
     * @param {number} x - 槽位 X
     * @param {number} y - 槽位 Y
     * @param {number} size - 槽位边长
     * @param {Object} elfData - 精灵持久化数据
     * @param {number} index - 队伍索引
     * @returns {Phaser.GameObjects.Container} 槽位容器
     */
    createElfSlot(x, y, size, elfData, index) {
        const container = this.add.container(x, y);
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) {
            return container;
        }

        const elf = new Elf(baseData, elfData);
        const isCurrent = elfData === this.playerElf._instanceData;
        const canFight = elfData.currentHp > 0;

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

        const portrait = ElfPortraitView.addStillPortrait(this, container, size / 2, size / 2, baseData.id, {
            maxSize: size - 8,
            tint: canFight ? null : 0x666666,
            warnTag: 'BattleScene'
        });

        if (!portrait) {
            const iconText = this.add.text(size / 2, size / 2, baseData.name.charAt(0), {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: canFight ? '#ffffff' : '#666666',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(iconText);
        }

        const lvText = this.add.text(size - 2, size - 2, `${elf.level}`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#aaddaa'
        }).setOrigin(1, 1);
        container.add(lvText);

        if (!isCurrent && canFight) {
            const hit = this.add.rectangle(size / 2, size / 2, size, size).setInteractive({ useHandCursor: true });
            container.add(hit);
            hit.on('pointerdown', () => this.selectSwitchElf(index));
        }

        container._bg = bg;
        container._index = index;
        container._elfData = elfData;
        container._isCurrent = isCurrent;
        container._size = size;

        return container;
    },

    /**
     * 选中指定索引的精灵（更新槽位高亮与详情区）
     * @param {number} index - 队伍索引
     */
    selectSwitchElf(index) {
        this.selectedSwitchIndex = index;

        this.elfSlots.forEach((slot, i) => {
            const bg = slot._bg;
            if (!bg) {
                return;
            }
            const slotSize = Number.isFinite(slot._size) ? slot._size : 40;
            const isCurrent = slot._isCurrent;
            const canFight = slot._elfData.currentHp > 0;
            const isSelected = i === index;

            bg.clear();
            const bgColor = isCurrent ? 0x4a6a8a : (isSelected ? 0x3a6a9a : (canFight ? 0x2a4a6a : 0x3a3a3a));
            bg.fillStyle(bgColor, 1);
            bg.fillRoundedRect(0, 0, slotSize, slotSize, 6);
            if (isCurrent) {
                bg.lineStyle(3, 0xffdd44);
            } else if (isSelected) {
                bg.lineStyle(3, 0x88ccff);
            } else {
                bg.lineStyle(2, canFight ? 0x4a8aca : 0x555555);
            }
            bg.strokeRoundedRect(0, 0, slotSize, slotSize, 6);
        });

        this.updateElfSwitchInfo(index);
    },

    /**
     * 更新选中精灵的详情区（HP、属性、技能预览、出战按钮）
     * @param {number} index - 队伍索引
     */
    updateElfSwitchInfo(index) {
        this.elfInfoContainer.removeAll(true);
        this.elfSkillContainer.removeAll(true);

        const elfData = PlayerData.elves[index];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData) {
            return;
        }

        const elf = new Elf(baseData, elfData);
        const canFight = elfData.currentHp > 0;
        const isCurrent = elfData === this.playerElf._instanceData;

        const name = elfData.nickname || baseData.name;
        const nameText = this.add.text(0, 0, name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.elfInfoContainer.add(nameText);

        const hpLabel = this.add.text(0, 25, `HP: ${elfData.currentHp}/${elf.getMaxHp()}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#88ddaa'
        });
        this.elfInfoContainer.add(hpLabel);

        const hpBarW = 165;
        const hpBarH = 12;
        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x222222, 1);
        hpBg.fillRoundedRect(0, 45, hpBarW, hpBarH, 4);
        this.elfInfoContainer.add(hpBg);

        const hpPct = elfData.currentHp / elf.getMaxHp();
        if (hpPct > 0) {
            const hpBar = this.add.graphics();
            let hpColor = 0x44dd44;
            if (hpPct <= 0.2) {
                hpColor = 0xdd4444;
            } else if (hpPct <= 0.5) {
                hpColor = 0xddaa44;
            }
            hpBar.fillStyle(hpColor, 1);
            hpBar.fillRoundedRect(2, 47, (hpBarW - 4) * hpPct, hpBarH - 4, 3);
            this.elfInfoContainer.add(hpBar);
        }

        const btnY = 65;
        const btnW = 72;
        const btnH = 28;
        const btnEnabled = canFight && !isCurrent;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(btnEnabled ? 0x44aa66 : 0x444444, 1);
        btnBg.fillRoundedRect(0, btnY, btnW, btnH, 6);
        this.elfInfoContainer.add(btnBg);

        const btnText = this.add.text(btnW / 2, btnY + btnH / 2, '出战', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: btnEnabled ? '#ffffff' : '#888888',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elfInfoContainer.add(btnText);

        if (btnEnabled) {
            const btnHit = this.add.rectangle(btnW / 2, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
            this.elfInfoContainer.add(btnHit);
            btnHit.on('pointerdown', () => this.doSwitch(index));
        }

        const skillW = 88;
        const skillH = 32;
        const skillGapX = 4;
        const skillGapY = 4;

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
                    const skillCard = BattleSwitchPanelView.createSwitchSkillCard.call(this, sx, sy, skillW, skillH, skillData, currentPP);
                    this.elfSkillContainer.add(skillCard);
                }
            } else {
                const emptyCard = this.add.graphics();
                emptyCard.fillStyle(0x222222, 0.5);
                emptyCard.fillRoundedRect(sx, sy, skillW, skillH, 4);
                this.elfSkillContainer.add(emptyCard);

                const dash = this.add.text(sx + skillW / 2, sy + skillH / 2, '-', {
                    fontSize: '16px',
                    color: '#444444'
                }).setOrigin(0.5);
                this.elfSkillContainer.add(dash);
            }
        }
    },

    /**
     * 创建换宠面板中的技能预览卡片
     * @param {number} x - 卡片 X
     * @param {number} y - 卡片 Y
     * @param {number} w - 卡片宽
     * @param {number} h - 卡片高
     * @param {Object} skill - 技能数据
     * @param {number} currentPP - 当前 PP
     * @returns {Phaser.GameObjects.Container} 卡片容器
     */
    createSwitchSkillCard(x, y, w, h, skill, currentPP) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a6a, 1);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(1, 0x4a6a8a);
        bg.strokeRoundedRect(0, 0, w, h, 4);
        container.add(bg);

        const compact = w <= 100;

        const nameText = this.add.text(8, 5, skill.name, {
            fontSize: compact ? '11px' : '13px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(nameText);

        const metaLabel = compact
            ? `PP${currentPP}/${skill.pp}`
            : `威力${skill.power}  PP${currentPP}/${skill.pp}`;
        const metaText = this.add.text(8, compact ? 19 : 23, metaLabel, {
            fontSize: compact ? '10px' : '11px',
            fontFamily: 'Arial',
            color: '#88aacc'
        });
        container.add(metaText);

        if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.renderSkill === 'function') {
            TypeIconView.renderSkill(this, container, w - 12, h / 2, skill, {
                iconSize: 16,
                originX: 1,
                originY: 0.5
            });
        } else {
            const fallbackDot = this.add.circle(w - 12, h / 2, 8, 0x8899aa, 1).setOrigin(1, 0.5);
            container.add(fallbackDot);
        }

        return container;
    },

    /**
     * 关闭换宠面板并重置 forceSwitchMode
     * @param {Object} [options={}] - { allowForceClose: boolean }
     * @returns {boolean} 是否实际关闭
     */
    closeElfSwitchPanel(options = {}) {
        const allowForceClose = options.allowForceClose === true;
        if (this.forceSwitchMode === true && !allowForceClose) {
            return false;
        }

        if (this.elfSwitchContainer) {
            this.elfSwitchContainer.destroy();
            this.elfSwitchContainer = null;
        }
        this.forceSwitchMode = false;
        this.selectedSwitchIndex = 0;
        return true;
    },

    /**
     * 执行换宠操作
     * - 普通模式：提交 SWITCH 行动意图
     * - 强制模式：直接换宠后恢复菜单与计时器
     * @param {number} elfIndex - 队伍索引
     */
    doSwitch(elfIndex) {
        const elfData = PlayerData.elves[elfIndex];
        const baseData = DataLoader.getElf(elfData.elfId);
        if (!baseData || elfData.currentHp <= 0) {
            return;
        }

        const wasForceSwitch = this.forceSwitchMode === true;
        if (!wasForceSwitch && (!this.menuEnabled || this.battleEnded || this.actionIntentLocked)) {
            return;
        }

        const previousPlayerElf = this.playerElf;
        const previousManagerElf = this.battleManager ? this.battleManager.playerElf : null;
        const newElf = new Elf(baseData, elfData);

        this.closeElfSwitchPanel({ allowForceClose: true });

        this.addLog(`${this.playerElf.getDisplayName()}，回来吧！`);
        this.addLog(`去吧，${newElf.getDisplayName()}！`);

        this.playerElf = newElf;
        this.battleManager.playerElf = newElf;

        this.updatePlayerSpriteAndStatus();

        if (wasForceSwitch) {
            this.showLogs(() => {
                this.enableMenu();
                this.startTurnTimer();
            });
        } else {
            const submitted = this.submitPanelIntent(BattleManager.ACTION.SWITCH, { elfIndex });
            if (!submitted) {
                this.playerElf = previousPlayerElf;
                if (this.battleManager) {
                    this.battleManager.playerElf = previousManagerElf;
                }
                this.updatePlayerSpriteAndStatus();
            }
        }
    },

    /**
     * 换宠后刷新玩家精灵容器、状态栏与技能面板
     */
    updatePlayerSpriteAndStatus() {
        if (this.playerSprite) {
            this.playerSprite.destroy();
        }
        this.playerSprite = this.createCharacterSprite(200, 230, this.playerElf, true);

        if (this.playerStatus && this.playerStatus.container) {
            this.playerStatus.container.destroy();
        }
        this.createStatusBar(this.playerElf, 20, 10, true);
        if (typeof this.refreshStatusIcons === 'function') {
            this.refreshStatusIcons();
        }

        this.rebuildSkillPanel();
    },

    /**
     * 显示强制换宠面板（玩家精灵倒下后调用）
     * @returns {boolean} 如果队伍中无可战斗精灵则返回 false
     */
    showForceSwitchPanel() {
        const availableElves = PlayerData.elves.filter((e) => e.currentHp > 0);

        if (availableElves.length === 0) {
            return false;
        }

        this.addLog('必须选择一只精灵出战！');
        this.showElfSwitchPanel(true);
        return true;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleSwitchPanelView', BattleSwitchPanelView);
}

window.BattleSwitchPanelView = BattleSwitchPanelView;
