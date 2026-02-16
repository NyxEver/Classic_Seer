/**
 * BattleHud - BattleScene HUD and interaction facade methods.
 *
 * These methods run with BattleScene as `this`.
 */

const BATTLE_STAGE_LABELS = {
    atk: '攻击',
    def: '防御',
    spAtk: '特攻',
    spDef: '特防',
    spd: '速度',
    accuracy: '命中'
};

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

const BattleHud = {
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

        const playerRight = this.playerStatus ? !!this.playerStatus.statusRowRightAligned : false;
        const enemyRight = this.enemyStatus ? !!this.enemyStatus.statusRowRightAligned : true;
        renderRow(this.playerStatusIconRow, 'player', playerRight);
        renderRow(this.enemyStatusIconRow, 'enemy', enemyRight);
    },

    createStatusBar(elf, x, y, isPlayer) {
        const sideKey = isPlayer ? 'playerStatus' : 'enemyStatus';
        const oldInfo = this[sideKey];
        if (oldInfo && oldInfo.container) {
            oldInfo.container.destroy();
        }

        const container = this.add.container(x, y);
        container.setDepth(26);

        const frameW = 108;
        const frameH = 82;
        const infoW = 270;
        const infoGap = 8;
        const hpBarH = 14;

        const frameX = isPlayer ? 0 : -frameW;
        const frameY = 0;
        const infoX = isPlayer
            ? frameX + frameW + infoGap
            : frameX - infoGap - infoW;
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

        const nameX = isPlayer ? infoX : (infoX + infoW);
        const nameOriginX = isPlayer ? 0 : 1;
        const hpX = isPlayer ? (infoX + infoW) : infoX;
        const hpOriginX = isPlayer ? 1 : 0;

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
            statusRowX: container.x + (isPlayer ? infoX : (infoX + infoW)),
            statusRowY: container.y + hpBarY + hpBarH + 20,
            statusRowRightAligned: !isPlayer
        };

        this[sideKey] = info;
        this.updateStatusHp(isPlayer ? 'player' : 'enemy');
        if (typeof this.refreshStatusIcons === 'function' && this.playerStatusIconRow && this.enemyStatusIconRow) {
            this.createStatusIconRows();
        }
    },

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
            info.hpBar.fillStyle(color, 1);
            info.hpBar.fillRoundedRect(info.hpBarX + 2, info.hpBarY + 2, (info.hpBarW - 4) * pct, info.hpBarH - 4, 4);
        }

        info.nameText.setText(elf.getDisplayName());
        info.lvText.setText(`Lv:${elf.level}`);
        info.hpText.setText(`${hp} / ${maxHp}`);
    },

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

    addLog(msg) {
        if (!msg) {
            return;
        }

        if (typeof msg === 'object' && msg.type === 'skill_log') {
            this.messageQueue.push(msg);
        }
    },

    queueTurnSkillLogs(result) {
        const events = Array.isArray(result && result.events) ? result.events : [];
        events
            .filter((event) => event && (event.type === BattleManager.EVENT.SKILL_CAST || event.type === 'skill_cast'))
            .forEach((event) => {
                const actorSide = event.actor === 'enemy' ? 'enemy' : 'player';
                this.addLog({
                    type: 'skill_log',
                    actor: actorSide,
                    actorName: this.getBattleSideDisplayName(actorSide),
                    skillName: event.skillName || this.getSkillNameById(event.skillId),
                    statusText: this.getBattleSideStatusText(actorSide)
                });
            });
    },

    getSkillNameById(skillId) {
        if (typeof DataLoader !== 'undefined' && DataLoader && typeof DataLoader.getSkill === 'function') {
            const skill = DataLoader.getSkill(skillId);
            if (skill && skill.name) {
                return skill.name;
            }
        }
        return '未知技能';
    },

    getBattleSideDisplayName(side) {
        const elf = side === 'player' ? this.playerElf : this.enemyElf;
        if (!elf || typeof elf.getDisplayName !== 'function') {
            return side === 'player' ? '我方精灵' : '敌方精灵';
        }
        return elf.getDisplayName();
    },

    getBattleSideStatusText(side) {
        const statusEffect = getHudStatusEffect();
        const elf = side === 'player' ? this.playerElf : this.enemyElf;
        if (!statusEffect || !elf || typeof statusEffect.getDisplayStatuses !== 'function') {
            return '正常';
        }

        const statuses = statusEffect.getDisplayStatuses(elf);
        if (!Array.isArray(statuses) || statuses.length === 0) {
            return '正常';
        }

        return statuses
            .map((statusType) => {
                if (typeof statusEffect.getStatusName === 'function') {
                    return statusEffect.getStatusName(statusType);
                }
                return statusType;
            })
            .join('、');
    },

    clipLogTextToWidth(text, style, maxWidth) {
        if (!text || maxWidth <= 0) {
            return '';
        }

        const probe = this.add.text(0, 0, text, style).setVisible(false);
        if (probe.width <= maxWidth) {
            probe.destroy();
            return text;
        }

        let sliced = text;
        while (sliced.length > 0) {
            sliced = sliced.slice(0, -1);
            probe.setText(`${sliced}...`);
            if (probe.width <= maxWidth) {
                probe.destroy();
                return `${sliced}...`;
            }
        }

        probe.destroy();
        return '';
    },

    appendLogEntry(entry) {
        if (!this.logPanelLayout || !this.logLineLayer || !entry) {
            return;
        }

        this.logEntries.push(entry);
        while (this.logEntries.length > this.logPanelLayout.maxLines) {
            this.logEntries.shift();
        }

        this.logLineLayer.removeAll(true);
        this.logEntries.forEach((logEntry, index) => {
            const lineContainer = this.add.container(
                this.logPanelLayout.x,
                this.logPanelLayout.y + index * this.logPanelLayout.lineHeight
            );

            const actorName = logEntry.actorName || '未知精灵';
            const skillName = logEntry.skillName || '未知技能';
            const statusText = logEntry.statusText || '正常';
            const actorColor = logEntry.actor === 'enemy' ? '#c792ff' : '#ffffff';
            const segments = [
                { text: `【${actorName}】`, color: actorColor },
                { text: '使用了', color: '#ffffff' },
                { text: skillName, color: '#ffd95a' },
                { text: '，', color: '#ffffff' },
                { text: '【状态】：', color: '#55dd88' },
                { text: statusText, color: '#55dd88' }
            ];

            let cursorX = 0;
            segments.forEach((segment) => {
                if (!segment.text) {
                    return;
                }
                const style = {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: segment.color,
                    fontStyle: 'bold'
                };

                const maxWidth = this.logPanelLayout.width - cursorX;
                const clippedText = this.clipLogTextToWidth(segment.text, style, maxWidth);
                if (!clippedText) {
                    return;
                }

                const text = this.add.text(cursorX, 0, clippedText, style).setOrigin(0, 0);
                lineContainer.add(text);
                cursorX += text.width;
            });

            this.logLineLayer.add(lineContainer);
        });
    },

    showLogs(onComplete) {
        if (this.messageQueue.length === 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        const entry = this.messageQueue.shift();
        this.appendLogEntry(entry);

        const actorName = entry && entry.actorName ? entry.actorName : '';
        const skillName = entry && entry.skillName ? entry.skillName : '';
        const statusText = entry && entry.statusText ? entry.statusText : '';
        const rawLength = actorName.length + skillName.length + statusText.length + 10;
        const delay = Math.max(650, 360 + rawLength * 55);

        this.time.delayedCall(delay, () => {
            this.showLogs(onComplete);
        });
    },

    showTurnFloatTexts(result) {
        const events = Array.isArray(result && result.events) ? result.events : [];
        const hpEvents = events.filter((event) => {
            return event
                && event.type === BattleManager.EVENT.HP_CHANGE
                && Number.isFinite(event.delta)
                && event.delta !== 0;
        });

        if (hpEvents.length === 0) {
            return;
        }

        if (!Array.isArray(this.turnFloatQueue)) {
            this.turnFloatQueue = [];
        }
        hpEvents.forEach((event) => {
            this.turnFloatQueue.push(event);
        });

        if (this.turnFloatPlaying) {
            return;
        }

        this.turnFloatPlaying = true;
        this.playNextTurnFloatText();
    },

    resolveFloatStyle(event) {
        const isDamage = event.delta < 0;
        const reason = event.reason || null;

        if (isDamage) {
            if (reason === 'damage') {
                return {
                    textColor: '#ff6b5c',
                    strokeColor: '#ffe27a'
                };
            }
            return {
                textColor: '#ffffff',
                strokeColor: '#7248b0'
            };
        }

        if (reason === 'item_use') {
            return {
                textColor: '#89ff9f',
                strokeColor: '#ffffff'
            };
        }

        return {
            textColor: '#ffffff',
            strokeColor: '#7248b0'
        };
    },

    getFloatAnchorBySide(side) {
        const info = side === 'enemy' ? this.enemyStatus : this.playerStatus;
        if (!info || !info.container) {
            return null;
        }

        return {
            x: info.container.x + info.hpBarX + info.hpBarW / 2,
            y: info.container.y + info.hpBarY + info.hpBarH + 24
        };
    },

    createFloatBubble(x, y, textValue, style) {
        const text = this.add.text(x, y, textValue, {
            fontSize: '50px',
            fontFamily: 'Arial',
            color: style.textColor,
            stroke: style.strokeColor,
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        text.setDepth(68);
        return text;
    },

    playNextTurnFloatText() {
        if (!Array.isArray(this.turnFloatQueue) || this.turnFloatQueue.length === 0) {
            this.turnFloatPlaying = false;
            return;
        }

        const event = this.turnFloatQueue.shift();
        const amount = Math.abs(Math.floor(event.delta || 0));
        if (amount <= 0) {
            this.time.delayedCall(80, () => this.playNextTurnFloatText());
            return;
        }

        const side = event.target === 'enemy' ? 'enemy' : 'player';
        const anchor = this.getFloatAnchorBySide(side);
        if (!anchor) {
            this.time.delayedCall(80, () => this.playNextTurnFloatText());
            return;
        }

        const style = this.resolveFloatStyle(event);
        const textValue = event.delta < 0 ? `-${amount}` : `+${amount}`;
        const bubble = this.createFloatBubble(anchor.x, anchor.y, textValue, style);
        const duration = 3500;

        this.tweens.add({
            targets: bubble,
            alpha: 0,
            duration,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                bubble.destroy();
            }
        });

        this.time.delayedCall(220, () => this.playNextTurnFloatText());
    },

    createCenterPopupDialog() {
        this.popupContainer = this.add.container(this.W / 2, this.H / 2);
        this.popupContainer.setVisible(false);
        this.popupContainer.setDepth(100);

        const w = 400;
        const h = 200;

        const mask = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.6).setOrigin(0.5);
        this.popupContainer.add(mask);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a4a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(3, 0x4a8aca);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        this.popupContainer.add(bg);

        this.popupText = this.add.text(0, -30, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: w - 40 }
        }).setOrigin(0.5);
        this.popupContainer.add(this.popupText);

        const btnW = 120;
        const btnH = 40;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x3a7aba, 1);
        btnBg.fillRoundedRect(-btnW / 2, 40, btnW, btnH, 6);
        btnBg.lineStyle(2, 0x5aaaee);
        btnBg.strokeRoundedRect(-btnW / 2, 40, btnW, btnH, 6);
        this.popupContainer.add(btnBg);

        const btnText = this.add.text(0, 60, '确认', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.popupContainer.add(btnText);

        const btnHit = this.add.rectangle(0, 60, btnW, btnH).setInteractive({ useHandCursor: true });
        this.popupContainer.add(btnHit);

        this.popupConfirmBg = btnBg;
        this.popupConfirmText = btnText;
        this.popupConfirmHit = btnHit;
        this.popupConsumed = false;

        btnHit.on('pointerdown', () => {
            if (this.popupConsumed) {
                return;
            }

            this.popupConsumed = true;
            if (this.popupConfirmHit) {
                this.popupConfirmHit.disableInteractive();
            }
            if (this.popupConfirmBg) {
                this.popupConfirmBg.setAlpha(0.65);
            }
            if (this.popupConfirmText) {
                this.popupConfirmText.setAlpha(0.65);
            }

            this.popupContainer.setVisible(false);
            if (this.popupCallback) {
                const callback = this.popupCallback;
                this.popupCallback = null;
                callback();
            } else {
                if (typeof this.finalizeBattleOnce === 'function') {
                    this.finalizeBattleOnce('return_to_map', { reason: 'popup_default_confirm' });
                } else if (typeof this.returnToMap === 'function') {
                    this.returnToMap();
                }
            }
        });
    },

    showPopup(title, message, callback = null) {
        this.popupText.setText(`${title}\n\n${message}`);
        this.popupCallback = callback;
        this.popupConsumed = false;
        if (this.popupConfirmHit) {
            this.popupConfirmHit.setInteractive({ useHandCursor: true });
        }
        if (this.popupConfirmBg) {
            this.popupConfirmBg.setAlpha(1);
        }
        if (this.popupConfirmText) {
            this.popupConfirmText.setAlpha(1);
        }
        this.popupContainer.setVisible(true);
    },

    startTurnTimer() {
        this.turnTimeLeft = 10;
        this.updateTimerDisplay();

        if (this.turnTimer) {
            this.turnTimer.remove();
        }

        this.turnTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.turnTimeLeft--;
                this.updateTimerDisplay();

                if (this.turnTimeLeft <= 0 && this.menuEnabled && !this.battleEnded) {
                    this.addLog('时间到！自动使用技能！');
                    const skills = this.playerElf.getSkillDetails();
                    if (skills.length > 0 && skills[0].currentPP > 0) {
                        this.doSkill(skills[0].id);
                    } else {
                        for (const skill of skills) {
                            if (skill.currentPP > 0) {
                                this.doSkill(skill.id);
                                return;
                            }
                        }
                    }
                }
            },
            loop: true
        });
    },

    stopTurnTimer() {
        if (this.turnTimer) {
            this.turnTimer.remove();
            this.turnTimer = null;
        }
        this.timerText.setText('');
    },

    updateTimerDisplay() {
        if (this.menuEnabled && !this.battleEnded) {
            this.timerText.setText(`⏱ ${this.turnTimeLeft}s`);
            this.timerText.setVisible(true);
        } else {
            this.timerText.setVisible(false);
        }
    },

    enableMenu() {
        this.menuEnabled = true;
        if (typeof this.refreshActionButtons === 'function') {
            this.refreshActionButtons();
            return;
        }
        if (this.skillContainer) {
            this.skillContainer.setAlpha(1);
        }
        if (this.actionContainer) {
            this.actionContainer.setAlpha(1);
        }
    },

    disableMenu() {
        this.menuEnabled = false;
        this.stopTurnTimer();
        if (typeof this.refreshActionButtons === 'function') {
            this.refreshActionButtons();
            return;
        }
        if (this.skillContainer) {
            this.skillContainer.setAlpha(0.4);
        }
        if (this.actionContainer) {
            this.actionContainer.setAlpha(0.4);
        }
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleHud', BattleHud);
}

window.BattleHud = BattleHud;
