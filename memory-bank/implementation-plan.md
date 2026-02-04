# Project Seer 实施计划

## 概述

本计划聚焦于 **Phase 1: MVP**，包含：
- 战斗引擎
- 一只初始精灵
- 船长室（任务系统）
- 克洛斯星（捕捉皮皮）
- 精灵背包

---

## 第一阶段：项目基础设施

### 步骤 1.1：创建项目目录结构

**指令：**
1. 在项目根目录 `/Seer/` 下创建以下文件夹：
   - `/css/`
   - `/js/`
   - `/js/lib/`
   - `/js/scenes/`
   - `/js/systems/`
   - `/js/utils/`
   - `/data/`
   - `/assets/`
   - `/assets/images/`
   - `/assets/audio/`

**验证测试：**
- 确认所有文件夹已创建
- 确认路径层级正确，无拼写错误

---

### 步骤 1.2：确认 Phaser 3

**指令：**
1. 确保文件存在 `/Seer/js/lib/phaser.min.js`
2. 确保是完整的生产版本（非 ES Module 版本）

**验证测试：**
- 文件大小应在 1MB 以上
- 用文本编辑器打开，确认开头包含 Phaser 版本注释
- 文件无损坏（无截断）

---

### 步骤 1.3：创建游戏入口 HTML

**指令：**
1. 在 `/Seer/` 下创建 `index.html`
2. 设置 HTML5 文档结构
3. 设置 `<meta charset="UTF-8">`
4. 设置视口 meta 标签（适配移动端）
5. 设置页面标题为 "Project Seer"
6. 引入 `/css/main.css`（后续创建）
7. 引入 `/js/lib/phaser.min.js`
8. 引入 `/js/main.js`（后续创建）
9. 创建一个 `id="game-container"` 的 div 作为游戏容器

**验证测试：**
- 用浏览器打开 `index.html`，无 404 错误（暂时允许 main.css 和 main.js 的 404）
- 打开开发者工具控制台，确认 Phaser 对象存在（输入 `Phaser.VERSION`）

---

### 步骤 1.4：创建基础样式文件

**指令：**
1. 在 `/Seer/css/` 下创建 `main.css`
2. 重置 body 的 margin 和 padding 为 0
3. 设置 body 背景色为黑色
4. 设置 `#game-container` 居中显示
5. 禁止页面滚动和文本选中（游戏体验优化）

**验证测试：**
- 刷新页面，背景应为黑色
- 页面无滚动条
- 控制台无 CSS 相关错误

---

### 步骤 1.5：创建 Phaser 游戏主配置

**指令：**
1. 在 `/Seer/js/` 下创建 `main.js`
2. 定义 Phaser 游戏配置对象，包含：
   - type: `Phaser.AUTO`
   - width: 1000
   - height: 600
   - parent: `'game-container'`
   - backgroundColor: `'#1a1a2e'`
   - scene: 空数组（后续填充）
3. 实例化 Phaser.Game

**验证测试：**
- 刷新页面，应看到 1000x600 的深蓝色游戏画布
- 控制台无错误
- 画布在容器内正确渲染

---

### 步骤 1.6：创建启动场景（BootScene）

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `BootScene.js`
2. 定义 BootScene 类，继承 `Phaser.Scene`
3. 构造函数中设置 scene key 为 `'BootScene'`
4. 实现 `preload()` 方法：暂时为空，添加注释说明将用于加载核心资源
5. 实现 `create()` 方法：在屏幕中央显示白色文字 "Loading..."
6. 在 `index.html` 中引入此脚本（在 main.js 之前）
7. 在 `main.js` 的 scene 数组中添加 BootScene

**验证测试：**
- 刷新页面，应看到 "Loading..." 文字居中显示
- 控制台无错误
- 场景正确初始化

---

### 步骤 1.7：创建场景管理器工具

**指令：**
1. 在 `/Seer/js/utils/` 下创建 `SceneManager.js`
2. 创建 SceneManager 对象/类，包含：
   - `changeScene(currentScene, targetSceneKey)` 方法：安全地切换场景
   - 切换前检查目标场景是否存在
3. 在 `index.html` 中引入此脚本

**验证测试：**
- 控制台输入 `SceneManager` 确认对象存在
- 调用方法时传入无效场景名，应有明确错误提示

---

## 第二阶段：核心数据结构

### 步骤 2.1：设计精灵数据 JSON 结构

**指令：**
1. 在 `/Seer/data/` 下创建 `elves.json`
2. 定义精灵数据结构，每只精灵包含：
   - `id`: 唯一数字标识
   - `name`: 精灵名称
   - `type`: 属性类型（如 "grass", "fire" 等）
   - `baseStats`: 基础数值对象
     - `hp`, `atk`, `spAtk`, `def`, `spDef`, `spd`
   - `evolutionLevel`: 进化等级（无进化则为 null）
   - `evolvesTo`: 进化后精灵 ID（无进化则为 null）
   - `learnableSkills`: 可学习技能配置数组，每项包含：
     - `skillId`: 技能 ID
     - `learnLevel`: 学习该技能的精灵等级
   - `catchRate`: 捕捉率（0-100）
   - `evYield`: 击败该精灵获得的努力值对象
     - `hp`, `atk`, `spAtk`, `def`, `spDef`, `spd`（每项 0-3）
