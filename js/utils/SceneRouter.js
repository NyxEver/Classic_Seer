/**
 * SceneRouter - 统一场景跳转入口
 * 封装 start/launch/pause/resume，并提供 BGM 过渡策略
 */
function getSceneRouterDependency(name) {
    if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
        const dep = AppContext.get(name, null);
        if (dep) {
            return dep;
        }
    }
    if (typeof window !== 'undefined') {
        return window[name] || null;
    }
    return null;
}

const SceneRouter = {
    /**
     * 切换场景（start）
     * @param {Phaser.Scene} currentScene
     * @param {string} targetSceneKey
     * @param {Object} data
     * @param {Object} options
     * @returns {boolean}
     */
    start(currentScene, targetSceneKey, data = {}, options = {}) {
        if (!this.validateCurrentScene(currentScene)) {
            return false;
        }

        if (!this.sceneExists(currentScene, targetSceneKey)) {
            console.error(`[SceneRouter] 目标场景不存在: ${targetSceneKey}`);
            console.warn('[SceneRouter] 可用场景:', this.getAvailableScenes(currentScene));
            return false;
        }

        this.applyBgmStrategy(currentScene, targetSceneKey, options.bgmStrategy || 'auto');

        try {
            currentScene.scene.start(targetSceneKey, data);
            console.log(`[SceneRouter] start -> ${targetSceneKey}`);
            return true;
        } catch (error) {
            console.error(`[SceneRouter] start 失败: ${error.message}`);
            return false;
        }
    },

    /**
     * 叠加场景（launch）
     * @param {Phaser.Scene} currentScene
     * @param {string} targetSceneKey
     * @param {Object} data
     * @param {Object} options
     * @returns {boolean}
     */
    launch(currentScene, targetSceneKey, data = {}, options = {}) {
        if (!this.validateCurrentScene(currentScene)) {
            return false;
        }

        if (!this.sceneExists(currentScene, targetSceneKey)) {
            console.error(`[SceneRouter] 目标场景不存在: ${targetSceneKey}`);
            console.warn('[SceneRouter] 可用场景:', this.getAvailableScenes(currentScene));
            return false;
        }

        this.applyBgmStrategy(currentScene, targetSceneKey, options.bgmStrategy || 'inherit');

        try {
            currentScene.scene.launch(targetSceneKey, data);
            console.log(`[SceneRouter] launch -> ${targetSceneKey}`);
            return true;
        } catch (error) {
            console.error(`[SceneRouter] launch 失败: ${error.message}`);
            return false;
        }
    },

    /**
     * 暂停场景
     * @param {Phaser.Scene} currentScene
     * @param {string} sceneKey
     * @returns {boolean}
     */
    pause(currentScene, sceneKey) {
        if (!this.validateCurrentScene(currentScene)) {
            return false;
        }
        if (!this.sceneExists(currentScene, sceneKey)) {
            console.warn(`[SceneRouter] pause 失败，场景不存在: ${sceneKey}`);
            return false;
        }

        currentScene.scene.pause(sceneKey);
        console.log(`[SceneRouter] pause -> ${sceneKey}`);
        return true;
    },

    /**
     * 恢复场景
     * @param {Phaser.Scene} currentScene
     * @param {string} sceneKey
     * @returns {boolean}
     */
    resume(currentScene, sceneKey) {
        if (!this.validateCurrentScene(currentScene)) {
            return false;
        }
        if (!this.sceneExists(currentScene, sceneKey)) {
            console.warn(`[SceneRouter] resume 失败，场景不存在: ${sceneKey}`);
            return false;
        }

        currentScene.scene.resume(sceneKey);
        console.log(`[SceneRouter] resume -> ${sceneKey}`);
        return true;
    },

    /**
     * 场景是否存在
     * @param {Phaser.Scene} currentScene
     * @param {string} sceneKey
     * @returns {boolean}
     */
    sceneExists(currentScene, sceneKey) {
        if (!this.validateCurrentScene(currentScene)) {
            return false;
        }
        return currentScene.scene.get(sceneKey) !== null;
    },

    /**
     * 获取当前可用场景 key 列表
     * @param {Phaser.Scene} currentScene
     * @returns {string[]}
     */
    getAvailableScenes(currentScene) {
        if (!this.validateCurrentScene(currentScene) || !currentScene.scene.manager) {
            return [];
        }

        const scenes = [];
        currentScene.scene.manager.scenes.forEach((scene) => {
            scenes.push(scene.sys.settings.key);
        });
        return scenes;
    },

    /**
     * 应用 BGM 过渡策略
     * strategy:
     * - inherit: 不处理 BGM
     * - stop: 停止当前 BGM
     * - auto: 根据目标场景映射自动过渡
     * @param {Phaser.Scene} currentScene
     * @param {string} targetSceneKey
     * @param {string} strategy
     */
    applyBgmStrategy(currentScene, targetSceneKey, strategy) {
        if (strategy === 'inherit') {
            return;
        }

        const bgmManager = getSceneRouterDependency('BgmManager');
        if (!bgmManager) {
            return;
        }

        if (strategy === 'stop') {
            bgmManager.stopCurrent(300, null, currentScene);
            return;
        }

        if (strategy !== 'auto') {
            return;
        }

        const assetMappings = getSceneRouterDependency('AssetMappings');
        if (!assetMappings || typeof assetMappings.getBgmKey !== 'function') {
            return;
        }

        const currentSceneKey = currentScene.scene.key;
        const currentBgmKey = assetMappings.getBgmKey(currentSceneKey);
        const targetBgmKey = assetMappings.getBgmKey(targetSceneKey);

        if (targetBgmKey) {
            bgmManager.transitionTo(targetSceneKey, currentScene);
            return;
        }

        if (currentBgmKey && !targetBgmKey) {
            bgmManager.stopCurrent(300, null, currentScene);
        }
    },

    /**
     * 校验当前 scene 对象
     * @param {Phaser.Scene} currentScene
     * @returns {boolean}
     */
    validateCurrentScene(currentScene) {
        if (!currentScene || !currentScene.scene) {
            console.error('[SceneRouter] 当前场景无效');
            return false;
        }
        return true;
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('SceneRouter', SceneRouter);
}

window.SceneRouter = SceneRouter;
