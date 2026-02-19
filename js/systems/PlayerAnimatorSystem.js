/**
 * PlayerAnimatorSystem - 通用玩家动画系统
 * 
 * 提供场景无关的玩家精灵动画控制，包括：
 * - 基于图集的玩家精灵创建
 * - 八方向行走动画（start → loop → end）
 * - 待机动画
 * - 方向镜像补全
 * - 图集帧管理与动画键注册
 * 
 * 不硬编码任何场景特有的资源映射，
 * 通过 config.atlasKeyResolver(direction) 由调用者提供图集 key 查询。
 */
class PlayerAnimatorSystem {

    /**
     * @param {Phaser.Scene} scene - Phaser 场景实例
     * @param {Object} config - 动画配置
     * @param {Function} config.atlasKeyResolver - 方向到图集 key 的映射函数 (baseDirection) => string|null
     * @param {number} [config.targetHeight=86] - 精灵目标高度
     * @param {number} [config.spriteScale=0.68] - 精灵额外缩放
     * @param {number} [config.loopDistanceThreshold=70] - 触发循环动画的最小移动距离
     * @param {string} [config.animKeyPrefix='seer_move_'] - 动画键前缀
     */
    constructor(scene, config) {
        this.scene = scene;
        this.config = config || {};
        this.atlasKeyResolver = config.atlasKeyResolver || (() => null);

        this.playerContainer = null;
        this.playerSprite = null;
        this.currentDirection = 'front';

        this.targetHeight = config.targetHeight || 86;
        this.spriteScale = config.spriteScale || 0.68;
        this.loopDistanceThreshold = config.loopDistanceThreshold || 70;
        this.animKeyPrefix = config.animKeyPrefix || 'seer_move_';

        this.frameCache = {};
        this.loopAnimCache = {};
        this.loopDelayTimer = null;
        this.moveToken = 0;
    }

    /**
     * 创建玩家显示对象（精灵 + 名称标签）
     * @param {number} x - 初始 X 坐标
     * @param {number} y - 初始 Y 坐标
     * @param {string} [playerName='赛尔'] - 玩家名称
     * @returns {Phaser.GameObjects.Container|null} 玩家容器，或 null（图集缺失）
     */
    createPlayer(x, y, playerName = '赛尔') {
        const atlasKey = this.atlasKeyResolver('front');
        if (!atlasKey || !this.scene.textures.exists(atlasKey)) {
            return null;
        }

        const container = this.scene.add.container(x, y);
        const frameSet = this.getFrameSet(atlasKey);
        const initialFrame = frameSet.endFrame || frameSet.startFrame || frameSet.loopFrames[0] || null;

        const sprite = this.scene.add.sprite(0, 20, atlasKey, initialFrame || undefined);
        sprite.setOrigin(0.5, 1);
        const scale = sprite.height > 0 ? this.targetHeight / sprite.height : 1;
        sprite.setScale(scale * this.spriteScale);

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

    /**
     * 播放行走动画
     * @param {string} direction - 目标方向（8方向字符串）
     * @param {number} distance - 移动距离（像素）
     * @param {number} moveDuration - 移动时长（ms）
     */
    playMove(direction, distance, moveDuration) {
        if (!this.playerSprite || !this.playerContainer || !this.playerContainer.scene) {
            return;
        }

        const resolved = this.resolveDirection(direction);
        const atlasKey = this.atlasKeyResolver(resolved.baseDirection);
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

    /**
     * 播放待机动画（静止姿态）
     * @param {string} [direction] - 朝向方向，省略时使用当前方向
     */
    playIdle(direction) {
        if (!this.playerSprite || !this.playerContainer || !this.playerContainer.scene) {
            return;
        }

        const resolved = this.resolveDirection(direction || this.currentDirection);
        const atlasKey = this.atlasKeyResolver(resolved.baseDirection);
        if (!atlasKey || !this.scene.textures.exists(atlasKey)) {
            return;
        }

        this.currentDirection = resolved.direction;
        this.stopLoopPlayback();

        const frameSet = this.getFrameSet(atlasKey);
        const endFrame = frameSet.endFrame || frameSet.startFrame || frameSet.loopFrames[0] || null;
        this.applyStaticPose(atlasKey, endFrame, resolved.flipX);
    }

    /**
     * 销毁动画系统，释放引用
     */
    destroy() {
        this.stopLoopPlayback();
        this.playerContainer = null;
        this.playerSprite = null;
    }

    // ── 内部方法 ──────────────────────────────────────

    /** 停止循环动画播放 */
    stopLoopPlayback() {
        if (this.loopDelayTimer && !this.loopDelayTimer.hasDispatched) {
            this.loopDelayTimer.remove(false);
        }
        this.loopDelayTimer = null;

        if (!this.playerSprite || !this.playerSprite.anims) {
            return;
        }

        const currentAnim = this.playerSprite.anims.currentAnim;
        if (currentAnim && typeof currentAnim.key === 'string' && currentAnim.key.startsWith(this.animKeyPrefix)) {
            this.playerSprite.stop();
        }
    }

    /** 应用静态姿态帧 */
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

    /**
     * 解析方向到基础方向与镜像标志
     * @param {string} direction - 8方向字符串
     * @returns {{ direction: string, baseDirection: string, flipX: boolean }}
     */
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

    /** 确保循环动画已注册 */
    ensureLoopAnimation(atlasKey, loopFrames) {
        const animKey = `${this.animKeyPrefix}${atlasKey}`;
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

    /** 获取图集帧集合（含缓存） */
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
                const aValue = this.parseNumericFrame(a);
                const bValue = this.parseNumericFrame(b);
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

    /** 获取图集帧名列表 */
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

    /** 查找指定名称帧 */
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

    /** 判断帧名是否为纯数字 */
    isNumericFrameName(frameName) {
        return /^\d+(?:\.[a-z0-9]+)?$/i.test(frameName);
    }

    /** 构建往返循环帧序列 */
    buildLoopPlaybackFrames(sortedFrames) {
        if (!Array.isArray(sortedFrames) || sortedFrames.length <= 2) {
            return Array.isArray(sortedFrames) ? sortedFrames.slice() : [];
        }

        const reverse = sortedFrames.slice(1, -1).reverse();
        return sortedFrames.concat(reverse);
    }

    /** 解析帧名中的数字部分 */
    parseNumericFrame(frameName) {
        const match = frameName.match(/^(\d+)/);
        if (!match) {
            return Number.MAX_SAFE_INTEGER;
        }
        return parseInt(match[1], 10);
    }
}

window.PlayerAnimatorSystem = PlayerAnimatorSystem;