3. 添加两只精灵数据：
   - 伊优（ID: 1，水属性，初始精灵）
   - 皮皮（ID: 2，普通属性，克洛斯星野生精灵，evYield: {spd: 1}）

**注意：**
- 个体值（IV, 0-31）在精灵实例生成时随机确定，存储在玩家存档中，不在 elves.json 中定义
- 努力值（EV）存储在玩家存档的精灵实例中，初始为 0

**验证测试：**
- 用 JSON 验证工具检查格式正确性
- 确认所有必要字段存在且类型正确
- 确认 ID 唯一
- 确认 learnableSkills 中的 learnLevel 递增

---

### 步骤 2.2：设计技能数据 JSON 结构

**指令：**
1. 在 `/Seer/data/` 下创建 `skills.json`
2. 定义技能数据结构，每个技能包含：
   - `id`: 唯一数字标识
   - `name`: 技能名称
   - `type`: 属性类型（"normal", "water", "fire", "grass", "flying", "general" 等）
   - `category`: "physical"（物理攻击）/ "special"（特殊攻击）/ "status"（属性攻击/状态技能）
   - `power`: 威力值（0 表示非伤害技能）
   - `accuracy`: 命中率（0-100）
   - `pp`: 技能使用次数上限
   - `priority`: 先制值（默认 0，正数优先出手）
   - `critRate`: 暴击率分母（如 16 表示 1/16 暴击率，null 表示不可暴击）
   - `effect`: 特效对象（可为 null），包含：
     - `type`: 效果类型（如 "statChange"）
     - `target`: 效果目标（"enemy" 或 "self"）
     - `stat`: 影响的属性（"atk", "def", "accuracy" 等）
     - `stages`: 等级变化值（-1 表示降低 1 级）
     - `chance`: 触发概率（100 表示必定触发）
3. 添加以下技能：
   
   **伊优技能：**
   - 拍打（ID: 1, 普通系, 物理攻击, 威力 40, PP 35, 先制 0, 命中 100%, 暴击 1/16, 学习等级 1）
   - 鸣叫（ID: 2, 一般系, 属性攻击, 威力 0, PP 40, 先制 0, 命中 100%, 效果: 降低对手攻击 1 级, 学习等级 4）
   - 泡沫（ID: 3, 水系, 特殊攻击, 威力 20, PP 30, 先制 0, 命中 100%, 暴击 1/16, 效果: 15%概率降低对手命中 1 级, 学习等级 8）
   - 玩水（ID: 4, 一般系, 属性攻击, 威力 0, PP 15, 先制 0, 命中 必中, 效果: 5回合内本方受到的火系伤害减半, 学习等级 11）
   - 飞击（ID: 5, 飞行系, 物理攻击, 威力 35, PP 35, 先制 0, 命中 96%, 暴击 1/16, 学习等级 15）
   
   **皮皮技能：**
   - 撞击（ID: 1, 普通系, 物理攻击, 威力 35, PP 35, 先制 0, 命中 95%, 暴击 1/16, 学习等级 1）
   - 鸣叫（ID: 2, 一般系, 属性攻击, 威力 0, PP 40, 命中 100%, 效果: 降低对手攻击 1 级, 学习等级 3）
   - 电光火石（ID: 3, 普通系, 物理攻击, 威力 40, PP 30, 先制 1, 命中 100%, 暴击 1/16, 学习等级 5）
   - 飞翼拍击（ID: 4, 飞行系, 物理攻击, 威力 60, PP 35, 先制 0, 命中 100%, 暴击 1/16, 学习等级 9）
   - 诱惑（ID: 5, 一般系, 属性攻击, 威力 0, PP 20, 命中 100%, 效果: 降低对手命中 1 级, 学习等级 13）

**注意：**
- 精灵同时最多装备 4 个技能
- 达到学习等级时，若技能槽已满，需选择替换旧技能

**验证测试：**
- JSON 格式验证通过
- 每个技能的 category 为 "physical"、"special" 或 "status"
- accuracy 在 0-100 范围内
- 先制值正确（电光火石为 1，其他为 0）

---

### 步骤 2.3：创建属性克制表

**指令：**
1. 在 `/Seer/data/` 下创建 `typeChart.json`
2. 按设计文档中的属性克制关系，创建二维映射表
3. 结构：以攻击方属性为 key，值为对象，包含对各防御属性的倍率
4. 倍率值：2（克制）、1（普通）、0.5（微弱）、0（无效）
5. 至少实现以下属性：water, fire, grass, electric, normal, flying, ground, ice, mechanical

**验证测试：**
- 验证 water 攻击 fire 返回 2
- 验证 grass 攻击 water 返回 2
- 验证 electric 攻击 ground 返回 0
- 验证 normal 攻击 normal 返回 1

---

### 步骤 2.4：创建数据加载器

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `DataLoader.js`
2. 创建 DataLoader 对象/类，包含：
   - `loadJSON(path)`: 异步加载 JSON 文件，返回 Promise
   - `elves`: 存储精灵数据的对象
   - `skills`: 存储技能数据的对象
   - `typeChart`: 存储属性克制表的对象
   - `init()`: 异步方法，加载所有数据文件
3. 在 `index.html` 中引入此脚本
4. 修改 BootScene，在 preload 中调用 `DataLoader.init()`

