/**
 * EncounterSystem - 野生遭遇系统
 * 管理野生精灵的生成和战斗触发
 */

const EncounterSystem = {
    // 地图配置：每个地图的遭遇信息
    mapConfig: {
        'klose': {
            elves: [
                { elfId: 10, weight: 70 }, // 皮皮
                { elfId: 16, weight: 25 }, // 仙人球
                { elfId: 47, weight: 5 }   // 蘑菇怪
            ],
            levelRange: { min: 2, max: 5 }
        }
        // 未来可添加更多地图配置
    },

    /**
     * 获取指定地图的随机野生精灵
     * @param {string} mapId - 地图 ID
     * @returns {Elf|null} 野生精灵实例
     */
    getRandomWildElf(mapId) {
        const config = this.mapConfig[mapId];
        if (!config) {
            console.warn(`EncounterSystem: 未找到地图 ${mapId} 的配置`);
            return null;
        }

        // 按权重随机选择精灵
        const totalWeight = config.elves.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;

        let selectedElfId = config.elves[0].elfId;
        for (const elfConfig of config.elves) {
            random -= elfConfig.weight;
            if (random <= 0) {
                selectedElfId = elfConfig.elfId;
                break;
            }
        }

        // 随机等级
        const level = Phaser.Math.Between(config.levelRange.min, config.levelRange.max);

        return this.createWildElf(selectedElfId, level, level);
    },

    /**
     * 创建野生精灵实例
     * @param {number} elfId - 精灵 ID
     * @param {number} minLevel - 最小等级
     * @param {number} maxLevel - 最大等级
     * @returns {Elf} 野生精灵实例
     */
    createWildElf(elfId, minLevel, maxLevel) {
        const level = Phaser.Math.Between(minLevel, maxLevel);
        // 直接使用 Elf 类的静态工厂方法
        return Elf.createWild(elfId, level);
    },

    /**
     * 启动野生战斗
     * @param {Phaser.Scene} scene - 当前场景
     * @param {Elf} wildElf - 野生精灵实例
     */
    startWildBattle(scene, wildElf) {
        if (!wildElf) {
            console.error('EncounterSystem: 无效的野生精灵');
            return;
        }

        // 获取玩家当前出战精灵
        const playerElf = ElfBag.getFirstAvailable();

        if (!playerElf) {
            console.error('EncounterSystem: 玩家没有可战斗的精灵');
            return;
        }

        console.log(`野生战斗开始：${playerElf.name} Lv.${playerElf.level} VS 野生 ${wildElf.name} Lv.${wildElf.level}`);

        // 标记精灵为已见过（图鉴系统）
        PlayerData.markSeen(wildElf.id);

        // 来源场景背景（用于战斗背景滤镜化）
        let sourceBackgroundKey = null;
        if (typeof scene.getBattleBackgroundKey === 'function') {
            sourceBackgroundKey = scene.getBattleBackgroundKey();
        } else if (scene.sceneConfig && scene.sceneConfig.background) {
            sourceBackgroundKey = scene.sceneConfig.background;
        }

        // 切换到战斗场景，传递数据
        scene.scene.start('BattleScene', {
            playerElf: playerElf,
            enemyElf: wildElf,
            battleType: 'wild',
            canEscape: true,
            canCatch: true,
            returnScene: scene.scene.key, // 战斗结束后返回的场景
            battleBackgroundKey: sourceBackgroundKey
        });
    }
};

// 挂载到全局
window.EncounterSystem = EncounterSystem;
