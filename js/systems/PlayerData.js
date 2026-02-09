/**
 * PlayerData - 玩家数据管理器
 * 负责管理玩家游戏存档数据
 */

const PlayerData = {
    // 玩家名称
    name: '',

    // 赛尔豆（货币）
    seerBeans: 0,

    // 玩家拥有的精灵数组
    elves: [],

    // 物品背包 { itemId: count }
    items: {},

    // 当前所在地图 ID
    currentMapId: 'spaceship',

    // 任务进度
    questProgress: {},

    // 上次保存时间
    lastSaveTime: null,

    // 图鉴系统：见过的精灵
    seenElves: [],

    // 图鉴系统：捕捉过的精灵
    caughtElves: [],

    /**
     * 生成随机个体值 (IV)
     * 每项属性 0-31 随机
     * @returns {Object} - IV 对象
     */
    generateRandomIV() {
        return {
            hp: Math.floor(Math.random() * 32),
            atk: Math.floor(Math.random() * 32),
            spAtk: Math.floor(Math.random() * 32),
            def: Math.floor(Math.random() * 32),
            spDef: Math.floor(Math.random() * 32),
            spd: Math.floor(Math.random() * 32)
        };
    },

    /**
     * 创建初始努力值 (EV)
     * 所有属性初始为 0
     * @returns {Object} - EV 对象
     */
    createInitialEV() {
        return {
            hp: 0,
            atk: 0,
            spAtk: 0,
            def: 0,
            spDef: 0,
            spd: 0
        };
    },

    /**
     * 创建新精灵实例
     * @param {number} elfId - 精灵 ID
     * @param {number} level - 初始等级
     * @param {string} nickname - 昵称（可选）
     * @returns {Object} - 精灵实例数据
     */
    createElfInstance(elfId, level, nickname = null) {
        const elfData = DataLoader.getElf(elfId);
        if (!elfData) {
            console.error(`[PlayerData] 无法创建精灵实例，找不到精灵 ID: ${elfId}`);
            return null;
        }

        // 根据等级确定初始技能
        const initialSkills = [];
        elfData.learnableSkills.forEach(skillInfo => {
            if (skillInfo.learnLevel <= level && initialSkills.length < 4) {
                initialSkills.push(skillInfo.skillId);
            }
        });

        // 初始化技能 PP
        const skillPP = {};
        initialSkills.forEach(skillId => {
            const skillData = DataLoader.getSkill(skillId);
            if (skillData) {
                skillPP[skillId] = skillData.pp;
            }
        });

        const iv = this.generateRandomIV();
        const ev = this.createInitialEV();

        // 计算初始 HP（用于 currentHp）
        const maxHp = this.calculateMaxHp(elfData, level, iv, ev);

        return {
            elfId: elfId,
            nickname: nickname,
            level: level,
            exp: 0,
            currentHp: maxHp,
            skills: initialSkills,
            skillPP: skillPP,
            iv: iv,
            ev: ev
        };
    },

    /**
     * 计算精灵最大 HP
     * 公式：floor((基础值 * 2 + IV + floor(EV / 4)) * 等级 / 100 + 10 + 等级)
     * @param {Object} elfData - 精灵基础数据
     * @param {number} level - 等级
     * @param {Object} iv - 个体值
     * @param {Object} ev - 努力值
     * @returns {number} - 最大 HP
     */
    calculateMaxHp(elfData, level, iv, ev) {
        const baseHp = elfData.baseStats.hp;
        const ivHp = iv.hp;
        const evHp = ev.hp;
        return Math.floor((baseHp * 2 + ivHp + Math.floor(evHp / 4)) * level / 100 + 10 + level);
    },

    /**
     * 创建新游戏玩家数据
     * @param {string} playerName - 玩家名称
     * @param {number} starterElfId - 初始精灵 ID (1=布布种子, 4=伊优, 7=小火猴)
     * @returns {Object} - 完整的玩家数据对象
     */
    createNew(playerName = '赛尔', starterElfId = 1) {
        console.log('[PlayerData] 创建新游戏存档...');

        // 重置数据
        this.name = playerName;
        this.seerBeans = 1000;
        this.elves = [];
        this.items = {};
        this.currentMapId = 'spaceship';
        this.questProgress = {};
        this.lastSaveTime = Date.now();
        this.seenElves = [];
        this.caughtElves = [];

        // 创建初始精灵（1 级）
        const starterElf = this.createElfInstance(starterElfId, 5, null);  // 改为5级方便测试进化
        if (starterElf) {
            this.elves.push(starterElf);
            // 初始精灵自动标记为已捕捉
            this.markCaught(starterElfId);
        }

        // 初始物品
        this.items = {
            1: 5,  // 初级精灵胶囊 x5
            2: 5,  // 初级体力药剂 x5
            3: 5   // 初级活力药剂 x5
        };

        console.log('[PlayerData] 新存档创建完成');
        console.log('[PlayerData] 初始精灵:', this.elves);
        console.log('[PlayerData] 初始物品:', this.items);
        console.log('[PlayerData] 初始赛尔豆:', this.seerBeans);

        return this.toSaveData();
    },

    /**
     * 从存档加载玩家数据
     * @returns {boolean} - 加载是否成功
     */
    loadFromSave() {
        const saveData = SaveSystem.load();

        if (!saveData) {
            console.log('[PlayerData] 无存档可加载');
            return false;
        }

        try {
            this.name = saveData.name || '赛尔';
            this.seerBeans = saveData.seerBeans || 0;
            this.elves = saveData.elves || [];
            this.items = saveData.items || {};
            this.currentMapId = saveData.currentMapId || 'spaceship';
            this.questProgress = saveData.questProgress || {};
            this.lastSaveTime = saveData.lastSaveTime || null;
            this.seenElves = saveData.seenElves || [];
            this.caughtElves = saveData.caughtElves || [];

            console.log('[PlayerData] 存档加载成功');
            return true;

        } catch (error) {
            console.error('[PlayerData] 加载存档失败:', error);
            return false;
        }
    },

    /**
     * 保存玩家数据到 LocalStorage
     * @returns {boolean} - 保存是否成功
     */
    saveToStorage() {
        this.lastSaveTime = Date.now();
        return SaveSystem.save(this.toSaveData());
    },

    /**
     * 转换为可保存的数据对象
     * @returns {Object} - 存档数据对象
     */
    toSaveData() {
        return {
            name: this.name,
            seerBeans: this.seerBeans,
            elves: this.elves,
            items: this.items,
            currentMapId: this.currentMapId,
            questProgress: this.questProgress,
            lastSaveTime: this.lastSaveTime,
            seenElves: this.seenElves,
            caughtElves: this.caughtElves
        };
    },

    /**
     * 标记精灵为已见过
     * @param {number} elfId - 精灵 ID
     */
    markSeen(elfId) {
        if (!this.seenElves.includes(elfId)) {
            this.seenElves.push(elfId);
            console.log(`[PlayerData] 图鉴：发现精灵 ID=${elfId}`);
        }
    },

    /**
     * 标记精灵为已捕捉
     * @param {number} elfId - 精灵 ID
     */
    markCaught(elfId) {
        // 捕捉同时也算见过
        this.markSeen(elfId);
        if (!this.caughtElves.includes(elfId)) {
            this.caughtElves.push(elfId);
            console.log(`[PlayerData] 图鉴：捕捉精灵 ID=${elfId}`);
        }
    },

    /**
     * 检查精灵是否已见过
     * @param {number} elfId - 精灵 ID
     * @returns {boolean}
     */
    hasSeen(elfId) {
        return this.seenElves.includes(elfId);
    },

    /**
     * 检查精灵是否已捕捉
     * @param {number} elfId - 精灵 ID
     * @returns {boolean}
     */
    hasCaught(elfId) {
        return this.caughtElves.includes(elfId);
    },

    /**
     * 添加精灵到背包
     * @param {number} elfId - 精灵 ID
     * @param {number} level - 等级
     * @param {string} nickname - 昵称（可选）
     * @returns {boolean} - 添加是否成功
     */
    addElf(elfId, level, nickname = null) {
        const elfInstance = this.createElfInstance(elfId, level, nickname);
        if (elfInstance) {
            this.elves.push(elfInstance);
            console.log(`[PlayerData] 添加精灵成功: ID=${elfId}, 等级=${level}`);
            return true;
        }
        return false;
    },

    /**
     * 添加物品到背包
     * @param {number} itemId - 物品 ID
     * @param {number} count - 数量
     */
    addItem(itemId, count = 1) {
        if (this.items[itemId]) {
            this.items[itemId] += count;
        } else {
            this.items[itemId] = count;
        }
        console.log(`[PlayerData] 获得物品: ID=${itemId}, 数量=${count}`);
    },

    /**
     * 使用物品
     * @param {number} itemId - 物品 ID
     * @param {number} count - 使用数量
     * @returns {boolean} - 使用是否成功
     */
    useItem(itemId, count = 1) {
        if (!this.items[itemId] || this.items[itemId] < count) {
            console.warn(`[PlayerData] 物品不足: ID=${itemId}`);
            return false;
        }

        this.items[itemId] -= count;
        if (this.items[itemId] <= 0) {
            delete this.items[itemId];
        }
        console.log(`[PlayerData] 使用物品: ID=${itemId}, 数量=${count}`);
        return true;
    },

    /**
     * 增加赛尔豆
     * @param {number} amount - 增加数量
     */
    addSeerBeans(amount) {
        this.seerBeans += amount;
        console.log(`[PlayerData] 获得赛尔豆: ${amount}, 当前: ${this.seerBeans}`);
    },

    /**
     * 消耗赛尔豆
     * @param {number} amount - 消耗数量
     * @returns {boolean} - 消耗是否成功
     */
    spendSeerBeans(amount) {
        if (this.seerBeans < amount) {
            console.warn(`[PlayerData] 赛尔豆不足: 当前=${this.seerBeans}, 需要=${amount}`);
            return false;
        }
        this.seerBeans -= amount;
        console.log(`[PlayerData] 消耗赛尔豆: ${amount}, 剩余: ${this.seerBeans}`);
        return true;
    }
};

// 导出为全局对象
window.PlayerData = PlayerData;
