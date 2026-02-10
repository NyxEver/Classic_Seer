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
        const isFileProtocol = window.location.protocol === 'file:';

        // 统一监听资源加载失败，便于快速定位路径问题
        this.load.on('loaderror', (file) => {
            console.error(`[BootScene] 资源加载失败: key=${file.key}, path=${file.src || 'unknown'}`);
        });

        // 使用 Base64 嵌入数据加载精灵贴图（绕过 file:// CORS 限制）
        if (typeof ElfSpriteData !== 'undefined' && typeof AssetMappings !== 'undefined') {
            let loadedCount = 0;
            for (const [elfId, fileName] of Object.entries(AssetMappings.elves)) {
                const imageKey = `elf_${fileName}`;
                const base64Data = ElfSpriteData[fileName];
                if (base64Data) {
                    this.load.image(imageKey, base64Data);
                    loadedCount++;
                }
            }
            console.log(`[BootScene] 预加载 ${loadedCount} 个精灵贴图（Base64 模式）`);
        }

        // 加载背景图片
        if (typeof BackgroundData !== 'undefined') {
            for (const [key, data] of Object.entries(BackgroundData)) {
                this.load.image(`bg_${key}`, data);
            }
            console.log(`[BootScene] 预加载 ${Object.keys(BackgroundData).length} 个背景图片`);
        }

        // 加载 UI 资源
        if (typeof UIAssetData !== 'undefined') {
            for (const [key, data] of Object.entries(UIAssetData)) {
                this.load.image(`ui_${key}`, data);
            }
            console.log(`[BootScene] 预加载 ${Object.keys(UIAssetData).length} 个 UI 资源`);
        }

        // 加载物品图标资源（优先 Base64，避免 file:// CORS）
        if (typeof AssetMappings !== 'undefined') {
            const loadedNames = new Set();
            let loadedCount = 0;
            for (const fileName of Object.values(AssetMappings.items || {})) {
                if (loadedNames.has(fileName)) continue;
                loadedNames.add(fileName);

                const key = `item_${fileName}`;
                if (typeof ItemIconData !== 'undefined' && ItemIconData[fileName]) {
                    this.load.image(key, ItemIconData[fileName]);
                    loadedCount++;
                } else if (!isFileProtocol) {
                    this.load.image(key, `assets/images/items/${fileName}.png`);
                    loadedCount++;
                } else {
                    console.warn(`[BootScene] 缺少 ItemIconData: ${fileName}`);
                }
            }
            console.log(`[BootScene] 预加载 ${loadedCount} 个物品图标`);
        }

        // 加载属性图标资源（当前仅水/火/草/飞行，优先 Base64）
        if (typeof AssetMappings !== 'undefined') {
            let loadedCount = 0;
            for (const iconName of Object.values(AssetMappings.typeIcons || {})) {
                const key = `type_${iconName}`;
                if (typeof TypeIconData !== 'undefined' && TypeIconData[iconName]) {
                    this.load.image(key, TypeIconData[iconName]);
                    loadedCount++;
                } else if (!isFileProtocol) {
                    this.load.image(key, `assets/images/ui/icons/type/${iconName}.png`);
                    loadedCount++;
                } else {
                    console.warn(`[BootScene] 缺少 TypeIconData: ${iconName}`);
                }
            }
            console.log(`[BootScene] 预加载 ${loadedCount} 个属性图标`);
        }

        // 加载背景音乐资源（优先 Base64，避免 file:// CORS）
        if (typeof AssetMappings !== 'undefined') {
            const loadedNames = new Set();
            let loadedCount = 0;
            for (const bgmName of Object.values(AssetMappings.bgm || {})) {
                if (loadedNames.has(bgmName)) continue;
                loadedNames.add(bgmName);

                const key = `bgm_${bgmName}`;
                if (typeof BgmData !== 'undefined' && BgmData[bgmName]) {
                    this.load.audio(key, BgmData[bgmName]);
                    loadedCount++;
                } else if (!isFileProtocol) {
                    this.load.audio(key, `assets/audio/bgm/${bgmName}.mp3`);
                    loadedCount++;
                } else {
                    console.warn(`[BootScene] 缺少 BgmData: ${bgmName}`);
                }
            }
            console.log(`[BootScene] 预加载 ${loadedCount} 个 BGM`);
        }
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

            // 短暂延迟后进入主菜单
            this.time.delayedCall(500, () => {
                console.log('BootScene: 数据加载完成，进入主菜单');
                SceneManager.changeScene(this, 'MainMenuScene');
            });

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
