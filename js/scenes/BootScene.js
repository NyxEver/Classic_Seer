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

            // === 第三阶段验证：精灵系统 ===
            console.log('=== 第三阶段验证：精灵系统 ===');

            // 验证 Elf 类
            console.log('--- Elf 类验证 ---');
            const testElf = ElfBag.getByIndex(0);
            if (testElf) {
                console.log('精灵名称:', testElf.getDisplayName());
                console.log('精灵等级:', testElf.level);
                console.log('精灵属性:', testElf.type);
                console.log('最大 HP:', testElf.getMaxHp());
                console.log('当前 HP:', testElf.currentHp);
                console.log('攻击力:', testElf.getAtk());
                console.log('特攻:', testElf.getSpAtk());
                console.log('防御:', testElf.getDef());
                console.log('特防:', testElf.getSpDef());
                console.log('速度:', testElf.getSpd());
                console.log('技能:', testElf.getSkillDetails());

                // 测试经验升级
                console.log('--- 经验升级测试 ---');
                console.log('升级所需经验:', testElf.getExpToNextLevel(), '(1级应为100)');
                const levelUpResults = testElf.addExp(150);
                console.log('添加150经验后等级:', testElf.level, '(应为2)');
                console.log('剩余经验:', testElf.exp, '(应为50)');
                console.log('升级结果:', levelUpResults);

                // 测试 EV 系统
                console.log('--- EV 系统测试 ---');
                console.log('当前 EV 总和:', testElf.getTotalEV());
                testElf.addEV('spd', 10);
                console.log('添加 10 速度 EV 后:', testElf.ev.spd);

                // 测试 EV 上限
                testElf.addEV('hp', 300); // 应该被限制到 255
                console.log('添加 300 HP EV 后 (应被限制):', testElf.ev.hp, '(上限255)');
            }

            // 验证 ElfBag
            console.log('--- ElfBag 验证 ---');
            console.log('精灵总数:', ElfBag.getCount(), '(应为1)');
            console.log('全部精灵:', ElfBag.getAll());
            console.log('首只可用精灵:', ElfBag.getFirstAvailable()?.getDisplayName());
            console.log('是否全部倒下:', ElfBag.allFainted(), '(应为false)');

            // 添加皮皮测试
            ElfBag.add(2, 3);
            console.log('添加皮皮后精灵总数:', ElfBag.getCount(), '(应为2)');

            // 交换位置测试
            ElfBag.swap(0, 1);
            console.log('交换后第一只精灵:', ElfBag.getByIndex(0)?.getDisplayName());
            ElfBag.swap(0, 1); // 换回来

            // 创建野生精灵测试
            console.log('--- 野生精灵创建测试 ---');
            const wildElf = Elf.createWild(2, 4);
            if (wildElf) {
                console.log('野生皮皮 Lv.4:', wildElf.getDisplayName(), 'HP:', wildElf.getMaxHp());
                console.log('野生皮皮 IV:', wildElf.iv);
                console.log('野生皮皮技能:', wildElf.getSkillDetails().map(s => s.name));
            }

            // 更新显示
            this.loadingText.setText('加载完成');
            this.statusText.setText('请打开控制台查看验证结果\n点击下方按钮进入精灵背包');

            // 停止动画
            this.tweens.killTweensOf(this.loadingText);
            this.loadingText.setAlpha(1);

            // 创建进入背包按钮
            this.createElfBagButton();

        } catch (error) {
            console.error('数据加载失败:', error);
            this.loadingText.setText('加载失败');
            this.statusText.setText('请检查控制台错误信息');
            this.loadingText.setColor('#ff0000');
        }
    }

    /**
     * 创建进入精灵背包的按钮
     */
    createElfBagButton() {
        const centerX = this.cameras.main.width / 2;
        const btnY = this.cameras.main.height - 80;

        // 按钮背景
        const btnBg = this.add.rectangle(centerX, btnY, 180, 50, 0x4a6aaa);
        btnBg.setStrokeStyle(3, 0x6a8acc);
        btnBg.setInteractive({ useHandCursor: true });

        // 按钮文字
        const btnText = this.add.text(centerX, btnY, '打开精灵背包', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 悬停效果
        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x5a7aba);
            btnBg.setScale(1.05);
            btnText.setScale(1.05);
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x4a6aaa);
            btnBg.setScale(1);
            btnText.setScale(1);
        });

        // 点击跳转
        btnBg.on('pointerdown', () => {
            console.log('[BootScene] 跳转到精灵背包');
            SceneManager.changeScene(this, 'ElfBagScene', { returnScene: 'BootScene' });
        });
    }

    /**
     * Update 方法
     */
    update() {
        // 预留给加载进度条更新
    }
}
