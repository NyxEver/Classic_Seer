/**
 * BattlePanels - 战斗底部控制面板门面
 *
 * 职责：
 * - 统一创建 / 销毁底部面板（技能、道具、胶囊、换宠、操作按钮）
 * - 向下层子视图委托 mount/unmount/update
 * - 管理面板状态同步与可见性刷新
 * - 提供行动意图提交入口
 *
 * 以 BattleScene 的 this 执行所有方法。
 */

/**
 * 获取子视图对象（优先从 AppContext，回退到 window）
 * @param {string} viewName - 视图名称
 * @returns {Object|null}
 */
function getBattlePanelsView(viewName) {
    if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
        const view = AppContext.get(viewName, null);
        if (view) {
            return view;
        }
    }
    if (typeof window !== 'undefined') {
        return window[viewName] || null;
    }
    return null;
}

/**
 * 确保场景的面板状态字段已初始化
 * @param {Phaser.Scene} scene - 战斗场景实例
 */
function ensureBattlePanelsState(scene) {
    if (typeof scene.isItemPanelOpen !== 'boolean') {
        scene.isItemPanelOpen = false;
    }
    if (typeof scene.forceSwitchMode !== 'boolean') {
        scene.forceSwitchMode = false;
    }
    if (!Number.isFinite(scene.selectedSwitchIndex)) {
        scene.selectedSwitchIndex = 0;
    }
}

/**
 * 调用子视图方法（以 scene 作为 this）
 * @param {Phaser.Scene} scene - 战斗场景实例
 * @param {string} viewName - 视图名称
 * @param {string} methodName - 方法名
 * @param {Array} [args=[]] - 参数数组
 * @returns {*}
 */
function callBattlePanelsViewMethod(scene, viewName, methodName, args = []) {
    const view = getBattlePanelsView(viewName);
    if (!view || typeof view[methodName] !== 'function') {
        throw new Error(`[BattlePanels] Missing view method: ${viewName}.${methodName}`);
    }
    return view[methodName].apply(scene, args);
}

/**
 * 挂载所有子视图
 * @param {Phaser.Scene} scene
 * @param {Object} [options={}]
 */
function mountBattlePanelsViews(scene, options = {}) {
    const viewNames = [
        'BattleActionButtonsView',
        'BattleSkillPanelView',
        'BattleItemPanelView',
        'BattleCapsulePanelView',
        'BattleSwitchPanelView'
    ];

    viewNames.forEach((viewName) => {
        const view = getBattlePanelsView(viewName);
        if (view && typeof view.mount === 'function') {
            view.mount.call(scene, options);
        }
    });
}

/**
 * 卸载所有子视图
 * @param {Phaser.Scene} scene
 */
function unmountBattlePanelsViews(scene) {
    const viewNames = [
        'BattleActionButtonsView',
        'BattleSkillPanelView',
        'BattleItemPanelView',
        'BattleCapsulePanelView',
        'BattleSwitchPanelView'
    ];

    viewNames.forEach((viewName) => {
        const view = getBattlePanelsView(viewName);
        if (view && typeof view.unmount === 'function') {
            view.unmount.call(scene);
        }
    });
}

