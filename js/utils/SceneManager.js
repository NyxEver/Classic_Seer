/**
 * SceneManager - Utility for safe scene transitions
 * Provides centralized scene management with validation
 */
const SceneManager = {
    /**
     * Safely change from one scene to another
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} targetSceneKey - Key of the target scene to switch to
     * @param {object} data - Optional data to pass to the new scene
     * @returns {boolean} - True if scene change was successful
     */
    changeScene: function (currentScene, targetSceneKey, data = {}) {
        if (typeof SceneRouter === 'undefined') {
            console.error('[SceneManager] SceneRouter 未加载，无法切换场景');
            return false;
        }
        return SceneRouter.start(currentScene, targetSceneKey, data, { bgmStrategy: 'auto' });
    },

    /**
     * Get a list of all available scene keys
     * @param {Phaser.Scene} scene - Any active scene
     * @returns {string[]} - Array of scene keys
     */
    getAvailableScenes: function (scene) {
        if (typeof SceneRouter === 'undefined') {
            return [];
        }
        if (!scene || !scene.scene || !scene.scene.manager) {
            return [];
        }
        return SceneRouter.getAvailableScenes(scene);
    },

    /**
     * Check if a scene exists
     * @param {Phaser.Scene} scene - Any active scene
     * @param {string} sceneKey - Key of the scene to check
     * @returns {boolean} - True if scene exists
     */
    sceneExists: function (scene, sceneKey) {
        if (typeof SceneRouter === 'undefined') {
            return false;
        }
        if (!scene || !scene.scene) {
            return false;
        }
        return SceneRouter.sceneExists(scene, sceneKey);
    },

    /**
     * Pause a scene
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} sceneKey - Key of the scene to pause
     */
    pauseScene: function (currentScene, sceneKey) {
        if (typeof SceneRouter === 'undefined') {
            console.warn('[SceneManager] SceneRouter 未加载，无法暂停场景');
            return;
        }
        SceneRouter.pause(currentScene, sceneKey);
    },

    /**
     * Resume a paused scene
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} sceneKey - Key of the scene to resume
     */
    resumeScene: function (currentScene, sceneKey) {
        if (typeof SceneRouter === 'undefined') {
            console.warn('[SceneManager] SceneRouter 未加载，无法恢复场景');
            return;
        }
        SceneRouter.resume(currentScene, sceneKey);
    }
};

// Make SceneManager globally available
window.SceneManager = SceneManager;
