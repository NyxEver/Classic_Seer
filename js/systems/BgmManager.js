/**
 * BgmManager - 统一 BGM 管理器
 * 仅管理场景 BGM：播放、淡入淡出、单轨约束
 */

const BgmManager = {
    currentSound: null,
    currentSceneKey: null,
    currentBgmKey: null,
    runtimeScene: null,
    masterVolume: 1,
    isStopping: false,
    fadeIntervalId: null,

    /**
     * 设置全局音量（0~1）
     * @param {number} v
     */
    setVolume(v) {
        const volume = Math.max(0, Math.min(1, Number(v) || 0));
        this.masterVolume = volume;
        if (this.currentSound) {
            this.currentSound.setVolume(volume);
        }
    },

    /**
     * 按场景播放 BGM（若无映射则不播放）
     * @param {string} sceneKey
     * @param {Phaser.Scene|null} scene
     * @returns {boolean}
     */
    playForScene(sceneKey, scene = null) {
        const runtimeScene = this.resolveScene(scene);
        if (!runtimeScene || !runtimeScene.sound) {
            console.warn('[BgmManager] 无可用场景上下文，无法播放 BGM');
            return false;
        }

        this.syncCurrentSoundState(runtimeScene);

        const bgmKey = this.getBgmKey(sceneKey);
        if (!bgmKey) {
            console.log(`[BgmManager] 场景 ${sceneKey} 未配置 BGM，跳过播放`);
            this.logActiveCount(runtimeScene, `skip(${sceneKey})`);
            return false;
        }

        if (!runtimeScene.cache.audio.exists(bgmKey)) {
            console.warn(`[BgmManager] BGM 资源不存在: ${bgmKey}`);
            return false;
        }

        if (this.currentSound && this.currentSound.isPlaying && this.currentBgmKey === bgmKey) {
            this.currentSceneKey = sceneKey;
            this.currentSound.setVolume(this.masterVolume);
            this.destroyOtherBgmSounds(runtimeScene, bgmKey);
            this.logActiveCount(runtimeScene, `reuse(${sceneKey})`);
            return true;
        }

        this.destroyOtherBgmSounds(runtimeScene, null);

        this.currentSound = runtimeScene.sound.add(bgmKey, {
            loop: true,
            volume: 0
        });
        this.currentSound.play();

        this.currentSceneKey = sceneKey;
        this.currentBgmKey = bgmKey;

        if (runtimeScene.tweens) {
            runtimeScene.tweens.add({
                targets: this.currentSound,
                volume: this.masterVolume,
                duration: 600,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.logActiveCount(runtimeScene, `play(${sceneKey})`);
                }
            });
        } else {
            this.currentSound.setVolume(this.masterVolume);
            this.logActiveCount(runtimeScene, `play(${sceneKey})`);
        }

        return true;
    },

    /**
     * 场景 BGM 过渡（当前淡出 -> 新场景淡入）
     * @param {string} sceneKey
     * @param {Phaser.Scene|null} scene
     */
    transitionTo(sceneKey, scene = null) {
        const runtimeScene = this.resolveScene(scene);
        if (!runtimeScene) {
            return false;
        }

        const bgmKey = this.getBgmKey(sceneKey);

        // 无映射：不主动播放；保留上层自行 stop 的策略
        if (!bgmKey) {
            console.log(`[BgmManager] 场景 ${sceneKey} 未配置 BGM，transition 跳过`);
            this.logActiveCount(runtimeScene, `transition-skip(${sceneKey})`);
            return false;
        }

        if (this.currentSound && this.currentSound.isPlaying && this.currentBgmKey === bgmKey) {
            this.currentSceneKey = sceneKey;
            this.currentSound.setVolume(this.masterVolume);
            this.destroyOtherBgmSounds(runtimeScene, bgmKey);
            this.logActiveCount(runtimeScene, `transition-reuse(${sceneKey})`);
            return true;
        }

        const startNext = () => {
            const sceneForPlay = this.findSceneByKey(sceneKey) || runtimeScene;
            this.playForScene(sceneKey, sceneForPlay);
        };

        if (this.currentSound && this.currentSound.isPlaying) {
            this.stopCurrent(450, startNext, runtimeScene);
            return true;
        }

        startNext();
        return true;
    },

    /**
     * 停止当前 BGM
     * @param {number} fadeMs
     * @param {Function|null} onComplete
     * @param {Phaser.Scene|null} scene
     */
    stopCurrent(fadeMs = 450, onComplete = null, scene = null) {
        const runtimeScene = this.resolveScene(scene);
        this.syncCurrentSoundState(runtimeScene);

        if (!this.currentSound) {
            this.destroyOtherBgmSounds(runtimeScene, null);
            if (onComplete) onComplete();
            if (runtimeScene) this.logActiveCount(runtimeScene, 'stop(no-sound)');
            return;
        }

        if (this.isStopping) {
            if (onComplete) {
                globalThis.setTimeout(onComplete, 220);
            }
            return;
        }

        const sound = this.currentSound;
        let finalized = false;
        const finalize = () => {
            if (finalized) {
                return;
            }
            finalized = true;
            this.clearFadeInterval();

            if (sound) {
                if (typeof sound.stop === 'function') {
                    sound.stop();
                }
                if (typeof sound.destroy === 'function') {
                    sound.destroy();
                }
            }

            if (this.currentSound === sound) {
                this.currentSound = null;
                this.currentSceneKey = null;
                this.currentBgmKey = null;
                this.destroyOtherBgmSounds(runtimeScene, null);
            }

            this.isStopping = false;

            if (runtimeScene) {
                this.logActiveCount(runtimeScene, 'stop(done)');
            }

            if (onComplete) onComplete();
        };

        if (!this.currentSound.isPlaying || fadeMs <= 0) {
            finalize();
            return;
        }

        this.isStopping = true;

        const startVolume = Number.isFinite(sound.volume) ? sound.volume : this.masterVolume;
        const duration = Math.max(80, Number(fadeMs) || 0);
        const startedAt = Date.now();

        this.clearFadeInterval();
        this.fadeIntervalId = globalThis.setInterval(() => {
            if (!this.currentSound || this.currentSound !== sound || !sound.isPlaying) {
                finalize();
                return;
            }

            const elapsed = Date.now() - startedAt;
            const ratio = Math.min(1, elapsed / duration);
            sound.setVolume(Math.max(0, startVolume * (1 - ratio)));

            if (ratio >= 1) {
                finalize();
            }
        }, 16);
    },

    getBgmKey(sceneKey) {
        if (typeof AssetMappings === 'undefined' || typeof AssetMappings.getBgmKey !== 'function') {
            return null;
        }
        return AssetMappings.getBgmKey(sceneKey);
    },

    resolveScene(scene = null) {
        if (scene) {
            this.runtimeScene = scene;
            return scene;
        }
        return this.runtimeScene;
    },

    findSceneByKey(sceneKey) {
        let game = null;
        if (typeof AppContext !== 'undefined' && typeof AppContext.get === 'function') {
            game = AppContext.get('game', null);
        }
        if (!game && typeof window !== 'undefined') {
            game = window.__seerGame || null;
        }
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') {
            return null;
        }

        try {
            return game.scene.getScene(sceneKey) || null;
        } catch (error) {
            console.warn(`[BgmManager] 无法获取场景实例: ${sceneKey}`, error);
            return null;
        }
    },

    syncCurrentSoundState(scene) {
        if (!this.currentSound) {
            return;
        }
        if (this.currentSound.isPlaying) {
            return;
        }

        if (typeof this.currentSound.destroy === 'function') {
            this.currentSound.destroy();
        }
        this.currentSound = null;
        this.currentSceneKey = null;
        this.currentBgmKey = null;
        this.isStopping = false;
        this.clearFadeInterval();

        if (scene) {
            this.logActiveCount(scene, 'sync(stale-cleared)');
        }
    },

    destroyOtherBgmSounds(scene, keepKey = null) {
        if (!scene || !scene.sound || typeof scene.sound.getAll !== 'function') {
            return;
        }

        const allBgm = scene.sound
            .getAll()
            .filter((sound) => sound && typeof sound.key === 'string' && sound.key.startsWith('bgm_'));

        allBgm.forEach((sound) => {
            if (keepKey && sound.key === keepKey) {
                return;
            }

            if (typeof sound.stop === 'function') {
                sound.stop();
            }
            if (typeof sound.destroy === 'function') {
                sound.destroy();
            }
            if (sound === this.currentSound) {
                this.currentSound = null;
                this.currentSceneKey = null;
                this.currentBgmKey = null;
                this.isStopping = false;
                this.clearFadeInterval();
            }
        });
    },

    clearFadeInterval() {
        if (this.fadeIntervalId !== null) {
            globalThis.clearInterval(this.fadeIntervalId);
            this.fadeIntervalId = null;
        }
    },

    getActiveBgmCount(scene) {
        if (!scene || !scene.sound || typeof scene.sound.getAll !== 'function') {
            return 0;
        }
        return scene.sound
            .getAll()
            .filter((sound) => sound && typeof sound.key === 'string' && sound.key.startsWith('bgm_'))
            .length;
    },

    logActiveCount(scene, context) {
        const count = this.getActiveBgmCount(scene);
        console.log(`[BgmManager] ${context} activeBgmCount=${count}`);
    }
};

if (typeof AppContext !== 'undefined' && typeof AppContext.register === 'function') {
    AppContext.register('BgmManager', BgmManager);
}

window.BgmManager = BgmManager;
