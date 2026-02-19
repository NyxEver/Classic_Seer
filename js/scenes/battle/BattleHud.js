/**
 * BattleHud - 战斗场景 HUD 门面模块
 *
 * 职责：管理顶部状态条（HP、等级、立绘、状态图标、能力增减）和左侧日志面板框架。
 * 日志/浮动数字功能委托给 BattleLogView，弹窗/计时器/菜单委托给 BattleDialogView。
 * 这些方法在运行时以 BattleScene 作为 `this` 调用（mixin 模式）。
 */

const BATTLE_STAGE_LABELS = {
    atk: '攻击',
    def: '防御',
    spAtk: '特攻',
    spDef: '特防',
    spd: '速度',
    accuracy: '命中'
};

const BATTLE_HUD_LAYOUT_DEFAULTS = {
    player: {
        mirrored: false,
        hpFillOrigin: 'left',
        statusRowAlign: 'left'
    },
    enemy: {
        mirrored: true,
        hpFillOrigin: 'right',
        statusRowAlign: 'right'
    }
};

function toObject(value) {
    return value && typeof value === 'object' ? value : {};
}

function normalizeHudSideLayout(rawConfig, defaults) {
    const config = toObject(rawConfig);

    return {
        mirrored: typeof config.mirrored === 'boolean' ? config.mirrored : defaults.mirrored,
        hpFillOrigin: (config.hpFillOrigin === 'left' || config.hpFillOrigin === 'right')
            ? config.hpFillOrigin
            : defaults.hpFillOrigin,
        statusRowAlign: (config.statusRowAlign === 'left' || config.statusRowAlign === 'right')
            ? config.statusRowAlign
            : defaults.statusRowAlign
    };
}

function getGlobalHudLayoutConfig() {
    if (typeof window === 'undefined') {
        return {};
    }
    return toObject(window.__seerBattleHudLayoutConfig);
}

function getSceneHudLayoutConfig(scene) {
    if (!scene || typeof scene !== 'object') {
        return {};
    }
    return toObject(scene.battleHudLayoutConfig);
}

function resolveBattleHudLayoutConfig(scene) {
    const globalConfig = getGlobalHudLayoutConfig();
    const sceneConfig = getSceneHudLayoutConfig(scene);

    return {
        player: normalizeHudSideLayout(
            {
                ...toObject(globalConfig.player),
                ...toObject(sceneConfig.player)
            },
            BATTLE_HUD_LAYOUT_DEFAULTS.player
        ),
        enemy: normalizeHudSideLayout(
            {
                ...toObject(globalConfig.enemy),
                ...toObject(sceneConfig.enemy)
            },
            BATTLE_HUD_LAYOUT_DEFAULTS.enemy
        )
    };
}

function getBattleHudSideLayout(scene, side) {
    const config = resolveBattleHudLayoutConfig(scene);
    return side === 'enemy' ? config.enemy : config.player;
}

function getStatusBarLocalLayout(sideLayout) {
    const frameW = 108;
    const infoW = 270;
    const infoGap = 8;
    const frameOnLeft = !sideLayout.mirrored;

    const frameX = frameOnLeft ? 0 : -frameW;
    const infoX = frameOnLeft
        ? frameX + frameW + infoGap
        : frameX - infoGap - infoW;

    const minX = Math.min(frameX, infoX);
    const maxX = Math.max(frameX + frameW, infoX + infoW);

    return {
        frameX,
        infoX,
        minX,
        maxX,
        frameW,
        infoW,
        infoGap
    };
}

function resolveStatusBarAnchorX(scene, side, sideLayout) {
    const marginX = 20;
    const local = getStatusBarLocalLayout(sideLayout);
    const sceneWidth = scene && Number.isFinite(scene.W)
        ? scene.W
        : (scene && scene.cameras && scene.cameras.main ? scene.cameras.main.width : 1000);

    if (side === 'player') {
        return marginX - local.minX;
    }

    return sceneWidth - marginX - local.maxX;
}

function getHudStatusEffect() {
    if (typeof StatusEffect !== 'undefined' && StatusEffect) {
        return StatusEffect;
    }
    return null;
}

