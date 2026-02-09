/**
 * SkillsData - 技能数据
 * 直接定义数据避免 CORS 问题
 * 
 * 技能 ID 分配规则：
 * - 1-99: 旧版皮皮技能 (保留兼容)
 * - 101-199: 皮皮技能
 * - 201-299: 水系进化链技能
 * - 301-399: 草系进化链技能
 * - 401-499: 火系进化链技能
 */

const SkillsData = {
    skills: [
        // ============================================
        // 通用技能
        // ============================================
        {
            id: 2,
            name: "鸣叫",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 40,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "atk",
                stages: -1,
                chance: 100
            },
            description: "发出刺耳的鸣叫声，降低对手的攻击力。"
        },

        // ============================================
        // 皮皮技能 (101-199)
        // ============================================
        {
            id: 101,
            name: "撞击",
            type: "normal",
            category: "physical",
            power: 35,
            accuracy: 95,
            pp: 35,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "用身体撞向对手进行攻击。"
        },
        {
            id: 102,
            name: "电光火石",
            type: "normal",
            category: "physical",
            power: 40,
            accuracy: 100,
            pp: 30,
            priority: 1,
            critRate: 16,
            effect: null,
            description: "以极快的速度冲向对手，必定先制攻击。"
        },
        {
            id: 103,
            name: "飞翼拍击",
            type: "flying",
            category: "physical",
            power: 60,
            accuracy: 100,
            pp: 35,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "用展开的翅膀拍击对手进行攻击。"
        },
        {
            id: 104,
            name: "诱惑",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "accuracy",
                stages: -1,
                chance: 100
            },
            description: "用迷人的眼神迷惑对手，降低对手的命中率。"
        },

        // ============================================
        // 水系进化链技能 (201-299)
        // 伊优 → 尤里安 → 巴鲁斯
        // ============================================
        {
            id: 201,
            name: "拍打",
            type: "normal",
            category: "physical",
            power: 40,
            accuracy: 100,
            pp: 35,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "用尾巴或手拍打对手进行攻击。"
        },
        {
            id: 202,
            name: "鸣叫",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 40,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "atk",
                stages: -1,
                chance: 100
            },
            description: "发出刺耳的鸣叫声，降低对手的攻击力。"
        },
        {
            id: 203,
            name: "泡沫",
            type: "water",
            category: "special",
            power: 20,
            accuracy: 100,
            pp: 30,
            priority: 0,
            critRate: 16,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "accuracy",
                stages: -1,
                chance: 15
            },
            description: "向对手喷射大量泡沫进行攻击，有时会降低对手的命中率。"
        },
        {
            id: 204,
            name: "玩水",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: null,
            pp: 15,
            priority: 0,
            critRate: null,
            effect: {
                type: "fieldEffect",
                effectName: "waterSport",
                duration: 5,
                description: "5回合内本方受到的火系伤害减半"
            },
            description: "在战场上洒水，5回合内本方受到的火系伤害减半。"
        },
        {
            id: 205,
            name: "飞击",
            type: "flying",
            category: "physical",
            power: 35,
            accuracy: 96,
            pp: 35,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "张开翅膀冲向对手进行攻击。"
        },
        {
            id: 206,
            name: "钢之爪",
            type: "mechanical",
            category: "physical",
            power: 50,
            accuracy: 95,
            pp: 35,
            priority: 0,
            critRate: 16,
            effect: {
                type: "statChange",
                target: "self",
                stat: "atk",
                stages: 1,
                chance: 20
            },
            description: "用钢铁般的爪子攻击对手，有时会提升自身攻击。"
        },
        {
            id: 207,
            name: "克制",
            type: "normal",
            category: "physical",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: -6,
            critRate: 16,
            effect: {
                type: "counter",
                multiplier: 2,
                description: "将所受伤害的2倍反馈给对手"
            },
            description: "等待对手攻击后，将所受伤害的2倍反馈给对手。"
        },
        {
            id: 208,
            name: "泡沫光线",
            type: "water",
            category: "special",
            power: 65,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "accuracy",
                stages: -1,
                chance: 15
            },
            description: "发射强力的泡沫光线攻击对手，有时会降低对手的命中率。"
        },
        {
            id: 209,
            name: "乱突",
            type: "normal",
            category: "physical",
            power: 15,
            accuracy: 85,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "multiHit",
                minHits: 2,
                maxHits: 5,
                description: "1回合攻击2~5次"
            },
            description: "用尖锐的部分连续突刺对手2~5次。"
        },
        {
            id: 210,
            name: "潮汐",
            type: "water",
            category: "special",
            power: 65,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: {
                type: "conditional",
                condition: "targetHpBelow50",
                bonusPower: 65,
                description: "对手体力低于1/2时威力加倍"
            },
            description: "掀起潮汐攻击对手，对手体力低于一半时威力加倍。"
        },
        {
            id: 211,
            name: "剑舞",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 15,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "self",
                stat: "atk",
                stages: 2,
                chance: 100
            },
            description: "激烈地跳起战舞提升斗志，大幅提升自身的攻击。"
        },
        {
            id: 212,
            name: "虚张声势",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 15,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "self",
                stat: "def",
                stages: 2,
                chance: 100
            },
            description: "摆出威吓的姿态，大幅提升自身的防御。"
        },
        {
            id: 213,
            name: "水流喷射",
            type: "water",
            category: "special",
            power: 40,
            accuracy: 100,
            pp: 20,
            priority: 1,
            critRate: 16,
            effect: null,
            description: "以极快的速度喷射水流攻击对手，必定先制攻击。"
        },
        {
            id: 214,
            name: "漩涡",
            type: "water",
            category: "special",
            power: 15,
            accuracy: 70,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "status",
                status: "frostbite",
                chance: 100,
                description: "100%令对手冻伤"
            },
            description: "将对手卷入漩涡中攻击，必定令对手冻伤。"
        },
        {
            id: 215,
            name: "白雾",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 30,
            priority: 0,
            critRate: null,
            effect: {
                type: "fieldEffect",
                effectName: "mist",
                duration: 5,
                description: "5回合内免疫能力下降状态"
            },
            description: "生成白雾覆盖自身，5回合内免疫能力下降效果。"
        },
        {
            id: 216,
            name: "猛攻",
            type: "normal",
            category: "physical",
            power: 80,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "用全身的力量猛烈撞击对手。"
        },
        {
            id: 217,
            name: "高压水枪",
            type: "water",
            category: "special",
            power: 120,
            accuracy: 85,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "喷射出超高压的水流攻击对手。"
        },

        // ============================================
        // 草系进化链技能 (301-399)
        // 布布种子 → 布布草 → 布布花
        // ============================================
        {
            id: 301,
            name: "撞击",
            type: "normal",
            category: "physical",
            power: 35,
            accuracy: 95,
            pp: 35,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "用身体撞向对手进行攻击。"
        },
        {
            id: 302,
            name: "缩头",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 40,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "self",
                stat: "def",
                stages: 1,
                chance: 100
            },
            description: "把头缩进壳里提升防御力。"
        },
        {
            id: 303,
            name: "吸取",
            type: "grass",
            category: "special",
            power: 20,
            accuracy: 100,
            pp: 25,
            priority: 0,
            critRate: 16,
            effect: {
                type: "drain",
                drainRatio: 0.5,
                description: "回复造成伤害的1/2"
            },
            description: "吸取对手的养分进行攻击，回复造成伤害的一半。"
        },
        {
            id: 304,
            name: "疾风刃",
            type: "grass",
            category: "physical",
            power: 55,
            accuracy: 95,
            pp: 25,
            priority: 0,
            critRate: 4,  // 4/16 = 25% 高暴击率
            effect: null,
            description: "发射锋利的叶片攻击对手，容易击中要害。"
        },
        {
            id: 305,
            name: "诅咒",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: null,
            effect: {
                type: "multiStatChange",
                target: "self",
                changes: [
                    { stat: "atk", stages: 1 },
                    { stat: "def", stages: 1 },
                    { stat: "spd", stages: -1 }
                ],
                chance: 100
            },
            description: "自身攻击和防御各提升1级，速度降低1级。"
        },
        {
            id: 306,
            name: "齿突",
            type: "normal",
            category: "physical",
            power: 60,
            accuracy: 100,
            pp: 25,
            priority: 0,
            critRate: 16,
            effect: {
                type: "status",
                status: "fear",
                chance: 5,
                description: "5%令对手害怕"
            },
            description: "用锋利的牙齿咬住对手，有时会令对手害怕。"
        },
        {
            id: 307,
            name: "强力吸取",
            type: "grass",
            category: "special",
            power: 40,
            accuracy: 100,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "drain",
                drainRatio: 0.5,
                description: "回复造成伤害的1/2"
            },
            description: "大量吸取对手的养分进行攻击，回复造成伤害的一半。"
        },
        {
            id: 308,
            name: "舍身撞击",
            type: "normal",
            category: "physical",
            power: 120,
            accuracy: 100,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "recoil",
                recoilRatio: 0.25,
                description: "自身承受1/4反伤"
            },
            description: "用全身力量猛烈撞击对手，自身也会受到伤害。"
        },
        {
            id: 309,
            name: "地震",
            type: "ground",
            category: "physical",
            power: 100,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "引发强烈的地震攻击对手。"
        },
        {
            id: 310,
            name: "寄生种子",
            type: "grass",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: null,
            effect: {
                type: "status",
                status: "parasitism",
                duration: 5,
                immuneType: "grass",
                description: "5回合吸取对方最大体力1/8（草系无效）"
            },
            description: "在对手身上种下种子，每回合吸取对手体力。草系精灵免疫。"
        },
        {
            id: 311,
            name: "光合作用",
            type: "grass",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: null,
            effect: {
                type: "heal",
                healRatio: 0.5,
                teamHealRatio: 0.33,
                description: "回复自身最大体力1/2（团队回复为1/3）"
            },
            description: "吸收阳光进行光合作用，回复自身体力。"
        },
        {
            id: 312,
            name: "咬碎",
            type: "normal",
            category: "physical",
            power: 100,
            accuracy: 100,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "def",
                stages: -2,
                chance: 15
            },
            description: "用强力的下颚咬碎对手，有时会大幅降低对手防御。"
        },
        {
            id: 313,
            name: "超级吸取",
            type: "grass",
            category: "special",
            power: 60,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: {
                type: "drain",
                drainRatio: 0.5,
                description: "回复造成伤害的1/2"
            },
            description: "超强地吸取对手的养分进行攻击，回复造成伤害的一半。"
        },
        {
            id: 314,
            name: "飞叶风暴",
            type: "grass",
            category: "special",
            power: 140,
            accuracy: 90,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: {
                type: "statChange",
                target: "self",
                stat: "spAtk",
                stages: -1,
                chance: 100
            },
            description: "发起叶刃风暴攻击对手，使用后自身特攻下降。"
        },

        // ============================================
        // 火系进化链技能 (401-499)
        // 小火猴 → 烈火猴 → 烈焰猩猩
        // ============================================
        {
            id: 401,
            name: "抓",
            type: "normal",
            category: "physical",
            power: 40,
            accuracy: 100,
            pp: 35,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "用锋利的爪子抓向对手。"
        },
        {
            id: 402,
            name: "瞪眼",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 30,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "def",
                stages: -1,
                chance: 100
            },
            description: "用锐利的眼神瞪视对手，降低对手的防御。"
        },
        {
            id: 403,
            name: "火花",
            type: "fire",
            category: "special",
            power: 40,
            accuracy: 100,
            pp: 25,
            priority: 0,
            critRate: 16,
            effect: {
                type: "status",
                status: "burn",
                chance: 10,
                description: "10%令对手烧伤"
            },
            description: "向对手发射火花攻击，有时会令对手烧伤。"
        },
        {
            id: 404,
            name: "挑拨",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "accuracy",
                stages: -1,
                chance: 100
            },
            description: "挑拨对手使其分心，降低对手的命中率。"
        },
        {
            id: 405,
            name: "音速拳",
            type: "normal",
            category: "physical",
            power: 45,
            accuracy: 100,
            pp: 30,
            priority: 1,
            critRate: 16,
            effect: null,
            description: "以极快的速度挥出拳头攻击，必定先制攻击。"
        },
        {
            id: 406,
            name: "疯狂乱抓",
            type: "normal",
            category: "physical",
            power: 25,
            accuracy: 85,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "multiHit",
                minHits: 2,
                maxHits: 5,
                description: "1回合攻击2~5次"
            },
            description: "用锋利的爪子疯狂乱抓对手2~5次。"
        },
        {
            id: 407,
            name: "火焰车",
            type: "fire",
            category: "physical",
            power: 95,
            accuracy: 100,
            pp: 25,
            priority: 0,
            critRate: 16,
            effect: {
                type: "status",
                status: "burn",
                chance: 10,
                description: "10%令对手烧伤"
            },
            description: "用火焰包裹身体冲向对手，有时会令对手烧伤。"
        },
        {
            id: 408,
            name: "佯攻",
            type: "normal",
            category: "physical",
            power: 60,
            accuracy: 100,
            pp: 10,
            priority: 2,
            critRate: 16,
            effect: null,
            description: "出其不意地进行先制攻击。"
        },
        {
            id: 409,
            name: "折磨",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 25,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "enemy",
                stat: "def",
                stages: -1,
                chance: 100
            },
            description: "用言语刺激对手，降低对手的防御。"
        },
        {
            id: 410,
            name: "惩罚",
            type: "normal",
            category: "physical",
            power: 60,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: {
                type: "conditional",
                condition: "targetBuffed",
                bonusPowerPerStage: 20,
                description: "对手能力等级越高威力越大"
            },
            description: "惩罚强化过的对手，对手能力等级越高威力越大。"
        },
        {
            id: 411,
            name: "全力一击",
            type: "normal",
            category: "physical",
            power: 120,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "使出全身的力量进行一击。"
        },
        {
            id: 412,
            name: "火焰漩涡",
            type: "fire",
            category: "special",
            power: 15,
            accuracy: 70,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "status",
                status: "burn",
                chance: 100,
                description: "100%令对手烧伤"
            },
            description: "将对手卷入火焰漩涡中攻击，必定令对手烧伤。"
        },
        {
            id: 413,
            name: "冥想",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: null,
            effect: {
                type: "multiStatChange",
                target: "self",
                changes: [
                    { stat: "atk", stages: 1 },
                    { stat: "spAtk", stages: 1 }
                ],
                chance: 100
            },
            description: "静心冥想，提升自身的攻击和特攻。"
        },
        {
            id: 414,
            name: "烈焰冲撞",
            type: "fire",
            category: "special",
            power: 125,
            accuracy: 100,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "recoil",
                recoilRatio: 0.25,
                description: "自身承受1/4反伤"
            },
            description: "用烈焰包裹身体猛烈冲撞对手，自身也会受到伤害。"
        }
    ]
};

window.SkillsData = SkillsData;
