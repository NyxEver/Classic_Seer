/**
 * EvolutionScene - 进化动画场景
 * 负责显示精灵进化过程的动画效果
 * 
 * 进化动画流程：
 * 1. 显示进化提示
 * 2. 低级形态贴图逐渐缩小 + 透明度降低
 * 3. 白色圆球出现在原位置，透明度 20% → 100%
 * 4. 白色圆球逐渐透明消失，高级形态贴图出现
 * 5. 显示进化完成提示
 */

class EvolutionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EvolutionScene' });
    }

    /**
     * 初始化进化数据
     * @param {Object} data - 传入的数据
     * @param {Object} data.elf - 进化前的精灵 Elf 实例
     * @param {number} data.newElfId - 进化后的精灵 ID
     * @param {string} data.returnScene - 返回的场景 key
     * @param {Object} data.returnData - 返回场景时传递的数据
     */
    init(data) {
        this.elf = data.elf;
        this.newElfId = data.newElfId;
        this.returnScene = data.returnScene || 'BattleScene';
        this.returnData = data.returnData || {};
        this.callback = data.callback || null;
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // 背景
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

        // 获取进化前后的精灵数据
        const beforeElfData = DataLoader.getElf(this.elf.id);
        const afterElfData = DataLoader.getElf(this.newElfId);

        if (!beforeElfData || !afterElfData) {
            console.error('[EvolutionScene] 无法获取精灵数据');
            this.returnToPrevious();
            return;
        }

        // 显示进化提示文字
        this.messageText = this.add.text(centerX, 80, `咦？${this.elf.getDisplayName()} 开始进化了！`, {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 创建进化前精灵显示
        this.beforeSprite = this.createElfDisplay(centerX, centerY, beforeElfData, '#4fc3f7');

        // 创建白色光球（初始透明）
        this.lightBall = this.add.circle(centerX, centerY, 80, 0xffffff, 0);

        // 创建进化后精灵显示（初始透明）
        this.afterSprite = this.createElfDisplay(centerX, centerY, afterElfData, '#81c784');
        this.afterSprite.setAlpha(0);

        // 开始进化动画序列
        this.time.delayedCall(1500, () => this.playEvolutionAnimation(beforeElfData, afterElfData));
    }

    /**
     * 创建精灵显示
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {Object} elfData - 精灵数据对象（需包含 id 和 name）
     * @param {string} fallbackColor - 后备颜色（无贴图时使用）
     * @returns {Phaser.GameObjects.Container}
     */
    createElfDisplay(x, y, elfData, fallbackColor) {
        const container = this.add.container(x, y);

        // 优先使用 external_scene/still 贴图
        let imageKey = null;
        if (typeof AssetMappings.getExternalStillKey === 'function') {
            imageKey = AssetMappings.getExternalStillKey(elfData.id);
        }
        if (!imageKey && typeof AssetMappings.getElfImageKey === 'function') {
            imageKey = AssetMappings.getElfImageKey(elfData.id);
        }

        if (imageKey && this.textures.exists(imageKey)) {
            const sprite = this.add.image(0, 0, imageKey);
            const maxSize = 140;
            const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
            sprite.setScale(scale);
            container.add(sprite);
        } else {
            // 后备：精灵圆形背景
            const circle = this.add.circle(0, 0, 70, Phaser.Display.Color.HexStringToColor(fallbackColor).color, 0.8);
            container.add(circle);

            // 精灵名称
            const nameText = this.add.text(0, 0, elfData.name, {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(nameText);
        }

        return container;
    }

    /**
     * 播放进化动画
     * @param {Object} beforeData - 进化前精灵数据
     * @param {Object} afterData - 进化后精灵数据
     */
    playEvolutionAnimation(beforeData, afterData) {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // 阶段1：旧形态缩小+透明
        this.tweens.add({
            targets: this.beforeSprite,
            scaleX: 0.3,
            scaleY: 0.3,
            alpha: 0,
            duration: 800,
            ease: 'Power2'
        });

        // 阶段2：白色光球出现
        this.tweens.add({
            targets: this.lightBall,
            alpha: 1,
            duration: 600,
            delay: 400,
            ease: 'Power2',
            onComplete: () => {
                // 光球闪烁效果
                this.tweens.add({
                    targets: this.lightBall,
                    radius: 100,
                    duration: 300,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // 阶段3：光球消失，新形态出现
        this.time.delayedCall(2000, () => {
            // 光球消失
            this.tweens.add({
                targets: this.lightBall,
                alpha: 0,
                duration: 500,
                ease: 'Power2'
            });

            // 新形态从小到大出现
            this.afterSprite.setScale(0.3);
            this.tweens.add({
                targets: this.afterSprite,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                duration: 600,
                delay: 200,
                ease: 'Back.easeOut',
                onComplete: () => this.showEvolutionComplete(beforeData, afterData)
            });
        });
    }

    /**
     * 显示进化完成
     * @param {Object} beforeData - 进化前精灵数据
     * @param {Object} afterData - 进化后精灵数据
     */
    showEvolutionComplete(beforeData, afterData) {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;

        // 更新提示文字
        this.messageText.setText(`恭喜！${beforeData.name} 进化为 ${afterData.name}！`);

        // 添加闪光效果
        this.tweens.add({
            targets: this.messageText,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            repeat: 2
        });

        // 显示属性变化（可选）
        const statsText = this.add.text(centerX, height - 120,
            `属性已重新计算！\n${afterData.name} 的能力得到了提升！`, {
            fontSize: '18px',
            fill: '#aaffaa',
            align: 'center'
        }).setOrigin(0.5);

        // 继续按钮
        const continueBtn = this.add.text(centerX, height - 50, '[ 点击继续 ]', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4a4a6a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        continueBtn.on('pointerover', () => continueBtn.setStyle({ fill: '#ffff00' }));
        continueBtn.on('pointerout', () => continueBtn.setStyle({ fill: '#ffffff' }));
        continueBtn.on('pointerdown', () => this.completeEvolution(afterData));

        // 标记进化后的精灵为已捕捉（图鉴更新）
        if (typeof PlayerData !== 'undefined') {
            PlayerData.markCaught(this.newElfId);
            console.log(`[EvolutionScene] 图鉴更新：${afterData.name} 已标记为已捕捉`);
        }
    }

    /**
     * 完成进化，返回上一场景
     * @param {Object} afterData - 进化后精灵数据
     */
    completeEvolution(afterData) {
        console.log(`[EvolutionScene] 进化完成：${afterData.name}`);

        // 如果有回调函数，执行回调
        if (this.callback) {
            this.callback(this.newElfId);
        }

        // 返回上一场景
        this.returnToPrevious();
    }

    /**
     * 返回上一场景
     */
    returnToPrevious() {
        if (this.returnScene) {
            SceneRouter.start(this, this.returnScene, this.returnData);
        } else {
            // 默认返回飞船场景
            SceneRouter.start(this, 'SpaceshipScene');
        }
    }
}

// 导出为全局对象
window.EvolutionScene = EvolutionScene;