**验证测试：**
- 在 BootScene 的 create 中打印 `DataLoader.elves`，确认数据加载成功
- 打印 `DataLoader.skills`，确认技能数据存在
- 故意写错路径，确认有明确错误提示

---

### 步骤 2.5：创建存档系统

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `SaveSystem.js`
2. 创建 SaveSystem 对象/类，包含：
   - `SAVE_KEY`: 存档在 LocalStorage 中的 key（如 "seer_save_data"）
   - `save(data)`: 将游戏数据序列化并存入 LocalStorage
   - `load()`: 从 LocalStorage 读取并解析存档，无存档返回 null
   - `hasSave()`: 检查是否存在存档
   - `deleteSave()`: 删除存档
3. 在 `index.html` 中引入此脚本

**验证测试：**
- 调用 `SaveSystem.save({test: 123})`，然后调用 `SaveSystem.load()`，确认返回 `{test: 123}`
- 调用 `SaveSystem.hasSave()`，确认返回 true
- 调用 `SaveSystem.deleteSave()`，再调用 `hasSave()`，确认返回 false
- 存入非法 JSON 数据，确认有错误处理

---

### 步骤 2.6：设计玩家存档数据结构

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `PlayerData.js`
2. 创建 PlayerData 对象/类，包含：
   - `name`: 玩家名称
   - `seerBeans`: 赛尔豆（货币），初始值 1000
   - `elves`: 玩家拥有的精灵数组，每只精灵包含：
     - `elfId`: 对应 elves.json 的 ID
     - `nickname`: 昵称（可选）
     - `level`: 当前等级
     - `exp`: 当前经验值
     - `currentHp`: 当前 HP
     - `skills`: 当前装备的技能 ID 数组（最多 4 个）
     - `skillPP`: 每个技能的当前 PP 对象 `{skillId: currentPP}`
     - `iv`: 个体值对象（生成时随机确定，0-31）
       - `hp`, `atk`, `spAtk`, `def`, `spDef`, `spd`
     - `ev`: 努力值对象（初始为 0，通过战斗积累）
       - `hp`, `atk`, `spAtk`, `def`, `spDef`, `spd`
       - 单项上限 255，总和上限 510
   - `items`: 物品背包对象 `{itemId: count}`
   - `currentMapId`: 当前所在地图 ID
   - `questProgress`: 任务进度对象
3. 添加 `createNew()` 方法：创建新玩家数据
   - 包含初始精灵伊优（随机生成 IV，EV 全为 0）
   - 初始物品：
     - 初级精灵胶囊 x5（ID: 1，效果值 10）
     - 初级体力药剂 x5（ID: 2，恢复 20 HP）
     - 初级活力药剂 x5（ID: 3，恢复技能 PP 5 次）
   - 初始赛尔豆：1000
4. 添加 `loadFromSave()` 方法：从存档加载数据
5. 添加 `saveToStorage()` 方法：保存到 LocalStorage
6. 添加 `generateRandomIV()` 方法：生成随机个体值对象（每项 0-31）
7. 在 `index.html` 中引入此脚本

**验证测试：**
- 调用 `PlayerData.createNew()` 后，`PlayerData.elves` 应包含一只伊优
- 初始伊优的 IV 各项在 0-31 范围内
- 初始伊优的 EV 各项为 0
- 初始赛尔豆应为 1000
- 初始物品应包含胶囊、体力药剂、活力药剂各 5 个
- 调用 `saveToStorage()` 后再刷新页面，调用 `loadFromSave()`，数据应一致

---

## 第三阶段：精灵系统

### 步骤 3.1：创建精灵类

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `Elf.js`
2. 创建 Elf 类，构造函数接收：
   - `elfData`: 来自 elves.json 的基础数据
   - `instanceData`: 来自玩家存档的实例数据（等级、经验、IV、EV 等）
3. 实现以下属性/方法：
   - `getMaxHp()`: 根据等级计算最大 HP
   - `getAtk()`: 根据等级计算攻击力
   - `getSpAtk()`: 根据等级计算特攻
   - `getDef()`: 根据等级计算防御
   - `getSpDef()`: 根据等级计算特防
   - `getSpd()`: 根据等级计算速度
   - 数值公式：`floor((基础值 * 2 + 个体值 + floor(努力值 / 4)) * 等级 / 100 + 10 + 等级)`
   - `addEV(stat, amount)`: 增加努力值（需检查单项上限 255 和总和上限 510）
   - `getTotalEV()`: 获取努力值总和
4. 在 `index.html` 中引入此脚本

**努力值规则：**
- 击败精灵后，根据被击败精灵的 `evYield` 获得相应努力值
- 每项努力值上限 255
- 所有努力值总和上限 510

**验证测试：**
- 创建一只 1 级、IV 全 0、EV 全 0 的伊优，验证基础数值
- 创建一只 10 级伊优，各属性应高于 1 级
- 添加努力值后，属性值正确提升
- 努力值不超过单项上限和总和上限
- 确认 HP 计算正确

---

### 步骤 3.2：实现经验与升级系统

**指令：**
1. 在 Elf 类中添加：
   - `getExpToNextLevel()`: 返回升到下一级所需经验值
   - `addExp(amount)`: 增加经验值，处理升级逻辑
   - `canLevelUp()`: 检查是否可以升级
   - `levelUp()`: 执行升级，提升等级，重置经验差值
