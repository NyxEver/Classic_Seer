/**
 * SkillTooltipView - 技能悬停提示窗
 * 统一提供 show/move/hide/unmount，支持鼠标跟随与边界防溢出。
 */
const SkillTooltipView = {
    mount(scene, options = {}) {
        if (!scene || !scene.add || !scene.cameras || !scene.cameras.main) {
            return null;
        }

        const stateKey = '__seerSkillTooltipState';
        const existingState = scene[stateKey];
        if (existingState && existingState.root && existingState.root.scene) {
            return existingState;
        }

        const depth = Number.isFinite(options.depth) ? options.depth : 9500;
        const root = scene.add.container(0, 0).setDepth(depth).setScrollFactor(0).setVisible(false);

        const bg = scene.add.graphics();
        const titleText = scene.add.text(0, 0, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffd95a',
            fontStyle: 'bold'
        });
        const categoryText = scene.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#d7dde5'
        });
        const descText = scene.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#e5edf6',
            wordWrap: { width: 248 }
        });

        root.add(bg);
        root.add(titleText);
        root.add(categoryText);
        root.add(descText);

        const state = {
            root,
            bg,
            titleText,
            categoryText,
            descText,
            width: 0,
            height: 0,
            currentSkillId: null
        };
        scene[stateKey] = state;

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unmount(scene));
        scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.unmount(scene));

        return state;
    },

    show(scene, pointer, skill) {
        if (!scene || !skill) {
            return;
        }

        const state = this.mount(scene);
        if (!state) {
            return;
        }

        this.updateContent(state, skill);
        state.root.setVisible(true);
        this.move(scene, pointer);
    },

    move(scene, pointer) {
        if (!scene || !scene.cameras || !scene.cameras.main) {
            return;
        }

        const state = scene.__seerSkillTooltipState;
        if (!state || !state.root || !state.root.scene || !state.root.visible) {
            return;
        }

        const camera = scene.cameras.main;
        const px = Number.isFinite(pointer && pointer.x) ? pointer.x : (camera.width / 2);
        const py = Number.isFinite(pointer && pointer.y) ? pointer.y : (camera.height / 2);
        const margin = 10;
        const gap = 14;

        const maxX = Math.max(margin, camera.width - state.width - margin);
        const maxY = Math.max(margin, camera.height - state.height - margin);

        let x = px + gap;
        let y = py + gap;

        if (x > maxX) {
            x = px - state.width - gap;
        }
        if (y > maxY) {
            y = py - state.height - gap;
        }

        x = Phaser.Math.Clamp(x, margin, maxX);
        y = Phaser.Math.Clamp(y, margin, maxY);
        state.root.setPosition(x, y);
    },

    hide(scene) {
        if (!scene) {
            return;
        }
        const state = scene.__seerSkillTooltipState;
        if (!state || !state.root || !state.root.scene) {
            return;
        }
        state.root.setVisible(false);
    },

    unmount(scene) {
        if (!scene) {
            return;
        }
        const stateKey = '__seerSkillTooltipState';
        const state = scene[stateKey];
        if (!state) {
            return;
        }

        if (state.root && state.root.scene) {
            state.root.destroy(true);
        }
        delete scene[stateKey];
    },

    updateContent(state, skill) {
        const tooltipWidth = 268;
        const padding = 10;
        const title = skill.name || '未知技能';
        const category = this.getCategoryLabel(skill.category);
        const description = skill.description || '暂无描述';

        state.currentSkillId = Number.isFinite(skill.id) ? skill.id : null;

        state.titleText.setText(title);
        state.categoryText.setText(category);
        state.descText.setWordWrapWidth(tooltipWidth - padding * 2, true);
        state.descText.setText(description);

        state.titleText.setPosition(padding, padding);
        state.categoryText.setPosition(padding + state.titleText.width + 8, padding + 1);

        const firstRowHeight = Math.max(state.titleText.height, state.categoryText.height);
        const descY = padding + firstRowHeight + 6;
        state.descText.setPosition(padding, descY);

        const tooltipHeight = descY + state.descText.height + padding;
        state.width = tooltipWidth;
        state.height = tooltipHeight;

        state.bg.clear();
        state.bg.fillStyle(0x2b3139, 0.95);
        state.bg.fillRoundedRect(0, 0, tooltipWidth, tooltipHeight, 8);
        state.bg.lineStyle(1, 0x99a7b5, 0.9);
        state.bg.strokeRoundedRect(0, 0, tooltipWidth, tooltipHeight, 8);
    },

    getCategoryLabel(category) {
        if (category === 'physical') {
            return '物理攻击';
        }
        if (category === 'special') {
            return '特殊攻击';
        }
        if (category === 'status') {
            return '属性技能';
        }
        return '技能';
    }
};

window.SkillTooltipView = SkillTooltipView;
