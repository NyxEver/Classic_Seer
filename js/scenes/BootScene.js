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

        // 加载战斗精灵动画图集
        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getAllBattleAtlases === 'function') {
            const atlases = AssetMappings.getAllBattleAtlases();
            let loadedCount = 0;
            for (const atlas of atlases) {
                if (!atlas || !atlas.key || !atlas.texturePath || !atlas.atlasPath) continue;
                this.load.atlas(atlas.key, atlas.texturePath, atlas.atlasPath);
                loadedCount++;
            }
            console.log(`[BootScene] 预加载 ${loadedCount} 组战斗精灵动画图集`);
        }

        // 加载场景外静态精灵图（背包等）
        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getAllExternalStillAssets === 'function') {
            const stillAssets = AssetMappings.getAllExternalStillAssets();
            let loadedCount = 0;
            for (const asset of stillAssets) {
                if (!asset || !asset.key || !asset.path) continue;
                this.load.image(asset.key, asset.path);
                loadedCount++;
            }
            console.log(`[BootScene] 预加载 ${loadedCount} 张场景外静态精灵图`);
        }

        // 加载场景外动态图集（野外四方向）
        if (typeof AssetMappings !== 'undefined' && typeof AssetMappings.getAllExternalDynamicAtlases === 'function') {
            const atlases = AssetMappings.getAllExternalDynamicAtlases();
            let loadedCount = 0;
            for (const atlas of atlases) {
                if (!atlas || !atlas.key || !atlas.texturePath || !atlas.atlasPath) continue;
                this.load.atlas(atlas.key, atlas.texturePath, atlas.atlasPath);
                loadedCount++;
            }
            console.log(`[BootScene] 预加载 ${loadedCount} 组场景外动态图集`);
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

        // 加载属性图标资源（全属性，优先 Base64）
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

        // 在 create 阶段触发数据完整性校验（仅警告，不阻断）
        this.runDataIntegrityCheck();
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
     * 执行数据完整性校验
     */
    runDataIntegrityCheck() {
        if (typeof DataIntegrityChecker === 'undefined' || typeof DataIntegrityChecker.run !== 'function') {
            console.warn('[BootScene] DataIntegrityChecker 未加载，跳过校验');
            return;
        }

        try {
            DataIntegrityChecker.run();
        } catch (error) {
            console.warn('[BootScene] 数据完整性校验异常（已忽略）:', error);
        }
    }

    /**
     * Update 方法
     */
    update() {
        // 预留给加载进度条更新
    }
}
