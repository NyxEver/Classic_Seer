/**
 * SceneManager - Utility for safe scene transitions
 * Provides centralized scene management with validation
 */
function getSceneManagerDependency(name) {
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

const SceneManager = {
    /**
     * Safely change from one scene to another
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} targetSceneKey - Key of the target scene to switch to
     * @param {object} data - Optional data to pass to the new scene
     * @returns {boolean} - True if scene change was successful
     */
    changeScene: function (currentScene, targetSceneKey, data = {}) {
        const sceneRouter = getSceneManagerDependency('SceneRouter');
        if (!sceneRouter) {
            console.error('[SceneManager] SceneRouter 未加载，无法切换场景');
            return false;
        }
        return sceneRouter.start(currentScene, targetSceneKey, data, { bgmStrategy: 'auto' });
    },

    /**
     * Get a list of all available scene keys
     * @param {Phaser.Scene} scene - Any active scene
     * @returns {string[]} - Array of scene keys
     */
    getAvailableScenes: function (scene) {
        const sceneRouter = getSceneManagerDependency('SceneRouter');
        if (!sceneRouter) {
            return [];
        }
        if (!scene || !scene.scene || !scene.scene.manager) {
            return [];
        }
        return sceneRouter.getAvailableScenes(scene);
    },

    /**
     * Check if a scene exists
     * @param {Phaser.Scene} scene - Any active scene
     * @param {string} sceneKey - Key of the scene to check
     * @returns {boolean} - True if scene exists
     */
    sceneExists: function (scene, sceneKey) {
        const sceneRouter = getSceneManagerDependency('SceneRouter');
        if (!sceneRouter) {
            return false;
        }
        if (!scene || !scene.scene) {
            return false;
        }
        return sceneRouter.sceneExists(scene, sceneKey);
    },

    /**
     * Pause a scene
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} sceneKey - Key of the scene to pause
     */
    pauseScene: function (currentScene, sceneKey) {
        const sceneRouter = getSceneManagerDependency('SceneRouter');
        if (!sceneRouter) {
            console.warn('[SceneManager] SceneRouter 未加载，无法暂停场景');
            return;
        }
        sceneRouter.pause(currentScene, sceneKey);
    },

    /**
     * Resume a paused scene
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} sceneKey - Key of the scene to resume
     */
    resumeScene: function (currentScene, sceneKey) {
        const sceneRouter = getSceneManagerDependency('SceneRouter');
        if (!sceneRouter) {
            console.warn('[SceneManager] SceneRouter 未加载，无法恢复场景');
            return;
        }
        sceneRouter.resume(currentScene, sceneKey);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('SceneManager', SceneManager);
}

// Make SceneManager globally available
window.SceneManager = SceneManager;
