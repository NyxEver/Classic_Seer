/**
 * SkillsData - 技能数据
 * 直接定义数据避免 CORS 问题
 */

const SkillsData = {
    skills: [
        {
            id: 1,
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
        {
            id: 3,
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
            id: 4,
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
            id: 5,
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
        }
    ]
};

window.SkillsData = SkillsData;
