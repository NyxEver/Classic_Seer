/**
 * SceneManager - Legacy compatibility shim.
 *
 * 内部调用已迁移到 SceneRouter；该对象仅为兼容历史调用保留。
 */
const SceneManager = {
    get _sceneRouter() {
        if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
            return AppContext.get('SceneRouter', null);
        }
        return typeof window !== 'undefined' ? (window.SceneRouter || null) : null;
    },

    changeScene(currentScene, targetSceneKey, data = {}) {
        if (!this._sceneRouter) {
            console.error('[SceneManager] SceneRouter 未加载，无法切换场景');
            return false;
        }
        return this._sceneRouter.start(currentScene, targetSceneKey, data, { bgmStrategy: 'auto' });
    },

    getAvailableScenes(scene) {
        if (!this._sceneRouter) {
            return [];
        }
        if (!scene || !scene.scene || !scene.scene.manager) {
            return [];
        }
        return this._sceneRouter.getAvailableScenes(scene);
    },

    sceneExists(scene, sceneKey) {
        if (!this._sceneRouter) {
            return false;
        }
        if (!scene || !scene.scene) {
            return false;
        }
        return this._sceneRouter.sceneExists(scene, sceneKey);
    },

    pauseScene(currentScene, sceneKey) {
        if (!this._sceneRouter) {
            console.warn('[SceneManager] SceneRouter 未加载，无法暂停场景');
            return;
        }
        this._sceneRouter.pause(currentScene, sceneKey);
    },

    resumeScene(currentScene, sceneKey) {
        if (!this._sceneRouter) {
            console.warn('[SceneManager] SceneRouter 未加载，无法恢复场景');
            return;
        }
        this._sceneRouter.resume(currentScene, sceneKey);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('SceneManager', SceneManager);
}

// Make SceneManager globally available
window.SceneManager = SceneManager;
