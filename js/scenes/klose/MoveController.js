/**
 * KloseMoveController - 克洛斯星移动控制器
 * 职责：玩家点击移动、野怪游走与边界约束
 * 
 * 核心移动逻辑委托给通用 MovementSystem，
 * 本类保留克洛斯星场景特有的边界计算、移动参数和动画连接。
 */

class KloseMoveController {
    constructor(scene) {
        this.scene = scene;
        this.playerMoveTween = null;
        this.playerMoveTarget = null;
        this.playerMoveDirection = null;

        // 玩家移动速度参数（可按体验微调）
        // 目标风格：恒速慢速版（无起步停顿、无加减速）
        this.playerMoveMsPerPixel = 9;
        this.playerMoveMinDuration = 360;
        this.playerMoveMaxDuration = 5200;
        this.playerMoveStartDelay = 0;
        this.playerMoveEase = 'Linear';

        // tween 状态对象，供 MovementSystem 管理去重与取消
        this._tweenState = {
            tween: null,
            target: null,
            direction: null
        };
    }

    createMoveArea(width, height) {
        const moveZone = this.scene.add.zone(width / 2, height / 2, width, height);
        moveZone.setDepth(0);
        moveZone.setInteractive();

        moveZone.on('pointerup', (pointer) => {
            this.movePlayerTo(pointer.x, pointer.y);
        });
    }