2. 经验公式建议：`所需经验 = 当前等级 * 100`
3. 升级时检查是否学会新技能（根据 elves.json 的 skills 配置）

**验证测试：**
- 1 级精灵需要 100 经验升级
- 给 1 级精灵添加 150 经验，应升到 2 级，剩余 50 经验
- 给 1 级精灵添加 300 经验，应连续升级到 3 级

---

### 步骤 3.3：创建精灵背包管理器

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `ElfBag.js`
2. 创建 ElfBag 对象/类，包含：
   - `getAll()`: 获取所有精灵实例（Elf 对象数组）
   - `getByIndex(index)`: 获取指定位置的精灵
   - `add(elfId, level)`: 添加新精灵到背包
   - `remove(index)`: 移除指定位置的精灵
   - `swap(index1, index2)`: 交换两只精灵位置
   - `getFirstAvailable()`: 获取第一只 HP > 0 的精灵
   - `allFainted()`: 检查是否所有精灵都倒下
3. 精灵数据存储在 PlayerData.elves 中
4. 在 `index.html` 中引入此脚本

**验证测试：**
- 新游戏开始后，`ElfBag.getAll()` 应返回包含伊优的数组
- 添加皮皮后，数组长度应为 2
- 移除精灵后，数组长度应减少
- `getFirstAvailable()` 应跳过 HP 为 0 的精灵

---

### 步骤 3.4：创建精灵背包 UI 场景

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `ElfBagScene.js`
2. 定义 ElfBagScene 类，scene key 为 `'ElfBagScene'`
3. 实现 UI 显示：
   - 左侧：精灵列表（显示名称、等级、HP 条）
   - 右侧：选中精灵的详细信息（数值、技能）
   - 底部：返回按钮
4. 实现交互：
   - 点击精灵查看详情
   - 点击返回按钮回到上一场景
5. 在 `index.html` 中引入此脚本
6. 在 `main.js` 的 scene 数组中添加此场景

**验证测试：**
- 进入背包场景，应看到初始精灵伊优
- 点击精灵，右侧应显示详细数值
- 返回按钮功能正常
- HP 条颜色应根据 HP 百分比变化（绿/黄/红）

---

## 第四阶段：战斗系统

### 步骤 4.1：创建战斗场景基础结构

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `BattleScene.js`
2. 定义 BattleScene 类，scene key 为 `'BattleScene'`
3. 场景接收初始化数据：
   - `playerElf`: 玩家精灵实例
   - `enemyElf`: 敌方精灵实例
   - `battleType`: "wild"（野生）或 "trainer"（训练家）
   - `canEscape`: 是否可逃跑
   - `canCatch`: 是否可捕捉
4. 实现 `create()` 方法：
   - 显示战斗背景
   - 显示双方精灵（位置：玩家左下，敌方右上）
   - 显示双方 HP 条和等级
5. 在 `index.html` 中引入此脚本
6. 在 `main.js` 的 scene 数组中添加此场景

**验证测试：**
- 手动调用场景切换，传入测试数据，确认 UI 正确显示
- 双方精灵名称、等级、HP 正确
- 场景布局合理

---

### 步骤 4.2：实现战斗菜单 UI

**指令：**
1. 在 BattleScene 中添加战斗菜单 UI：
   - 主菜单：战斗 / 背包 / 精灵 / 逃跑
   - 技能菜单：显示当前精灵的 4 个技能（名称、PP）
2. 实现菜单状态管理：
   - `MAIN_MENU`: 显示主菜单
   - `SKILL_SELECT`: 显示技能选择
   - `ITEM_SELECT`: 显示物品选择（暂时禁用）
   - `ELF_SELECT`: 显示精灵切换（暂时禁用）
3. 实现菜单切换逻辑

**验证测试：**
- 点击"战斗"显示技能列表
- 点击"逃跑"触发逃跑逻辑（暂时直接成功）
- 按返回/取消可回到主菜单
- 技能按钮显示正确的技能名和 PP

---

### 步骤 4.3：创建战斗管理器

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `BattleManager.js`
2. 创建 BattleManager 类，包含：
   - `playerElf`: 玩家当前精灵
   - `enemyElf`: 敌方当前精灵
   - `turnPhase`: 当前回合阶段
   - `battleLog`: 战斗日志数组
3. 实现回合阶段：
   - `PLAYER_CHOOSE`: 玩家选择行动
   - `EXECUTE_TURN`: 执行回合
   - `CHECK_RESULT`: 检查战斗结果
   - `BATTLE_END`: 战斗结束
4. 在 `index.html` 中引入此脚本

**验证测试：**
- 创建 BattleManager 实例，确认初始阶段正确
- 调用阶段切换方法，确认阶段正确变化

---

### 步骤 4.4：实现伤害计算系统

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `DamageCalculator.js`
2. 创建 DamageCalculator 对象，包含：
   - `calculate(attacker, defender, skill)`: 计算伤害值
3. 伤害公式：
   ```
   伤害 = floor((((等级*0.4+2)*技能威力*攻击方的攻击/防御方的防御)/50+2)*本系加成*克制系数*(R/255))
   ```
   - R = 217~255 的随机整数
   - 本系加成 = 技能属性 === 攻击方属性 ? 1.5 : 1
   - 克制系数 = 从 typeChart 查询
