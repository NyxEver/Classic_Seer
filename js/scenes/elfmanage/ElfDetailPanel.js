/**
 * ElfDetailPanel — 精灵管理场景右侧详情面板模块
 *
 * 职责：渲染精灵详情面板的所有子区块（基本信息、六维属性、技能列表、立绘、工具方法等）。
 * 每个方法的第一个参数为 `scene`（ElfManageScene 实例），因为不再是类方法。
 */

const ElfDetailPanel = {
    /**
     * 渲染右侧完整详情面板（包含顶部信息、属性、技能三个区块）。
     * @param {Phaser.Scene} scene - ElfManageScene 实例
     */
    renderRightDetail(scene) {
        // 切换精灵会重建右侧技能卡，先隐藏 Tooltip 防止残留在旧卡片坐标。
        if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.hide === 'function') {
            SkillTooltipView.hide(scene);
        }
        scene.rightContent.removeAll(true);
        const index = scene.selectedElfIndex;
        if (index < 0 || index >= PlayerData.elves.length) {
            const empty = scene.add.text(scene.rightW / 2, scene.modalH / 2, '请选择一只精灵', {
                fontSize: '20px', color: '#8ea9c6'
            }).setOrigin(0.5);
            scene.rightContent.add(empty);
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
        const skillH = scene.modalH - skillY - 12;

        ElfDetailPanel.drawPanelBlock(scene, scene.rightContent, padding, topY, scene.rightW - padding * 2, topH, 0x1b3248);
        ElfDetailPanel.drawPanelBlock(scene, scene.rightContent, padding, statY, scene.rightW - padding * 2, statH, 0x1a2d42);
        ElfDetailPanel.drawPanelBlock(scene, scene.rightContent, padding, skillY, scene.rightW - padding * 2, skillH, 0x17293d);

        ElfDetailPanel.renderTopInfo(scene, elfData, baseData, elf, padding + 12, 20, scene.rightW - padding * 2 - 24);
        ElfDetailPanel.renderStats(scene, elf, padding + 12, statY + 10, scene.rightW - padding * 2 - 24);
        ElfDetailPanel.renderSkills(scene, elfData, padding + 12, skillY + 10, scene.rightW - padding * 2 - 24, skillH - 20);
    },

    /**
     * 渲染顶部信息区块（编号、名称、属性图标、等级、经验、获得时间）。
     * @param {Phaser.Scene} scene - ElfManageScene 实例
     * @param {object} elfData - 精灵实例数据
     * @param {object} baseData - 精灵基础数据
     * @param {Elf} elf - Elf 实例
     * @param {number} x - 区块起始 X
     * @param {number} y - 区块起始 Y
     * @param {number} w - 区块宽度
     */
    renderTopInfo(scene, elfData, baseData, elf, x, y, w) {
        // 大图
        if (!ElfDetailPanel.addElfPortrait(scene, scene.rightContent, x + 95, y + 90, baseData.id, 150, 150)) {
            const fallback = scene.add.circle(x + 95, y + 90, 55, 0x4a7aaa);
            scene.rightContent.add(fallback);
        }

        const tx = x + 195;
        let ty = y + 8;
        const expNeed = elf.getExpToNextLevel();
        const lineNo = scene.add.text(tx, ty, `编号: ${baseData.id.toString().padStart(3, '0')}`, {
            fontSize: '14px', color: '#d6ecff'
        });
        scene.rightContent.add(lineNo);
        ty += 28;

        // 名字 + 属性图标
        const lineName = scene.add.text(tx, ty, `名字: ${elfData.nickname || baseData.name}`, {
            fontSize: '14px', color: '#d6ecff'
        });
        scene.rightContent.add(lineName);
        const nameTypeKey = AssetMappings.getTypeIconKey(baseData.type);
        const iconX = tx + lineName.width + 10;
        const iconY = lineName.y + lineName.height / 2;
        if (nameTypeKey && scene.textures.exists(nameTypeKey)) {
            const typeIcon = scene.add.image(iconX, iconY, nameTypeKey).setOrigin(0, 0.5);
            const scale = Math.min(18 / typeIcon.width, 18 / typeIcon.height);
            typeIcon.setScale(scale);
            scene.rightContent.add(typeIcon);
        } else {
            const fallback = scene.add.circle(iconX + 8, iconY, 7, DataLoader.getTypeColor(baseData.type), 1).setOrigin(0, 0.5);
            fallback.setStrokeStyle(1, 0xffffff, 0.7);
            scene.rightContent.add(fallback);
        }
        ty += 28;

        const restRows = [
            `等级: Lv.${elfData.level}`,
            `升级所需经验值: ${expNeed > 0 ? expNeed : '已满级'}`,
            '性格: ',
            `获得时间: ${ElfDetailPanel.formatObtainedTime(elfData)}`
        ];
        restRows.forEach((text) => {
            const line = scene.add.text(tx, ty, text, {
                fontSize: '14px', color: '#d6ecff'
            });
            scene.rightContent.add(line);
            ty += 28;
        });
    },

    /**
     * 渲染六维属性区块（攻击、防御、特攻、特防、速度、体力）。
     * @param {Phaser.Scene} scene - ElfManageScene 实例
     * @param {Elf} elf - Elf 实例
     * @param {number} x - 区块起始 X
     * @param {number} y - 区块起始 Y
     * @param {number} w - 区块宽度
     */
    renderStats(scene, elf, x, y, w) {
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
            const dot = scene.add.circle(sx + 8, sy + 12, 4, 0x88c8ff);
            const label = scene.add.text(sx + 18, sy + 3, `${item.name}:`, {
                fontSize: '14px', color: '#aac8e8'
            });
            const value = scene.add.text(sx + colW - 14, sy + 3, `${item.value}`, {
                fontSize: '14px', color: '#ffffff'
            }).setOrigin(1, 0);
            scene.rightContent.add(dot);
            scene.rightContent.add(label);
            scene.rightContent.add(value);
        });
    },

    /**
     * 渲染技能列表区块（2x2 技能卡片 + Tooltip 绑定）。
     * @param {Phaser.Scene} scene - ElfManageScene 实例
     * @param {object} elfData - 精灵实例数据
     * @param {number} x - 区块起始 X
     * @param {number} y - 区块起始 Y
     * @param {number} w - 区块宽度
     * @param {number} h - 区块高度
     */
    renderSkills(scene, elfData, x, y, w, h) {
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

            const bg = scene.add.graphics();
            bg.fillStyle(skill ? 0x24415d : 0x1c2f43, 1);
            bg.fillRoundedRect(sx, sy, cardW, cardH, 6);
            bg.lineStyle(1, skill ? 0x76a9d4 : 0x35516b);
            bg.strokeRoundedRect(sx, sy, cardW, cardH, 6);
            scene.rightContent.add(bg);

            if (!skill) {
                const empty = scene.add.text(sx + cardW / 2, sy + cardH / 2, '--', {
                    fontSize: '14px', color: '#6c87a2'
                }).setOrigin(0.5);
                scene.rightContent.add(empty);
                continue;
            }

            const ppNow = elfData.skillPP[skill.id] || 0;
            const name = scene.add.text(sx + 8, sy + 6, skill.name, {
                fontSize: '13px', color: '#ffffff', fontStyle: 'bold'
            });
            scene.rightContent.add(name);

            if (typeof TypeIconView !== 'undefined' && TypeIconView && typeof TypeIconView.renderSkill === 'function') {
                TypeIconView.renderSkill(scene, scene.rightContent, sx + cardW - 10, sy + 10, skill, {
                    iconSize: 16,
                    originX: 1,
                    originY: 0
                });
            } else {
                const fallback = scene.add.circle(sx + cardW - 10, sy + 10, 7, 0x8899aa, 1).setOrigin(1, 0);
                fallback.setStrokeStyle(1, 0xffffff, 0.7);
                scene.rightContent.add(fallback);
            }

            const power = scene.add.text(sx + 8, sy + cardH - 18, `威力 ${skill.power || '-'}`, {
                fontSize: '12px', color: '#bcd8ef'
            });
            const pp = scene.add.text(sx + cardW - 8, sy + cardH - 18, `PP ${ppNow}/${skill.pp}`, {
                fontSize: '12px', color: '#d2f0a8'
            }).setOrigin(1, 0);
            scene.rightContent.add(power);
            scene.rightContent.add(pp);

            const hit = scene.add.rectangle(sx + cardW / 2, sy + cardH / 2, cardW, cardH, 0x000000, 0.001).setInteractive();
            if (typeof SkillTooltipView !== 'undefined' && SkillTooltipView && typeof SkillTooltipView.bind === 'function') {
                SkillTooltipView.bind(scene, hit, skill, { bindKey: '__seerSkillTooltipBound' });
            }
            scene.rightContent.add(hit);
        }
    },

    /**
     * 绘制带圆角的面板背景块。
     * @param {Phaser.Scene} scene - ElfManageScene 实例
     * @param {Phaser.GameObjects.Container} container - 目标容器
     * @param {number} x - 左上角 X
     * @param {number} y - 左上角 Y
     * @param {number} w - 宽度
     * @param {number} h - 高度
     * @param {number} color - 填充颜色
     */
    drawPanelBlock(scene, container, x, y, w, h, color) {
        const g = scene.add.graphics();
        g.fillStyle(color, 0.95);
        g.fillRoundedRect(x, y, w, h, 8);
        g.lineStyle(1, 0x35506b, 1);
        g.strokeRoundedRect(x, y, w, h, 8);
        container.add(g);
    },

    /**
     * 添加精灵立绘图（回退链：external still → battle still 首帧 → 返回 false）。
     * @param {Phaser.Scene} scene - ElfManageScene 实例
     * @param {Phaser.GameObjects.Container} container - 目标容器
     * @param {number} x - 中心 X
     * @param {number} y - 中心 Y
     * @param {number} elfId - 精灵 ID
     * @param {number} maxWidth - 最大宽度
     * @param {number} maxHeight - 最大高度
     * @returns {boolean} 是否成功添加了立绘
     */
    addElfPortrait(scene, container, x, y, elfId, maxWidth, maxHeight) {
        let stillKey = null;
        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getExternalStillKey === 'function') {
            stillKey = AssetMappings.getExternalStillKey(elfId);
        }

        if (stillKey && scene.textures.exists(stillKey)) {
            const image = scene.add.image(x, y, stillKey).setOrigin(0.5);
            const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
            image.setScale(scale);
            container.add(image);
            return true;
        }

        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getBattleClipKeys === 'function') {
            const battleStillKeys = AssetMappings.getBattleClipKeys(elfId, 'still');
            for (const atlasKey of battleStillKeys) {
                if (!scene.textures.exists(atlasKey)) continue;

                const texture = scene.textures.get(atlasKey);
                if (!texture) continue;

                let frameNames = [];
                const atlasJson = scene.cache && scene.cache.json ? scene.cache.json.get(atlasKey) : null;
                if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
                    frameNames = Object.keys(atlasJson.frames);
                } else {
                    frameNames = texture.getFrameNames().filter((name) => name !== '__BASE');
                }
                if (!frameNames.length) continue;

                const sprite = scene.add.sprite(x, y, atlasKey, frameNames[0]).setOrigin(0.5);
                const scale = Math.min(maxWidth / sprite.width, maxHeight / sprite.height);
                sprite.setScale(scale);
                container.add(sprite);
                return true;
            }
        }

        if (!scene._missingPortraitWarned) {
            scene._missingPortraitWarned = new Set();
        }
        if (!scene._missingPortraitWarned.has(elfId)) {
            console.warn(`[ElfManageScene] 精灵图片缺失: elfId=${elfId}, stillKey=${stillKey || 'null'}`);
            scene._missingPortraitWarned.add(elfId);
        }
        return false;
    },

    /**
     * 获取 HP 条颜色（绿/黄/红三段）。
     * @param {number} pct - HP 百分比（0~1）
     * @returns {number} Phaser 颜色值
     */
    getHpBarColor(pct) {
        if (pct <= 0.2) return 0xdd4b4b;
        if (pct <= 0.5) return 0xe0b34a;
        return 0x53c56b;
    },

    /**
     * 格式化精灵获得时间为 "YYYY-MM-DD HH:mm" 格式。
     * @param {object} elfData - 精灵实例数据
     * @returns {string} 格式化的时间字符串，无效时返回 '未知'
     */
    formatObtainedTime(elfData) {
        if (!elfData.obtainedAt) return '未知';
        const date = new Date(elfData.obtainedAt);
        if (Number.isNaN(date.getTime())) return '未知';
        const yr = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${yr}-${m}-${d} ${hh}:${mm}`;
    }
};

window.ElfDetailPanel = ElfDetailPanel;