    /**
     * 将玩家移动到目标位置（委托 MovementSystem）
     * @param {number} targetX - 目标 X 坐标
     * @param {number} targetY - 目标 Y 坐标
     */
    movePlayerTo(targetX, targetY) {
        if (!this.scene.player || !this.scene.player.scene) {
            return;
        }

        const bounds = this.getPlayerMoveBounds();

        // 检查去重（距离小于 2 时 MovementSystem 会返回 null）
        if (this.isDuplicateMoveRequest(targetX, targetY)) {
            return;
        }

        const result = MovementSystem.movePlayerTo(
            this.scene,
            this.scene.player,
            targetX,
            targetY,
            bounds,
            {
                msPerPixel: this.playerMoveMsPerPixel,
                minDuration: this.playerMoveMinDuration,
                maxDuration: this.playerMoveMaxDuration,
                startDelay: this.playerMoveStartDelay,
                ease: this.playerMoveEase,
                _tweenState: this._tweenState,
                onDirectionChange: (direction, distance, duration) => {
                    this.scene.playerDirection = direction;
                    if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playMove === 'function') {
                        this.scene.playerAnimator.playMove(direction, distance, duration);
                    }
                },
                onMoveComplete: (direction) => {
                    if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playIdle === 'function') {
                        this.scene.playerAnimator.playIdle(direction);
                    }
                }
            }
        );

        if (!result) {
            // 距离过近，播放待机
            if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playIdle === 'function') {
                this.scene.playerAnimator.playIdle(this.scene.playerDirection || 'front');
            }
            return;
        }

        // 同步坐标到场景（供子场景切换时使用）
        const clampedX = Phaser.Math.Clamp(targetX, bounds.minX, bounds.maxX);
        const clampedY = Phaser.Math.Clamp(targetY, bounds.minY, bounds.maxY);
        this.scene.playerX = clampedX;
        this.scene.playerY = clampedY;
    }

    /**
     * 检查是否为重复移动请求
     */
    isDuplicateMoveRequest(targetX, targetY) {
        if (!this._tweenState.tween || !this._tweenState.target) {
            return false;
        }

        // 检查 tween 是否仍在播放
        const tween = this._tweenState.tween;
        const isPlaying = typeof tween.isPlaying === 'function' ? tween.isPlaying() : !!tween.isPlaying;
        if (!isPlaying) {
            return false;
        }

        const bounds = this.getPlayerMoveBounds();
        const clampedX = Phaser.Math.Clamp(targetX, bounds.minX, bounds.maxX);
        const clampedY = Phaser.Math.Clamp(targetY, bounds.minY, bounds.maxY);

        const targetTolerance = 10;
        const sameTarget = Phaser.Math.Distance.Between(
            clampedX,
            clampedY,
            this._tweenState.target.x,
            this._tweenState.target.y
        ) <= targetTolerance;

        if (!sameTarget) {
            return false;
        }

        // 方向也相同才视为重复
        const dx = clampedX - (this.scene.player ? this.scene.player.x : 0);
        const dy = clampedY - (this.scene.player ? this.scene.player.y : 0);
        const direction = MovementSystem.getDirectionFromVector(dx, dy, this.scene.playerDirection);
        return direction === this._tweenState.direction;
    }

    /**
     * 获取玩家移动边界（克洛斯星专用）
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
     */
    getPlayerMoveBounds() {
        const { width, height } = this.scene.cameras.main;
        return {
            minX: 50,
            maxX: width - 50,
            minY: 100,
            maxY: height - 80
        };
    }

    /**
     * 获取克洛斯星场景配置的野精灵游走半径
     */
    getSceneWildMoveRadius() {
        const cfg = this.scene.sceneConfig && this.scene.sceneConfig.wildMoveRadius
            ? this.scene.sceneConfig.wildMoveRadius
            : {};
        const radiusX = Math.floor(Number(cfg.x));
        const radiusY = Math.floor(Number(cfg.y));

        return {
            x: Number.isFinite(radiusX) && radiusX > 0 ? radiusX : 40,
            y: Number.isFinite(radiusY) && radiusY > 0 ? radiusY : 30
        };
    }

    /**
     * 获取野精灵世界边界（克洛斯星专用）
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
     */
    getWildWorldBounds() {
        const { width, height } = this.scene.cameras.main;
        return {
            minX: 50,
            maxX: width - 50,
            minY: 120,
            maxY: height - 70
        };
    }

    /**
     * 判断坐标是否在野精灵活动边界内
     */
    isPointInsideWildBounds(x, y) {
        const bounds = this.getWildWorldBounds();
        return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
    }

    /**
     * 简化四方向（用于野精灵，委托 MovementSystem 内部逻辑）
     */
    getDirectionFromVector(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx >= 0 ? 'right' : 'left';
        }
        return dy >= 0 ? 'front' : 'back';
    }

    /**
     * 蘑菇怪专属移动参数（慢速）
     */
    getMoguguaiMoveProfile() {
        return {
            useDistanceDuration: true,
            msPerPixel: 14,
            minDuration: 900,
            maxDuration: 2200,
            startDelayMin: 350,
            startDelayMax: 1100,
            idleDelayMin: 650,
            idleDelayMax: 1700
        };
    }

    /**
     * 根据精灵 ID 获取移动参数（场景特有配置）
     * @param {number} elfId - 精灵 ID
     * @returns {Object|null} 移动参数，null 表示使用默认
     */
    getWildMoveProfile(elfId) {
        if (elfId === 47) {
            return this.getMoguguaiMoveProfile();
        }
        return null;
    }

    /**
     * 为野精灵添加随机游走行为（委托 MovementSystem）
     * @param {Phaser.GameObjects.Container} container - 精灵容器
     * @param {number} originX - 游走中心 X
     * @param {number} originY - 游走中心 Y
     * @param {Object} [options={}] - 额外配置
     */
    addWildElfMovement(container, originX, originY, options = {}) {
        const bounds = this.getWildWorldBounds();
        const moveProfile = options.moveProfile || this.getWildMoveProfile(container._wildElfId || 0);

        MovementSystem.addWildElfMovement(this.scene, container, originX, originY, bounds, {
            spawnArea: options.spawnArea || null,
            moveRadius: options.moveRadius || null,
            moveProfile,
            isPointInsideArea: typeof options.isPointInsideArea === 'function'
                ? options.isPointInsideArea
                : () => true,
            getFallbackPoint: typeof options.getFallbackPoint === 'function'
                ? options.getFallbackPoint
                : () => null,
            onDirectionChange: typeof options.onDirectionChange === 'function'
                ? options.onDirectionChange
                : null
        });
    }
}

window.KloseMoveController = KloseMoveController;