4. 精度规则：
   - 除随机系数 (R/255) 外，公式中每一次除法运算结果直接截断到小数点后 4 位，不四舍五入
   - 所有乘法不截断精度
   - 最终伤害整体向下取整（floor）
5. 物理技能使用 ATK/DEF，特殊技能使用 SP.ATK/SP.DEF
6. 最小伤害为 1
7. 在 `index.html` 中引入此脚本

**计算步骤详解：**
```javascript
// 1. 计算基础值
let levelFactor = truncate4(attacker.level * 0.4 + 2);
let atkDefRatio = truncate4(attackStat / defenseStat);
let baseDamage = truncate4((levelFactor * skill.power * atkDefRatio) / 50 + 2);

// 2. 应用加成
let stab = (skill.type === attacker.type) ? 1.5 : 1;
let typeEffect = getTypeEffectiveness(skill.type, defender.type);
let R = randomInt(217, 255);
let randomFactor = R / 255;  // 此处不截断

// 3. 最终伤害
let finalDamage = Math.floor(baseDamage * stab * typeEffect * randomFactor);
return Math.max(finalDamage, 1);
```

**验证测试：**
- 水属性技能打火属性精灵，伤害应翻倍
- 火属性技能打水属性精灵，伤害应减半
- 电属性技能打地面属性精灵，伤害应为 0
- 同属性技能应有 1.5 倍本系加成
- 多次计算同一攻击，伤害应在合理范围内波动（随机系数）

---

### 步骤 4.5：实现回合执行逻辑

**指令：**
1. 在 BattleManager 中添加：
- `setPlayerAction(action, data)`: 设置玩家行动
- `generateEnemyAction()`: AI 随机选择技能
- `executeTurn()`: 执行回合
2. 执行顺序逻辑：
- 比较双方速度，速度高者先出手
- 速度相同时随机决定
3. 执行流程：
- 先手方使用技能
- 计算伤害，扣除 HP
- 检查是否击败
- 若未击败，后手方使用技能
- 同样流程
4. 返回回合执行结果

**验证测试：**
- 速度高的精灵确实先出手
- 伤害正确扣除 HP
- HP 归零时正确判定击败
- 双方都使用技能后回合结束

---

### 步骤 4.6：实现战斗动画与消息显示

**指令：**
1. 在 BattleScene 中添加：
- `showMessage(text)`: 显示战斗消息（底部消息框）
- `animateAttack(attacker, target)`: 攻击动画（简单位移）
- `animateHpChange(target, newHp)`: HP 条动画
- `animateFaint(target)`: 倒下动画（淡出）
2. 使用 Phaser 的 Tween 系统实现动画
3. 消息显示支持队列，依次显示

**验证测试：**
- 使用技能时显示 "XX 使用了 XX"
- 攻击时精灵有位移动画
- HP 条平滑减少
- 精灵倒下时淡出

---

### 步骤 4.7：实现战斗结果处理

**指令：**
1. 在 BattleManager 中添加：
- `checkBattleEnd()`: 检查战斗是否结束
- `calculateExpReward()`: 计算经验奖励
- `handleVictory()`: 处理胜利
- `handleDefeat()`: 处理失败
2. 胜利处理：
- 计算获得经验值
- 给参战精灵添加经验
- 检查升级
3. 失败处理：
- 显示失败消息
- 返回上一场景（或复活点）

**验证测试：**
- 击败敌方后正确计算经验
- 经验足够时自动升级
- 升级时显示提示消息
- 失败时正确处理

---

### 步骤 4.8：实现逃跑机制

**指令：**
1. 在 BattleManager 中添加：
- `attemptEscape()`: 尝试逃跑
2. 逃跑成功率公式：
- 基础成功率 50%
- 玩家速度 > 敌方速度：+20%
- 玩家速度 < 敌方速度：-20%
- 训练家战斗：不可逃跑
3. 逃跑成功：结束战斗，返回地图
4. 逃跑失败：浪费本回合，敌方行动

**验证测试：**
- 野生战斗可以尝试逃跑
- 逃跑失败时敌方正常攻击
- 速度高时逃跑更容易成功
- 多次测试确认概率合理

---

## 第五阶段：场景与导航

### 步骤 5.1：创建主菜单场景

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `MainMenuScene.js`
2. 定义 MainMenuScene 类，scene key 为 `'MainMenuScene'`
3. UI 内容：
- 游戏 Logo/标题
- "新游戏" 按钮
- "继续游戏" 按钮（有存档时可用）
- 版本号
4. 逻辑：
- "新游戏"：创建新存档，进入飞船场景
- "继续游戏"：加载存档，进入上次位置
5. 修改 BootScene，加载完成后跳转到 MainMenuScene
6. 在 `index.html` 中引入此脚本
7. 在 `main.js` 的 scene 数组中添加此场景

**验证测试：**
- 游戏启动后显示主菜单
- 无存档时"继续游戏"按钮禁用/隐藏
- "新游戏"正确初始化玩家数据
- 有存档时"继续游戏"正确加载数据

---

