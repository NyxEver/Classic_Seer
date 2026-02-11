/**
 * ElvesData - 精灵基础数据
 * 直接定义数据避免 CORS 问题
 * 
 * 进化链设计：
 * - evolutionChainId: 同一进化链的精灵共享此 ID
 * - evolveTo: 进化后精灵 ID（无进化则为 null）
 * - evolveLevel: 进化所需等级（无进化则为 null）
 * - 同一进化链的所有形态共用同一张技能学习表（learnableSkills）
 */

const ElvesData = {
    elves: [
        // ============================================
        // 水系进化链 (evolutionChainId: 1)
        // 伊优 → 尤里安 → 巴鲁斯
        // ============================================
        {
            id: 4,
            name: "伊优",
            type: "water",
            evolutionChainId: 1,
            evolveTo: 5,
            evolveLevel: 16,
            baseStats: {
                hp: 53,
                atk: 51,
                spAtk: 61,
                def: 53,
                spDef: 56,
                spd: 40
            },
            // 水系进化链共用技能表
            learnableSkills: [
                { skillId: 201, learnLevel: 1 },   // 拍打
                { skillId: 202, learnLevel: 4 },   // 鸣叫
                { skillId: 203, learnLevel: 8 },   // 泡沫
                { skillId: 204, learnLevel: 11 },  // 玩水
                { skillId: 205, learnLevel: 15 },  // 飞击
                { skillId: 206, learnLevel: 16 },  // 钢之爪
                { skillId: 207, learnLevel: 19 },  // 克制
                { skillId: 208, learnLevel: 24 },  // 泡沫光线
                { skillId: 209, learnLevel: 28 },  // 乱突
                { skillId: 210, learnLevel: 33 },  // 潮汐
                { skillId: 211, learnLevel: 36 },  // 剑舞
                { skillId: 212, learnLevel: 37 },  // 虚张声势
                { skillId: 213, learnLevel: 38 },  // 水流喷射
                { skillId: 214, learnLevel: 39 },  // 漩涡
                { skillId: 215, learnLevel: 46 },  // 白雾
                { skillId: 216, learnLevel: 52 },  // 猛攻
                { skillId: 217, learnLevel: 59 }   // 高压水枪
            ],
            catchRate: null,  // 初始精灵不可捕捉
            evYield: { hp: 0, atk: 0, spAtk: 1, def: 0, spDef: 0, spd: 0 }
        },
        {
            id: 5,
            name: "尤里安",
            type: "water",
            evolutionChainId: 1,
            evolveTo: 6,
            evolveLevel: 36,
            baseStats: {
                hp: 64,
                atk: 66,
                spAtk: 81,
                def: 68,
                spDef: 76,
                spd: 50
            },
            // 使用与伊优相同的技能表（进化链共享）
            learnableSkills: [
                { skillId: 201, learnLevel: 1 },
                { skillId: 202, learnLevel: 4 },
                { skillId: 203, learnLevel: 8 },
                { skillId: 204, learnLevel: 11 },
                { skillId: 205, learnLevel: 15 },
                { skillId: 206, learnLevel: 16 },
                { skillId: 207, learnLevel: 19 },
                { skillId: 208, learnLevel: 24 },
                { skillId: 209, learnLevel: 28 },
                { skillId: 210, learnLevel: 33 },
                { skillId: 211, learnLevel: 36 },
                { skillId: 212, learnLevel: 37 },
                { skillId: 213, learnLevel: 38 },
                { skillId: 214, learnLevel: 39 },
                { skillId: 215, learnLevel: 46 },
                { skillId: 216, learnLevel: 52 },
                { skillId: 217, learnLevel: 59 }
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 0, spAtk: 2, def: 0, spDef: 0, spd: 0 }
        },
        {
            id: 6,
            name: "巴鲁斯",
            type: "water",
            evolutionChainId: 1,
            evolveTo: null,
            evolveLevel: null,
            baseStats: {
                hp: 84,
                atk: 86,
                spAtk: 111,
                def: 88,
                spDef: 101,
                spd: 65
            },
            learnableSkills: [
                { skillId: 201, learnLevel: 1 },
                { skillId: 202, learnLevel: 4 },
                { skillId: 203, learnLevel: 8 },
                { skillId: 204, learnLevel: 11 },
                { skillId: 205, learnLevel: 15 },
                { skillId: 206, learnLevel: 16 },
                { skillId: 207, learnLevel: 19 },
                { skillId: 208, learnLevel: 24 },
                { skillId: 209, learnLevel: 28 },
                { skillId: 210, learnLevel: 33 },
                { skillId: 211, learnLevel: 36 },
                { skillId: 212, learnLevel: 37 },
                { skillId: 213, learnLevel: 38 },
                { skillId: 214, learnLevel: 39 },
                { skillId: 215, learnLevel: 46 },
                { skillId: 216, learnLevel: 52 },
                { skillId: 217, learnLevel: 59 }
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 0, spAtk: 3, def: 0, spDef: 0, spd: 0 }
        },

        // ============================================
        // 草系进化链 (evolutionChainId: 2)
        // 布布种子 → 布布草 → 布布花
        // ============================================
        {
            id: 1,
            name: "布布种子",
            type: "grass",
            evolutionChainId: 2,
            evolveTo: 2,
            evolveLevel: 18,
            baseStats: {
                hp: 55,
                atk: 69,
                spAtk: 65,
                def: 55,
                spDef: 31,
                spd: 45
            },
            // 草系进化链共用技能表
            learnableSkills: [
                { skillId: 301, learnLevel: 1 },   // 撞击
                { skillId: 302, learnLevel: 4 },   // 缩头
                { skillId: 303, learnLevel: 9 },   // 吸取
                { skillId: 304, learnLevel: 13 },  // 疾风刃
                { skillId: 305, learnLevel: 17 },  // 诅咒
                { skillId: 306, learnLevel: 22 },  // 齿突
                { skillId: 307, learnLevel: 27 },  // 强力吸取
                { skillId: 308, learnLevel: 32 },  // 舍身撞击
                { skillId: 309, learnLevel: 33 },  // 地震
                { skillId: 310, learnLevel: 34 },  // 寄生种子
                { skillId: 311, learnLevel: 39 },  // 光合作用
                { skillId: 312, learnLevel: 45 },  // 咬碎
                { skillId: 313, learnLevel: 51 },  // 超级吸取
                { skillId: 314, learnLevel: 57 }   // 飞叶风暴
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 1, spAtk: 0, def: 0, spDef: 0, spd: 0 }
        },
        {
            id: 2,
            name: "布布草",
            type: "grass",
            evolutionChainId: 2,
            evolveTo: 3,
            evolveLevel: 32,
            baseStats: {
                hp: 75,
                atk: 89,
                spAtk: 55,
                def: 85,
                spDef: 65,
                spd: 41
            },
            learnableSkills: [
                { skillId: 301, learnLevel: 1 },
                { skillId: 302, learnLevel: 4 },
                { skillId: 303, learnLevel: 9 },
                { skillId: 304, learnLevel: 13 },
                { skillId: 305, learnLevel: 17 },
                { skillId: 306, learnLevel: 22 },
                { skillId: 307, learnLevel: 27 },
                { skillId: 308, learnLevel: 32 },
                { skillId: 309, learnLevel: 33 },
                { skillId: 310, learnLevel: 34 },
                { skillId: 311, learnLevel: 39 },
                { skillId: 312, learnLevel: 45 },
                { skillId: 313, learnLevel: 51 },
                { skillId: 314, learnLevel: 57 }
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 2, spAtk: 0, def: 0, spDef: 0, spd: 0 }
        },
        {
            id: 3,
            name: "布布花",
            type: "grass",
            evolutionChainId: 2,
            evolveTo: null,
            evolveLevel: null,
            baseStats: {
                hp: 95,
                atk: 109,
                spAtk: 105,
                def: 85,
                spDef: 56,
                spd: 75
            },
            learnableSkills: [
                { skillId: 301, learnLevel: 1 },
                { skillId: 302, learnLevel: 4 },
                { skillId: 303, learnLevel: 9 },
                { skillId: 304, learnLevel: 13 },
                { skillId: 305, learnLevel: 17 },
                { skillId: 306, learnLevel: 22 },
                { skillId: 307, learnLevel: 27 },
                { skillId: 308, learnLevel: 32 },
                { skillId: 309, learnLevel: 33 },
                { skillId: 310, learnLevel: 34 },
                { skillId: 311, learnLevel: 39 },
                { skillId: 312, learnLevel: 45 },
                { skillId: 313, learnLevel: 51 },
                { skillId: 314, learnLevel: 57 }
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 3, spAtk: 0, def: 0, spDef: 0, spd: 0 }
        },

        // ============================================
        // 火系进化链 (evolutionChainId: 3)
        // 小火猴 → 烈火猴 → 烈焰猩猩
        // ============================================
        {
            id: 7,
            name: "小火猴",
            type: "fire",
            evolutionChainId: 3,
            evolveTo: 8,
            evolveLevel: 14,
            baseStats: {
                hp: 44,
                atk: 58,
                spAtk: 58,
                def: 44,
                spDef: 44,
                spd: 61
            },
            // 火系进化链共用技能表
            learnableSkills: [
                { skillId: 401, learnLevel: 1 },   // 抓
                { skillId: 402, learnLevel: 3 },   // 瞪眼
                { skillId: 403, learnLevel: 7 },   // 火花
                { skillId: 404, learnLevel: 9 },   // 挑拨
                { skillId: 405, learnLevel: 14 },  // 音速拳
                { skillId: 406, learnLevel: 16 },  // 疯狂乱抓
                { skillId: 407, learnLevel: 19 },  // 火焰车
                { skillId: 408, learnLevel: 26 },  // 佯攻
                { skillId: 409, learnLevel: 29 },  // 折磨
                { skillId: 410, learnLevel: 36 },  // 惩罚
                { skillId: 411, learnLevel: 41 },  // 全力一击
                { skillId: 412, learnLevel: 45 },  // 火焰漩涡
                { skillId: 413, learnLevel: 53 },  // 冥想
                { skillId: 414, learnLevel: 57 }   // 烈焰冲撞
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 1 }
        },
        {
            id: 8,
            name: "烈火猴",
            type: "fire",
            evolutionChainId: 3,
            evolveTo: 9,
            evolveLevel: 36,
            baseStats: {
                hp: 64,
                atk: 78,
                spAtk: 78,
                def: 52,
                spDef: 52,
                spd: 81
            },
            learnableSkills: [
                { skillId: 401, learnLevel: 1 },
                { skillId: 402, learnLevel: 3 },
                { skillId: 403, learnLevel: 7 },
                { skillId: 404, learnLevel: 9 },
                { skillId: 405, learnLevel: 14 },
                { skillId: 406, learnLevel: 16 },
                { skillId: 407, learnLevel: 19 },
                { skillId: 408, learnLevel: 26 },
                { skillId: 409, learnLevel: 29 },
                { skillId: 410, learnLevel: 36 },
                { skillId: 411, learnLevel: 41 },
                { skillId: 412, learnLevel: 45 },
                { skillId: 413, learnLevel: 53 },
                { skillId: 414, learnLevel: 57 }
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 2 }
        },
        {
            id: 9,
            name: "烈焰猩猩",
            type: "fire",
            evolutionChainId: 3,
            evolveTo: null,
            evolveLevel: null,
            baseStats: {
                hp: 76,
                atk: 104,
                spAtk: 104,
                def: 71,
                spDef: 71,
                spd: 108
            },
            learnableSkills: [
                { skillId: 401, learnLevel: 1 },
                { skillId: 402, learnLevel: 3 },
                { skillId: 403, learnLevel: 7 },
                { skillId: 404, learnLevel: 9 },
                { skillId: 405, learnLevel: 14 },
                { skillId: 406, learnLevel: 16 },
                { skillId: 407, learnLevel: 19 },
                { skillId: 408, learnLevel: 26 },
                { skillId: 409, learnLevel: 29 },
                { skillId: 410, learnLevel: 36 },
                { skillId: 411, learnLevel: 41 },
                { skillId: 412, learnLevel: 45 },
                { skillId: 413, learnLevel: 53 },
                { skillId: 414, learnLevel: 57 }
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 3 }
        },
        {
            id: 10,
            name: "皮皮",
            type: "flying",
            evolutionChainId: 100,  // 独立进化链
            evolveTo: null,
            evolveLevel: null,
            baseStats: {
                hp: 40,
                atk: 40,
                spAtk: 30,
                def: 35,
                spDef: 35,
                spd: 50
            },
            learnableSkills: [
                { skillId: 101, learnLevel: 1 },
                { skillId: 2, learnLevel: 3 },
                { skillId: 102, learnLevel: 5 },
                { skillId: 103, learnLevel: 9 },
                { skillId: 104, learnLevel: 13 }
            ],
            catchRate: 60,
            evYield: { hp: 0, atk: 0, spAtk: 0, def: 0, spDef: 0, spd: 1 }
        },
        {
            id: 300,
            name: "谱尼",
            type: "spirit",
            evolutionChainId: 101,  // 独立形态（无进化）
            evolveTo: null,
            evolveLevel: null,
            baseStats: {
                hp: 120,
                atk: 110,
                spAtk: 120,
                def: 100,
                spDef: 100,
                spd: 110
            },
            // 谱尼技能表
            learnableSkills: [
                { skillId: 518, learnLevel: 85 },   // 璨灵圣光
                { skillId: 519, learnLevel: 85 },   // 落芳天华
                { skillId: 520, learnLevel: 85 },   // 圣灵悲魂曲
                { skillId: 501, learnLevel: 1 },   // 极光
                { skillId: 502, learnLevel: 5 },   // 虚无
                { skillId: 503, learnLevel: 10 },  // 神圣之光
                { skillId: 504, learnLevel: 15 },  // 元素
                { skillId: 505, learnLevel: 20 },  // 能量
                { skillId: 506, learnLevel: 25 },  // 灵光之怒
                { skillId: 507, learnLevel: 30 },  // 生命
                { skillId: 508, learnLevel: 35 },  // 断空破
                { skillId: 509, learnLevel: 40 },  // 轮回
                { skillId: 510, learnLevel: 45 },  // 灵魂干涉
                { skillId: 511, learnLevel: 50 },  // 圣堂之门
                { skillId: 512, learnLevel: 55 },  // 永恒
                { skillId: 513, learnLevel: 60 },  // 圣洁
                { skillId: 514, learnLevel: 70 },  // 旋灭裂空阵
                { skillId: 521, learnLevel: 71 },  // 圣影流光破
                { skillId: 515, learnLevel: 80 },  // 千烈虚光闪
                { skillId: 516, learnLevel: 90 },  // 圣光气
                { skillId: 517, learnLevel: 100 }  // 圣灵魔闪光
            ],
            catchRate: null,
            evYield: { hp: 0, atk: 0, spAtk: 3, def: 0, spDef: 0, spd: 0 }
        }
    ]
};

window.ElvesData = ElvesData;
