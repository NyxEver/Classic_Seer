/**
 * CaptainQuestModalScene - 船长任务弹窗场景
 * 使用一个 Scene 承载两层容器：任务列表 + 任务对话。
 */
class CaptainQuestModalScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CaptainQuestModalScene' });

        this.returnScene = 'CaptainRoomScene';
        this.returnData = {};

        this.doubleTapWindowMs = 320;
        this.doubleTapTolerancePx = 18;
        this.lastQuestTap = null;
        this.selectedQuestId = null;
        this.questEntries = [];
    }

    init(data = {}) {
        this.returnScene = data.returnScene || 'CaptainRoomScene';
        this.returnData = data.returnData || {};

        this.lastQuestTap = null;
        this.selectedQuestId = null;
        this.questEntries = [];
        this.activeDialogQuestId = null;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

        if (!this.ensureDependencies()) {
            this.closeModal();
            return;
        }

        const overlayState = ModalOverlayLayer.mount(this, { alpha: 0, depth: 5500 });
        this.baseDepth = overlayState && Number.isFinite(overlayState.depth) ? overlayState.depth : 5500;

        const camera = this.cameras.main;
        this.layout = {
            width: Math.min(900, camera.width - 70),
            height: Math.min(560, camera.height - 60)
        };
        this.layout.x = Math.floor((camera.width - this.layout.width) / 2);
        this.layout.y = Math.floor((camera.height - this.layout.height) / 2);

        QuestListPopup.mount(this, {
            layout: this.layout,
            depth: this.baseDepth + 1,
            onClose: () => this.closeModal(),
            onQuestTap: (entry, pointer) => this.handleQuestTap(entry, pointer)
        });

        this.refreshQuestEntries({ keepSelection: false });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
    }

    ensureDependencies() {
        if (typeof DataLoader === 'undefined' || !DataLoader || !DataLoader.quests) {
            console.error('[CaptainQuestModalScene] 任务数据不可用');
            return false;
        }

        if (typeof QuestManager === 'undefined' || !QuestManager) {
            console.error('[CaptainQuestModalScene] QuestManager 不可用');
            return false;
        }

        if (typeof QuestListPopup === 'undefined' || !QuestListPopup) {
            console.error('[CaptainQuestModalScene] QuestListPopup 未加载');
            return false;
        }

        if (typeof QuestDialogPopup === 'undefined' || !QuestDialogPopup) {
            console.error('[CaptainQuestModalScene] QuestDialogPopup 未加载');
            return false;
        }

        return true;
    }

    refreshQuestEntries(options = {}) {
        const keepSelection = !!options.keepSelection;
        this.questEntries = this.buildQuestEntries();

        if (!keepSelection || !this.questEntries.some((entry) => entry.id === this.selectedQuestId)) {
            const firstInteractive = this.questEntries.find((entry) => entry.interactive);
            this.selectedQuestId = firstInteractive
                ? firstInteractive.id
                : (this.questEntries.length ? this.questEntries[0].id : null);
        }

        QuestListPopup.render(this, this.questEntries, this.selectedQuestId);
    }

    buildQuestEntries() {
        const quests = this.getAllQuests();

        return quests
            .map((quest) => {
                const status = this.resolveQuestStatus(quest);
                return {
                    id: quest.id,
                    quest,
                    status,
                    interactive: this.isInteractiveStatus(status),
                    title: `#${quest.id} ${quest.name}`,
                    subtitle: this.buildQuestSubtitle(quest, status)
                };
            })
            .sort((a, b) => {
                const orderA = this.getStatusOrder(a.status);
                const orderB = this.getStatusOrder(b.status);
                if (orderA !== orderB) return orderA - orderB;
                return a.id - b.id;
            });
    }

    getAllQuests() {
        const questsObj = DataLoader.quests || {};
        return Object.values(questsObj).sort((a, b) => a.id - b.id);
    }

    resolveQuestStatus(quest) {
        if (QuestManager.isQuestCompleted(quest.id)) {
            return 'completed';
        }

        if (QuestManager.isQuestActive(quest.id)) {
            return QuestManager.checkCompletion(quest.id) ? 'claimable' : 'active';
        }

        if (QuestManager.checkRequirements(quest)) {
            return 'available';
        }

        return 'locked';
    }

    buildQuestSubtitle(quest, status) {
        if (status === 'completed') return '已完成，不可重复领取';
        if (status === 'locked') return this.buildRequirementText(quest);

        const objectiveText = this.buildObjectiveProgressText(quest, status);
        if (status === 'claimable') return `目标已达成：${objectiveText}`;
        if (status === 'active') return `进度：${objectiveText}`;

        return quest.description || '可领取任务';
    }

    buildObjectiveProgressText(quest, status) {
        const texts = [];
        const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];

        objectives.forEach((objective, index) => {
            const label = typeof QuestManager.getObjectiveDescription === 'function'
                ? QuestManager.getObjectiveDescription(objective)
                : (objective.type || '目标');

            let current = 0;
            if (status === 'active' || status === 'claimable') {
                current = this.getObjectiveProgressValue(quest.id, index);
            } else if (status === 'completed') {
                current = objective.count;
            }

            texts.push(`${label} ${current}/${objective.count}`);
        });

        return texts.join('；');
    }

    getObjectiveProgressValue(questId, objectiveIndex) {
        const progressRoot = PlayerData.questProgress && PlayerData.questProgress.active;
        if (!progressRoot || !progressRoot[questId]) return 0;
        return Number(progressRoot[questId][objectiveIndex]) || 0;
    }

    buildRequirementText(quest) {
        const requirements = Array.isArray(quest.requirements) ? quest.requirements : [];
        if (!requirements.length) return '未满足解锁条件';

        const names = requirements
            .map((id) => DataLoader.getQuest(id))
            .filter((q) => !!q)
            .map((q) => q.name);

        return names.length
            ? `前置：${names.join('、')}`
            : '前置任务未完成';
    }

    getStatusOrder(status) {
        switch (status) {
            case 'claimable': return 0;
            case 'active': return 1;
            case 'available': return 2;
            case 'locked': return 3;
            case 'completed': return 4;
            default: return 99;
        }
    }

    isInteractiveStatus(status) {
        return status === 'available' || status === 'active' || status === 'claimable';
    }

    handleQuestTap(entry, pointer) {
        if (!entry || !entry.interactive) {
            return;
        }

        this.selectedQuestId = entry.id;
        QuestListPopup.render(this, this.questEntries, this.selectedQuestId);

        if (!this.isDoubleTap(entry, pointer)) {
            return;
        }

        this.lastQuestTap = null;
        this.openQuestDialog(entry);
    }

    isDoubleTap(entry, pointer) {
        const now = this.time.now;
        const point = this.getPointerPoint(pointer);

        const last = this.lastQuestTap;
        this.lastQuestTap = {
            questId: entry.id,
            time: now,
            x: point.x,
            y: point.y
        };

        if (!last || last.questId !== entry.id) {
            return false;
        }

        const elapsed = now - last.time;
        if (elapsed > this.doubleTapWindowMs) {
            return false;
        }

        const dx = point.x - last.x;
        const dy = point.y - last.y;
        const distanceSq = dx * dx + dy * dy;
        return distanceSq <= this.doubleTapTolerancePx * this.doubleTapTolerancePx;
    }

    getPointerPoint(pointer) {
        if (!pointer) return { x: 0, y: 0 };
        return {
            x: Number.isFinite(pointer.x) ? pointer.x : 0,
            y: Number.isFinite(pointer.y) ? pointer.y : 0
        };
    }

    openQuestDialog(entry) {
        if (!entry || !entry.interactive) {
            return;
        }

        this.activeDialogQuestId = entry.id;
        const dialog = this.buildDialogConfig(entry);

        QuestDialogPopup.show(this, {
            layout: this.layout,
            depth: this.baseDepth + 30,
            title: dialog.title,
            content: dialog.content,
            buttons: dialog.buttons,
            onClose: () => this.closeQuestDialog()
        });
    }

    buildDialogConfig(entry) {
        const quest = entry.quest;
        const content = this.buildDialogContent(entry);
        const buttons = [];

        if (entry.status === 'available') {
            buttons.push({
                label: '领取',
                primary: true,
                onClick: () => this.acceptQuest(quest.id)
            });
            buttons.push({
                label: '取消',
                primary: false,
                onClick: () => this.closeQuestDialog()
            });
        } else if (entry.status === 'active') {
            buttons.push({
                label: '确认',
                primary: true,
                onClick: () => this.closeQuestDialog()
            });
        } else if (entry.status === 'claimable') {
            buttons.push({
                label: '确认',
                primary: true,
                onClick: () => this.claimQuest(quest.id)
            });
        }

        return {
            title: quest.name,
            content,
            buttons
        };
    }

    buildDialogContent(entry) {
        const quest = entry.quest;
        const statusLabel = {
            available: '状态：未领取',
            active: '状态：进行中',
            claimable: '状态：可完成待领奖'
        }[entry.status] || '状态：任务';

        const lines = [
            statusLabel,
            '',
            `说明：${quest.description || '无'}`,
            '',
            `目标：${this.buildObjectiveProgressText(quest, entry.status)}`,
            '',
            `奖励：${this.buildRewardText(quest)}`
        ];

        return lines.join('\n');
    }

    buildRewardText(quest) {
        const rewards = quest.rewards || {};
        const sections = [];
        if (Number(rewards.seerBeans) > 0) {
            sections.push(`赛尔豆 x${rewards.seerBeans}`);
        }

        const items = Array.isArray(rewards.items) ? rewards.items : [];
        items.forEach((item) => {
            const itemData = DataLoader.getItem(item.id);
            const itemName = itemData ? itemData.name : `物品#${item.id}`;
            sections.push(`${itemName} x${item.count}`);
        });

        return sections.length ? sections.join('，') : '无';
    }

    acceptQuest(questId) {
        QuestManager.acceptQuest(questId);
        this.closeQuestDialog();
        this.refreshQuestEntries({ keepSelection: true });
    }

    claimQuest(questId) {
        QuestManager.completeQuest(questId);
        this.closeQuestDialog();
        this.refreshQuestEntries({ keepSelection: true });
    }

    closeQuestDialog() {
        this.activeDialogQuestId = null;
        if (typeof QuestDialogPopup !== 'undefined' && QuestDialogPopup && typeof QuestDialogPopup.hide === 'function') {
            QuestDialogPopup.hide(this);
        }
    }

    closeModal() {
        this.closeQuestDialog();
        ModalOverlayLayer.unmount(this);

        const targetScene = this.resolveSafeReturnScene(this.returnScene);
        const targetData = this.returnData && typeof this.returnData === 'object' ? this.returnData : {};

        if (this.scene.isActive(targetScene)) {
            this.scene.stop();
            return;
        }

        SceneRouter.start(this, targetScene, targetData);
    }

    resolveSafeReturnScene(sceneKey) {
        if (sceneKey && this.scene.get(sceneKey)) {
            return sceneKey;
        }
        return 'CaptainRoomScene';
    }

    cleanup() {
        this.closeQuestDialog();
        if (typeof QuestListPopup !== 'undefined' && QuestListPopup && typeof QuestListPopup.unmount === 'function') {
            QuestListPopup.unmount(this);
        }
        ModalOverlayLayer.unmount(this);
    }
}

window.CaptainQuestModalScene = CaptainQuestModalScene;