### 步骤 5.2：创建飞船场景框架

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `SpaceshipScene.js`
2. 定义 SpaceshipScene 类，scene key 为 `'SpaceshipScene'`
3. UI 内容：
- 飞船内部背景
- 各房间入口按钮/区域：
  - 船长室（可用）
  - 机械室（灰显，Phase 3）
  - 实验室（灰显，Phase 3）
  - 传送舱（可用）
  - 能源中心（灰显）
  - 资料室（灰显）
4. 实现房间切换逻辑
5. 在 `index.html` 中引入此脚本
6. 在 `main.js` 的 scene 数组中添加此场景

**验证测试：**
- 进入飞船场景，看到所有房间入口
- 可用房间可点击，有交互反馈
- 灰显房间显示"开发中"提示
- 场景切换正常

---

### 步骤 5.3：创建船长室场景

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `CaptainRoomScene.js`
2. 定义 CaptainRoomScene 类，scene key 为 `'CaptainRoomScene'`
3. UI 内容：
- 房间背景
- NPC 船长
- 任务列表面板
- 返回飞船按钮
4. 实现：
- 显示当前可接任务
- 显示进行中任务
- 与船长对话触发任务
5. 在 `index.html` 中引入此脚本
6. 在 `main.js` 的 scene 数组中添加此场景

**验证测试：**
- 进入船长室，看到船长 NPC
- 点击船长显示对话
- 任务列表正确显示
- 返回按钮功能正常

---

### 步骤 5.4：创建传送舱场景

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `TeleportScene.js`
2. 定义 TeleportScene 类，scene key 为 `'TeleportScene'`
3. UI 内容：
- 星系地图（帕诺星系）
- 星球列表/图标
- 只有克洛斯星可选（其他灰显）
- 返回飞船按钮
4. 实现：
- 点击可用星球进入该星球场景
- 灰显星球显示"未开放"
5. 在 `index.html` 中引入此脚本
6. 在 `main.js` 的 scene 数组中添加此场景

**验证测试：**
- 进入传送舱，看到星球选择界面
- 只有克洛斯星可点击
- 点击克洛斯星进入该星球
- 其他星球显示锁定状态

---

### 步骤 5.5：创建克洛斯星场景

**指令：**
1. 在 `/Seer/js/scenes/` 下创建 `KloseScene.js`
2. 定义 KloseScene 类，scene key 为 `'KloseScene'`
3. UI 内容：
- 克洛斯星背景（草地环境）
- 可移动区域
- 精灵刷新在地图中，随机移动
- 返回传送舱按钮
4. 实现：
- 玩家在场景中移动（点击移动或方向键）
- 点击地图中的精灵触发战斗
5. 在 `index.html` 中引入此脚本
6. 在 `main.js` 的 scene 数组中添加此场景

**验证测试：**
- 进入克洛斯星，看到场景背景
- 可以在场景中移动
- 点击精灵触发战斗（与皮皮）
- 返回按钮功能正常

---

### 步骤 5.6：实现野生遭遇系统

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `EncounterSystem.js`
2. 创建 EncounterSystem 对象，包含：
- `checkEncounter(mapId)`: 根据地图判断是否触发遭遇
- `getRandomWildElf(mapId)`: 获取该地图的随机野生精灵
- `startWildBattle(scene, elfData)`: 启动野生战斗
3. 克洛斯星遭遇配置：
- 遭遇率：30%
- 可遇精灵：皮皮（等级 2-5 随机）
4. 在 `index.html` 中引入此脚本

**验证测试：**
- 在移动时，点击刷新出来的精灵触发遭遇
- 遭遇的皮皮等级在 2-5 范围内
- 点击皮皮进入战斗场景
- 战斗结束后返回克洛斯星场景

---

## 第六阶段：捕捉系统

### 步骤 6.1：创建物品数据结构

**指令：**
1. 在 `/Seer/data/` 下创建 `items.json`
2. 定义物品数据结构：
   - `id`: 唯一标识
   - `name`: 物品名称
   - `type`: "capsule"（胶囊）/ "hpPotion"（体力药剂）/ "ppPotion"（活力药剂）/ "material"（材料）
   - `tier`: 品级（"basic", "intermediate", "advanced" 等，用于区分同类型不同等级物品）
   - `description`: 描述文本
   - `effect`: 效果数据对象，根据 type 不同：
     - 胶囊：`{ "catchBonus": 10 }`（捕捉率加成）
     - 体力药剂：`{ "hpRestore": 20 }`（HP 恢复量）
     - 活力药剂：`{ "ppRestore": 5 }`（技能 PP 恢复量）
3. 添加初始物品：
   - **初级精灵胶囊**（ID: 1，basic，捕捉加成 10）
   - **初级体力药剂**（ID: 2，basic，恢复 20 HP）
   - **初级活力药剂**（ID: 3，basic，恢复技能 PP 5 次）
4. 预留高级物品位置（待后续阶段添加）：
   - 中级/高级胶囊（更高捕捉加成）
   - 中级/高级体力药剂（更高 HP 恢复）
   - 中级/高级活力药剂（更高 PP 恢复）
5. 修改 DataLoader，加载物品数据

**验证测试：**
- 物品数据正确加载
- JSON 格式正确
- 可通过 ID 查询物品信息
- effect 对象结构与 type 匹配

---

