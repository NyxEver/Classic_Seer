/**
 * KloseMoveController - 克洛斯星移动控制器
 * 职责：玩家点击移动、野怪游走与边界约束
 */

class KloseMoveController {
    constructor(scene) {
        this.scene = scene;
        this.playerMoveTween = null;
        this.playerMoveTarget = null;
        this.playerMoveDirection = null;

        // 玩家移动速度参数（可按体验微调）
        // 目标风格：恒速慢速版（无起步停顿、无加减速）
        this.playerMoveMsPerPixel = 5.5;
        this.playerMoveMinDuration = 360;
        this.playerMoveMaxDuration = 5200;
        this.playerMoveStartDelay = 0;
        this.playerMoveEase = 'Linear';
    }

    createMoveArea(width, height) {
        const moveZone = this.scene.add.zone(width / 2, height / 2, width, height);
        moveZone.setDepth(0);
        moveZone.setInteractive();

        moveZone.on('pointerup', (pointer) => {
            this.movePlayerTo(pointer.x, pointer.y);
        });
    }

    movePlayerTo(targetX, targetY) {
        if (!this.scene.player || !this.scene.player.scene) {
            return;
        }

        const { width, height } = this.scene.cameras.main;
        const clampedX = Phaser.Math.Clamp(targetX, 50, width - 50);
        const clampedY = Phaser.Math.Clamp(targetY, 100, height - 80);

        const dx = clampedX - this.scene.player.x;
        const dy = clampedY - this.scene.player.y;
        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x,
            this.scene.player.y,
            clampedX,
            clampedY
        );

        if (distance < 2) {
            if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playIdle === 'function') {
                this.scene.playerAnimator.playIdle(this.scene.playerDirection || 'front');
            }
            return;
        }

        const duration = Phaser.Math.Clamp(
            Math.floor(distance * this.playerMoveMsPerPixel),
            this.playerMoveMinDuration,
            this.playerMoveMaxDuration
        );
        const playerDirection = this.getPlayerDirectionFromVector(dx, dy);

        if (this.isDuplicateMoveRequest(clampedX, clampedY, playerDirection)) {
            return;
        }

        this.scene.playerDirection = playerDirection;

        if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playMove === 'function') {
            this.scene.playerAnimator.playMove(playerDirection, distance, duration);
        }

        if (this.playerMoveTween) {
            this.playerMoveTween.stop();
            this.playerMoveTween = null;
        }

        this.playerMoveTarget = { x: clampedX, y: clampedY };
        this.playerMoveDirection = playerDirection;

        this.playerMoveTween = this.scene.tweens.add({
            targets: this.scene.player,
            x: clampedX,
            y: clampedY,
            delay: this.playerMoveStartDelay,
            duration,
            ease: this.playerMoveEase,
            onComplete: () => {
                this.playerMoveTween = null;
                this.playerMoveTarget = null;
                this.playerMoveDirection = null;
                if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playIdle === 'function') {
                    this.scene.playerAnimator.playIdle(playerDirection);
                }
            }
        });

        this.scene.playerX = clampedX;
        this.scene.playerY = clampedY;
    }

    isDuplicateMoveRequest(targetX, targetY, direction) {
        if (!this.isPlayerMoveActive()) {
            return false;
        }
        if (!this.playerMoveTarget || !this.playerMoveDirection) {
            return false;
        }

        const targetTolerance = 10;
        const sameTarget = Phaser.Math.Distance.Between(
            targetX,
            targetY,
            this.playerMoveTarget.x,
            this.playerMoveTarget.y
        ) <= targetTolerance;

        return sameTarget && direction === this.playerMoveDirection;
    }

    isPlayerMoveActive() {
        if (!this.playerMoveTween) {
            return false;
        }

        if (typeof this.playerMoveTween.isPlaying === 'function') {
            return this.playerMoveTween.isPlaying();
        }

        return !!this.playerMoveTween.isPlaying;
    }

    getPlayerDirectionFromVector(dx, dy) {
        const epsilon = 0.001;
        if (Math.abs(dx) < epsilon && Math.abs(dy) < epsilon) {
            return this.scene.playerDirection || 'front';
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
    }

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

    getWildWorldBounds() {
        const { width, height } = this.scene.cameras.main;
        return {
            minX: 50,
            maxX: width - 50,
            minY: 120,
            maxY: height - 70
        };
    }

    isPointInsideWildBounds(x, y) {
        const bounds = this.getWildWorldBounds();
        return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
    }

    getDirectionFromVector(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx >= 0 ? 'right' : 'left';
        }
        return dy >= 0 ? 'front' : 'back';
    }

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

    getWildMoveProfile(elfId) {
        if (elfId === 47) {
            return this.getMoguguaiMoveProfile();
        }
        return null;
    }

    addWildElfMovement(container, originX, originY, options = {}) {
        const spawnArea = options.spawnArea || null;
        const moveRadius = options.moveRadius || null;
        const moveProfile = options.moveProfile || this.getWildMoveProfile(container._wildElfId || 0);
        const isPointInsideArea = typeof options.isPointInsideArea === 'function'
            ? options.isPointInsideArea
            : () => true;
        const getFallbackPoint = typeof options.getFallbackPoint === 'function'
            ? options.getFallbackPoint
            : () => null;
        const onDirectionChange = typeof options.onDirectionChange === 'function'
            ? options.onDirectionChange
            : null;

        const radiusX = moveRadius && Number.isFinite(Number(moveRadius.x))
            ? Math.max(0, Math.floor(Number(moveRadius.x)))
            : 40;
        const radiusY = moveRadius && Number.isFinite(Number(moveRadius.y))
            ? Math.max(0, Math.floor(Number(moveRadius.y)))
            : 30;

        const moveElf = () => {
            if (!container || !container.scene) return;

            let target = null;
            for (let i = 0; i < 24; i++) {
                const candidateX = originX + Phaser.Math.Between(-radiusX, radiusX);
                const candidateY = originY + Phaser.Math.Between(-radiusY, radiusY);
                const insideArea = !spawnArea || isPointInsideArea(candidateX, candidateY, spawnArea);
                if (insideArea && this.isPointInsideWildBounds(candidateX, candidateY)) {
                    target = { x: candidateX, y: candidateY };
                    break;
                }
            }

            if (!target && spawnArea) {
                target = getFallbackPoint(spawnArea, 48);
            }

            if (!target) {
                const bounds = this.getWildWorldBounds();
                target = {
                    x: Phaser.Math.Clamp(originX, bounds.minX, bounds.maxX),
                    y: Phaser.Math.Clamp(originY, bounds.minY, bounds.maxY)
                };
            }

            const moveDirection = this.getDirectionFromVector(target.x - container.x, target.y - container.y);
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

            this.scene.tweens.add({
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
                    this.scene.time.delayedCall(Phaser.Math.Between(idleDelayMin, idleDelayMax), moveElf);
                }
            });
        };

        const startDelayMin = moveProfile ? moveProfile.startDelayMin : 500;
        const startDelayMax = moveProfile ? moveProfile.startDelayMax : 2000;
        this.scene.time.delayedCall(Phaser.Math.Between(startDelayMin, startDelayMax), moveElf);
    }
}

window.KloseMoveController = KloseMoveController;
