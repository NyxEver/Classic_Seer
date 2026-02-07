/**
 * QuestsData - 任务数据
 * 定义游戏中的所有任务信息
 */

const QuestsData = {
    quests: [
        {
            id: 1,
            name: "初次捕捉",
            description: "捕获一只野生皮皮精灵",
            type: "main",
            requirements: [], // 前置条件（已完成的任务 ID）
            objectives: [
                {
                    type: "catch",      // 捕捉类型
                    targetId: 2,        // 皮皮的精灵 ID
                    count: 1            // 需要捕捉数量
                }
            ],
            rewards: {
                exp: 0,                 // 经验值奖励
                seerBeans: 100,         // 赛尔豆奖励
                items: [
                    { id: 1, count: 5 } // 初级精灵胶囊 x5
                ]
            }
        },
        {
            id: 2,
            name: "训练初始",
            description: "将任意精灵升到 5 级",
            type: "main",
            requirements: [],
            objectives: [
                {
                    type: "levelUp",    // 升级类型
                    targetLevel: 5,     // 目标等级
                    count: 1            // 需要达成数量（1 只精灵即可）
                }
            ],
            rewards: {
                exp: 0,
                seerBeans: 200,
                items: []
            }
        },
        {
            id: 3,
            name: "初次战斗",
            description: "击败 3 只野生精灵",
            type: "side",
            requirements: [],
            objectives: [
                {
                    type: "defeat",     // 击败类型
                    targetId: null,     // null 表示任意精灵
                    count: 3            // 需要击败数量
                }
            ],
            rewards: {
                exp: 0,
                seerBeans: 50,
                items: [
                    { id: 2, count: 3 } // 初级体力药剂 x3
                ]
            }
        }
    ]
};

// 导出为全局对象
window.QuestsData = QuestsData;
