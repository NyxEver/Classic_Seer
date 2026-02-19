/**
 * BattleSkillPanelView - 战斗技能面板
 *
 * 职责：
 * - 展示玩家当前精灵的 4 个技能按钮（含属性图标、PP 显示）
 * - 实时同步 PP 状态并切换按钮禁用/可用样式
 * - 支持 SkillTooltip 悬浮提示绑定
 * - 提供面板重建（换宠后调用）
 *
 * 以 BattleScene 的 this 执行所有方法。
 */

const BattleSkillPanelView = {
    /**
     * 面板挂载：如果已存在则重建，否则首次创建
     * @param {Object} [options={}] - { panelY: number }
     */
    mount(options = {}) {
        const panelY = Number.isFinite(options.panelY) ? options.panelY : (this.bottomPanelY || 430);
        if (this.skillContainer && !this.skillContainer.scene) {
            this.skillContainer = null;
        }
        if (this.skillContainer) {
            BattleSkillPanelView.rebuildSkillPanel.call(this);
            return;
        }
        BattleSkillPanelView.createMiddleSkillPanel.call(this, panelY);
    },

    /** 面板更新：同步所有技能按钮的 PP 显示 */
    update() {
        BattleSkillPanelView.updateSkillPP.call(this);
    },

    /** 面板卸载：隐藏 tooltip 并销毁技能容器 */
    unmount() {
        if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.hide === 'function') {
            SkillTooltipView.hide(this);
        }
        if (this.skillContainer) {
            this.skillContainer.destroy();
            this.skillContainer = null;
        }
        this.skillButtons = [];
    },

    /**
     * 创建技能面板（2×2 网格布局）
     * @param {number} panelY - 面板顶部 Y 坐标
     */
    createMiddleSkillPanel(panelY) {
        const x = 310;
        const y = panelY + 10;
        const w = 380;
        const h = 150;

        const skillBg = this.add.graphics();
        skillBg.fillStyle(0x152030, 1);
        skillBg.fillRoundedRect(x, y, w, h, 6);
        skillBg.lineStyle(2, 0x2a4a6a);
        skillBg.strokeRoundedRect(x, y, w, h, 6);

        this.skillContainer = this.add.container(0, 0);

        const skills = this.playerElf.getSkillDetails();
        const skillBtnW = 175;
        const skillBtnH = 55;
        const gapX = 10;
        const gapY = 10;
        const totalW = skillBtnW * 2 + gapX;
        const totalH = skillBtnH * 2 + gapY;
        const startX = x + Math.floor((w - totalW) / 2);
        const startY = y + Math.floor((h - totalH) / 2);

        this.skillButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = startX + col * (skillBtnW + gapX);
            const btnY = startY + row * (skillBtnH + gapY);

            if (i < skills.length) {
                const skill = skills[i];
                const btn = BattleSkillPanelView.createSkillButton.call(this, btnX, btnY, skillBtnW, skillBtnH, skill, i);
                this.skillButtons.push(btn);
                this.skillContainer.add(btn);
            } else {
                const emptyBtn = BattleSkillPanelView.createEmptySkillSlot.call(this, btnX, btnY, skillBtnW, skillBtnH);
                this.skillButtons.push(emptyBtn);
                this.skillContainer.add(emptyBtn);
            }
        }
    },

    /**
     * 创建单个技能按钮（含属性图标、PP 文本、hover/tooltip 绑定）
     * @param {number} x - 按钮 X
     * @param {number} y - 按钮 Y
     * @param {number} w - 按钮宽
     * @param {number} h - 按钮高
     * @param {Object} skill - 技能详情数据
     * @param {number} index - 技能槽位索引
     * @returns {Phaser.GameObjects.Container} 按钮容器
     */
    createSkillButton(x, y, w, h, skill, index) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0x2a4a7a, 1);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(2, 0x4a7aba);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const nameText = this.add.text(10, 10, skill.name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(nameText);

        if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.renderSkill === 'function') {
            TypeIconView.renderSkill(this, container, 10, 38, skill, {
                iconSize: 14,
                originX: 0,
                originY: 0.5
            });
        } else {
            const fallbackDot = this.add.circle(10, 38, 7, 0x8899aa, 1).setOrigin(0, 0.5);
            container.add(fallbackDot);
        }

        const ppText = this.add.text(w - 10, h / 2, `PP ${skill.currentPP}/${skill.pp}`, {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#aaddaa'
        }).setOrigin(1, 0.5);
        container.add(ppText);

        const hit = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.001)
            .setInteractive({ useHandCursor: true });
        container.add(hit);

        if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView) {
            if (typeof SkillTooltipView.bind === 'function') {
                SkillTooltipView.bind(this, hit, skill, {
                    bindKey: '__seerSkillTooltipBound',
                    onOver: () => {
                        const disabledNow = BattleSkillPanelView.syncSkillButtonState.call(this, container);
                        if (disabledNow) {
                            return;
                        }
                        bg.clear();
                        bg.fillStyle(0x3a6aaa, 1);
                        bg.fillRoundedRect(0, 0, w, h, 6);
                        bg.lineStyle(2, 0x5a9ada);
                        bg.strokeRoundedRect(0, 0, w, h, 6);
                    },
                    onOut: () => {
                        BattleSkillPanelView.syncSkillButtonState.call(this, container);
                    }
                });
            }
        }

        hit.on('pointerdown', () => {
            const disabledNow = BattleSkillPanelView.syncSkillButtonState.call(this, container);
            if (disabledNow) {
                return;
            }
            if (this.menuEnabled && !this.battleEnded) {
                this.doSkill(skill.id);
            }
        });

        container._skill = skill;
        container._ppText = ppText;
        container._nameText = nameText;
        container._bg = bg;
        container._hit = hit;
        container._w = w;
        container._h = h;
        container._index = index;
        BattleSkillPanelView.syncSkillButtonState.call(this, container);
        return container;
    },

    /**
     * 创建空技能槽位（未学满 4 技能时使用）
     * @param {number} x - 槽位 X
     * @param {number} y - 槽位 Y
     * @param {number} w - 槽位宽
     * @param {number} h - 槽位高
     * @returns {Phaser.GameObjects.Container}
     */
    createEmptySkillSlot(x, y, w, h) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 0.5);
        bg.fillRoundedRect(0, 0, w, h, 6);
        bg.lineStyle(1, 0x333333);
        bg.strokeRoundedRect(0, 0, w, h, 6);
        container.add(bg);

        const text = this.add.text(w / 2, h / 2, '-', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#444444'
        }).setOrigin(0.5);
        container.add(text);

        return container;
    },

    /** 同步所有技能按钮的 PP 显示（从精灵实例读取最新值） */
    updateSkillPP() {
        const skills = this.playerElf.getSkillDetails();
        for (let i = 0; i < skills.length && i < this.skillButtons.length; i++) {
            const btn = this.skillButtons[i];
            if (btn._skill && btn._ppText) {
                const skill = skills[i];
                btn._skill.currentPP = skill.currentPP;
                BattleSkillPanelView.syncSkillButtonState.call(this, btn);
            }
        }
    },

    /**
     * 同步单个技能按钮的视觉状态（PP 文本、颜色、禁用样式）
     * @param {Phaser.GameObjects.Container} btn - 技能按钮容器
     * @returns {boolean} 按钮是否处于禁用状态
     */
    syncSkillButtonState(btn) {
        if (!btn || !btn._skill || !btn._bg || !btn._ppText) {
            return false;
        }

        const skillId = btn._skill.id;
        const ppNowRaw = this.playerElf && this.playerElf.skillPP ? this.playerElf.skillPP[skillId] : btn._skill.currentPP;
        const ppNow = Number.isFinite(ppNowRaw) ? ppNowRaw : 0;
        const ppMax = Number.isFinite(btn._skill.pp) ? btn._skill.pp : 0;
        const disabled = ppNow <= 0;

        btn._skill.currentPP = ppNow;
        btn._ppText.setText(`PP ${ppNow}/${ppMax}`);

        if (btn._nameText) {
            btn._nameText.setColor(disabled ? '#666666' : '#ffffff');
        }
        btn._ppText.setColor(disabled ? '#444444' : '#aaddaa');

        btn._bg.clear();
        if (disabled) {
            btn._bg.fillStyle(0x333333, 1);
            btn._bg.fillRoundedRect(0, 0, btn._w, btn._h, 6);
            btn._bg.lineStyle(2, 0x444444);
            btn._bg.strokeRoundedRect(0, 0, btn._w, btn._h, 6);
        } else {
            btn._bg.fillStyle(0x2a4a7a, 1);
            btn._bg.fillRoundedRect(0, 0, btn._w, btn._h, 6);
            btn._bg.lineStyle(2, 0x4a7aba);
            btn._bg.strokeRoundedRect(0, 0, btn._w, btn._h, 6);
        }

        if (btn._hit && btn._hit.input) {
            btn._hit.input.cursor = disabled ? 'default' : 'pointer';
        }

        return disabled;
    },

    /** 显示/切换技能面板（如果道具面板打开则关闭道具面板以恢复技能面板可见） */
    showSkillPanel() {
        if (this.isItemPanelOpen) {
            this.closeItemPanel();
            return;
        }
        this.refreshActionButtons();
    },

    /** 重建技能面板（换宠后调用，销毁旧按钮并重新创建） */
    rebuildSkillPanel() {
        if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.hide === 'function') {
            SkillTooltipView.hide(this);
        }
        if (this.skillContainer) {
            this.skillContainer.removeAll(true);
        }

        const skills = this.playerElf.getSkillDetails();
        const panelY = 430;
        const x = 310;
        const y = panelY + 10;
        const w = 380;
        const h = 150;
        const skillBtnW = 175;
        const skillBtnH = 55;
        const gapX = 10;
        const gapY = 10;
        const totalW = skillBtnW * 2 + gapX;
        const totalH = skillBtnH * 2 + gapY;
        const startX = x + Math.floor((w - totalW) / 2);
        const startY = y + Math.floor((h - totalH) / 2);

        this.skillButtons = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btnX = startX + col * (skillBtnW + gapX);
            const btnY = startY + row * (skillBtnH + gapY);

            if (i < skills.length) {
                const skill = skills[i];
                const btn = BattleSkillPanelView.createSkillButton.call(this, btnX, btnY, skillBtnW, skillBtnH, skill, i);
                this.skillButtons.push(btn);
                this.skillContainer.add(btn);
            } else {
                const emptyBtn = BattleSkillPanelView.createEmptySkillSlot.call(this, btnX, btnY, skillBtnW, skillBtnH);
                this.skillButtons.push(emptyBtn);
                this.skillContainer.add(emptyBtn);
            }
        }
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleSkillPanelView', BattleSkillPanelView);
}

window.BattleSkillPanelView = BattleSkillPanelView;