### 步骤 6.2：创建物品背包系统

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `ItemBag.js`
2. 创建 ItemBag 对象/类，包含：
- `getAll()`: 获取所有物品及数量
- `getCount(itemId)`: 获取指定物品数量
- `add(itemId, count)`: 添加物品
- `remove(itemId, count)`: 移除物品，不足时返回 false
- `has(itemId, count)`: 检查是否拥有足够物品
3. 数据存储在 PlayerData.items 中
4. 在 `index.html` 中引入此脚本

**验证测试：**
- 添加 5 个胶囊，getCount 返回 5
- 移除 3 个，getCount 返回 2
- 移除 10 个失败，数量不变
- has(1, 2) 返回 true

---

### 步骤 6.3：实现捕捉机制

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `CatchSystem.js`
2. 创建 CatchSystem 对象，包含：
- `calculateCatchRate(elf, capsule)`: 计算捕捉成功率
- `attemptCatch(elf, capsule)`: 尝试捕捉，返回成功/失败
3. 捕捉率公式：
- 基础捕捉率 = 精灵的 catchRate
- HP 加成 = (1 - 当前HP/最大HP) * 50  // HP 越低越容易抓
- 胶囊加成 = 胶囊效果值
- 最终捕捉率 = min(基础捕捉率 + HP 加成 + 胶囊加成, 100)
4. 在 `index.html` 中引入此脚本

**验证测试：**
- 满血精灵捕捉率较低
- 残血精灵捕捉率较高
- 高级胶囊提升捕捉率
- 成功率 100% 时必定成功

---

### 步骤 6.4：在战斗中集成捕捉功能

**指令：**
1. 在 BattleScene 中添加：
- 背包按钮功能实现
- 显示可用胶囊列表
- 选择胶囊后执行捕捉
2. 捕捉流程：
- 选择胶囊
- 消耗胶囊
- 播放投掷动画
- 显示晃动动画（1-3 次）
- 判定结果
- 成功：加入背包，战斗结束
- 失败：敌方回合继续
3. 只有野生战斗可以捕捉

**验证测试：**
- 野生战斗中可以使用胶囊
- 胶囊正确消耗
- 捕捉成功后精灵加入背包
- 捕捉失败后战斗继续
- 训练家战斗无法使用胶囊

---

### 步骤 6.5：添加捕捉动画效果

**指令：**
1. 在 BattleScene 中添加捕捉动画：
- 胶囊投掷动画（抛物线）
- 精灵缩小/消失进入胶囊
- 胶囊落地
- 胶囊晃动（1-3 次，根据捕捉判定）
- 成功：星星特效
- 失败：胶囊打开，精灵跳出
2. 使用 Phaser Tween 实现
3. 动画期间禁用菜单交互

**验证测试：**
- 动画流畅播放
- 晃动次数与判定一致
- 成功/失败有不同动画
- 动画期间无法操作

---

## 第七阶段：任务系统（基础）

### 步骤 7.1：创建任务数据结构

**指令：**
1. 在 `/Seer/data/` 下创建 `quests.json`
2. 定义任务数据结构：
- `id`: 唯一标识
- `name`: 任务名称
- `description`: 任务描述
- `type`: "main"（主线）/ "side"（支线）/ "daily"（每日）
- `requirements`: 前置条件（如：完成某任务）
- `objectives`: 任务目标数组
  - `type`: "catch"（捕捉）/ "defeat"（击败）/ "collect"（收集）/ "talk"（对话）
  - `targetId`: 目标 ID
  - `count`: 所需数量
- `rewards`: 奖励对象
  - `exp`: 经验值
  - `seerBeans`: 赛尔豆
  - `items`: 物品数组
3. 添加初始主线任务：
- 任务 1："初次捕捉" - 捕捉 1 只皮皮
- 任务 2："训练初始" - 将初始精灵升到 5 级
4. 修改 DataLoader，加载任务数据

**验证测试：**
- 任务数据正确加载
- JSON 格式正确
- 任务目标结构清晰

---

### 步骤 7.2：创建任务管理器

**指令：**
1. 在 `/Seer/js/systems/` 下创建 `QuestManager.js`
2. 创建 QuestManager 对象/类，包含：
- `getAvailableQuests()`: 获取可接取的任务
- `getActiveQuests()`: 获取进行中的任务
- `getCompletedQuests()`: 获取已完成的任务
- `acceptQuest(questId)`: 接取任务
- `updateProgress(eventType, targetId, count)`: 更新任务进度
- `checkCompletion(questId)`: 检查任务是否完成
- `completeQuest(questId)`: 完成任务，发放奖励
3. 任务进度存储在 PlayerData.questProgress 中
4. 在 `index.html` 中引入此脚本

**验证测试：**
- 新游戏可接取"初次捕捉"任务
- 接取后任务出现在进行中列表
- 捕捉皮皮后进度更新
- 达成目标后可完成任务
- 奖励正确发放

---

### 步骤 7.3：集成任务事件触发

**指令：**
1. 在相关系统中添加任务进度更新调用：
- 战斗胜利时：`QuestManager.updateProgress('defeat', elfId, 1)`
- 捕捉成功时：`QuestManager.updateProgress('catch', elfId, 1)`
- 精灵升级时：`QuestManager.updateProgress('levelUp', elfId, newLevel)`
2. 确保事件在正确时机触发
3. 更新后检查任务完成状态

