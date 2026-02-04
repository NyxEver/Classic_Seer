/**
 * BootScene - 启动场景
 * 负责加载核心资源和数据文件
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    /**
     * Preload 方法
     * 用于加载图片、音频等资源文件
     */
    preload() {
        // TODO: 在此加载图片和音频资源
        // Example: this.load.image('logo', 'assets/images/logo.png');
    }

    /**
     * Create 方法
     * Preload 完成后调用，初始化场景并加载数据
     */
    create() {
        // 获取画布中心坐标
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // 显示 "Loading..." 文字
        this.loadingText = this.add.text(centerX, centerY, '正在加载数据...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.loadingText.setOrigin(0.5, 0.5);

        // 加载状态文本
        this.statusText = this.add.text(centerX, centerY + 50, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#aaaaaa'
        });
        this.statusText.setOrigin(0.5, 0.5);

        // 添加脉冲动画
        this.tweens.add({
            targets: this.loadingText,
            alpha: { from: 1, to: 0.5 },
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        console.log('BootScene created successfully');

        // 开始异步加载数据
        this.loadGameData();
    }

    /**
     * 加载游戏数据（同步）
     */
    loadGameData() {
        try {
            this.statusText.setText('加载游戏数据...');

            // 初始化数据加载器（同步）
            DataLoader.init();

            this.statusText.setText('数据加载完成！');

            // 验证数据加载（在控制台打印）
            console.log('=== 数据加载验证 ===');
            console.log('DataLoader.elves:', DataLoader.elves);
            console.log('DataLoader.skills:', DataLoader.skills);
            console.log('DataLoader.typeChart:', DataLoader.typeChart);

            // 验证属性克制
            const waterVsFire = DataLoader.getTypeEffectiveness('water', 'fire');
            const grassVsWater = DataLoader.getTypeEffectiveness('grass', 'water');
            const electricVsGround = DataLoader.getTypeEffectiveness('electric', 'ground');
            console.log('水 → 火 克制倍率:', waterVsFire, '(应为 2)');
            console.log('草 → 水 克制倍率:', grassVsWater, '(应为 2)');
            console.log('电 → 地面 克制倍率:', electricVsGround, '(应为 0)');

            // 验证 SaveSystem
            console.log('=== SaveSystem 验证 ===');
            SaveSystem.save({ test: 123 });
            const testLoad = SaveSystem.load();
            console.log('SaveSystem 测试:', testLoad, '(应为 {test: 123})');
            console.log('SaveSystem.hasSave():', SaveSystem.hasSave(), '(应为 true)');
            SaveSystem.deleteSave();
            console.log('删除后 hasSave():', SaveSystem.hasSave(), '(应为 false)');

            // 验证 PlayerData
            console.log('=== PlayerData 验证 ===');
            PlayerData.createNew('测试玩家');
            console.log('PlayerData.elves:', PlayerData.elves);
            console.log('初始精灵 IV:', PlayerData.elves[0]?.iv);
            console.log('初始精灵 EV:', PlayerData.elves[0]?.ev);
            console.log('初始赛尔豆:', PlayerData.seerBeans, '(应为 1000)');
            console.log('初始物品:', PlayerData.items, '(应含 ID 1,2,3 各 5 个)');

            // 更新显示
            this.loadingText.setText('加载完成');
            this.statusText.setText('请打开控制台查看数据验证结果');

            // 停止动画
            this.tweens.killTweensOf(this.loadingText);
            this.loadingText.setAlpha(1);

            // TODO: 后续切换到 MainMenuScene
            // SceneManager.changeScene(this, 'MainMenuScene');

        } catch (error) {
            console.error('数据加载失败:', error);
            this.loadingText.setText('加载失败');
            this.statusText.setText('请检查控制台错误信息');
            this.loadingText.setColor('#ff0000');
        }
    }

    /**
     * Update 方法
     */
    update() {
        // 预留给加载进度条更新
    }
}