const BattlePanels = {
    /**
     * 创建底部控制面板（重建所有子视图、重置状态）
     */
    createBottomControlPanel() {
        const panelY = 430;
        const panelH = 170;

        if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.hide === 'function') {
            SkillTooltipView.hide(this);
        }

        unmountBattlePanelsViews(this);

        this.bottomPanelY = panelY;
        this.isItemPanelOpen = false;
        this.forceSwitchMode = false;
        this.selectedSwitchIndex = 0;
        this.skillContainer = null;
        this.actionContainer = null;
        this.itemPanelContainer = null;
        this.capsulePanelContainer = null;
        this.elfSwitchContainer = null;
        this.itemGridContainer = null;
        this.itemPanelLayout = null;
        this.categoryButtons = [];
        this.actionButtons = [];
        this.skillButtons = [];

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a2a3a, 0.95);
        panelBg.fillRect(0, panelY, this.W, panelH);
        panelBg.lineStyle(3, 0x3a5a7a);
        panelBg.lineBetween(0, panelY, this.W, panelY);

        this.createLeftInfoPanel(panelY);
        mountBattlePanelsViews(this, { panelY });
        this.refreshActionButtons();
        this.refreshPanelVisibility();

        if (!this._battlePanelsLifecycleBound) {
            this._battlePanelsLifecycleBound = true;
            const cleanup = () => {
                unmountBattlePanelsViews(this);
                this._battlePanelsLifecycleBound = false;
            };
            this.events.once('shutdown', cleanup);
            this.events.once('destroy', cleanup);
        }
    },

    /** 刷新右侧操作按钮状态并同步面板可见性 */
    refreshActionButtons() {
        ensureBattlePanelsState(this);
        const panelY = this.bottomPanelY || 430;
        callBattlePanelsViewMethod(this, 'BattleActionButtonsView', 'update', [{ panelY }]);
        this.refreshPanelVisibility();
    },

    /**
     * 刷新面板可见性（技能面板 / 道具面板 / tooltip / 透明度）
     * 根据 isItemPanelOpen、forceSwitchMode、battleEnded 决定各容器状态
     */
    refreshPanelVisibility() {
        ensureBattlePanelsState(this);

        if ((this.isItemPanelOpen === true || this.forceSwitchMode === true || this.battleEnded === true)
            && typeof SkillTooltipView !== 'undefined'
            && SkillTooltipView
            && typeof SkillTooltipView.hide === 'function') {
            // 面板切换/战斗结束时强制隐藏 Tooltip，避免悬浮层停留在已销毁技能按钮上。
            SkillTooltipView.hide(this);
        }

        if (this.isItemPanelOpen === true && !this.itemPanelContainer) {
            this.isItemPanelOpen = false;
        }
        if (this.forceSwitchMode === true && !this.elfSwitchContainer) {
            this.forceSwitchMode = false;
        }

        const showSkillPanel = this.isItemPanelOpen !== true && this.forceSwitchMode !== true;
        if (showSkillPanel) {
            if (!this.skillContainer) {
                this.createMiddleSkillPanel(this.bottomPanelY || 430);
            } else if ((!this.skillButtons || this.skillButtons.length === 0) && typeof this.rebuildSkillPanel === 'function') {
                this.rebuildSkillPanel();
            }
        }

        if (this.skillContainer) {
            this.skillContainer.setVisible(showSkillPanel);
        }

        if (this.itemPanelContainer) {
            this.itemPanelContainer.setVisible(this.isItemPanelOpen === true && this.forceSwitchMode !== true);
        }

        const locked = !this.menuEnabled || this.battleEnded;
        const alpha = locked ? 0.4 : 1;

        if (this.skillContainer) {
            this.skillContainer.setAlpha(alpha);
        }
        if (this.actionContainer) {
            this.actionContainer.setAlpha(alpha);
        }
    },

    /**
     * 提交行动意图（强制换宠模式下仅允许 SWITCH）
     * @param {string} intent - 行动类型
     * @param {Object} [payload={}] - 行动负载
     * @returns {boolean} 是否提交成功
     */
    submitPanelIntent(intent, payload = {}) {
        if (this.forceSwitchMode && intent !== BattleManager.ACTION.SWITCH && intent !== 'switch') {
            return false;
        }
        if (typeof this.submitBattleIntent !== 'function') {
            return false;
        }
        return this.submitBattleIntent(intent, payload);
    }
};

/**
 * 子视图方法映射表：门面方法名 → [视图名, 实际方法名]
 * 由下方 forEach 动态绑定到 BattlePanels 对象
 */
const BATTLE_PANEL_VIEW_METHODS = {
    createMiddleSkillPanel: ['BattleSkillPanelView', 'createMiddleSkillPanel'],
    createSkillButton: ['BattleSkillPanelView', 'createSkillButton'],
    createEmptySkillSlot: ['BattleSkillPanelView', 'createEmptySkillSlot'],
    updateSkillPP: ['BattleSkillPanelView', 'updateSkillPP'],
    createRightActionButtons: ['BattleActionButtonsView', 'createRightActionButtons'],
    showSkillPanel: ['BattleSkillPanelView', 'showSkillPanel'],
    createActionButton: ['BattleActionButtonsView', 'createActionButton'],
    showCapsulePanel: ['BattleCapsulePanelView', 'showCapsulePanel'],
    closeCapsulePanel: ['BattleCapsulePanelView', 'closeCapsulePanel'],
    doCatch: ['BattleCapsulePanelView', 'doCatch'],
    showItemPanel: ['BattleItemPanelView', 'showItemPanel'],
    createCategoryButton: ['BattleItemPanelView', 'createCategoryButton'],
    updateCategoryHighlight: ['BattleItemPanelView', 'updateCategoryHighlight'],
    updateItemGrid: ['BattleItemPanelView', 'updateItemGrid'],
    createItemSlot: ['BattleItemPanelView', 'createItemSlot'],
    useItem: ['BattleItemPanelView', 'useItem'],
    closeItemPanel: ['BattleItemPanelView', 'closeItemPanel'],
    showElfSwitchPanel: ['BattleSwitchPanelView', 'showElfSwitchPanel'],
    createElfSlot: ['BattleSwitchPanelView', 'createElfSlot'],
    selectSwitchElf: ['BattleSwitchPanelView', 'selectSwitchElf'],
    updateElfSwitchInfo: ['BattleSwitchPanelView', 'updateElfSwitchInfo'],
    createSwitchSkillCard: ['BattleSwitchPanelView', 'createSwitchSkillCard'],
    closeElfSwitchPanel: ['BattleSwitchPanelView', 'closeElfSwitchPanel'],
    doSwitch: ['BattleSwitchPanelView', 'doSwitch'],
    updatePlayerSpriteAndStatus: ['BattleSwitchPanelView', 'updatePlayerSpriteAndStatus'],
    rebuildSkillPanel: ['BattleSkillPanelView', 'rebuildSkillPanel'],
    showForceSwitchPanel: ['BattleSwitchPanelView', 'showForceSwitchPanel']
};

Object.entries(BATTLE_PANEL_VIEW_METHODS).forEach(([facadeMethod, mapping]) => {
    const viewName = mapping[0];
    const methodName = mapping[1];
    BattlePanels[facadeMethod] = function (...args) {
        ensureBattlePanelsState(this);
        return callBattlePanelsViewMethod(this, viewName, methodName, args);
    };
});

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattlePanels', BattlePanels);
}

window.BattlePanels = BattlePanels;
