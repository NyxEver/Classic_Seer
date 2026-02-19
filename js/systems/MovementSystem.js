/**
 * MovementSystem - 通用移动系统
 * 
 * 提供场景无关的移动逻辑，包括：
 * - 玩家点击移动（带边界限制与速度参数化）
 * - 八方向判定
 * - 野精灵随机游走
 * 
 * 不依赖任何场景特有配置，所有依赖通过参数传入。
 * 供各场景的移动控制器委托调用。
 */
const MovementSystem = {

    /**
     * 将玩家移动到目标位置（带边界限制）
     * @param {Phaser.Scene} scene - Phaser 场景实例（用于 tweens）
     * @param {Phaser.GameObjects.Container} player - 玩家显示对象
     * @param {number} targetX - 目标 X 坐标
     * @param {number} targetY - 目标 Y 坐标
     * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds - 移动边界
     * @param {Object} [options={}] - 可选配置
     * @param {number} [options.msPerPixel=9] - 每像素毫秒数（控制移动速度）
     * @param {number} [options.minDuration=360] - 最短移动时长（ms）
     * @param {number} [options.maxDuration=5200] - 最长移动时长（ms）
     * @param {number} [options.startDelay=0] - 移动起始延迟（ms）
     * @param {string} [options.ease='Linear'] - 缓动函数
     * @param {Function} [options.onDirectionChange] - 方向变更回调 (direction, distance, duration)
     * @param {Function} [options.onMoveComplete] - 移动完成回调 (direction)
     * @param {Object} [options._tweenState] - 外部提供的 tween 状态对象 { tween, target, direction }，用于去重与取消
     * @returns {{ tween: Phaser.Tweens.Tween, direction: string }|null} 移动信息，或 null（未移动）
     */
    movePlayerTo(scene, player, targetX, targetY, bounds, options = {}) {
        if (!player || !player.scene) {
            return null;
        }

        const clampedX = Phaser.Math.Clamp(targetX, bounds.minX, bounds.maxX);
        const clampedY = Phaser.Math.Clamp(targetY, bounds.minY, bounds.maxY);

        const dx = clampedX - player.x;
        const dy = clampedY - player.y;
        const distance = Phaser.Math.Distance.Between(player.x, player.y, clampedX, clampedY);

        if (distance < 2) {
            return null;
        }

        const msPerPixel = options.msPerPixel || 9;
        const minDuration = options.minDuration || 360;
        const maxDuration = options.maxDuration || 5200;
        const startDelay = options.startDelay || 0;
        const ease = options.ease || 'Linear';

        const duration = Phaser.Math.Clamp(
            Math.floor(distance * msPerPixel),
            minDuration,
            maxDuration
        );

        const direction = this.getDirectionFromVector(dx, dy);

        // 通知方向变更
        if (typeof options.onDirectionChange === 'function') {
            options.onDirectionChange(direction, distance, duration);
        }

        // 取消前一个 tween（如果外部提供了状态对象）
        const tweenState = options._tweenState;
        if (tweenState && tweenState.tween) {
            tweenState.tween.stop();
            tweenState.tween = null;
        }

        const tween = scene.tweens.add({
            targets: player,
            x: clampedX,
            y: clampedY,
            delay: startDelay,
            duration,
            ease,
            onComplete: () => {
                if (tweenState) {
                    tweenState.tween = null;
                    tweenState.target = null;
                    tweenState.direction = null;
                }
                if (typeof options.onMoveComplete === 'function') {
                    options.onMoveComplete(direction);
                }
            }
        });

        if (tweenState) {
            tweenState.tween = tween;
            tweenState.target = { x: clampedX, y: clampedY };
            tweenState.direction = direction;
        }

        return { tween, direction };
    },

    /**
     * 根据移动向量计算八方向
     * @param {number} dx - X 方向分量
     * @param {number} dy - Y 方向分量
     * @param {string} [fallback='front'] - 零向量时的默认方向
     * @returns {string} 方向字符串：'front'|'back'|'left'|'right'|'left_down'|'right_down'|'left_up'|'right_up'
     */
    getDirectionFromVector(dx, dy, fallback) {
        const epsilon = 0.001;
        if (Math.abs(dx) < epsilon && Math.abs(dy) < epsilon) {
            return fallback || 'front';
        }

        const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
        switch (octant) {
            case 0:
                return 'right';
            case 1:
                return 'right_down';
            case 2:
                return 'front';
            case 3:
                return 'left_down';
            case 4:
            case -4:
                return 'left';
            case -3:
                return 'left_up';
            case -2:
                return 'back';
            case -1:
                return 'right_up';
            default:
                return 'front';
        }
    },

    /**
     * 为野精灵容器添加随机游走行为
     * @param {Phaser.Scene} scene - Phaser 场景实例
     * @param {Phaser.GameObjects.Container} container - 精灵容器
     * @param {number} originX - 初始 X（游走中心）
     * @param {number} originY - 初始 Y（游走中心）
     * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds - 世界边界
     * @param {Object} [options={}] - 可选配置
     * @param {Object} [options.spawnArea] - 生成区域对象（用于区域内判定）
     * @param {{ x: number, y: number }} [options.moveRadius] - 游走半径
     * @param {Object} [options.moveProfile] - 移动参数覆盖（msPerPixel/minDuration/maxDuration/startDelay/idleDelay）
     * @param {Function} [options.isPointInsideArea] - 判定点是否在区域内 (x, y, area) => boolean
     * @param {Function} [options.getFallbackPoint] - 区域内回退采样 (area, attempts) => {x,y}|null
     * @param {Function} [options.onDirectionChange] - 方向变更回调 (container, direction)
     */
    addWildElfMovement(scene, container, originX, originY, bounds, options = {}) {
        const spawnArea = options.spawnArea || null;
        const moveProfile = options.moveProfile || null;
        const isPointInsideArea = typeof options.isPointInsideArea === 'function'
            ? options.isPointInsideArea
            : () => true;
        const getFallbackPoint = typeof options.getFallbackPoint === 'function'
            ? options.getFallbackPoint
            : () => null;
        const onDirectionChange = typeof options.onDirectionChange === 'function'
            ? options.onDirectionChange
            : null;

        const radiusX = options.moveRadius && Number.isFinite(Number(options.moveRadius.x))
            ? Math.max(0, Math.floor(Number(options.moveRadius.x)))
            : 40;
        const radiusY = options.moveRadius && Number.isFinite(Number(options.moveRadius.y))
            ? Math.max(0, Math.floor(Number(options.moveRadius.y)))
            : 30;

        const isPointInsideBounds = (x, y) => {
            return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
        };

        const moveElf = () => {
            if (!container || !container.scene) return;

            let target = null;
            for (let i = 0; i < 24; i++) {
                const candidateX = originX + Phaser.Math.Between(-radiusX, radiusX);
                const candidateY = originY + Phaser.Math.Between(-radiusY, radiusY);
                const insideArea = !spawnArea || isPointInsideArea(candidateX, candidateY, spawnArea);
                if (insideArea && isPointInsideBounds(candidateX, candidateY)) {
                    target = { x: candidateX, y: candidateY };
                    break;
                }
            }

            if (!target && spawnArea) {
                target = getFallbackPoint(spawnArea, 48);
            }

            if (!target) {
                target = {
                    x: Phaser.Math.Clamp(originX, bounds.minX, bounds.maxX),
                    y: Phaser.Math.Clamp(originY, bounds.minY, bounds.maxY)
                };
            }

            // 简化四方向用于野精灵
            const dx = target.x - container.x;
            const dy = target.y - container.y;
            const moveDirection = Math.abs(dx) > Math.abs(dy)
                ? (dx >= 0 ? 'right' : 'left')
                : (dy >= 0 ? 'front' : 'back');

            if (onDirectionChange) {
                onDirectionChange(container, moveDirection);
            }

            let duration = Phaser.Math.Between(2000, 4000);
            if (moveProfile && moveProfile.useDistanceDuration) {
                const distance = Phaser.Math.Distance.Between(container.x, container.y, target.x, target.y);
                duration = Phaser.Math.Clamp(
                    Math.floor(distance * moveProfile.msPerPixel),
                    moveProfile.minDuration,
                    moveProfile.maxDuration
                );
            }

            scene.tweens.add({
                targets: container,
                x: target.x,
                y: target.y,
                duration,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    container.setDepth(Math.max(5, Math.floor(container.y)));
                },
                onComplete: () => {
                    const idleDelayMin = moveProfile ? moveProfile.idleDelayMin : 1000;
                    const idleDelayMax = moveProfile ? moveProfile.idleDelayMax : 3000;
                    scene.time.delayedCall(Phaser.Math.Between(idleDelayMin, idleDelayMax), moveElf);
                }
            });
        };

        const startDelayMin = moveProfile ? moveProfile.startDelayMin : 500;
        const startDelayMax = moveProfile ? moveProfile.startDelayMax : 2000;
        scene.time.delayedCall(Phaser.Math.Between(startDelayMin, startDelayMax), moveElf);
    }
};

window.MovementSystem = MovementSystem;
