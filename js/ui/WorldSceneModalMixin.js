/**
 * WorldSceneModalMixin - 世界场景弹窗方法混入工具
 *
 * 为非战斗世界场景（KloseScene、SpaceshipScene、CaptainRoomScene、TeleportScene）
 * 统一混入 openItemBagModal()、openElfManageModal()、openSpaceshipFromBottomBar() 三个方法，
 * 消除各场景中重复的弹窗打开代码。
 *
 * 用法：
 *   WorldSceneModalMixin.apply(scene, 'KloseScene', () => scene.getKloseReturnData());
 */
const WorldSceneModalMixin = {

    /**
     * 向目标场景实例混入弹窗打开方法
     * @param {Phaser.Scene} scene - 要混入方法的场景实例
     * @param {string} returnSceneKey - 弹窗关闭后返回的场景 key（如 'KloseScene'）
     * @param {Function} [returnDataFn] - 返回数据生成函数，省略时默认返回空对象 {}
     */
    apply(scene, returnSceneKey, returnDataFn) {
        const getReturnData = typeof returnDataFn === 'function' ? returnDataFn : () => ({});

        /**
         * 打开背包弹窗（ItemBagScene）
         * 包含防重复启动保护，弹窗打开后置顶
         */
        scene.openItemBagModal = function () {
            if (this.scene.isActive('ItemBagScene')) {
                return;
            }

            SceneRouter.launch(this, 'ItemBagScene', {
                returnScene: returnSceneKey,
                returnData: getReturnData()
            }, {
                bgmStrategy: 'inherit'
            });
            this.scene.bringToTop('ItemBagScene');
        };

        /**
         * 打开精灵管理弹窗（ElfManageScene）
         * 包含防重复启动保护，弹窗打开后置顶
         */
        scene.openElfManageModal = function () {
            if (this.scene.isActive('ElfManageScene')) {
                return;
            }

            SceneRouter.launch(this, 'ElfManageScene', {
                returnScene: returnSceneKey,
                returnData: getReturnData()
            }, {
                bgmStrategy: 'inherit'
            });
            this.scene.bringToTop('ElfManageScene');
        };

        /**
         * 从底栏地图按钮返回飞船场景
         */
        scene.openSpaceshipFromBottomBar = function () {
            SceneRouter.start(this, 'SpaceshipScene');
        };
    }
};

window.WorldSceneModalMixin = WorldSceneModalMixin;
