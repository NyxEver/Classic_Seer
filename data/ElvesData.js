/**
 * ElvesData - 精灵基础数据
 * 直接定义数据避免 CORS 问题
 */

const ElvesData = {
    elves: [
        {
            id: 1,
            name: "伊优",
            type: "water",
            baseStats: {
                hp: 45,
                atk: 35,
                spAtk: 50,
                def: 40,
                spDef: 45,
                spd: 55
            },
            evolutionLevel: 18,
            evolvesTo: null,
            learnableSkills: [
                { skillId: 1, learnLevel: 1 },
                { skillId: 2, learnLevel: 4 },
                { skillId: 3, learnLevel: 8 },
                { skillId: 4, learnLevel: 11 },
                { skillId: 5, learnLevel: 15 }
            ],
            catchRate: null,
            evYield: {
                hp: 0,
                atk: 0,
                spAtk: 1,
                def: 0,
                spDef: 0,
                spd: 0
            }
        },
        {
            id: 2,
            name: "皮皮",
            type: "flying",
            baseStats: {
                hp: 40,
                atk: 40,
                spAtk: 30,
                def: 35,
                spDef: 35,
                spd: 50
            },
            evolutionLevel: 16,
            evolvesTo: null,
            learnableSkills: [
                { skillId: 101, learnLevel: 1 },
                { skillId: 2, learnLevel: 3 },
                { skillId: 102, learnLevel: 5 },
                { skillId: 103, learnLevel: 9 },
                { skillId: 104, learnLevel: 13 }
            ],
            catchRate: 60,
            evYield: {
                hp: 0,
                atk: 0,
                spAtk: 0,
                def: 0,
                spDef: 0,
                spd: 1
            }
        }
    ]
};

window.ElvesData = ElvesData;
