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
        // Validate current scene
        if (!currentScene || !currentScene.scene) {
            console.error('[SceneManager] Invalid current scene provided');
            return false;
        }

        // Check if target scene exists in the scene manager
        const sceneManager = currentScene.scene;
        const targetScene = sceneManager.get(targetSceneKey);

        if (!targetScene) {
            console.error(`[SceneManager] Target scene "${targetSceneKey}" does not exist`);
            console.warn('[SceneManager] Available scenes:', this.getAvailableScenes(currentScene));
            return false;
        }

        // Perform the scene transition
        try {
            sceneManager.start(targetSceneKey, data);
            console.log(`[SceneManager] Successfully changed to scene: ${targetSceneKey}`);
            return true;
        } catch (error) {
            console.error(`[SceneManager] Failed to change scene: ${error.message}`);
            return false;
        }
    },

    /**
     * Get a list of all available scene keys
     * @param {Phaser.Scene} scene - Any active scene
     * @returns {string[]} - Array of scene keys
     */
    getAvailableScenes: function (scene) {
        if (!scene || !scene.scene || !scene.scene.manager) {
            return [];
        }

        const scenes = [];
        scene.scene.manager.scenes.forEach(s => {
            scenes.push(s.sys.settings.key);
        });
        return scenes;
    },

    /**
     * Check if a scene exists
     * @param {Phaser.Scene} scene - Any active scene
     * @param {string} sceneKey - Key of the scene to check
     * @returns {boolean} - True if scene exists
     */
    sceneExists: function (scene, sceneKey) {
        if (!scene || !scene.scene) {
            return false;
        }
        return scene.scene.get(sceneKey) !== null;
    },

    /**
     * Pause a scene
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} sceneKey - Key of the scene to pause
     */
    pauseScene: function (currentScene, sceneKey) {
        if (this.sceneExists(currentScene, sceneKey)) {
            currentScene.scene.pause(sceneKey);
            console.log(`[SceneManager] Paused scene: ${sceneKey}`);
        } else {
            console.warn(`[SceneManager] Cannot pause - scene "${sceneKey}" not found`);
        }
    },

    /**
     * Resume a paused scene
     * @param {Phaser.Scene} currentScene - The currently active scene
     * @param {string} sceneKey - Key of the scene to resume
     */
    resumeScene: function (currentScene, sceneKey) {
        if (this.sceneExists(currentScene, sceneKey)) {
            currentScene.scene.resume(sceneKey);
            console.log(`[SceneManager] Resumed scene: ${sceneKey}`);
        } else {
            console.warn(`[SceneManager] Cannot resume - scene "${sceneKey}" not found`);
        }
    }
};

// Make SceneManager globally available
window.SceneManager = SceneManager;
