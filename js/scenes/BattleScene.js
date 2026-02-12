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

        const startMsg = this.battleType === 'wild'
            ? `野生的 ${this.enemyElf.getDisplayName()} 出现了！`
            : `对手派出了 ${this.enemyElf.getDisplayName()}！`;

        this.addLog(startMsg);
        this.addLog(`去吧！${this.playerElf.getDisplayName()}！`);

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
        if (!this.battleManager || this.battleEnded || !this.menuEnabled || this.actionIntentLocked) {
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
        } catch (error) {
            console.error('[BattleScene] executeTurn 失败:', error);
            this.actionIntentLocked = false;
            if (!this.battleEnded) {
                this.enableMenu();
                this.startTurnTimer();
            }
            return;
        }

        const events = Array.isArray(result.events) ? result.events : [];
        const catchEvent = events.find((event) => event.type === 'catch_result');
        const catchResult = catchEvent ? (catchEvent.result || null) : (result.catchResult || null);

        if (catchResult) {
            await this.playCatchAnimation(catchResult);

            if (catchResult.success) {
                this.showPopup('🎉 捕捉成功！', `成功捕捉了 ${this.enemyElf.getDisplayName()}！`);
                return;
            }

            this.addLog(`${this.enemyElf.getDisplayName()} 挣脱了胶囊！`);
        }

        for (const event of events) {
            if (event.type === 'skill_cast' || event.type === 'skillCast') {
                await this.playSkillCastAnimation(event);
                this.updateStatusHp('player');
                this.updateStatusHp('enemy');
                this.updateSkillPP();
            }
        }

        this.updateStatusHp('player');
        this.updateStatusHp('enemy');
        this.updateSkillPP();

        await new Promise((resolve) => this.showLogs(resolve));

        const outcome = result.outcome || {};

        if (outcome.escaped || result.escaped) {
            this.showPopup('逃跑成功！', '成功逃离了战斗！');
            return;
        }

        if (outcome.battleEnded || result.battleEnded) {
            const battleEndResult = this.deferredBattleEndResult || {
                victory: (outcome.winner || result.winner) === 'player'
            };
            this.deferredBattleEndResult = null;
            this.handleBattleEnd(battleEndResult);
            return;
        }

        if (outcome.needSwitch || result.needSwitch) {
            this.playerElf._instanceData.currentHp = 0;
            PlayerData.saveToStorage();

            this.addLog(`${this.playerElf.getDisplayName()} 倒下了！`);
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
        'createStatusBar',
        'updateStatusHp',
        'createLeftInfoPanel',
        'createCenterPopupDialog',
        'showPopup',
        'addLog',
        'showLogs',
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
        'createFilteredSceneBackground',
        'createMainBattleArea',
        'createCharacterSprite',
        'applyBattleSideFlip',
        'getAvailableBattleAtlases',
        'pickBattleAtlas',
        'getFrameOrderValue',
        'getAtlasFrameNames',
        'getFirstAtlasFrameName',
        'getBattleFrameRate',
        'getClipDurationMs',
        'ensureBattleAnimation',
        'playAtlasClip',
        'playElfClip',
        'waitMs',
        'moveBattleSprite',
        'playStrikeMotionWithStill',
        'getPhysicalStrikeX',
        'playSkillCastAnimation',
        'playCatchAnimation',
        'playCapsuleShake',
        'playSuccessEffect',
        'playFailEffect'
    ],
    BattlePostFlow: [
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
