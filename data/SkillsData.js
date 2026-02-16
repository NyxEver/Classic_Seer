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
 * - 501-599: 谱尼技能
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
        {
            id: 105,
            name: "手下留情",
            type: "normal",
            category: "physical",
            power: 40,
            accuracy: 100,
            pp: 40,
            priority: 0,
            critRate: 16,
            effect: {
                type: "leaveOneHp",
                minimumTargetHp: 1,
                description: "本次攻击至少保留对手1点体力"
            },
            description: "留有余力地攻击对手，不会将对手直接击倒。"
        },
        {
            id: 106,
            name: "同生共死",
            type: "normal",
            category: "physical",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: {
                type: "equalizeHp",
                requireTargetHigherHp: true,
                description: "将对手体力降至与自身相同（需对手体力高于自己）"
            },
            description: "以拼命一击逼近胜负，将对手体力压到与自身相同。"
        },
        {
            id: 107,
            name: "吹飞",
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
                stat: "spd",
                stages: -1,
                chance: 100
            },
            description: "刮起强风扰乱对手，降低对手速度。"
        },
        {
            id: 108,
            name: "燕返",
            type: "flying",
            category: "physical",
            power: 60,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "以迅捷回旋突进敌阵，稳定命中并造成伤害。"
        },
        {
            id: 109,
            name: "突进",
            type: "normal",
            category: "physical",
            power: 90,
            accuracy: 85,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "recoil",
                recoilRatio: 0.25,
                description: "自身承受1/4反伤"
            },
            description: "不顾防御地猛烈冲撞，自身也会受到反作用伤害。"
        },
        {
            id: 110,
            name: "高速移动",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "self",
                stat: "spd",
                stages: 2,
                chance: 100
            },
            description: "急速提升机动力，大幅提高自身速度。"
        },
        {
            id: 111,
            name: "猛禽",
            type: "flying",
            category: "physical",
            power: 120,
            accuracy: 85,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "recoil",
                recoilRatio: 0.25,
                description: "自身承受1/4反伤"
            },
            description: "以凶猛俯冲发动重击，对目标造成巨大伤害并承受反冲。"
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
                healRatio: 0.125,
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
        {
            id: 315,
            name: "针刺",
            type: "grass",
            category: "special",
            power: 35,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "射出尖锐针刺攻击对手。"
        },
        {
            id: 316,
            name: "催眠粉",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 50,
            pp: 15,
            priority: 0,
            critRate: null,
            effect: {
                type: "status",
                status: "sleep",
                chance: 100,
                description: "命中后令对手睡眠"
            },
            description: "散布催眠粉末，使对手陷入睡眠。"
        },
        {
            id: 317,
            name: "毒粉",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 35,
            priority: 0,
            critRate: null,
            effect: {
                type: "status",
                status: "poison",
                chance: 100,
                description: "命中后令对手中毒"
            },
            description: "喷洒有毒粉末，使对手中毒。"
        },
        {
            id: 318,
            name: "香甜气息",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "self",
                stat: "accuracy",
                stages: 1,
                chance: 100
            },
            description: "散发甜香稳定呼吸，提升自身命中率。"
        },
        {
            id: 319,
            name: "生长",
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
                stat: "spAtk",
                stages: 1,
                chance: 100
            },
            description: "激发体内能量，提升自身特攻。"
        },
        {
            id: 320,
            name: "花瓣舞",
            type: "grass",
            category: "special",
            power: 50,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "multiHit",
                minHits: 2,
                maxHits: 3,
                description: "1回合攻击2~3次"
            },
            description: "舞动连绵花瓣进行连续打击。"
        },
        {
            id: 321,
            name: "阳光烈焰",
            type: "grass",
            category: "special",
            power: 120,
            accuracy: 90,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "汇聚阳光后放出炽烈能量，造成高额伤害。"
        },
        {
            id: 322,
            name: "弹跳踢",
            type: "normal",
            category: "physical",
            power: 30,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "multiHit",
                minHits: 2,
                maxHits: 3,
                description: "1回合攻击2~3次"
            },
            description: "以连续弹跳踢击对手。"
        },
        {
            id: 323,
            name: "毒泡",
            type: "grass",
            category: "special",
            power: 45,
            accuracy: 100,
            pp: 25,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "喷射毒性气泡攻击对手。"
        },
        {
            id: 324,
            name: "毒气冲击",
            type: "grass",
            category: "physical",
            power: 60,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "status",
                status: "poison",
                chance: 10,
                description: "10%令对手中毒"
            },
            description: "裹挟毒气撞击对手，偶尔令对手中毒。"
        },
        {
            id: 325,
            name: "栖息",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: null,
            effect: {
                type: "heal",
                healRatio: 0.5,
                description: "恢复自身最大体力1/2"
            },
            description: "短暂休整身体，恢复大量体力。"
        },
        {
            id: 326,
            name: "毒雾",
            type: "grass",
            category: "special",
            power: 60,
            accuracy: 95,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "status",
                status: "poison",
                chance: 10,
                description: "10%令对手中毒"
            },
            description: "释放浓厚毒雾伤害对手，偶尔造成中毒。"
        },
        {
            id: 327,
            name: "毒气集中",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 30,
            priority: 0,
            critRate: null,
            effect: {
                type: "statChange",
                target: "self",
                stat: "spAtk",
                stages: 1,
                chance: 100
            },
            description: "聚拢体内毒能，提升自身特攻。"
        },
        {
            id: 328,
            name: "四方刀叶",
            type: "grass",
            category: "special",
            power: 80,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "从四方卷起刀叶斩击对手。"
        },
        {
            id: 329,
            name: "防护罩",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: null,
            effect: {
                type: "protect",
                duration: 1,
                description: "抵挡下一次攻击"
            },
            description: "展开防护罩，抵挡即将到来的攻击。"
        },
        {
            id: 330,
            name: "泰山压顶",
            type: "normal",
            category: "physical",
            power: 120,
            accuracy: 90,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: {
                type: "selfExhausted",
                duration: 1,
                description: "自身疲惫1回合"
            },
            description: "以山岳之势压向对手，随后自身短暂疲惫。"
        },
        {
            id: 331,
            name: "光能射线",
            type: "grass",
            category: "special",
            power: 100,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "聚焦光能发射射线，造成稳定高伤害。"
        },
        {
            id: 332,
            name: "光源波",
            type: "grass",
            category: "special",
            power: 120,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "释放高密度光波冲击对手。"
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
        },

        // ============================================
        // 谱尼技能 (501-599)
        // ============================================
        {
            id: 501,
            name: "极光",
            type: "normal",
            category: "physical",
            power: 60,
            accuracy: 100,
            pp: 40,
            priority: 0,
            critRate: 8,
            effect: null,
            description: "普通系物理攻击。"
        },
        {
            id: 502,
            name: "虚无",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 1,
            priority: 0,
            critRate: null,
            effect: {
                type: "voidShield",
                duration: 2,
                requiresFirstStrike: true,
                description: "2回合内若本方先手攻击，使对方技能失效"
            },
            description: "2回合内若本方先手攻击，使对方技能失效。"
        },
        {
            id: 503,
            name: "神圣之光",
            type: "spirit",
            category: "special",
            power: 70,
            accuracy: 100,
            pp: 40,
            priority: 0,
            critRate: 16,
            effect: null,
            description: "圣灵系特殊攻击。"
        },
        {
            id: 504,
            name: "元素",
            type: "spirit",
            category: "special",
            power: 5,
            accuracy: 95,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: {
                type: "fixedDamageBonus",
                amount: 200,
                description: "额外附加200点固定伤害"
            },
            description: "造成伤害后额外附加200点固定伤害。"
        },
        {
            id: 505,
            name: "能量",
            type: "spirit",
            category: "physical",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: -6,
            critRate: 16,
            effect: {
                type: "counter",
                multiplier: 2,
                description: "将所受伤害2倍反馈给对手"
            },
            description: "将所受伤害2倍反馈给对手。"
        },
        {
            id: 506,
            name: "灵光之怒",
            type: "spirit",
            category: "special",
            power: 80,
            accuracy: 100,
            pp: 30,
            priority: 0,
            critRate: 16,
            effect: {
                type: "conditional",
                condition: "targetBuffed",
                bonusPowerPerStage: 20,
                description: "对手能力等级越高威力越大"
            },
            description: "对手能力等级越高威力越大。"
        },
        {
            id: 507,
            name: "生命",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: null,
            effect: {
                type: "skillLifeSteadyRegen",
                duration: 5,
                amount: 100,
                description: "5回合内使用技能时恢复100点体力"
            },
            description: "5回合内使用技能时恢复100点体力。"
        },
        {
            id: 508,
            name: "断空破",
            type: "normal",
            category: "physical",
            power: 90,
            accuracy: 100,
            pp: 20,
            priority: 0,
            critRate: 16,
            effect: {
                type: "fixedDamageBonus",
                amount: 30,
                description: "额外附加30点固定伤害"
            },
            description: "普通系物理攻击，额外附加30点固定伤害。"
        },
        {
            id: 509,
            name: "轮回",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 1,
            priority: 0,
            critRate: null,
            effect: {
                type: "heal",
                healRatio: 1,
                description: "恢复自身最大体力100%"
            },
            description: "恢复自身最大体力100%。"
        },
        {
            id: 510,
            name: "灵魂干涉",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 70,
            pp: 20,
            priority: 0,
            critRate: null,
            effect: {
                type: "exhausted",
                duration: 3,
                description: "令对手疲惫3回合"
            },
            description: "令对手疲惫3回合。"
        },
        {
            id: 511,
            name: "圣堂之门",
            type: "spirit",
            category: "special",
            power: 100,
            accuracy: 100,
            pp: 15,
            priority: 0,
            critRate: 16,
            effect: {
                type: "removeTargetBuffs",
                description: "消除对手能力提升状态"
            },
            description: "圣灵系特殊攻击，并消除对手能力提升状态。"
        },
        {
            id: 512,
            name: "永恒",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: null,
            effect: {
                type: "restoreAllPP",
                description: "恢复自身所有PP"
            },
            description: "恢复自身所有技能PP。"
        },
        {
            id: 513,
            name: "圣洁",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: null,
            effect: {
                type: "selfStatusSkillImmune",
                duration: 5,
                description: "5回合内属性攻击对自身必定miss"
            },
            description: "5回合内属性攻击对自身必定miss。"
        },
        {
            id: 514,
            name: "旋灭裂空阵",
            type: "spirit",
            category: "physical",
            power: 135,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: {
                type: "dotFixedDamage",
                duration: 5,
                amount: 30,
                description: "5回合内每回合附加30点固定伤害"
            },
            description: "圣灵系物理攻击，并附加持续固定伤害。"
        },
        {
            id: 515,
            name: "千烈虚光闪",
            type: "spirit",
            category: "special",
            power: 140,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: 16,
            effect: {
                type: "clearSelfDebuffs",
                description: "解除自身能力下降状态"
            },
            description: "圣灵系特殊攻击，并解除自身能力下降状态。"
        },
        {
            id: 516,
            name: "圣光气",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 10,
            priority: 0,
            critRate: null,
            effect: {
                type: "guaranteedCrit",
                duration: 2,
                description: "下2回合自身攻击必定致命一击"
            },
            description: "下2回合自身攻击必定致命一击。"
        },
        {
            id: 517,
            name: "圣灵魔闪光",
            type: "spirit",
            category: "special",
            power: 160,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: {
                type: "reduceTargetHpByMaxRatio",
                ratio: 0.125,
                description: "降低对手1/8HP"
            },
            description: "圣灵系特殊攻击，并降低对手1/8最大HP。"
        },
        {
            id: 518,
            name: "璨灵圣光",
            type: "normal",
            category: "status",
            power: 0,
            accuracy: 100,
            pp: 5,
            priority: 0,
            critRate: null,
            effect: {
                type: "compositeBuff",
                immuneDamageDuration: 2,
                regenDuration: 5,
                regenRatio: 0.3333,
                guaranteedFirstStrikeDuration: 2,
                damageMultiplierDuration: 2,
                damageMultiplier: 2,
                description: "2回合免疫伤害；5回合每回合回复1/3HP；下2回合必定先手；下2回合伤害翻倍"
            },
            description: "复合强化技能。"
        },
        {
            id: 519,
            name: "落芳天华",
            type: "spirit",
            category: "special",
            power: 80,
            accuracy: 100,
            pp: 10,
            priority: 3,
            critRate: 16,
            effect: {
                type: "transferBuffAndGrowingFixedDamage",
                maxFixedDamage: 400,
                description: "转移对手能力提升；附加固定伤害递增，最高400点"
            },
            description: "高先制圣灵系特殊攻击。"
        },
        {
            id: 520,
            name: "圣灵悲魂曲",
            type: "spirit",
            category: "special",
            power: 150,
            accuracy: 95,
            pp: 5,
            priority: 1,
            critRate: 16,
            effect: {
                type: "statusSkillSealAndReducePP",
                duration: 3,
                chance: 50,
                ppReduceOnFirstStrike: 1,
                description: "3回合50%令对手属性技能无效；先手时对手PP-1"
            },
            description: "圣灵系高威力特殊攻击。"
        },
        {
            id: 521,
            name: "圣影流光破",
            type: "spirit",
            category: "special",
            power: 160,
            accuracy: 95,
            pp: 5,
            priority: 0,
            critRate: 16,
            effect: {
                type: "purgeRoundEffectNoHealAndBoostAndDrain",
                noHealDuration: 2,
                selfBoost: { spAtk: 1, spd: 1 },
                maxDrain: 350,
                description: "消除回合类效果；2回合无法回血；自身特攻+1速度+1；吸取固定体力最高350点"
            },
            description: "圣灵系特殊攻击并附带多重效果。"
        }
    ]
};

window.SkillsData = SkillsData;
