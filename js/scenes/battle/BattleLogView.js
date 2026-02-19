/**
 * BattleLogView — 战斗日志与浮动伤害数字模块
 *
 * 职责：管理战斗日志队列的追加与滚动显示，以及伤害/治疗浮动数字的渲染与动画。
 * 这些方法在运行时以 BattleScene 作为 `this` 调用（mixin 模式）。
 */

const BattleLogView = {
    /**
     * 记录一条战斗日志消息。
     * @param {string|object} msg - 日志消息，字符串或 `{ type: 'skill_log', ... }` 对象
     */
    addLog(msg) {
        if (!msg) {
            return;
        }

        if (typeof msg === 'object' && msg.type === 'skill_log') {
            this.messageQueue.push(msg);
        }
    },

    /**
     * 从回合结果事件流中提取技能施放事件，批量入队日志。
     * @param {object} result - 回合结果对象，包含 `events` 数组
     */
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

    /**
     * 根据技能 ID 查询技能名称。
     * @param {number} skillId - 技能 ID
     * @returns {string} 技能名称，查不到时返回 '未知技能'
     */
    getSkillNameById(skillId) {
        if (typeof DataLoader !== 'undefined' && DataLoader && typeof DataLoader.getSkill === 'function') {
            const skill = DataLoader.getSkill(skillId);
            if (skill && skill.name) {
                return skill.name;
            }
        }
        return '未知技能';
    },

    /**
     * 获取战斗方的显示名称。
     * @param {'player'|'enemy'} side - 战斗方
     * @returns {string} 精灵显示名
     */
    getBattleSideDisplayName(side) {
        const elf = side === 'player' ? this.playerElf : this.enemyElf;
        if (!elf || typeof elf.getDisplayName !== 'function') {
            return side === 'player' ? '我方精灵' : '敌方精灵';
        }
        return elf.getDisplayName();
    },

    /**
     * 获取战斗方的状态文本（如"中毒、灼伤"或"正常"）。
     * @param {'player'|'enemy'} side - 战斗方
     * @returns {string} 状态文本
     */
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

    /**
     * 将文本裁剪到指定像素宽度内，超出部分用省略号替代。
     * @param {string} text - 原始文本
     * @param {object} style - Phaser 文本样式对象
     * @param {number} maxWidth - 最大像素宽度
     * @returns {string} 裁剪后的文本
     */
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

    /**
     * 追加一条日志条目到日志面板，超出最大行数时移除最早条目。
     * @param {object} entry - 日志条目 `{ actorName, skillName, statusText, actor }`
     */
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
                const segStyle = {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: segment.color,
                    fontStyle: 'bold'
                };

                const maxSegWidth = this.logPanelLayout.width - cursorX;
                const clippedText = this.clipLogTextToWidth(segment.text, segStyle, maxSegWidth);
                if (!clippedText) {
                    return;
                }

                const textObj = this.add.text(cursorX, 0, clippedText, segStyle).setOrigin(0, 0);
                lineContainer.add(textObj);
                cursorX += textObj.width;
            });

            this.logLineLayer.add(lineContainer);
        });
    },

    /**
     * 依次消费日志队列并展示，按文本长度动态延迟后递归。
     * @param {Function} [onComplete] - 队列消费完毕后的回调
     */
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

    /**
     * 从回合结果中收集 HP 变更事件，入队浮动文字并启动播放链。
     * @param {object} result - 回合结果对象，包含 `events` 数组
     */
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

    /**
     * 根据 HP 变更事件的类型和原因，返回浮动文字的颜色样式。
     * @param {object} event - HP 变更事件 `{ delta, reason }`
     * @returns {{ textColor: string, strokeColor: string }}
     */
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

    /**
     * 获取浮动文字的锚点坐标（在 HP 条下方居中）。
     * @param {'player'|'enemy'} side - 战斗方
     * @returns {{ x: number, y: number }|null}
     */
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

    /**
     * 创建一个浮动数字气泡文本对象。
     * @param {number} x - 锚点 X
     * @param {number} y - 锚点 Y
     * @param {string} textValue - 显示文本（如 "-30"、"+15"）
     * @param {{ textColor: string, strokeColor: string }} style - 颜色样式
     * @returns {Phaser.GameObjects.Text}
     */
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

    /**
     * 递归播放下一条浮动数字文本，播放完毕后自动结束。
     */
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

        const floatStyle = this.resolveFloatStyle(event);
        const textValue = event.delta < 0 ? `-${amount}` : `+${amount}`;
        const bubble = this.createFloatBubble(anchor.x, anchor.y, textValue, floatStyle);
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
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BattleLogView', BattleLogView);
}

window.BattleLogView = BattleLogView;