function getHudStageEntries(scene, side) {
    if (!scene || !scene.battleManager) {
        return [];
    }

    const stages = side === 'player'
        ? scene.battleManager.playerStatStages
        : scene.battleManager.enemyStatStages;
    if (!stages || typeof stages !== 'object') {
        return [];
    }

    return Object.keys(BATTLE_STAGE_LABELS)
        .map((stat) => ({
            stat,
            label: BATTLE_STAGE_LABELS[stat],
            value: Number(stages[stat]) || 0
        }))
        .filter((entry) => entry.value !== 0);
}

// ---------------------------------------------------------------------------
// BattleHud 门面对象
// ---------------------------------------------------------------------------

const BattleHud = {
    /**
     * 创建顶部状态条（双方 HP 条 + 计时器文本 + 状态图标行）。
     */
    createTopBar() {
        this.createStatusBar(this.playerElf, 20, 10, true);
        this.createStatusBar(this.enemyElf, this.W - 20, 10, false);

        this.timerText = this.add.text(this.W / 2, 40, '', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.timerText.setDepth(40);

        this.createStatusIconRows();
    },

    /**
     * 创建双方状态图标行容器并刷新图标。
     */
    createStatusIconRows() {
        if (this.playerStatusIconRow) {
            this.playerStatusIconRow.destroy();
        }
        if (this.enemyStatusIconRow) {
            this.enemyStatusIconRow.destroy();
        }

        const playerAnchorX = this.playerStatus && Number.isFinite(this.playerStatus.statusRowX)
            ? this.playerStatus.statusRowX
            : 12;
        const playerAnchorY = this.playerStatus && Number.isFinite(this.playerStatus.statusRowY)
            ? this.playerStatus.statusRowY
            : 98;
        const enemyAnchorX = this.enemyStatus && Number.isFinite(this.enemyStatus.statusRowX)
            ? this.enemyStatus.statusRowX
            : (this.W - 12);
        const enemyAnchorY = this.enemyStatus && Number.isFinite(this.enemyStatus.statusRowY)
            ? this.enemyStatus.statusRowY
            : 98;

        this.playerStatusIconRow = this.add.container(playerAnchorX, playerAnchorY);
        this.enemyStatusIconRow = this.add.container(enemyAnchorX, enemyAnchorY);
        this.playerStatusIconRow.setDepth(32);
        this.enemyStatusIconRow.setDepth(32);
        this.refreshStatusIcons();
    },

    /**
     * 刷新双方状态图标（异常状态 + 能力增减 badge）。
     */
    refreshStatusIcons() {
        if (!this.playerStatusIconRow || !this.enemyStatusIconRow) {
            return;
        }

        this.playerStatusIconRow.removeAll(true);
        this.enemyStatusIconRow.removeAll(true);

        const statusEffect = getHudStatusEffect();
        const iconSize = 22;
        const gap = 7;

        const createStatusIconItem = (statusType) => {
            const item = this.add.container(0, 0);
            const key = (typeof AssetMappings !== 'undefined' && AssetMappings && typeof AssetMappings.getStatusIconKey === 'function')
                ? AssetMappings.getStatusIconKey(statusType)
                : null;

            if (key && this.textures.exists(key)) {
                const icon = this.add.image(iconSize / 2, 0, key).setOrigin(0.5, 0.5);
                const scale = Math.min(iconSize / icon.width, iconSize / icon.height);
                icon.setScale(scale);
                item.add(icon);
            } else {
                const fallback = this.add.circle(iconSize / 2, 0, 10, 0x334455, 1)
                    .setStrokeStyle(1, 0xffffff, 0.8)
                    .setOrigin(0.5, 0.5);
                const statusName = statusEffect && typeof statusEffect.getStatusName === 'function'
                    ? statusEffect.getStatusName(statusType)
                    : statusType;
                const label = this.add.text(iconSize / 2, 0, statusName.charAt(0), {
                    fontSize: '10px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5, 0.5);
                item.add(fallback);
                item.add(label);
            }

            return { container: item, width: iconSize };
        };

        const createStageBadgeItem = (entry) => {
            const positive = entry.value > 0;
            const textColor = positive ? '#ffe37a' : '#d7b8ff';
            const bgColor = positive ? 0xa86622 : 0x46276f;
            const borderColor = positive ? 0xf0b65f : 0x8d63c2;
            const badgeText = `${entry.label}${entry.value > 0 ? `+${entry.value}` : entry.value}`;

            const item = this.add.container(0, 0);
            const text = this.add.text(0, 0, badgeText, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: textColor,
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);

            const padX = 7;
            const width = Math.max(42, Math.ceil(text.width + padX * 2));
            const height = 18;
            const bg = this.add.graphics();
            bg.fillStyle(bgColor, 0.95);
            bg.fillRoundedRect(0, -height / 2, width, height, 6);
            bg.lineStyle(1, borderColor, 1);
            bg.strokeRoundedRect(0, -height / 2, width, height, 6);

            text.setPosition(width / 2, 0);
            item.add(bg);
            item.add(text);
            return { container: item, width };
        };

        const renderRow = (rowContainer, side, isRightAligned) => {
            const elf = side === 'player' ? this.playerElf : this.enemyElf;
            const statuses = (statusEffect && typeof statusEffect.getDisplayStatuses === 'function')
                ? statusEffect.getDisplayStatuses(elf)
                : [];
            const stageEntries = getHudStageEntries(this, side);

            const items = [];
            statuses.forEach((statusType) => {
                items.push(createStatusIconItem(statusType));
            });
            stageEntries.forEach((entry) => {
                items.push(createStageBadgeItem(entry));
            });

            let cursor = 0;
            items.forEach((item) => {
                const x = isRightAligned ? -(cursor + item.width) : cursor;
                item.container.setPosition(x, 0);
                rowContainer.add(item.container);
                cursor += item.width + gap;
            });
        };

        const playerDefaultLayout = getBattleHudSideLayout(this, 'player');
        const enemyDefaultLayout = getBattleHudSideLayout(this, 'enemy');
        const playerRight = this.playerStatus
            ? !!this.playerStatus.statusRowRightAligned
            : playerDefaultLayout.statusRowAlign === 'right';
        const enemyRight = this.enemyStatus
            ? !!this.enemyStatus.statusRowRightAligned
            : enemyDefaultLayout.statusRowAlign === 'right';
        renderRow(this.playerStatusIconRow, 'player', playerRight);
        renderRow(this.enemyStatusIconRow, 'enemy', enemyRight);
    },

    /**
     * 创建一侧完整的状态条（立绘框 + 名称 + 等级 + HP 条）。
     * @param {Elf} elf - 精灵实例
     * @param {number} x - 基准 X（仅用于 anchorY 的回退）
     * @param {number} y - 基准 Y
     * @param {boolean} isPlayer - 是否为玩家侧
     */
    createStatusBar(elf, x, y, isPlayer) {
        const side = isPlayer ? 'player' : 'enemy';
        const sideLayout = getBattleHudSideLayout(this, side);
        const localLayout = getStatusBarLocalLayout(sideLayout);

        const sideKey = isPlayer ? 'playerStatus' : 'enemyStatus';
        const oldInfo = this[sideKey];
        if (oldInfo && oldInfo.container) {
            oldInfo.container.destroy();
        }

        const anchorX = resolveStatusBarAnchorX(this, side, sideLayout);
        const anchorY = Number.isFinite(y) ? y : 10;
        const container = this.add.container(anchorX, anchorY);
        container.setDepth(26);

        const frameW = localLayout.frameW;
        const frameH = 82;
        const infoW = localLayout.infoW;
        const hpBarH = 14;

        const frameX = localLayout.frameX;
        const frameY = 0;
        const infoX = localLayout.infoX;
        const infoTextY = 16;
        const hpBarY = 38;

        const frame = this.add.graphics();
        frame.fillStyle(0x11223a, 0.72);
        frame.fillRoundedRect(frameX, frameY, frameW, frameH, 26);
        frame.lineStyle(3, 0x6389aa, 0.95);
        frame.strokeRoundedRect(frameX, frameY, frameW, frameH, 26);
        container.add(frame);

        const innerCircleX = frameX + Math.floor(frameW / 2);
        const innerCircleY = frameY + 30;
        const innerRadius = 26;
        const iconRing = this.add.graphics();
        iconRing.fillStyle(0x0b1625, 0.9);
        iconRing.fillCircle(innerCircleX, innerCircleY, innerRadius);
        iconRing.lineStyle(3, 0x8ca5bc, 0.95);
        iconRing.strokeCircle(innerCircleX, innerCircleY, innerRadius);
        container.add(iconRing);

        const portraitHolder = this.add.container(innerCircleX, innerCircleY);
        container.add(portraitHolder);
        let portrait = null;
        if (typeof ElfPortraitView !== 'undefined' && ElfPortraitView && typeof ElfPortraitView.addStillPortrait === 'function') {
            portrait = ElfPortraitView.addStillPortrait(this, portraitHolder, 0, 0, elf.id, {
                maxSize: innerRadius * 1.75,
                warnTag: 'BattleHud'
            });
            if (portrait && !isPlayer && typeof portrait.setFlipX === 'function') {
                portrait.setFlipX(true);
            }
        }
        if (!portrait) {
            const fallbackText = this.add.text(0, 0, elf.name.charAt(0), {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            portraitHolder.add(fallbackText);
        }

        const lvText = this.add.text(innerCircleX, frameY + frameH - 3, `Lv:${elf.level}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#d8d8d8',
            fontStyle: 'bold'
        }).setOrigin(0.5, 1);
        container.add(lvText);

        const textMirrored = !!sideLayout.mirrored;
        const nameX = textMirrored ? (infoX + infoW) : infoX;
        const nameOriginX = textMirrored ? 1 : 0;
        const hpX = textMirrored ? infoX : (infoX + infoW);
        const hpOriginX = textMirrored ? 0 : 1;

        const nameText = this.add.text(nameX, infoTextY, elf.getDisplayName(), {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(nameOriginX, 0.5);
        container.add(nameText);

        const hpText = this.add.text(hpX, infoTextY, `${elf.currentHp} / ${elf.getMaxHp()}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(hpOriginX, 0.5);
        container.add(hpText);

        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x202020, 1);
        hpBg.fillRoundedRect(infoX, hpBarY, infoW, hpBarH, 5);
        hpBg.lineStyle(1, 0x4f4f4f, 0.95);
        hpBg.strokeRoundedRect(infoX, hpBarY, infoW, hpBarH, 5);
        container.add(hpBg);

        const hpBar = this.add.graphics();
        container.add(hpBar);

        const statusRowRightAligned = sideLayout.statusRowAlign === 'right';
        const info = {
            container,
            hpBar,
            hpText,
            nameText,
            lvText,
            hpBarX: infoX,
            hpBarY,
            hpBarW: infoW,
            hpBarH,
            hpFillFromRight: sideLayout.hpFillOrigin === 'right',
            statusRowX: container.x + (statusRowRightAligned ? (infoX + infoW) : infoX),
            statusRowY: container.y + hpBarY + hpBarH + 20,
            statusRowRightAligned
        };

        this[sideKey] = info;
        this.updateStatusHp(isPlayer ? 'player' : 'enemy');
        if (typeof this.refreshStatusIcons === 'function' && this.playerStatusIconRow && this.enemyStatusIconRow) {
            this.createStatusIconRows();
        }
    },

    /**
     * 更新一侧的 HP 条显示。
     * @param {'player'|'enemy'} side - 战斗方
     */
    updateStatusHp(side) {
        const elf = side === 'player' ? this.playerElf : this.enemyElf;
        const info = side === 'player' ? this.playerStatus : this.enemyStatus;
        if (!elf || !info) {
            return;
        }

        const hp = Math.max(0, elf.currentHp);
        const maxHp = Math.max(1, elf.getMaxHp());
        const pct = hp / maxHp;

        let color = 0x44dd44;
        if (pct <= 0.2) {
            color = 0xdd4444;
        } else if (pct <= 0.5) {
            color = 0xddaa44;
        }

        info.hpBar.clear();
        if (pct > 0) {
            const fillWidth = (info.hpBarW - 4) * pct;
            const fillX = info.hpFillFromRight
                ? (info.hpBarX + info.hpBarW - 2 - fillWidth)
                : (info.hpBarX + 2);
            info.hpBar.fillStyle(color, 1);
            info.hpBar.fillRoundedRect(fillX, info.hpBarY + 2, fillWidth, info.hpBarH - 4, 4);
        }

        info.nameText.setText(elf.getDisplayName());
        info.lvText.setText(`Lv:${elf.level}`);
        info.hpText.setText(`${hp} / ${maxHp}`);
    },

    /**
     * 创建左侧日志面板框架（背景 + 布局参数 + 行容器）。
     * @param {number} panelY - 面板顶部 Y 坐标
     */
    createLeftInfoPanel(panelY) {
        const x = 15;
        const y = panelY + 10;
        const w = 280;
        const h = 150;

        const logBg = this.add.graphics();
        logBg.fillStyle(0x0a1520, 1);
        logBg.fillRoundedRect(x, y, w, h, 6);
        logBg.lineStyle(2, 0x2a4a6a);
        logBg.strokeRoundedRect(x, y, w, h, 6);

        this.logPanelLayout = {
            x: x + 10,
            y: y + 10,
            width: w - 20,
            lineHeight: 22,
            maxLines: 6
        };
        this.logEntries = [];
        this.logLineLayer = this.add.container(0, 0);
        this.logLineLayer.setDepth(35);
    },

    // --- 以下方法委托给 BattleLogView ---

    /** @see BattleLogView.addLog */
    addLog(msg) {
        return BattleLogView.addLog.call(this, msg);
    },
    /** @see BattleLogView.getSkillNameById */
    getSkillNameById(skillId) {
        return BattleLogView.getSkillNameById.call(this, skillId);
    },
    /** @see BattleLogView.getBattleSideDisplayName */
    getBattleSideDisplayName(side) {
        return BattleLogView.getBattleSideDisplayName.call(this, side);
    },
    /** @see BattleLogView.getBattleSideStatusText */
    getBattleSideStatusText(side) {
        return BattleLogView.getBattleSideStatusText.call(this, side);
    },
    /** @see BattleLogView.queueTurnSkillLogs */
    queueTurnSkillLogs(result) {
        return BattleLogView.queueTurnSkillLogs.call(this, result);
    },
    /** @see BattleLogView.clipLogTextToWidth */
    clipLogTextToWidth(text, style, maxWidth) {
        return BattleLogView.clipLogTextToWidth.call(this, text, style, maxWidth);
    },
    /** @see BattleLogView.appendLogEntry */
    appendLogEntry(entry) {
        return BattleLogView.appendLogEntry.call(this, entry);
    },
    /** @see BattleLogView.showLogs */
    showLogs(onComplete) {
        return BattleLogView.showLogs.call(this, onComplete);
    },
    /** @see BattleLogView.resolveFloatStyle */
    resolveFloatStyle(event) {
        return BattleLogView.resolveFloatStyle.call(this, event);
    },
    /** @see BattleLogView.getFloatAnchorBySide */
    getFloatAnchorBySide(side) {
        return BattleLogView.getFloatAnchorBySide.call(this, side);
    },
    /** @see BattleLogView.createFloatBubble */
    createFloatBubble(x, y, textValue, style) {
        return BattleLogView.createFloatBubble.call(this, x, y, textValue, style);
    },
    /** @see BattleLogView.playNextTurnFloatText */
    playNextTurnFloatText() {
        return BattleLogView.playNextTurnFloatText.call(this);
    },
    /** @see BattleLogView.showTurnFloatTexts */
    showTurnFloatTexts(result) {
        return BattleLogView.showTurnFloatTexts.call(this, result);
    },

    // --- 以下方法委托给 BattleDialogView ---

    /** @see BattleDialogView.createCenterPopupDialog */
    createCenterPopupDialog() {
        return BattleDialogView.createCenterPopupDialog.call(this);
    },
    /** @see BattleDialogView.showPopup */
    showPopup(title, message, callback) {
        return BattleDialogView.showPopup.call(this, title, message, callback);
    },
    /** @see BattleDialogView.startTurnTimer */
    startTurnTimer() {
        return BattleDialogView.startTurnTimer.call(this);
    },
    /** @see BattleDialogView.stopTurnTimer */
    stopTurnTimer() {
        return BattleDialogView.stopTurnTimer.call(this);
    },
    /** @see BattleDialogView.updateTimerDisplay */
    updateTimerDisplay() {
        return BattleDialogView.updateTimerDisplay.call(this);
    },
    /** @see BattleDialogView.enableMenu */
    enableMenu() {
        return BattleDialogView.enableMenu.call(this);
    },
    /** @see BattleDialogView.disableMenu */
    disableMenu() {
        return BattleDialogView.disableMenu.call(this);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleHud', BattleHud);
}

window.BattleHud = BattleHud;
