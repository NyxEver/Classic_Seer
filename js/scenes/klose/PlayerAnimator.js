/**
 * KlosePlayerAnimator - 克洛斯星玩家赛尔动画控制器
 * 职责：
 * 1) 创建玩家显示对象（赛尔方向图集 + 名字）
 * 2) 根据 8 方向播放 start -> loop -> end 动画
 * 3) 缺失方向通过镜像补全（right/right_down/left_up）
 */

class KlosePlayerAnimator {
    constructor(scene) {
        this.scene = scene;
        this.playerContainer = null;
        this.playerSprite = null;
        this.currentDirection = 'front';

        this.loopDistanceThreshold = 70;
        this.frameCache = {};
        this.loopAnimCache = {};
        this.loopDelayTimer = null;
        this.moveToken = 0;
    }

    createPlayer(x, y, playerName = '赛尔') {
        const atlasKey = this.getAtlasKeyForBaseDirection('front');
        if (!atlasKey || !this.scene.textures.exists(atlasKey)) {
            return null;
        }

        const container = this.scene.add.container(x, y);
        const frameSet = this.getFrameSet(atlasKey);
        const initialFrame = frameSet.endFrame || frameSet.startFrame || frameSet.loopFrames[0] || null;

        const sprite = this.scene.add.sprite(0, 20, atlasKey, initialFrame || undefined);
        sprite.setOrigin(0.5, 1);
        const targetHeight = 86;
        const scale = sprite.height > 0 ? targetHeight / sprite.height : 1;
        sprite.setScale(scale);

        const nameTag = this.scene.add.text(0, 46, playerName, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        container.add([sprite, nameTag]);

        this.playerContainer = container;
        this.playerSprite = sprite;
        this.currentDirection = 'front';
        this.playIdle('front');

        return container;
    }

    playMove(direction, distance, moveDuration) {
        if (!this.playerSprite || !this.playerContainer || !this.playerContainer.scene) {
            return;
        }

        const resolved = this.resolveDirection(direction);
        const atlasKey = this.getAtlasKeyForBaseDirection(resolved.baseDirection);
        if (!atlasKey || !this.scene.textures.exists(atlasKey)) {
            return;
        }

        this.currentDirection = resolved.direction;
        this.moveToken++;

        this.stopLoopPlayback();

        const frameSet = this.getFrameSet(atlasKey);
        const startFrame = frameSet.startFrame || frameSet.loopFrames[0] || frameSet.endFrame || null;
        this.applyStaticPose(atlasKey, startFrame, resolved.flipX);

        const canLoop = distance >= this.loopDistanceThreshold && frameSet.loopFrames.length > 0;
        if (!canLoop) {
            return;
        }

        const token = this.moveToken;
        const leadTime = Math.min(140, Math.max(60, Math.floor(moveDuration * 0.2)));
        this.loopDelayTimer = this.scene.time.delayedCall(leadTime, () => {
            if (token !== this.moveToken || !this.playerSprite || !this.playerContainer || !this.playerContainer.scene) {
                return;
            }

            const animKey = this.ensureLoopAnimation(atlasKey, frameSet.loopFrames);
            if (!animKey) {
                return;
            }

            this.playerSprite.setFlipX(resolved.flipX);
            this.playerSprite.play(animKey, true);
        });
    }

    playIdle(direction) {
        if (!this.playerSprite || !this.playerContainer || !this.playerContainer.scene) {
            return;
        }

        const resolved = this.resolveDirection(direction || this.currentDirection);
        const atlasKey = this.getAtlasKeyForBaseDirection(resolved.baseDirection);
        if (!atlasKey || !this.scene.textures.exists(atlasKey)) {
            return;
        }

        this.currentDirection = resolved.direction;
        this.stopLoopPlayback();

        const frameSet = this.getFrameSet(atlasKey);
        const endFrame = frameSet.endFrame || frameSet.startFrame || frameSet.loopFrames[0] || null;
        this.applyStaticPose(atlasKey, endFrame, resolved.flipX);
    }

    destroy() {
        this.stopLoopPlayback();
        this.playerContainer = null;
        this.playerSprite = null;
    }

    stopLoopPlayback() {
        if (this.loopDelayTimer && !this.loopDelayTimer.hasDispatched) {
            this.loopDelayTimer.remove(false);
        }
        this.loopDelayTimer = null;

        if (!this.playerSprite || !this.playerSprite.anims) {
            return;
        }

        const currentAnim = this.playerSprite.anims.currentAnim;
        if (currentAnim && typeof currentAnim.key === 'string' && currentAnim.key.startsWith('seer_move_')) {
            this.playerSprite.stop();
        }
    }

    applyStaticPose(atlasKey, frameName, flipX) {
        if (!this.playerSprite) {
            return;
        }

        this.playerSprite.stop();
        this.playerSprite.setFlipX(!!flipX);

        if (this.playerSprite.texture.key !== atlasKey) {
            if (frameName) {
                this.playerSprite.setTexture(atlasKey, frameName);
            } else {
                this.playerSprite.setTexture(atlasKey);
            }
            return;
        }

        if (frameName) {
            this.playerSprite.setFrame(frameName);
        }
    }

    resolveDirection(direction) {
        switch (direction) {
            case 'front':
                return { direction: 'front', baseDirection: 'front', flipX: false };
            case 'back':
                return { direction: 'back', baseDirection: 'back', flipX: false };
            case 'left':
                return { direction: 'left', baseDirection: 'left', flipX: false };
            case 'right':
                return { direction: 'right', baseDirection: 'left', flipX: true };
            case 'left_down':
                return { direction: 'left_down', baseDirection: 'left_down', flipX: false };
            case 'right_down':
                return { direction: 'right_down', baseDirection: 'left_down', flipX: true };
            case 'right_up':
                return { direction: 'right_up', baseDirection: 'right_up', flipX: false };
            case 'left_up':
                return { direction: 'left_up', baseDirection: 'right_up', flipX: true };
            default:
                return { direction: 'front', baseDirection: 'front', flipX: false };
        }
    }

    getAtlasKeyForBaseDirection(baseDirection) {
        if (typeof AssetMappings === 'undefined') {
            return null;
        }
        if (typeof AssetMappings.getSeerDynamicAtlasKey !== 'function') {
            return null;
        }
        return AssetMappings.getSeerDynamicAtlasKey(baseDirection);
    }

    ensureLoopAnimation(atlasKey, loopFrames) {
        const animKey = `seer_move_${atlasKey}`;
        if (this.loopAnimCache[animKey]) {
            return animKey;
        }
        if (this.scene.anims.exists(animKey)) {
            this.loopAnimCache[animKey] = true;
            return animKey;
        }
        if (!loopFrames.length) {
            return null;
        }

        this.scene.anims.create({
            key: animKey,
            frames: loopFrames.map((frame) => ({ key: atlasKey, frame })),
            frameRate: Math.max(8, Math.min(14, loopFrames.length * 2)),
            repeat: -1
        });

        this.loopAnimCache[animKey] = true;
        return animKey;
    }

    getFrameSet(atlasKey) {
        if (this.frameCache[atlasKey]) {
            return this.frameCache[atlasKey];
        }

        const frameNames = this.getAtlasFrameNames(atlasKey);
        const startFrame = this.findNamedFrame(frameNames, 'start');
        const endFrame = this.findNamedFrame(frameNames, 'end');

        const loopFrames = frameNames
            .filter((name) => this.isNumericFrameName(name))
            .sort((a, b) => {
                const aValue = this.parseNumericFrame(name);
                const bValue = this.parseNumericFrame(name);
                if (aValue !== bValue) return aValue - bValue;
                return a.localeCompare(b, 'en');
            });

        const loopPlaybackFrames = this.buildLoopPlaybackFrames(loopFrames);

        const result = {
            startFrame,
            endFrame,
            loopFrames: loopPlaybackFrames
        };

        this.frameCache[atlasKey] = result;
        return result;
    }

    getAtlasFrameNames(atlasKey) {
        const atlasJson = this.scene.cache && this.scene.cache.json
            ? this.scene.cache.json.get(atlasKey)
            : null;
        if (atlasJson && atlasJson.frames && typeof atlasJson.frames === 'object') {
            return Object.keys(atlasJson.frames);
        }

        const texture = this.scene.textures.get(atlasKey);
        if (!texture) {
            return [];
        }
        return texture.getFrameNames().filter((name) => name !== '__BASE');
    }

    findNamedFrame(frameNames, target) {
        const expected = `${target}.png`;
        for (const frameName of frameNames) {
            const lower = frameName.toLowerCase();
            if (lower === expected || lower === target) {
                return frameName;
            }
        }
        return null;
    }

    isNumericFrameName(frameName) {
        return /^\d+(?:\.[a-z0-9]+)?$/i.test(frameName);
    }

    buildLoopPlaybackFrames(sortedFrames) {
        if (!Array.isArray(sortedFrames) || sortedFrames.length <= 2) {
            return Array.isArray(sortedFrames) ? sortedFrames.slice() : [];
        }

        const reverse = sortedFrames.slice(1, -1).reverse();
        return sortedFrames.concat(reverse);
    }

    parseNumericFrame(frameName) {
        const match = frameName.match(/^(\d+)/);
        if (!match) {
            return Number.MAX_SAFE_INTEGER;
        }
        return parseInt(match[1], 10);
    }
}

window.KlosePlayerAnimator = KlosePlayerAnimator;
