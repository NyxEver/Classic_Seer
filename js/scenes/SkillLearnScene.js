/**
 * SkillLearnScene - 技能学习场景
 * 当技能槽已满时，提示玩家选择是否学习新技能
 * 如果学习，需要从现有4个技能中选择一个进行替换
 */

class SkillLearnScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SkillLearnScene' });
    }

    /**
     * 初始化数据
     * @param {Object} data - 传入的数据
     * @param {Object} data.elf - 精灵 Elf 实例
     * @param {number} data.newSkillId - 要学习的新技能 ID
     * @param {string} data.returnScene - 返回的场景 key
     * @param {Object} data.returnData - 返回场景时传递的数据
     * @param {Function} data.callback - 完成后的回调
     * @param {Object} data.chainData - 链式处理数据（用于处理多个待学习技能和进化）
     */
    init(data) {
        data = data || {};
        this.elf = data.elf;
        this.newSkillId = data.newSkillId;
        this.returnScene = data.returnScene || 'SpaceshipScene';
        this.returnData = data.returnData || {};
        this.callback = data.callback || null;

        // 链式处理数据
        this.chainData = data.chainData || null;

        // 【重要】重置状态标志（Phaser 会重用场景实例，这些标志需要重置）
        this.isTransitioning = false;
        this.confirmBtn = null;
        this.selectedSlotIndex = null;
        this.skillSlots = [];
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        if (!this.elf || typeof this.elf.getDisplayName !== 'function') {
            console.error('[SkillLearnScene] 缺少有效精灵实例，跳过技能学习流程');
            this.returnToPrevious();
            return;
        }

        // 背景
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // 获取新技能数据
        this.newSkillData = DataLoader.getSkill(this.newSkillId);
        if (!this.newSkillData) {
            console.error('[SkillLearnScene] 无法获取技能数据');
            this.skipLearning();
            return;
        }

        // 标题
        this.add.text(centerX, 40, `${this.elf.getDisplayName()} 想要学习新技能！`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 新技能卡片
        this.createNewSkillCard(centerX, 130);

        // 提示文字
        this.add.text(centerX, 210, '技能槽已满，是否替换一个技能？', {
            fontSize: '18px',
            fill: '#ffdd88'
        }).setOrigin(0.5);

        // 当前技能列表
        this.createCurrentSkillsList(centerX, 330);

        // 放弃学习按钮
        this.createButton(centerX, height - 50, '放弃学习', 0x666666, () => {
            this.skipLearning();
        });

        this.selectedSlotIndex = null;
    }

    /**
     * 创建新技能卡片展示
     */
    createNewSkillCard(x, y) {
        const skill = this.newSkillData;
        const cardW = 350, cardH = 100;

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x2a5a4a, 1);
        bg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
        bg.lineStyle(3, 0x44aa88);
        bg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);

        // 技能名称
        this.add.text(x, y - 25, `✨ ${skill.name}`, {
            fontSize: '22px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 技能信息（使用属性图标）
        const typeIconKey = AssetMappings.getTypeIconKey(skill.type);
        let info = `威力: ${skill.power || '-'}  |  PP: ${skill.pp}`;
        if (typeIconKey && this.textures.exists(typeIconKey)) {
            const typeIcon = this.add.image(x - 145, y + 5, typeIconKey).setOrigin(0.5);
            const scale = Math.min(20 / typeIcon.width, 20 / typeIcon.height);
            typeIcon.setScale(scale);
        } else {
            const fallback = this.add.circle(x - 145, y + 5, 8, DataLoader.getTypeColor(skill.type), 1).setOrigin(0.5);
            fallback.setStrokeStyle(1, 0xffffff, 0.7);
        }
        this.add.text(x + 10, y + 5, info, {
            fontSize: '14px',
            fill: '#88ddaa'
        }).setOrigin(0.5);

        // 技能描述
        this.add.text(x, y + 30, skill.description || '', {
            fontSize: '12px',
            fill: '#aaccaa',
            wordWrap: { width: cardW - 20 }
        }).setOrigin(0.5);
    }

    /**
     * 创建当前技能列表（可选择替换）
     */
    createCurrentSkillsList(x, y) {
        this.add.text(x, y - 80, '选择要替换的技能：', {
            fontSize: '16px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        const skills = this.elf.skills;
        const cardW = 200, cardH = 70;
        const gap = 15;
        const startX = x - (cardW * 2 + gap) / 2 + cardW / 2;

        this.skillSlots = [];

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const slotX = startX + col * (cardW + gap);
            const slotY = y - 30 + row * (cardH + gap);

            const skillId = skills[i];
            const skillData = DataLoader.getSkill(skillId);

            if (skillData) {
                const slot = this.createSkillSlot(slotX, slotY, cardW, cardH, skillData, i);
                this.skillSlots.push(slot);
            }
        }
    }

    /**
     * 创建可选择的技能槽
     */
    createSkillSlot(x, y, w, h, skill, index) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x3a4a6a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        bg.lineStyle(2, 0x5a7a9a);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        container.add(bg);

        // 技能名称
        const nameText = this.add.text(0, -15, skill.name, {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(nameText);

        // 技能信息
        const info = `威力: ${skill.power || '-'}  PP: ${skill.pp}`;
        const infoText = this.add.text(0, 10, info, {
            fontSize: '12px',
            fill: '#88aacc'
        }).setOrigin(0.5);
        container.add(infoText);

        // 交互
        const hitArea = this.add.rectangle(0, 0, w, h).setInteractive({ useHandCursor: true });
        container.add(hitArea);

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x4a6a8a, 1);
            bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
            bg.lineStyle(2, 0x88aacc);
            bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        });

        hitArea.on('pointerout', () => {
            if (this.selectedSlotIndex !== index) {
                bg.clear();
                bg.fillStyle(0x3a4a6a, 1);
                bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
                bg.lineStyle(2, 0x5a7a9a);
                bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
            }
        });

        hitArea.on('pointerdown', () => {
            this.selectSlot(index, bg, w, h);
        });

        container._bg = bg;
        container._w = w;
        container._h = h;

        return container;
    }

    /**
     * 选择替换槽位
     */
    selectSlot(index, bg, w, h) {
        // 取消之前的选择
        this.skillSlots.forEach((slot, i) => {
            const slotBg = slot._bg;
            const slotW = slot._w;
            const slotH = slot._h;
            slotBg.clear();
            slotBg.fillStyle(0x3a4a6a, 1);
            slotBg.fillRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 8);
            slotBg.lineStyle(2, 0x5a7a9a);
            slotBg.strokeRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 8);
        });

        // 标记当前选择
        this.selectedSlotIndex = index;
        bg.clear();
        bg.fillStyle(0x5a3a3a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        bg.lineStyle(3, 0xffaa44);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

        // 显示确认按钮
        this.showConfirmButton();
    }

    /**
     * 显示确认替换按钮
     */
    showConfirmButton() {
        if (this.confirmBtn) return;

        const { width, height } = this.cameras.main;
        this.confirmBtn = this.createButton(width / 2, height - 100, '确认替换', 0x44aa66, () => {
            this.confirmReplacement();
        });
    }

    /**
     * 确认替换技能
     */
    confirmReplacement() {
        // 防止重复调用
        if (this.isTransitioning) return;

        const oldSkillId = this.elf.skills[this.selectedSlotIndex];
        const oldSkillData = DataLoader.getSkill(oldSkillId);

        // 替换技能
        this.elf.skills[this.selectedSlotIndex] = this.newSkillId;

        // 初始化新技能 PP
        this.elf.skillPP[this.newSkillId] = this.newSkillData.pp;

        // 删除旧技能 PP
        delete this.elf.skillPP[oldSkillId];

        // 同步到实例数据
        this.elf._syncInstanceData();

        console.log(`[SkillLearnScene] ${this.elf.getDisplayName()} 忘记了 ${oldSkillData?.name}，学会了 ${this.newSkillData.name}`);

        // 从待学习列表中移除该技能
        this.elf.removePendingSkill(this.newSkillId);

        // 保存
        PlayerData.saveToStorage();

        // 完成回调
        if (this.callback) {
            this.callback(true, this.newSkillId);
        }

        this.returnToPrevious();
    }

    /**
     * 放弃学习
     */
    skipLearning() {
        // 防止重复调用
        if (this.isTransitioning) return;

        const elfName = this.elf && typeof this.elf.getDisplayName === 'function'
            ? this.elf.getDisplayName()
            : '精灵';
        console.log(`[SkillLearnScene] ${elfName} 放弃学习 ${this.newSkillData?.name || '技能'}`);

        // 从待学习列表中移除该技能（放弃也要移除）
        if (this.elf && typeof this.elf.removePendingSkill === 'function' && Number.isFinite(this.newSkillId)) {
            this.elf.removePendingSkill(this.newSkillId);
        }
        PlayerData.saveToStorage();

        if (this.callback) {
            this.callback(false, null);
        }

        this.returnToPrevious();
    }

    /**
     * 返回上一场景或继续处理链式任务
     */
    returnToPrevious() {
        // 防止重复调用
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const safeDefaultReturnScene = this.resolveSafeReturnScene(this.returnScene);
        const safeDefaultReturnData = this.returnData || {};

        // 检查是否有链式处理数据
        if (this.chainData) {
            const { canEvolve, evolveTo, playerElf, returnScene, returnData } = this.chainData;
            const chainedReturnData = this.returnData || returnData || {};
            const safeChainReturnScene = this.resolveSafeReturnScene(returnScene || safeDefaultReturnScene);

            // 【重要】使用精灵当前的待学习列表，而不是chainData中的旧列表
            const pendingSkills = this.elf && typeof this.elf.getPendingSkills === 'function'
                ? this.elf.getPendingSkills()
                : [];
            const remainingSkills = [];
            pendingSkills.forEach((skillId) => {
                if (!Number.isFinite(skillId)) {
                    if (this.elf && typeof this.elf.removePendingSkill === 'function') {
                        this.elf.removePendingSkill(skillId);
                    }
                    return;
                }

                const skillData = DataLoader.getSkill(skillId);
                if (!skillData) {
                    if (this.elf && typeof this.elf.removePendingSkill === 'function') {
                        this.elf.removePendingSkill(skillId);
                    }
                    return;
                }

                remainingSkills.push(skillId);
            });

            // 检查是否还有更多待学习技能
            if (remainingSkills && remainingSkills.length > 0) {
                // 继续下一个技能学习 - 添加延迟避免场景切换问题
                this.time.delayedCall(100, () => {
                    SceneRouter.start(this, 'SkillLearnScene', {
                        elf: this.elf,
                        newSkillId: remainingSkills[0],  // 取第一个待学习技能
                        returnScene: safeChainReturnScene,
                        returnData: chainedReturnData,
                        chainData: {
                            canEvolve: canEvolve,
                            evolveTo: evolveTo,
                            playerElf: playerElf,
                            returnScene: safeChainReturnScene,
                            returnData: chainedReturnData
                        }
                    }, {
                        bgmStrategy: 'inherit'
                    });
                });
                return;
            }

            // 所有技能处理完成，检查进化
            if (canEvolve && evolveTo && playerElf) {
                this.time.delayedCall(100, () => {
                    SceneRouter.start(this, 'EvolutionScene', {
                        elf: playerElf,
                        newElfId: evolveTo,
                        returnScene: safeChainReturnScene,
                        returnData: chainedReturnData,
                        callback: (evolvedElfId) => {
                            playerElf.evolve();
                            PlayerData.saveToStorage();
                            console.log(`[SkillLearnScene] 进化完成: ${playerElf.name}`);
                        }
                    }, {
                        bgmStrategy: 'inherit'
                    });
                });
                return;
            }

            // 没有更多任务，返回地图
            SceneRouter.start(this, safeChainReturnScene, chainedReturnData);
        } else {
            // 没有链式数据，直接返回
            SceneRouter.start(this, safeDefaultReturnScene, safeDefaultReturnData);
        }
    }

    resolveSafeReturnScene(sceneKey) {
        if (!sceneKey) {
            return 'SpaceshipScene';
        }

        const transientSceneKeys = {
            SkillLearnScene: true,
            EvolutionScene: true
        };
        if (transientSceneKeys[sceneKey]) {
            return 'SpaceshipScene';
        }

        return sceneKey;
    }

    /**
     * 创建按钮
     */
    createButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-80, -20, 160, 40, 8);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(-80, -20, 160, 40, 8);
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        const hitArea = this.add.rectangle(0, 0, 160, 40).setInteractive({ useHandCursor: true });
        container.add(hitArea);

        hitArea.on('pointerdown', callback);

        return container;
    }
}

// 导出为全局对象
window.SkillLearnScene = SkillLearnScene;
