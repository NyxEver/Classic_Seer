/**
 * BattleCapsulePanelView - 战斗胶囊选择面板
 *
 * 职责：
 * - 展示玩家背包中的所有精灵胶囊（带名称、数量和悬停高亮）
 * - 点击胶囊后提交 CATCH 行动意图
 * - 与 ItemPanel / SwitchPanel 互斥显示
 *
 * 以 BattleScene 的 this 执行所有方法。
 */

const BattleCapsulePanelView = {
    /** 面板挂载时无操作（由 showCapsulePanel 按需创建） */
    mount() { },

    /** 面板更新时无操作 */
    update() { },

    /** 面板卸载时关闭胶囊面板 */
    unmount() {
        BattleCapsulePanelView.closeCapsulePanel.call(this);
    },

    /**
     * 打开胶囊选择面板（居中弹窗、带蒙版遮罩）
     * 只在 wild 战斗且有胶囊时可用
     */
    showCapsulePanel() {
        if (!this.menuEnabled || this.battleEnded || this.forceSwitchMode) {
            return;
        }
        if (this.capsulePanelContainer) {
            return;
        }

        if (!this.canCatch) {
            this.addLog('无法在此战斗中捕捉！');
            return;
        }

        const capsules = ItemBag.getCapsules();
        if (capsules.length === 0) {
            this.addLog('没有可用的精灵胶囊！');
            return;
        }

        this.closeItemPanel();
        this.closeElfSwitchPanel();

        this.capsulePanelContainer = this.add.container(this.W / 2, this.H / 2);
        this.capsulePanelContainer.setDepth(90);

        const w = 350;
        const h = 250;

        const mask = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.5).setOrigin(0.5);
        mask.setInteractive();
        this.capsulePanelContainer.add(mask);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(3, 0x4a8aca);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        this.capsulePanelContainer.add(bg);

        const title = this.add.text(0, -h / 2 + 25, '选择胶囊', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.capsulePanelContainer.add(title);

        const startY = -h / 2 + 60;
        const itemH = 50;
        capsules.forEach((capsuleInfo, index) => {
            const itemY = startY + index * (itemH + 10);
            const itemContainer = this.add.container(0, itemY);

            const itemBg = this.add.graphics();
            itemBg.fillStyle(0x2a4a7a, 1);
            itemBg.fillRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            itemBg.lineStyle(2, 0x4a7aba);
            itemBg.strokeRoundedRect(-w / 2 + 20, 0, w - 40, itemH, 6);
            itemContainer.add(itemBg);

            const nameText = this.add.text(-w / 2 + 35, itemH / 2, capsuleInfo.itemData.name, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0, 0.5);
            itemContainer.add(nameText);

            const countText = this.add.text(w / 2 - 35, itemH / 2, `x${capsuleInfo.count}`, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#aaddaa'
            }).setOrigin(1, 0.5);
            itemContainer.add(countText);

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
                this.doCatch(capsuleInfo.itemData.id);
            });

            this.capsulePanelContainer.add(itemContainer);
        });

        const cancelY = h / 2 - 35;
        const cancelBg = this.add.graphics();
        cancelBg.fillStyle(0x5a3a3a, 1);
        cancelBg.fillRoundedRect(-50, cancelY - 15, 100, 30, 6);
        this.capsulePanelContainer.add(cancelBg);

        const cancelText = this.add.text(0, cancelY, '取消', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.capsulePanelContainer.add(cancelText);

        const cancelHit = this.add.rectangle(0, cancelY, 100, 30).setInteractive({ useHandCursor: true });
        this.capsulePanelContainer.add(cancelHit);
        cancelHit.on('pointerdown', () => this.closeCapsulePanel());
    },

    /** 关闭胶囊面板 */
    closeCapsulePanel() {
        if (this.capsulePanelContainer) {
            this.capsulePanelContainer.destroy();
            this.capsulePanelContainer = null;
        }
    },

    /**
     * 执行捕捉：提交 CATCH 行动意图并关闭面板
     * @param {number|Object} capsuleOrItemId - 胶囊道具 ID 或含 id 属性的对象
     * @returns {boolean} 是否成功提交
     */
    doCatch(capsuleOrItemId) {
        const itemId = typeof capsuleOrItemId === 'number'
            ? capsuleOrItemId
            : (capsuleOrItemId && typeof capsuleOrItemId.id === 'number' ? capsuleOrItemId.id : null);

        if (!itemId) {
            return false;
        }

        const submitted = this.submitPanelIntent(BattleManager.ACTION.CATCH, { itemId });
        if (submitted) {
            this.closeCapsulePanel();
        }
        return submitted;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleCapsulePanelView', BattleCapsulePanelView);
}

window.BattleCapsulePanelView = BattleCapsulePanelView;
