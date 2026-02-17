/**
 * BattleScene - 战斗场景门面
 * 仅保留场景编排、回合入口和基础状态管理。
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
        this.returnData = data.returnData || {};
        this.battleBackgroundKey = data.battleBackgroundKey || null;
        this.battleHudLayoutConfig = data.battleHudLayoutConfig && typeof data.battleHudLayoutConfig === 'object'
            ? data.battleHudLayoutConfig
            : null;
    }

    create() {
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        this.messageQueue = [];
        this.menuEnabled = false;
        this.battleEnded = false;
        this.turnTimer = null;
        this.turnTimeLeft = 10;
        this.deferredBattleEndResult = null;
        this.actionIntentLocked = false;
        this.isAnimationPlaying = false;
        this._animationLockCount = 0;
        this.postFlowLocked = false;
        this.returnTriggered = false;
        this.bgmStopTriggered = false;
        this.battleBgm = null;
        this.isBgmFadingOut = false;

        verifyBattleSceneFacadesOrThrow();

        this.events.once('shutdown', this.cleanupBattleBgm, this);
        this.events.once('destroy', this.cleanupBattleBgm, this);

        this.createBackground();
        this.createTopBar();
        this.createMainBattleArea();
        this.createBottomControlPanel();
        this.createCenterPopupDialog();

        this.battleManager = new BattleManager({
            playerElf: this.playerElf,
            enemyElf: this.enemyElf,
            battleType: this.battleType,
            canEscape: this.canEscape,
            canCatch: this.canCatch,
            onMessage: (msg) => this.addLog(msg),
            onBattleEnd: (result) => {
                this.deferredBattleEndResult = result;
            }
        });

        this.playBattleBgm();

        this.showLogs(() => {
            if (!this.battleEnded) {
                this.enableMenu();
                this.startTurnTimer();
            }
        });
    }

    doSkill(skillId) {
        this.submitBattleIntent(BattleManager.ACTION.SKILL, { skillId });
    }

    doEscape() {
        this.submitBattleIntent(BattleManager.ACTION.ESCAPE);
    }

    submitBattleIntent(intent, payload = {}) {
        if (!this.battleManager || this.battleEnded || !this.menuEnabled || this.actionIntentLocked || this.isAnimationPlaying) {
            return false;
        }

        if (this.forceSwitchMode && intent !== BattleManager.ACTION.SWITCH && intent !== 'switch') {
            return false;
        }

        this.actionIntentLocked = true;
        this.disableMenu();
        this.battleManager.setPlayerAction(intent, payload);
        this.executeTurn();
        return true;
    }

    async executeTurn() {
        if (!this.battleManager) {
            this.actionIntentLocked = false;
            return;
        }

        this.deferredBattleEndResult = null;
        let result = null;
        try {
            result = await this.battleManager.executeTurn();
            if (typeof this.refreshStatusIcons === 'function') {
                this.refreshStatusIcons();
            }
        } catch (error) {
            console.error('[BattleScene] executeTurn 失败:', error);
            this.actionIntentLocked = false;
            if (!this.battleEnded) {
                this.enableMenu();
                this.startTurnTimer();
            }
            return;
        }

        let animationResult = null;
        try {
            animationResult = await this.playTurnAnimations(result);
        } catch (error) {
            console.error('[BattleScene] playTurnAnimations 失败:', error);
        }

        const catchResult = animationResult && animationResult.catchResult
            ? animationResult.catchResult
            : (result.catchResult || null);

        const floatTextsQueuedByAnimator = animationResult && animationResult.floatTextsQueued === true;
        if (!floatTextsQueuedByAnimator && typeof this.showTurnFloatTexts === 'function') {
            this.showTurnFloatTexts(result);
        }
        if (typeof this.queueTurnSkillLogs === 'function') {
            this.queueTurnSkillLogs(result);
        }

        if (catchResult) {
            if (catchResult.success) {
                this.finalizeBattleOnce('capture_success', {
                    title: '🎉 捕捉成功！',
                    message: `成功捕捉了 ${this.enemyElf.getDisplayName()}！`
                });
                return;
            }
        }

        await new Promise((resolve) => this.showLogs(resolve));

        const outcome = result.outcome || {};

        if (outcome.escaped || result.escaped) {
            this.finalizeBattleOnce('escape_success', {
                title: '逃跑成功！',
                message: '成功逃离了战斗！'
            });
            return;
        }

        if (outcome.battleEnded || result.battleEnded) {
            const battleEndResult = this.deferredBattleEndResult || {
                victory: (outcome.winner || result.winner) === 'player'
            };
            this.deferredBattleEndResult = null;
            this.finalizeBattleOnce('battle_end', {
                result: battleEndResult
            });
            return;
        }

        if (outcome.needSwitch || result.needSwitch) {
            this.playerElf._instanceData.currentHp = 0;
            PlayerData.saveToStorage();
            await new Promise((resolve) => this.showLogs(resolve));
            this.actionIntentLocked = false;
            this.showForceSwitchPanel();
            return;
        }

        if (!this.battleEnded) {
            this.actionIntentLocked = false;
            this.enableMenu();
            this.startTurnTimer();
        }
    }
}

const BATTLE_SCENE_FACADE_METHODS = {
    BattleHud: [
        'createTopBar',
        'createStatusIconRows',
        'refreshStatusIcons',
        'createStatusBar',
        'updateStatusHp',
        'createLeftInfoPanel',
        'createCenterPopupDialog',
        'showPopup',
        'addLog',
        'getSkillNameById',
        'getBattleSideDisplayName',
        'getBattleSideStatusText',
        'queueTurnSkillLogs',
        'clipLogTextToWidth',
        'appendLogEntry',
        'showLogs',
        'resolveFloatStyle',
        'getFloatAnchorBySide',
        'createFloatBubble',
        'playNextTurnFloatText',
        'showTurnFloatTexts',
        'startTurnTimer',
        'stopTurnTimer',
        'updateTimerDisplay',
        'enableMenu',
        'disableMenu'
    ],
    BattlePanels: [
        'createBottomControlPanel',
        'createMiddleSkillPanel',
        'createSkillButton',
        'createEmptySkillSlot',
        'updateSkillPP',
        'createRightActionButtons',
        'refreshActionButtons',
        'refreshPanelVisibility',
        'submitPanelIntent',
        'showSkillPanel',
        'createActionButton',
        'showCapsulePanel',
        'closeCapsulePanel',
        'doCatch',
        'showItemPanel',
        'createCategoryButton',
        'updateCategoryHighlight',
        'updateItemGrid',
        'createItemSlot',
        'useItem',
        'closeItemPanel',
        'showElfSwitchPanel',
        'createElfSlot',
        'selectSwitchElf',
        'updateElfSwitchInfo',
        'createSwitchSkillCard',
        'closeElfSwitchPanel',
        'doSwitch',
        'updatePlayerSpriteAndStatus',
        'rebuildSkillPanel',
        'showForceSwitchPanel'
    ],
    BattleAnimator: [
        'createBackground',
        'createMainBattleArea',
        'createCharacterSprite',
        'playTurnAnimations',
        'playCatchAnimation'
    ],
    BattlePostFlow: [
        'finalizeBattleOnce',
        'handleBattleEnd',
        'processPostBattle',
        'processNextPendingSkill',
        'processEvolution',
        'returnToMap',
        'playBattleBgm',
        'fadeOutBattleBgm',
        'cleanupBattleBgm'
    ]
};

function getBattleFacade(facadeName) {
    if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
        const facade = AppContext.get(facadeName, null);
        if (facade) {
            return facade;
        }
    }
    if (typeof window !== 'undefined') {
        return window[facadeName] || null;
    }
    return null;
}

function verifyBattleSceneFacadesOrThrow() {
    const missing = [];

    Object.entries(BATTLE_SCENE_FACADE_METHODS).forEach(([facadeName, methodNames]) => {
        const facade = getBattleFacade(facadeName);
        if (!facade) {
            missing.push(`${facadeName} (facade object)`);
            return;
        }

        methodNames.forEach((methodName) => {
            if (typeof facade[methodName] !== 'function') {
                missing.push(`${facadeName}.${methodName}`);
            }
        });
    });

    if (missing.length > 0) {
        const message = `[BattleScene] Facade method missing: ${missing.join(', ')}`;
        console.error(message);
        throw new Error(message);
    }
}

function applyBattleSceneFacadeDelegates() {
    const proto = BattleScene.prototype;

    Object.entries(BATTLE_SCENE_FACADE_METHODS).forEach(([facadeName, methodNames]) => {
        methodNames.forEach((methodName) => {
            proto[methodName] = function (...args) {
                const facade = getBattleFacade(facadeName);
                if (!facade || typeof facade[methodName] !== 'function') {
                    throw new Error(`[BattleScene] Facade method missing: ${facadeName}.${methodName}`);
                }
                return facade[methodName].apply(this, args);
            };
        });
    });
}

applyBattleSceneFacadeDelegates();

window.BattleScene = BattleScene;
