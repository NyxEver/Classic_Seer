/**
 * KlosePlayerAnimator - 克洛斯星玩家动画门面
 * 职责：玩家精灵创建与方向动画控制
 * 
 * 核心动画逻辑委托给通用 PlayerAnimatorSystem，
 * 本类保留克洛斯星场景特有的图集 key 查询（AssetMappings.getSeerDynamicAtlasKey）。
 */

class KlosePlayerAnimator {
    constructor(scene) {
        this.scene = scene;

        // 克洛斯星特有：通过 AssetMappings 获取赛尔角色动态图集 key
        const atlasKeyResolver = (baseDirection) => {
            if (typeof AssetMappings === 'undefined') {
                return null;
            }
            if (typeof AssetMappings.getSeerDynamicAtlasKey !== 'function') {
                return null;
            }
            return AssetMappings.getSeerDynamicAtlasKey(baseDirection);
        };

        // 创建通用动画系统实例，注入克洛斯星配置
        this._system = new PlayerAnimatorSystem(scene, {
            atlasKeyResolver,
            targetHeight: 86,
            spriteScale: 0.68,
            loopDistanceThreshold: 70,
            animKeyPrefix: 'seer_move_'
        });
    }

    /**
     * 创建玩家精灵（委托 PlayerAnimatorSystem）
     * @param {number} x - 初始 X
     * @param {number} y - 初始 Y
     * @param {string} [playerName='赛尔'] - 玩家名称
     * @returns {Phaser.GameObjects.Container|null}
     */
    createPlayer(x, y, playerName = '赛尔') {
        const container = this._system.createPlayer(x, y, playerName);
        return container;
    }

    /**
     * 播放行走动画（委托 PlayerAnimatorSystem）
     * @param {string} direction - 方向
     * @param {number} distance - 移动距离
     * @param {number} moveDuration - 移动时长
     */
    playMove(direction, distance, moveDuration) {
        this._system.playMove(direction, distance, moveDuration);
    }

    /**
     * 播放待机动画（委托 PlayerAnimatorSystem）
     * @param {string} [direction] - 方向
     */
    playIdle(direction) {
        this._system.playIdle(direction);
    }

    /**
     * 获取玩家容器
     * @returns {Phaser.GameObjects.Container|null}
     */
    getPlayerContainer() {
        return this._system.playerContainer;
    }

    /**
     * 获取玩家精灵
     * @returns {Phaser.GameObjects.Sprite|null}
     */
    getPlayerSprite() {
        return this._system.playerSprite;
    }

    /**
     * 获取当前方向
     * @returns {string}
     */
    getCurrentDirection() {
        return this._system.currentDirection;
    }

    /**
     * 销毁并释放引用（委托 PlayerAnimatorSystem）
     */
    destroy() {
        if (this._system) {
            this._system.destroy();
        }
    }
}

window.KlosePlayerAnimator = KlosePlayerAnimator;