**验证测试：**
- 击败野生皮皮，击败类任务进度 +1
- 捕捉皮皮，捕捉类任务进度 +1
- 精灵升级，升级类任务进度更新
- 多次操作累计计数

---

### 步骤 7.4：实现船长室任务 UI

**指令：**
1. 在 CaptainRoomScene 中完善任务 UI：
- 任务列表显示：可接取 / 进行中 / 已完成（标签页）
- 任务详情面板：目标、进度、奖励预览
- "接取" 按钮：接取选中任务
- "完成" 按钮：完成已达成目标的任务
2. 实现任务选择交互
3. 完成任务时显示奖励动画/提示

**验证测试：**
- 可接取任务显示在对应标签
- 点击任务显示详情
- 接取按钮功能正常
- 进度实时显示（如 1/3）
- 完成按钮只在达成目标时可用
- 奖励正确显示

---

### 步骤 7.5：添加任务完成提示

**指令：**
1. 创建全局任务提示系统：
- 任务目标达成时显示浮动提示
- 任务可完成时显示图标提示（如感叹号）
2. 在 UI 层添加任务追踪面板（可选显示/隐藏）：
- 显示当前追踪任务的进度
3. 在各场景中正确显示提示

**验证测试：**
- 达成目标时有提示弹出
- 提示不阻塞游戏操作
- 追踪面板正确更新
- 返回船长室时任务状态正确

---

## 第八阶段：整合与完善

### 步骤 8.1：完善新游戏流程

**指令：**
1. 实现新游戏开场流程：
- 欢迎文字/简短剧情
- 玩家输入名称
- 选择初始精灵（MVP 阶段只有伊优，但 UI 可扩展）
- 进入飞船场景
2. 确保 PlayerData 正确初始化

**验证测试：**
- 完整走完新游戏流程
- 玩家名称正确保存
- 初始精灵在背包中
- 初始物品正确（如 5 个胶囊）

---

### 步骤 8.2：完善存档与读档

**指令：**
1. 确保以下时机自动存档：
- 战斗结束后
- 捕捉成功后
- 任务完成后
- 切换场景时
2. 添加手动存档选项（设置菜单或快捷键）
3. 读档时验证存档完整性

**验证测试：**
- 进行游戏后关闭浏览器
- 重新打开，点击继续游戏
- 精灵、物品、任务进度完整恢复
- 当前位置正确恢复

---

### 步骤 8.3：添加设置菜单

**指令：**
1. 创建 SettingsScene 或 设置弹窗：
- 音量控制（BGM / SFX，暂时可禁用）
- 返回主菜单选项
- 删除存档选项（需二次确认）
2. 可从飞船场景或战斗外场景访问

**验证测试：**
- 设置菜单正常打开/关闭
- 返回主菜单功能正常
- 删除存档需二次确认
- 删除后主菜单正确显示无存档状态

---

### 步骤 8.4：添加简易图鉴系统

**指令：**
1. 在 PlayerData 中添加 `seenElves` 和 `caughtElves` 数组
2. 遭遇精灵时记录到 seenElves
3. 捕捉精灵时记录到 caughtElves
4. 在传送舱或资料室添加图鉴查看功能：
- 显示已见/已捕捉精灵列表
- 未见精灵显示为问号

**验证测试：**
- 遭遇皮皮后图鉴显示"已见"
- 捕捉皮皮后图鉴显示"已捕捉"
- 初始精灵自动标记为已捕捉
- 未遇精灵显示为未知

---

### 步骤 8.5：最终整合测试

**指令：**
1. 执行完整游戏流程测试：
- 新游戏 → 接取任务 → 前往克洛斯星 → 捕捉皮皮 → 完成任务
- 进行多次战斗，升级精灵
- 查看背包、图鉴
- 存档 → 关闭 → 读档 → 验证数据
2. 检查所有场景切换正常
3. 检查无 JavaScript 错误
4. 检查 UI 无明显错位

**验证测试：**
- 完整流程无阻塞
- 控制台无错误
- 数据持久化正常
- 游戏可重复游玩

---

## 附录：资源占位说明

在开发过程中，可使用以下占位资源：

1. **精灵图片**：使用纯色矩形或简单几何图形
2. **背景图片**：使用渐变色块
3. **UI 元素**：使用 Phaser 内置图形绘制
4. **音效**：暂时禁用或使用静音

待 Phase 2 时替换为正式美术资源。

---

## 里程碑检查点

| 阶段 | 完成标志 |
|------|----------|
| 阶段 1 | Phaser 游戏画布正常显示，场景可切换 |
| 阶段 2 | 数据加载正常，存档系统可用 |
| 阶段 3 | 精灵可创建、升级，背包可查看 |
| 阶段 4 | 完整战斗流程可进行，胜负判定正确 |
| 阶段 5 | 场景导航完整，可到达克洛斯星 |
| 阶段 6 | 可捕捉野生精灵并加入背包 |
| 阶段 7 | 任务系统可用，奖励正确发放 |
| 阶段 8 | MVP 完整可玩，存档稳定 |

---

> 本计划用于指导 AI 开发者逐步实现 Project Seer MVP 版本。每完成一个步骤，请更新 `/memory-bank/@architecture.md` 记录当前进度和架构变更。
