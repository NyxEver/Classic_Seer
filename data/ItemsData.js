/**
 * ItemsData - 物品数据
 * 定义游戏中的所有物品
 */

const ItemsData = {
    items: [
        // ===== 精灵胶囊 =====
        {
            id: 1,
            name: "初级精灵胶囊",
            type: "capsule",
            tier: "basic",
            description: "用于捕捉野生精灵的基础胶囊。",
            effect: {
                catchBonus: 10
            }
        },
        {
            id: 4,
            name: "中级精灵胶囊",
            type: "capsule",
            tier: "intermediate",
            description: "性能更好的胶囊，捕捉率更高。",
            effect: {
                catchBonus: 25
            }
        },
        {
            id: 7,
            name: "高级精灵胶囊",
            type: "capsule",
            tier: "advanced",
            description: "顶级胶囊，极高的捕捉成功率。",
            effect: {
                catchBonus: 50
            }
        },

        // ===== 体力药剂 =====
        {
            id: 2,
            name: "初级体力药剂",
            type: "hpPotion",
            tier: "basic",
            description: "恢复精灵 20 点 HP。",
            effect: {
                hpRestore: 20
            }
        },
        {
            id: 5,
            name: "中级体力药剂",
            type: "hpPotion",
            tier: "intermediate",
            description: "恢复精灵 50 点 HP。",
            effect: {
                hpRestore: 50
            }
        },
        {
            id: 8,
            name: "高级体力药剂",
            type: "hpPotion",
            tier: "advanced",
            description: "恢复精灵 100 点 HP。",
            effect: {
                hpRestore: 100
            }
        },

        // ===== 活力药剂 =====
        {
            id: 3,
            name: "初级活力药剂",
            type: "ppPotion",
            tier: "basic",
            description: "恢复技能 5 点 PP。",
            effect: {
                ppRestore: 5
            }
        },
        {
            id: 6,
            name: "中级活力药剂",
            type: "ppPotion",
            tier: "intermediate",
            description: "恢复技能 10 点 PP。",
            effect: {
                ppRestore: 10
            }
        },
        {
            id: 9,
            name: "高级活力药剂",
            type: "ppPotion",
            tier: "advanced",
            description: "恢复技能 20 点 PP。",
            effect: {
                ppRestore: 20
            }
        }
    ]
};

// 导出为全局对象
window.ItemsData = ItemsData;
