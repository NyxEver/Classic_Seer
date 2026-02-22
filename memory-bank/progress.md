# Project Seer - 开发进度

## 第一阶段：项目基础设施 ✅
**完成日期：** 2026-02-04

### 已完成步骤
- [x] 1.1 创建项目目录结构
- [x] 1.2 确认 Phaser 3 (v3.90.0)
- [x] 1.3 创建游戏入口 HTML
- [x] 1.4 创建基础样式文件
- [x] 1.5 创建 Phaser 游戏主配置
- [x] 1.6 创建启动场景（BootScene）
- [x] 1.7 创建场景管理器工具

### 验证结果
- ✅ Phaser.VERSION = '3.90.0'
- ✅ 1000x600 深蓝色画布正确显示
- ✅ "Loading..." 文字居中带脉冲动画
- ✅ SceneManager 对象可用，错误处理正常

---

## 第二阶段：核心数据结构 ✅
**完成日期：** 2026-02-04

### 已完成步骤
- [x] 2.1 设计精灵数据结构 (`ElvesData.js`)
- [x] 2.2 设计技能数据结构 (`SkillsData.js`)
- [x] 2.3 创建属性克制表 (`TypeChartData.js`)
- [x] 2.4 创建数据加载器 (`DataLoader.js`)
- [x] 2.5 创建存档系统 (`SaveSystem.js`)
- [x] 2.6 设计玩家存档数据结构 (`PlayerData.js`)

### 新增文件
- `data/ElvesData.js` - 精灵基础数据（伊优、皮皮）
- `data/SkillsData.js` - 技能数据（9 个技能）
- `data/TypeChartData.js` - 属性克制表
- `js/systems/DataLoader.js` - 数据加载器（同步加载）
- `js/systems/SaveSystem.js` - 存档系统
- `js/systems/PlayerData.js` - 玩家数据管理器

### 验证结果
- ✅ DataLoader 加载数据成功（精灵 2 只、技能 9 个）
- ✅ 属性克制表查询正确（水→火=2, 草→水=2, 电→地=0）
- ✅ SaveSystem 存取删除功能正常
- ✅ PlayerData 创建新存档含初始伊优（含随机 IV）和物品（ID 1,2,3 各 5 个）

### 技术说明
- 使用 JavaScript 模块而非 JSON 文件，避免 `file://` 协议下的 CORS 问题

---

## 第三阶段：精灵系统 ✅
**完成日期：** 2026-02-04

### 已完成步骤
- [x] 3.1 创建精灵类 (`Elf.js`)
- [x] 3.2 实现经验与升级系统
- [x] 3.3 创建精灵背包管理器 (`ElfBag.js`)
- [x] 3.4 创建精灵背包 UI 场景 (`ElfBagScene.js`)

### 新增文件
- `js/systems/Elf.js` - 精灵类（属性计算、升级、EV 管理）
- `js/systems/ElfBag.js` - 精灵背包管理器
- `js/scenes/ElfBagScene.js` - 精灵背包 UI 场景

### 验证结果
- ✅ 1 级伊优属性计算正确（HP:12, ATK:6, SP.ATK:7, DEF:6, SP.DEF:7, SPD:7）
- ✅ 经验升级：添加 150 经验后升到 2 级，剩余 50 经验
- ✅ EV 系统：单项上限 255、总和上限 510 限制正常
- ✅ ElfBag：获取/添加/交换精灵功能正常
- ✅ 野生精灵创建：Lv.4 皮皮正确生成（HP:17，技能：撞击、鸣叫）
- ✅ ElfBagScene UI：精灵列表、详情面板、返回按钮正常

### 技术说明
- 属性公式：`floor((base*2 + IV + floor(EV/4)) * level/100 + 5|10 + level)`
- 经验公式：`当前等级 * 100`
- Elf 类支持 `_syncInstanceData()` 自动同步到 PlayerData

---

## 第四阶段：战斗系统 ✅
**完成日期：** 2026-02-04

### 已完成步骤
- [x] 4.1 创建战斗场景基础结构 (`BattleScene.js`)
- [x] 4.2 实现战斗菜单 UI（赛尔号风格）
- [x] 4.3 创建战斗管理器 (`BattleManager.js`)
- [x] 4.4 实现伤害计算系统 (`DamageCalculator.js`)
- [x] 4.5 实现回合执行逻辑
- [x] 4.6 实现战斗动画与消息显示
- [x] 4.7 实现战斗结果处理（胜利/失败弹窗）
- [x] 4.8 实现逃跑机制

### 新增文件
- `js/systems/DamageCalculator.js` - 伤害计算系统
- `js/systems/BattleManager.js` - 战斗管理器
- `js/scenes/BattleScene.js` - 战斗场景 UI

### 验证结果
- ✅ 战斗场景 UI 赛尔号风格（顶部状态栏 + 中央战斗区 + 底部控制区）
- ✅ 技能使用、PP 扣除、伤害计算正确
- ✅ 回合计时器 10 秒，超时自动使用技能 1
- ✅ 逃跑成功弹窗、战斗胜利弹窗（显示经验和升级）
- ✅ 非玩家回合时技能面板和按钮变灰禁用

### 技术说明
- 伤害公式：`floor(((2*L/5+2) * power * A/D / 50 + 2) * STAB * type * crit * random)`
- 回合顺序：优先级 > 速度 > 随机
- 逃跑概率：`(playerSpeed * 128 / enemySpeed + 30 * escapeAttempts) % 256 > random`

---

## 第五阶段：场景与导航 ✅
**完成日期：** 2026-02-05

### 已完成步骤
- [x] 5.1 创建主菜单场景 (`MainMenuScene.js`)
- [x] 5.2 创建飞船场景框架 (`SpaceshipScene.js`)
- [x] 5.3 创建船长室场景 (`CaptainRoomScene.js`)
- [x] 5.4 创建传送舱场景 (`TeleportScene.js`)
- [x] 5.5 创建克洛斯星场景 (`KloseScene.js`)
- [x] 5.6 实现野生遭遇系统 (`EncounterSystem.js`)

### 新增文件
- `js/scenes/MainMenuScene.js` - 主菜单（新游戏/继续游戏）
- `js/scenes/SpaceshipScene.js` - 飞船大厅（房间入口）
- `js/scenes/CaptainRoomScene.js` - 船长室（任务系统入口）
- `js/scenes/TeleportScene.js` - 传送舱（星球选择）
- `js/scenes/KloseScene.js` - 克洛斯星探索场景
- `js/systems/EncounterSystem.js` - 野生遭遇系统

### 验证结果
- ✅ 主菜单：新游戏/继续游戏按钮正常，存档检测正确
- ✅ 飞船场景：房间入口显示，可用/灰显状态正确
- ✅ 传送舱：星球选择 UI，克洛斯星可点击
- ✅ 克洛斯星：玩家移动、野生皮皮生成、点击触发战斗
- ✅ 野生战斗：从克洛斯星进入战斗场景正常
- ✅ 存档功能：战斗失败后刷新，继续游戏正确提示无可出战精灵

### 技术说明
- 克洛斯星野生精灵点击需设置 `container.setDepth(100)` 和 `moveZone.setDepth(0)` 确保正确的交互层级
- 使用 `container.setSize(60, 60)` 配合 `setInteractive({ useHandCursor: true })` 实现点击检测和手型光标
- `Elf` 类属性直接存储在实例上（如 `elf.name`），而非嵌套在 `elfData` 下

---

## 第六阶段：捕捉系统与战斗增强 ✅
**完成日期：** 2026-02-06

### 已完成步骤
- [x] 6.1 创建捕捉系统 (`CatchSystem.js`)
- [x] 6.2 创建物品背包管理 (`ItemBag.js`)
- [x] 6.3 实现战斗中精灵切换功能
- [x] 6.4 实现战斗中道具面板
- [x] 6.5 添加物品数据 (`ItemsData.js`)
- [x] 6.6 实现强制切换（精灵倒下时）

### 新增文件
- `js/systems/CatchSystem.js` - 捕捉系统，计算捕捉率并添加精灵到背包
- `js/systems/ItemBag.js` - 物品背包管理器
- `data/ItemsData.js` - 物品数据定义（胶囊、HP药剂、PP药剂）

### 验证结果
- ✅ 捕捉野生精灵成功后添加到背包
- ✅ 精灵按钮：多只精灵时启用，可切换
- ✅ 切换后：状态栏重建、技能面板更新正确
- ✅ 强制切换：精灵倒下时自动弹出切换面板
- ✅ 道具面板：分类过滤显示（血药/PP药/胶囊）

### 已知问题
- ⚠️ 道具面板中使用药剂功能暂未生效（待修复）
- ⚠️ 道具面板没能与中间技能面板MiddleSkillPanel对齐（待修复）

### 技术说明
- 物品类型：`capsule`（胶囊）、`hpPotion`（HP药剂）、`ppPotion`（PP药剂）
- 效果属性：`effect.hpRestore`、`effect.ppRestore`、`effect.catchBonus`
- 精灵切换时使用 `createCharacterSprite()` 重建显示
- 强制切换通过 `BattleManager.checkBattleEnd()` 返回 `needSwitch: true` 触发

---

## 第七阶段：任务系统 ✅
**完成日期：** 2026-02-07

### 已完成步骤
- [x] 7.1 创建任务数据结构 (`QuestsData.js`)
- [x] 7.2 创建任务管理器 (`QuestManager.js`)
- [x] 7.3 集成任务事件触发（击败/捕捉/升级）
- [x] 7.4 实现船长室任务 UI（动态面板、标签页、接取/完成）
- [x] 7.5 添加任务完成提示（Toast 消息、奖励弹窗）

### 新增文件
- `data/QuestsData.js` - 任务数据定义（3 个初始任务）
- `js/systems/QuestManager.js` - 任务管理器（接取、进度、完成、奖励）

### 修改文件
- `DataLoader.js` - 添加任务数据加载和 `getQuest()` 方法
- `BattleManager.js` - 在 `handleVictory()` 添加击败事件触发
- `CatchSystem.js` - 在 `addCapturedElf()` 添加捕捉事件触发
- `Elf.js` - 在 `addExp()` 添加升级事件触发
- `CaptainRoomScene.js` - 完全重构为动态任务 UI
- `index.html` - 添加新脚本引用

### 验证结果
- ✅ 新游戏进入船长室显示 3 个可接取任务
- ✅ 接取任务后状态变为进行中，显示进度 0/1
- ✅ 捕捉皮皮后任务进度更新为 1/1，显示 ✓ 标记
- ✅ 完成任务后奖励弹窗正确显示（100 赛尔豆 + 5 胶囊）
- ✅ 奖励正确到账（赛尔豆、物品）

### 技术说明
- 任务进度存储在 `PlayerData.questProgress`：`{ active: { questId: { objectiveIndex: progress } }, completed: [questId...] }`
- 事件触发通过 `QuestManager.updateProgress(type, targetId, value)` 统一处理
- 支持 3 种任务目标类型：`catch`（捕捉）、`defeat`（击败）、`levelUp`（升级）
- 任务 UI 采用标签页设计：可接取 / 进行中 / 已完成

---

## 第八阶段：整合与完善 ✅
**完成日期：** 2026-02-07

### 已完成步骤
- [x] 8.1 完善新游戏流程（欢迎对话、名称选择、初始精灵展示）
- [x] 8.2 完善存档与读档（已有自动存档机制）
- [x] 8.3 添加设置菜单（音量控制 UI、返回主菜单、删除存档）
- [x] 8.4 添加简易图鉴系统（seenElves/caughtElves）
- [x] 8.5 最终整合测试

### 新增文件
- `js/scenes/SettingsScene.js` - 设置场景（音量、返回主菜单、删除存档）
- `js/scenes/PokedexScene.js` - 图鉴场景（精灵发现/捕捉状态展示）

### 修改文件
- `MainMenuScene.js` - 添加新游戏开场流程（欢迎对话、名称选择、初始精灵展示）
- `SpaceshipScene.js` - 添加设置按钮、启用资料室入口
- `PlayerData.js` - 添加 `seenElves`/`caughtElves` 数组和 `markSeen()`/`markCaught()` 方法
- `DataLoader.js` - 添加 `getAllElves()` 方法
- `EncounterSystem.js` - 遭遇野生精灵时调用 `markSeen()`
- `CatchSystem.js` - 捕捉成功时调用 `markCaught()`
- `main.js` - 添加 SettingsScene 和 PokedexScene
- `index.html` - 引入新场景脚本

### 验证结果
- ✅ 新游戏显示欢迎对话和名称选择
- ✅ 初始精灵展示页面正确显示伊优
- ✅ 设置菜单正常打开，返回主菜单功能正常
- ✅ 删除存档需二次确认，删除后主菜单正确显示
- ✅ 资料室入口可用，图鉴显示初始精灵为已捕捉
- ✅ 遭遇皮皮后图鉴显示为已见，捕捉后显示为已捕捉

### 技术说明
- 图鉴数据存储在 `PlayerData.seenElves` 和 `PlayerData.caughtElves` 数组中
- 初始精灵在 `createNew()` 时自动调用 `markCaught()`
- 设置场景通过 `init(data)` 接收 `returnScene` 参数实现返回功能
- 音量控制 UI 已创建但功能暂禁用（无音频系统）

---

## MVP 完成 🎉

**Project Seer MVP 版本已完成！**

核心功能清单：
- ✅ Phaser 3 游戏引擎集成
- ✅ 精灵系统（属性计算、经验升级、EV 管理）
- ✅ 战斗系统（回合制、伤害计算、胜负判定）
- ✅ 捕捉系统（胶囊使用、概率计算）
- ✅ 场景导航（飞船、船长室、传送舱、克洛斯星）
- ✅ 任务系统（接取、进度、完成、奖励）
- ✅ 图鉴系统（发现/捕捉记录）
- ✅ 设置菜单（返回主菜单、删除存档）
- ✅ 存档系统（LocalStorage 持久化）

---

## 第九阶段：进化与技能学习系统 ✅
**完成日期：** 2026-02-09

### 已完成步骤
- [x] 9.1 完善初始精灵选择（三选一 UI：布布种子/小火猴/伊优）
- [x] 9.2 创建进化场景 (`EvolutionScene.js`)
- [x] 9.3 创建技能学习场景 (`SkillLearnScene.js`)
- [x] 9.4 实现精灵进化系统（达到等级自动触发）
- [x] 9.5 实现技能替换 UI（技能槽已满时选择遗忘）
- [x] 9.6 完善 DevMode 直接触发进化/技能学习
- [x] 9.7 添加精灵管理场景 (`ElfManageScene.js`)

### 新增文件
- `js/scenes/EvolutionScene.js` - 进化动画场景
- `js/scenes/SkillLearnScene.js` - 技能学习/替换 UI 场景
- `js/scenes/ElfManageScene.js` - 精灵管理（治疗、查看）

### 修改文件
- `MainMenuScene.js` - 添加三只初始精灵选择 UI
- `Elf.js` - 添加 `pendingSkills` 持久化、`checkEvolution()`、`evolve()`、`removePendingSkill()` 方法
- `BattleManager.js` - 战斗胜利后检查进化条件和待学习技能
- `BattleScene.js` - 添加战后链式处理（技能 → 进化 → 返回）
- `DevMode.js` - 添加 `_triggerSkillLearnScene()` 和 `_triggerEvolutionScene()` 直接触发功能
- `ElvesData.js` - 添加进化配置（`evolvesTo`、`evolveLevel`）

### 验证结果
- ✅ 新游戏显示三只初始精灵选择 UI
- ✅ 达到进化等级后自动触发进化动画
- ✅ 技能槽满时弹出技能替换 UI
- ✅ 多个待学习技能可逐个处理（不再自动跳过）
- ✅ DevMode 升级后立即触发技能/进化场景

### 技术说明
- 进化数据存储在 `ElvesData` 的 `evolvesTo`（目标精灵 ID）和 `evolveLevel`（进化等级）
- `pendingSkills` 数组存储在 `Elf._instanceData` 中，通过 `_syncInstanceData()` 自动持久化
- 技能学习场景使用 `chainData` 实现多技能连续处理和后续进化触发
- Phaser 场景重用需在 `init()` 中重置 `isTransitioning` 等状态标志

---

## Feature Phase 2：开发者模式 ✅
**完成日期：** 2026-02-09

### 已完成步骤
- [x] 2.1 在 SettingsScene 添加"开发者模式"开关
- [x] 2.2 创建 DevMode.js 工具类
- [x] 2.3 实现 `window.dev` 调试接口
- [x] 2.4 在 ElfManageScene 添加"+5000 经验"按钮
- [x] 2.5 实现 100% 捕捉开关
- [x] 2.6 实现全图鉴解锁功能

### 新增文件
- `js/systems/DevMode.js` - 开发者模式工具类

### 修改文件
- `SettingsScene.js` - 添加开发者模式开关（createToggleButton 方法）
- `ElfManageScene.js` - 开发者模式下显示"+5000 经验"按钮
- `CatchSystem.js` - 支持 `DevMode.alwaysCatch` 100% 捕捉
- `index.html` - 添加 DevMode.js 脚本引用

### 验证结果
- ✅ 设置中可开启/关闭开发者模式
- ✅ 开启后精灵管理显示"🔧 +5000 经验"按钮
- ✅ 点击按钮精灵获得 5000 经验并触发升级/进化
- ✅ `dev.setAlwaysCatch(true)` 开启 100% 捕捉
- ✅ `dev.unlockAllPokedex()` 解锁全图鉴

### 技术说明
- `DevMode` 对象管理开发者模式状态（`enabled`、`alwaysCatch`）
- 开启时挂载 `window.dev` 工具对象，关闭时卸载
- `dev.giveExp()` 升级后自动检查并触发技能学习/进化场景
- `CatchSystem.attemptCatch()` 检查 `DevMode.alwaysCatch` 实现强制捕捉

---

## Feature Phase 3.1：资源系统（精灵贴图）✅
**完成日期：** 2026-02-09

### 已完成步骤
- [x] 3.1.1 创建 `AssetMappings.js` 资源映射表
- [x] 3.1.2 修改 `BootScene.js` 统一预加载精灵贴图
- [x] 3.1.3 更新场景使用真实精灵贴图
  - [x] `BattleScene.js` - 战斗精灵显示 + 切换面板
  - [x] `KloseScene.js` - 野生皮皮显示
  - [x] `EvolutionScene.js` - 进化动画
  - [x] `PokedexScene.js` - 图鉴精灵显示
  - [x] `MainMenuScene.js` - 初始精灵选择
  - [x] `ElfManageScene.js` - 精灵管理列表

### 新增文件
- `data/AssetMappings.js` - 精灵 ID 到图片文件的映射表

### 修改文件
- `index.html` - 添加 AssetMappings.js 脚本引用
- `BootScene.js` - preload() 加载所有精灵贴图
- `BattleScene.js` - createCharacterSprite/createElfSlot 使用贴图
- `KloseScene.js` - createWildElf 使用皮皮贴图
- `EvolutionScene.js` - createElfDisplay 使用贴图
- `PokedexScene.js` - createElfCard 使用贴图（含剪影效果）
- `MainMenuScene.js` - createStarterCard 使用贴图
- `ElfManageScene.js` - createElfListItem 使用贴图

### 验证结果
- ✅ 用户测试确认所有场景精灵贴图正确显示（Base64 模式）

### 技术说明
- 使用 Base64 嵌入数据绕过 `file://` CORS 限制
- `tools/generate-sprite-data.ps1` 生成 `ElfSpriteData.js`
- `AssetMappings.elves` 存储精灵 ID 到文件名的映射
- `getElfImageKey(id)` 返回 Phaser 纹理键（如 `elf_yiyou`）
- 所有场景使用 `this.textures.exists(key)` 检查贴图是否存在
- 贴图不存在时自动回退到原有占位符（彩色圆圈/文字）

---

## Feature Phase 3.2：克洛斯星多场景系统 ✅
**完成日期：** 2026-02-10

### 已完成步骤
- [x] 3.2.1 创建背景图片 Base64 数据（`BackgroundData.js`）
- [x] 3.2.2 创建 UI 资源 Base64 数据（`UIAssetData.js`）
- [x] 3.2.3 添加克洛斯星场景配置（`AssetMappings.kloseScenes`）
- [x] 3.2.4 重构 `KloseScene.js` 支持多子场景
- [x] 3.2.5 更新 `TeleportScene.js` 使用真实星球图标

### 新增文件
- `data/BackgroundData.js` - 3 张克洛斯星背景图 Base64
- `data/UIAssetData.js` - 星球图标 Base64
- `tools/generate-asset-data.ps1` - 资源转换脚本

### 修改文件
- `index.html` - 添加 BackgroundData.js、UIAssetData.js 脚本
- `BootScene.js` - preload 加载背景和 UI 资源
- `AssetMappings.js` - 添加 `kloseScenes` 配置
- `KloseScene.js` - 完全重写，支持 3 个子场景
- `TeleportScene.js` - 使用真实星球图标，优化悬停效果

### 场景配置
| 场景 | 名称 | 进入热点 | 返回热点 |
|------|------|----------|----------|
| 1 | 克洛斯星 | → 克洛斯星沼泽 | - |
| 2 | 克洛斯星沼泽 | → 克洛斯星林间 | ← 克洛斯星 |
| 3 | 克洛斯星林间 | - | ← 克洛斯星沼泽 |

### 验证结果
- ✅ 传送仓克洛斯星图标正确显示
- ✅ 3 个子场景背景正确加载
- ✅ 热点导航（进入/返回）功能正常
- ✅ 子场景间位置传递正确
- ✅ 精灵刷新区域按场景配置

---

## Feature Phase 3.3：资源系统（物品图标 / 属性图标 / 战斗BGM）⏳ 进行中
**更新日期：** 2026-02-10

### 本轮已完成
- [x] 扩展 `AssetMappings.js`（BGM、物品图标、属性图标映射）
- [x] 新增 Base64 资源数据文件（用于 `file://` 运行）
  - `data/ItemIconData.js`
  - `data/TypeIconData.js`
  - `data/BgmData.js`
- [x] `BootScene.js` 统一预加载上述资源（优先 Base64，非 `file://` 才走路径）
- [x] 战斗场景 BGM：进入淡入、结束/离场淡出、场景销毁清理
- [x] 物品图标落地：
  - `ItemBagScene.js` 使用真实物品图标替代首字占位
  - `BattleScene.js` 道具槽使用真实物品图标替代 emoji
- [x] 属性图标全量替换为图片（16 种属性）：
  - `AssetMappings.typeIcons` 覆盖 normal/water/fire/grass/electric/flying/ground/ice/mechanical/psychic/battle/light/shadow/mystery/dragon/spirit
  - 主菜单、图鉴、背包、战斗、精灵管理、技能学习等场景统一优先显示图标，缺失时回退为无文字色块
  - `tools/generate-type-icon-data.ps1` 按目录自动生成 `TypeIconData.js`
- [x] 属性体系扩展（design-document 全属性）：
  - `TypeChartData.js` 新增 battle/light/shadow/mystery/dragon/spirit 克制表与 typeNames、typeColors
  - `DataLoader.getTypeColor(type)` 统一提供属性颜色；各场景属性名/颜色改为走 DataLoader
- [x] 谱尼精灵（ID 300）：
  - `ElvesData.js` 新增谱尼（spirit，无进化），技能表 501–521
  - `SkillsData.js` 新增谱尼 21 个技能定义
  - `AssetMappings.elves[300] = 'puni'`，贴图 `assets/images/elves/puni.png`，ElfSpriteData 含 puni
  - 开发者模式开启时自动发放 1 级谱尼（仅发放一次），图鉴标记已捕捉

### 当前阶段状态（未完成项）
- [ ] **Phase 3 未完成**（见 feature-implementation.md）：仍缺少“所有场景 BGM 体系化映射与接入”（目前仅战斗场景）
- [ ] 资源系统的全场景规范化和扩展（更多场景/更多 UI 资源）仍待后续迭代

### 技术说明
- `file://` 协议下新增资源统一采用 Base64 数据脚本，避免 CORS 导致的加载失败
- `BattleScene` 仅依赖 `AssetMappings.bgm.BattleScene`，便于后续扩展到其他场景
- 属性显示逻辑：`AssetMappings.getTypeIconKey(type)` → 有则用图标，无则用 `DataLoader.getTypeColor(type)` 画圆形占位，不再显示属性中文文字

---

## 2026-02-10~2026-02-11：体验与稳定性修复 ✅

### 已完成修复
- [x] 精灵等级上限修复：`Elf.js` 强制最大等级 100，满级后不再累计经验
- [x] 捕捉精灵获得时间修复：`CatchSystem.js` 写入 `obtainedAt`
- [x] 精灵管理页面重构：
  - 从全屏改为“叠加弹窗式”双栏布局（左 40% / 右 60%）
  - 左侧 2x3 精灵卡片、首发/仓库/回复圆形功能按钮
  - 开发者模式按钮 `+5000经验` 仅在 DevMode 开启时显示
  - 回复按钮仅在存在未满血精灵时可点击
  - 卡片新增彩色血条（绿/黄/红/空血条）
  - 右侧详情“名字 + 属性图标”对齐与间距优化
- [x] 战斗背景增强：
  - 战斗背景来源于进入战斗前场景背景图
  - 叠加暗化、降饱和、轻微模糊感和暖色调

### 涉及文件（主要）
- `js/scenes/ElfManageScene.js`
- `js/scenes/SpaceshipScene.js`
- `js/systems/Elf.js`
- `js/systems/CatchSystem.js`
- `js/systems/EncounterSystem.js`
- `js/scenes/KloseScene.js`
- `js/scenes/BattleScene.js`
- `js/scenes/BootScene.js`
- `data/AssetMappings.js`
- `data/ItemIconData.js`
- `data/TypeIconData.js`
- `data/BgmData.js`


---

## Feature Phase 3.4：精灵资源迁移与战斗动画事件化 ✅ Step 3 已收尾
**更新日期：** 2026-02-11（用户验证通过）

### 本轮已完成
- [x] 移除精灵贴图 Base64 链路（改为文件资源）
  - 删除 `data/ElfSpriteData.js`
  - 删除 `index.html` 中 `ElfSpriteData.js` 引用
  - 删除 `BootScene.js` 内 `ElfSpriteData` 预加载分支
  - 删除 `tools/generate-sprite-data.ps1`
- [x] `AssetMappings.js` 扩展精灵资源映射（战斗图集 + 场景外 still/dynamic）
- [x] `BootScene.js` 统一预加载：
  - 战斗图集（`fighting_scene`）
  - 场景外静态图（`external_scene/still`）
  - 场景外动态图集（`external_scene/dynamic`）
- [x] `BattleManager.js` 新增 `skillCast` 事件（按技能类别驱动场景动画）
- [x] `BattleScene.js` 动画系统重构：
  - 默认 `01_still`
  - 移除 `02_attack / 03_special / 04_status` 独立演出
  - 物理/特殊技能统一使用 `01_still + 位移` 完成施放表现
  - 属性技能（`status`）不做位移与施放动作，仅保留回合与日志流程
  - 对方使用任意技能时播放 `05_hit`
  - 全流程串行等待，禁止动画串播
  - 物理攻击位移与动画并行，位移起点延迟至约第 5~6 帧，位移节奏 45% 前冲 / 55% 回程
  - 每次技能动画后立即刷新 HP/PP，不再整回合统一刷新
  - 战斗结束弹窗延后到回合动画与日志完成后触发
- [x] 战斗资源裁剪：
  - 删除 `assets/images/elves/fighting_scene/02_attack/**`
  - 删除 `assets/images/elves/fighting_scene/03_special/**`
  - 删除 `assets/images/elves/fighting_scene/04_status/**`
  - `AssetMappings.battleAtlases/battleClips` 仅保留 `still/hit`
- [x] `ElfManageScene.js` 与 `ElfBagScene.js` 接入精灵 still 图展示（缺图回退 battle still 首帧）
- [x] `KloseScene.js` 接入 dynamic 四方向动画与场景精灵池
  - scene1 仅刷新皮皮（ID 10）
  - scene2/scene3 暂不刷新野怪
- [x] `KloseScene.js` 野怪刷新改造（场景1白圈区域调优）：
  - 删除旧字段 `spawnZones`，统一使用 `spawnAreas`
  - scene1 刷新参数：同屏 `3-4`、最小间距 `80`、游走半径 `x±90/y±60`
  - 新增椭圆区域采样与最小间距拒绝采样，减少扎堆
  - 新增刷新/游走世界边界约束，避免精灵跑到最底部外

### 用户验证结果（本轮）
- ✅ 精灵管理/背包图片刷新正常
- ✅ 克洛斯星 scene2/scene3 无野怪刷新
- ✅ 物理位移路径问题修复，战斗动画不再串播
- ✅ 物理/特殊技能统一 `still + 位移`，`status` 技能不再动作；`hit` 与 `skillCast` 机制保持正常
- ✅ 克洛斯星 scene1 野怪分布与移动范围通过验证（不再明显扎堆，不再越界到底部）

### 当前阶段未完成项（Phase 3 总体）
- [ ] Feature Phase 3 总体仍未完成：全场景 BGM 体系化映射与接入（当前仅战斗场景）
- [ ] 精灵动画资源尚未覆盖全部精灵 ID（当前优先接入 001/002/003 战斗图集与部分 external 资源）

---

## Feature Phase 3.5：资源系统 Step 3 持续迭代（新增精灵与战斗 UI 修复）✅ 暂时结束
**更新日期：** 2026-02-12（用户验证通过）

### 本轮已完成
- [x] 数据层新增与重构精灵链路：
  - 飞行链：皮皮(10) → 比波(11) → 波克尔(12)
  - 草链：仙人球(16) → 仙人掌(17) → 巨型仙人掌(18)
  - 草链：小蘑菇(46) → 蘑菇怪(47)
- [x] 技能数据扩展：补齐技能 `105-111` 与 `315-332`（含多段攻击、反伤、保留 1HP、状态附加、属性变化等效果字段）
- [x] 克洛斯星刷新配置更新：
  - `scene2` 刷新仙人球（3-4 只）
  - `scene3` 刷新蘑菇怪 BOSS（固定 1 只）
- [x] 捕捉系统修复：`CatchSystem.calculateCatchRate()` 兼容 `elf.id` 与 `elf.elfId`，避免野怪捕捉率回退默认值
- [x] 资源映射覆盖扩大：
  - 战斗图集补齐 `004/005/006/007/008/009/010/011/012/016/017/018/046/047/300` 的 `still/hit`
  - 场景外 still 补齐并统一接入（含 `300`）
- [x] 野外动态观感修复：
  - 蘑菇怪（47）采用独立移动参数方法 `getMoguguaiMoveProfile()`
  - 其他野怪恢复原移动节奏
  - 蘑菇怪左向移动复用右向图集并镜像，修复立体方向不一致
- [x] 战斗与 UI 交互修复：
  - 技能面板 2x2 按钮居中布局
  - 道具面板尺寸与技能面板对齐（完整覆盖中间面板区域）
  - 道具面板打开时：`战斗`按钮可点击、`道具`按钮灰显；切回技能面板后状态恢复
  - 新增敌方贴图统一朝左渲染方法（右侧战斗精灵自动 `flipX`）
- [x] 场景贴图策略统一：`EvolutionScene`、`MainMenuScene`、`PokedexScene` 改为优先使用 `external_scene/still`

### 用户验证结果（本轮）
- ✅ 伊优/小火猴及其进化形态战斗动图显示正常
- ✅ 敌方（右侧）精灵朝向统一朝左
- ✅ 技能面板与道具面板布局、切换交互符合预期

### 当前阶段未完成项（Feature Phase 3 总体）
- [ ] 全场景 BGM 体系化映射与接入（当前仍仅战斗场景）
- [ ] Phase 4（状态异常系统）尚未启动

---

## Refactor Baseline（Phase 4 步骤 1）🧭
**更新日期：** 2026-02-12

### 关键行为快照（重构前）
- 启动链路：`BootScene -> DataLoader.init() -> MainMenuScene`。
- 主流程链路：主菜单 -> 飞船 -> 传送舱 -> 克洛斯 -> 战斗 -> 捕捉 -> 背包 -> 图鉴 -> 设置。
- 任务推进：由 `CatchSystem`、`BattleManager`、`Elf` 直接调用 `QuestManager.updateProgress(...)`。
- 资源入口：`AssetMappings` 统一映射精灵、场景与 BGM 资源 key。
- 状态保存：主要由 `PlayerData.saveToStorage()` 在关键节点触发。

### 已知问题与风险（基线）
- [x] 已发现并定位：`QuestsData` 中“初次捕捉”`targetId` 与 `ElvesData` 的皮皮 ID 不一致（已在步骤 2 修复）。
- [ ] 全局依赖耦合高（`window.*`），模块边界弱。
- [ ] 巨型文件集中（`BattleScene`、`KloseScene`、`AssetMappings`、`ElvesData`、`SkillsData`），改动回归面大。
- [ ] Phase 3 仍未完成：全场景 BGM 体系化映射与接入。

### 手工主流程基线验证（待用户执行）
- [ ] 主菜单
- [ ] 飞船
- [ ] 传送舱
- [ ] 克洛斯
- [ ] 战斗
- [ ] 捕捉
- [ ] 背包
- [ ] 图鉴
- [ ] 设置
- [ ] 控制台阻断错误数记录（目标：0）

---

## Phase 4 步骤 2：数据耦合风险修复 ✅（待用户验证）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 修正“初次捕捉”任务目标：`data/QuestsData.js` 中 `targetId: 2 -> 10`（对齐皮皮真实 ID）。
- [x] 新增 `js/systems/DataIntegrityChecker.js`（仅 `console.warn`，不阻断启动）。
- [x] 在 `index.html` 注入 `DataIntegrityChecker.js` 脚本引用。
- [x] 在 `js/scenes/BootScene.js` 的 `create()` 链路中调用完整性校验。

### 校验覆盖项（DataIntegrityChecker）
- [x] 精灵进化目标 `evolveTo` 是否存在。
- [x] 精灵学习表 `learnableSkills[*].skillId` 是否存在。
- [x] 任务目标 `objectives[*].targetId` 是否存在（`catch/defeat -> elfId`，`collect -> itemId`）。
- [x] 任务奖励物品 `rewards.items[*].id` 是否存在。
- [x] 任务前置 `requirements[*]` 是否存在。

### 待验证项（用户执行）
- [x] 新开档接“初次捕捉”，捕获皮皮后进度从 `0/1` 变 `1/1`。
- [x] 控制台输出“校验通过”或明确 warn，不出现异常中断。

### 用户验证结果（2026-02-12）
- ✅ 启动日志出现 `DataIntegrityChecker` 通过信息：`校验通过：elves=18, skills=96, items=9, quests=3`。
- ✅ 捕捉皮皮成功后任务日志：`QuestManager 任务 初次捕捉 目标 0 进度: 1/1`。
- ✅ 任务可正常完成并发放奖励：`完成任务: 初次捕捉`。
- ℹ️ 控制台仅出现 `favicon.ico 404`，不影响流程，不属于阻断错误。

---

## Phase 4 步骤 3：统一 BGM 管理器（先解耦音乐）✅（按当前资源约束）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/systems/BgmManager.js`，封装 `playForScene`、`transitionTo`、`stopCurrent`、`setVolume`。
- [x] 单轨约束：播放前清理同 key 残留实例，避免战斗场景叠音。
- [x] 调试监控：统一输出 `activeBgmCount`，便于验证“音轨不累计”。
- [x] `BattleScene` 的 `playBattleBgm/fadeOutBattleBgm/cleanupBattleBgm` 改为调用 `BgmManager`（保留原方法名作为兼容壳）。
- [x] `index.html` 注入 `js/systems/BgmManager.js`。
- [x] 按用户要求保持 `AssetMappings.bgm` 仅 `BattleScene`，不为主菜单/飞船/克洛斯添加占位 BGM。

### 用户验证结果（2026-02-12）
- ✅ 进入战斗时稳定输出 `play(BattleScene) activeBgmCount=1`，战斗 BGM 正常播放。
- ✅ 战斗结束后输出 `stop(done)` + `stop(no-sound)`，最终稳定到 `activeBgmCount=0`。
- ✅ 连续多次遭遇战（约 10 次）未出现叠音，音轨实例未累计。
- ℹ️ 观察到每场战斗结束会出现多次 `stop(no-sound)`，来源于战斗结束链路与场景生命周期的幂等清理调用，属可接受冗余日志，不影响功能。

---

## Phase 4 步骤 4：抽公共 UI 组件 ✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/ui/TypeIconView.js`，统一属性图标渲染：优先图标，缺失时回退颜色圆点。
- [x] 新增 `js/ui/ElfPortraitView.js`，统一精灵 still 回退链：`external still -> battle still 首帧 -> 场景占位`。
- [x] `index.html` 新增 UI 组件脚本注入（在场景脚本前加载）：
  - `js/ui/TypeIconView.js`
  - `js/ui/ElfPortraitView.js`
- [x] 替换四个场景中的重复实现（保持视觉样式不变）：
  - `js/scenes/ElfBagScene.js`
  - `js/scenes/PokedexScene.js`
  - `js/scenes/BattleScene.js`
  - `js/scenes/MainMenuScene.js`
- [x] 为手工回退测试增加运行时句柄：`js/main.js` 暴露 `window.__seerGame`（仅调试辅助，不影响主流程）。

### 用户验证结果（2026-02-12）
- ✅ 控制台确认组件可用：`typeof TypeIconView === 'object'`、`typeof ElfPortraitView === 'object'`。
- ✅ 手工删除属性图标纹理（`type_30px-water`）后流程正常，无阻断异常，验证了类型图标统一回退链可工作。
- ✅ 手工删除精灵静态纹理（`ext_still_005`）后流程正常，可继续切图鉴、战斗、返回主场景。
- ✅ 进一步删除 `btl_005_still` 后，控制台出现一次性缺图告警（`[PokedexScene] 精灵图片缺失...`），但无崩溃，符合“缺图统一降级”预期。
- ✅ 全流程日志无新增阻断错误；现有日志均为功能日志或可接受 warn。

### 结果说明
- 本步骤目标“抽公共 UI 组件并替换四场景重复代码”已完成并通过手工验证。
- 按计划可进入 **Phase 4 步骤 5（BattleScene 门面化拆分）**。

---

## Phase 4 步骤 5：BattleScene 门面化拆分 ✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/scenes/battle/` 门面目录，按职责拆分 4 个模块：
  - `BattleHud.js`（顶部状态栏、日志、弹窗、计时器、菜单启停）
  - `BattlePanels.js`（技能/道具/胶囊/精灵切换面板与交互）
  - `BattleAnimator.js`（背景、战斗精灵渲染、图集动画、捕捉动画）
  - `BattlePostFlow.js`（战后结算链路、技能学习/进化跳转、返回与 BGM 生命周期）
- [x] `index.html` 新增 4 个 battle 门面脚本，并放在 `js/scenes/BattleScene.js` 之前加载。
- [x] `js/scenes/BattleScene.js` 保持 Scene 门面角色，新增运行时委托层：
  - `BATTLE_SCENE_FACADE_METHODS`（方法分组映射）
  - `applyBattleSceneFacadeDelegates()`（优先调用门面模块，缺失时回退 `__legacy_*`）
- [x] 保持原方法签名与主流程入口（`create/executeTurn/doSkill/doEscape` 等）不变，降低改造期回归风险。

### 用户验证结果（2026-02-12）
- ✅ 技能释放、PP 扣减、先后手、道具面板开关、捕捉成功/失败、主动切换、倒地强切、胜利经验、返回原场景：全部通过。
- ✅ BGM 单轨验证通过：进入战斗 `activeBgmCount=1`，离开后稳定回落到 `0`，未出现叠音。
- ✅ 技能学习/进化链路在外部触发路径验证通过（DevMode/场景链路）。
- ℹ️ 本次实测中未在 BattleScene 内直接命中“胜利后立即进入技能学习/进化”同一路径；建议后续补一条定向回归用例用于持续重构阶段。

### 结果说明
- BattleScene 巨型文件已完成“门面化拆分第一步”：职责切分到独立模块，同时保留 legacy 回退，支持后续逐步内联迁移与最终瘦身。
- 按用户要求，测试通过后已记录本步骤产出与验证结论。

---

## Phase 4 步骤 6：AssetMappings 拆分为子映射 ✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `data/assets/BattleAssets.js`：承载战斗侧映射（`elfSpritesEnabled`、`elves`、`battleAtlases`、`battleClips`）。
- [x] 新增 `data/assets/WorldAssets.js`：承载外场/地图侧映射（`externalStill`、`externalStillPaths`、`externalDynamicAtlases`、`externalDynamicClips`、`kloseScenes`）。
- [x] 新增 `data/assets/UIAssets.js`：承载 UI 图标映射（`items`、`typeIcons`）。
- [x] 新增 `data/assets/AudioAssets.js`：承载场景 BGM 映射（当前仅 `BattleScene`）。
- [x] 重写 `data/AssetMappings.js` 为“聚合兼容层”：继续暴露原 `AssetMappings.*` 字段与方法，旧调用点无需改动。
- [x] 更新 `index.html` 数据脚本装配顺序：先加载 `data/assets/*.js`，再加载 `data/AssetMappings.js`。

### 用户验证结果（2026-02-12）
- ✅ 启动预加载数量与改造前一致：战斗图集 `36`、外场 still `18`、外场动态图集 `12`、物品图标 `7`、属性图标 `16`、BGM `1`。
- ✅ 子映射与聚合层对象均可访问：`typeof BattleAssets/WorldAssets/UIAssets/AudioAssets/AssetMappings === 'object'`。
- ✅ 关键兼容 API 行为正确：`getBattleClipKeys/getExternalStillKey/getItemImageKey/getTypeIconKey/getBgmKey` 与 `kloseScenes` 读取正常。
- ✅ 主流程 smoke 通过：主菜单 -> 飞船 -> 传送舱 -> 克洛斯 -> 战斗逃跑 -> 返回，未出现阻断异常。
- ✅ 缺失资源报错格式保持统一：`[BootScene] 资源加载失败: key=..., path=...`；用户注入缺图时成功打印 `key/path`。

### 结果说明
- 本步骤完成“配置巨石拆分 + 聚合兼容”双目标：配置职责下沉到子映射文件，同时保持 BootScene 和场景系统无感迁移。
- 下一步仍按计划为 **Phase 4 步骤 7（KloseScene 拆分）**，但需在用户明确指示后再开始。

---

## Phase 4 步骤 7：KloseScene 拆分 ✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/scenes/klose/MoveController.js`：抽离玩家点击移动、野怪边界约束、方向判定与游走节奏配置（含蘑菇怪专用参数）。
- [x] 新增 `js/scenes/klose/SpawnService.js`：抽离刷怪范围采样、最小间距校验、动态精灵渲染、方向动画与游走绑定。
- [x] 新增 `js/scenes/klose/HotspotService.js`：抽离热点交互、子场景切换与返回按钮逻辑。
- [x] 重构 `js/scenes/KloseScene.js` 为场景门面：仅保留生命周期协调、背景/玩家创建、战斗触发与背景 key 提供。
- [x] 更新 `index.html`：新增 3 个 klose 服务脚本并放在 `KloseScene.js` 之前加载。

### 用户验证结果（2026-02-12）
- ✅ 脚本装配正确：`typeof KloseMoveController/KloseSpawnService/KloseHotspotService === 'function'`。
- ✅ 刷怪规则保持：scene1 刷 `4` 只、scene2 刷 `4` 只、scene3 刷 `1` 只，符合配置区间。
- ✅ 最小间距与边界生效：实测 `minDistance=79.91`（接近 scene1 配置 `80`）、`outOfBounds=0`。
- ✅ 热点跳转与入口点正确：scene1→2→3 与 3→2（`{x:100,y:280}`）、2→1（`{x:30,y:480}`）链路正常。
- ✅ 野怪交互与战斗返回稳定：皮皮/仙人球/蘑菇怪均可点击入战，逃跑后返回子场景正常，BGM 维持 `activeBgmCount=1/0`。
- ✅ 连续进出克洛斯星多轮（含穿插战斗）无黑屏、无点击失效、无交互丢失。

### 结果说明
- 本步骤“拆分 KloseScene 并保持行为不变”目标已完成，功能与稳定性通过用户手工回归。
- 按用户指令，已在测试通过后补记本条进度；后续等待用户明确再进入 Phase 4 步骤 8。

---

## Phase 4 步骤 8：Elf 与 BattleManager 职责拆分 ✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/systems/elf/ElfStats.js`：承接精灵属性计算、EV 总量/单项上限、击败后 EV 收益分配、`getStats()` 聚合输出。
- [x] 新增 `js/systems/elf/ElfProgression.js`：承接经验、连升、进化、技能学习/待学习队列逻辑，保持原升级与进化行为。
- [x] 新增 `js/systems/battle/BattleEffects.js`：承接战斗属性阶段倍率、先后手判定、`statChange` 技能效果应用、战斗结束判定、经验奖励计算。
- [x] 重构 `js/systems/Elf.js`：对外 API 保持不变（`addExp`、`checkEvolution`、`evolve`、`getStats` 等），内部改为组合委托 `ElfStats` / `ElfProgression`。
- [x] 重构 `js/systems/BattleManager.js`：对外 API 保持不变（`executeTurn`、`determineOrder` 等），内部把效果与结算逻辑委托给 `BattleEffects`。
- [x] 更新 `index.html` 脚本装配：新增 `elf/` 与 `battle/` 子模块脚本，并保证加载顺序在 `Elf.js` / `BattleManager.js` 之前。

### 用户验证结果（2026-02-12）
- ✅ 模块可用性通过：`typeof ElfStats/ElfProgression/BattleEffects === 'object'`，`Elf` 与 `BattleManager` 关键方法仍可调用。
- ✅ 属性/成长链路通过：属性计算、`addExp` 连升、`checkEvolution`/`evolve` 行为正常。
- ✅ 战斗链路通过：技能释放、先后手、伤害计算、胜利结算、经验与 EV 增长行为正常。
- ✅ 强制切换通过：出战精灵倒下后可正常切换并继续战斗。
- ✅ 逃跑分支通过：分别验证逃跑失败（敌方行动继续）与逃跑成功（直接结束战斗）。
- ✅ 捕捉失败分支通过：胶囊消耗后失败并进入敌方行动，流程可继续。

### 测试备注
- ℹ️ 早期测试中使用“全局覆写 `Math.random`”会触发 Phaser 文本纹理 key 冲突并导致场景报错；改为局部覆写 `BattleManager.prototype.attemptEscape` 与 `CatchSystem.attemptCatch` 后，分支测试稳定通过。

### 结果说明
- 本步骤目标“业务核心解耦且对外行为不变”已完成并通过手工回归。
- 按用户要求，在测试通过后记录本轮实现与验证；下一步是否进入 Phase 4 步骤 9，等待用户指令。

---

## Phase 4 步骤 9：事件总线解耦任务进度（去直连）✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/systems/GameEvents.js`：提供 `emit/on/off/listenerCount`，并定义 `EVENTS.QUEST_PROGRESS`。
- [x] `js/systems/CatchSystem.js`：捕捉成功后由直连 `QuestManager.updateProgress(...)` 改为发射任务事件。
- [x] `js/systems/BattleManager.js`：击败结算后由直连改为发射任务事件。
- [x] `js/systems/elf/ElfProgression.js`：升级时由直连改为发射任务事件。
- [x] `js/systems/QuestManager.js`：新增 `initEventBridge()`，统一订阅任务事件并通过 `_eventsBound` 防重复注册。
- [x] `js/scenes/BootScene.js`：数据初始化后自动执行 `QuestManager.initEventBridge()`。
- [x] `index.html`：新增 `js/systems/GameEvents.js` 脚本装配。

### 用户验证结果（2026-02-12）
- ✅ 启动时日志显示：`[QuestManager] 任务事件桥接已启用，listeners=1`。
- ✅ 多次手动调用 `QuestManager.initEventBridge()` 后，`GameEvents.listenerCount(...)` 始终为 `1`。
- ✅ 捕捉任务链正常：`初次捕捉` 进度正确到 `1/1`，无重复累计。
- ✅ 击败任务链正常：`初次战斗` 按 `1/3 -> 2/3 -> 3/3` 线性推进，无 `+2/+3`。
- ✅ 升级任务链正常：`训练初始` 可正常达成并提交；多次升级事件只会被任务上限截断在 `1/1`，无超限。

### 结果说明
- 任务推进事件已从“多系统直连 QuestManager”改为“统一事件总线消费”，步骤 9 目标完成。

---

## Phase 4 步骤 10：统一场景跳转入口（控制导航耦合）✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/utils/SceneRouter.js`：封装 `start/launch/pause/resume` 与 BGM 策略（`auto/inherit/stop`）。
- [x] `js/utils/SceneManager.js` 改为兼容壳：保留旧 API，内部转发到 `SceneRouter`。
- [x] 将分散直连跳转替换为统一入口：
  - `js/systems/EncounterSystem.js`
  - `js/scenes/battle/BattlePostFlow.js`
  - `js/scenes/SkillLearnScene.js`
  - `js/systems/DevMode.js`
  - `js/scenes/BattleScene.js`
  - `js/scenes/SpaceshipScene.js`
  - `js/scenes/ElfManageScene.js`
- [x] `index.html` 新增 `js/utils/SceneRouter.js`，并放在 `SceneManager.js` 前加载。

### 用户验证结果（2026-02-12）
- ✅ 入口可达性通过：主流程、返回链路、传送链路、图鉴/背包/设置链路均可正常跳转。
- ✅ 叠加场景语义通过：打开精灵管理后 `game.scene.isPaused('SpaceshipScene') === true`，关闭后恢复为 `false` 且场景激活正常。
- ✅ 战斗后返回链路通过：逃跑/胜利均能回到来源场景，无黑屏卡死。
- ✅ 连续进出战斗验证通过：`BgmManager` 日志中 `activeBgmCount` 稳定为 `1/0`，无叠音累计。

### 结果说明
- 导航调用入口已统一到 `SceneRouter`，并保留 `SceneManager` 兼容层保障旧调用点；步骤 10 目标完成。

---

## Phase 4 步骤 11：全局依赖收敛（保持兼容，逐步降耦）✅（用户回归通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 新增 `js/core/AppContext.js`：提供 `register/get/has/unregister/syncFromWindow`，建立 Context 优先、`window.*` 回退的双通道依赖访问。
- [x] `index.html` 注入 `js/core/AppContext.js`（位于 Phaser 后、数据与系统脚本前），保证后续脚本可注册依赖。
- [x] `js/main.js` 将运行时 `game` 同步注册到 Context（`game` 与 `__seerGame`），并保留 `window.__seerGame` 兼容。
- [x] 导航与启动入口改为 Context 优先取依赖：
  - `js/utils/SceneRouter.js`
  - `js/utils/SceneManager.js`
  - `js/scenes/BootScene.js`
- [x] 核心系统改为 Context 优先取依赖（保留原 `window.*` 导出）：
  - `js/systems/DevMode.js`
  - `js/systems/QuestManager.js`
  - `js/systems/CatchSystem.js`
  - `js/systems/BattleManager.js`
  - `js/systems/elf/ElfProgression.js`
  - `js/systems/EncounterSystem.js`
  - `js/scenes/battle/BattlePostFlow.js`
- [x] 关键全局单例补充注册到 Context：`AssetMappings/DataLoader/BgmManager/GameEvents/PlayerData/SaveSystem/ItemBag/ElfBag/DamageCalculator/BattleEffects/Elf/DataIntegrityChecker`。

### 用户验证结果（2026-02-12）
- ✅ Context 可用：`typeof AppContext === 'object'`，`get/register` 可调用。
- ✅ 依赖一致性可用：`AppContext.get('SceneRouter'/'SceneManager'/'DataLoader'/'game')` 与现有全局对象一致。
- ✅ 任务桥接幂等：重复执行 `QuestManager.initEventBridge()` 后监听数仍为 `1`。
- ✅ DevMode 兼容：`window.dev` 与 `AppContext.get('dev')` 挂载/卸载一致，`dev.status()` 正常。
- ✅ 主流程 smoke 通过，连续战斗下 `BgmManager` 仍维持 `activeBgmCount=1/0`。

### 关键修复（本轮联动）
- [x] 修复克洛斯星子场景战斗返回丢失问题：
  - `js/systems/EncounterSystem.js` 进战时注入 `returnData`（`subScene + customEntry`）。
  - `js/scenes/BattleScene.js`、`js/scenes/battle/BattlePostFlow.js`、`js/scenes/SkillLearnScene.js` 全链路透传 `returnData`。
- ✅ 用户验证：scene2/scene3 战斗后可返回原子场景（不再强制回 scene1）。
- ℹ️ 仍待补一条定向回归：在 scene2/scene3 触发“技能学习 -> 进化”链后返回原子场景。

---

## Phase 4 步骤 12：收尾清理（保守版）✅
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 统一依赖访问策略为“Context 优先 + window 回退”，减少新增隐式全局引用。
- [x] 保留 `SceneManager` 兼容壳、`window.*` 导出与 `BattleScene` legacy 回退路径，确保低风险迁移。
- [x] 完成跨场景返回数据链收口（`returnData`），消除克洛斯子场景战斗回退到 scene1 的回归问题。

### 暂不执行（按用户要求）
- [ ] 不进入 Phase 5。
- [ ] 不做激进清理（删除 legacy 委托/兼容壳）；待后续独立回归后再执行。

---

## Phase 4 步骤 12：收尾清理（激进版）✅（核心链路用户回归通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] 全项目内部场景跳转收敛到 `SceneRouter`，移除场景/服务中的 `SceneManager.changeScene(...)` 直接调用：
  - `MainMenuScene`、`SpaceshipScene`、`TeleportScene`、`SettingsScene`、`CaptainRoomScene`
  - `PokedexScene`、`ElfBagScene`、`ItemBagScene`、`ElfManageScene`
  - `EvolutionScene`、`SkillLearnScene`、`klose/HotspotService`
  - `BootScene` 启动跳转改为 `SceneRouter.start(...)`
- [x] `js/utils/SceneManager.js` 收缩为纯兼容 shim（仅转发 `SceneRouter`），不再承担真实导航实现。
- [x] `BattleScene` 进一步去除 legacy 回退：
  - 删除 `__legacy_*` 回退机制。
  - 委托调用改为 **强依赖 facade**（缺失即抛错，避免静默回退隐藏问题）。
  - 删除 `BattleScene` 内已由 `BattlePostFlow` 接管的重复旧实现（战后链路、返回链路、战斗 BGM 清理链路）。
- [x] `BattleHud/BattlePanels/BattleAnimator` 注册到 `AppContext`，与 `BattlePostFlow` 一致，形成可显式解析的门面依赖。

### 用户验证结果（2026-02-12）
- ✅ 主流程全链路可达（主菜单/飞船/船长室/传送舱/克洛斯/战斗/背包/图鉴/设置）。
- ✅ 克洛斯 scene2/scene3 战斗后返回原子场景通过（胜利与多次连续战斗均通过）。
- ✅ 连续进出战斗稳定，无黑屏卡死；`BgmManager` 日志维持 `activeBgmCount=1/0`。
- ✅ 激进模式下未出现 `BattleScene Facade method missing` 报错，说明 Battle facades 解析完整。
- ℹ️ 尚未覆盖“克洛斯 scene2/scene3 中触发技能学习 + 进化链后返回”组合场景（当前已验证学技链在 ElfManage 返回正常）。

---

## Phase 5 步骤 1：BattleScene 门面化 ✅（用户验证通过）
**更新日期：** 2026-02-12

### 本轮已完成
- [x] `js/scenes/BattleScene.js` 重构为纯门面：仅保留 `constructor/init/create`、回合入口（`doSkill/doEscape/executeTurn`）和基础状态。
- [x] 按 `BATTLE_SCENE_FACADE_METHODS` 保留唯一方法清单；清单内方法在 `BattleScene` 中不再存在本地实体实现。
- [x] 在 `create()` 开头新增一次性 facade 自检：`BattleHud/BattlePanels/BattleAnimator/BattlePostFlow` 缺任一方法即抛错并中断初始化。
- [x] 统一 `create()` 入口顺序：`facade自检 -> createBackground -> createTopBar -> createMainBattleArea -> createBottomControlPanel -> createCenterPopupDialog -> BattleManager 初始化 -> 开场日志`。
- [x] 严格门面化收口：移除 `BattleScene.addTypeVisual`，由 `js/scenes/battle/BattlePanels.js` 与 `js/scenes/battle/BattleAnimator.js` 直接委托 `TypeIconView`。
- [x] `BattleScene.js` 行数由约 `2250` 压缩至 `300`，达到“纯门面体量”目标。

### 用户验证结果（2026-02-12）
- ✅ 启动链路与战斗首帧正常：`BootScene` 预加载计数正常，进入战斗后未出现 `Facade method missing`。
- ✅ 主路径回归通过：胜利返回与逃跑返回均可回原场景，无黑屏。
- ✅ 跨子场景回归通过：`Klose scene1/2/3` 均可进入战斗并返回原子场景。
- ✅ 连续战斗稳定：多轮进入/退出战斗行为一致，无随机初始化报错。
- ✅ BGM 生命周期正常：日志中 `activeBgmCount` 始终在 `1/0` 之间切换，无叠音累计。
- ℹ️ 负向自检（故意移除 facade 方法）用户有执行但未保留刷新前控制台截图；基于当前实现，缺失时将由 `verifyBattleSceneFacadesOrThrow()` 直接抛错阻断。

### 阶段约束
- [x] 按用户要求，本轮仅执行 Phase 5 步骤 1。
- [ ] 在用户明确“测试通过并允许继续”前，不进入 Phase 5 步骤 2（亦不启动步骤 6）。

---

## Phase 5 步骤 2：BattlePanels 收敛为“纯交互层” ✅（用户回归通过）
**更新日期：** 2026-02-13

### 本轮已完成
- [x] `js/scenes/battle/BattlePanels.js` 收敛为纯交互层：仅负责面板展示与动作意图提交，不再直接落地 `ItemBag/PlayerData/CatchSystem` 业务写入。
- [x] 统一动作意图入口：技能/道具/捕捉/换宠/逃跑全部通过 `submitPanelIntent(...) -> BattleScene.submitBattleIntent(...)` 提交。
- [x] 建立统一刷新函数：`refreshActionButtons()` + `refreshPanelVisibility()`，只读 `isItemPanelOpen/menuEnabled/battleEnded` 三个状态源驱动按钮灰显与面板显隐。
- [x] 强互斥与重复触发保护：技能面板与道具面板互斥；`showItemPanel/showCapsulePanel/showElfSwitchPanel/close*` 增加幂等保护，防止快速连点导致状态漂移。
- [x] 新增回合提交锁：`BattleScene` 引入 `actionIntentLocked`，行动提交后立即锁定，回合结果返回后解锁，避免重复 action。
- [x] `js/systems/BattleManager.js` 接管道具/捕捉业务：
  - 统一动作类型为 `item_use/catch_attempt`（兼容旧值归一化）
  - 新增 `applyPlayerItem()` 统一处理 HP/PP 道具消耗与结算
  - 捕捉改为基于 `itemId` 在管理器内校验/消耗/判定
  - 无效动作走 `actionRejected` 回到 `PLAYER_CHOOSE`，不推进敌方行动
- [x] 修复强制换宠分支隐患：`BattlePanels.doSwitch()` 在关闭面板前缓存 `wasForceSwitch`，确保“倒地强切”路径不被 `closeElfSwitchPanel()` 重置状态影响。
- [x] 清理启动噪音：`index.html` 显式配置站点图标（`assets/images/seer.png`），移除浏览器默认请求 `/favicon.ico` 导致的 404 控制台报错。

### 用户验证结果（2026-02-13）
- ✅ 用户按步骤执行回归后反馈：核心交互链路未发现“状态错乱/重复提交”类问题。
- ✅ 控制台显示道具、捕捉、换宠、技能、结算链路运行正常，阶段切换一致。
- ✅ 启动阶段唯一异常为 `favicon.ico 404`，已在本轮修复并给出刷新验证路径。

### 结果说明
- Phase 5 步骤 2 目标已完成并记录。
- 按用户约束，尚未进入 Phase 5 步骤 3（更未进入 Phase 6）。

---

## Phase 5 步骤 3：BattleManager 统一回合结果协议 ✅（用户回归通过）
**更新日期：** 2026-02-13

### 本轮已完成
- [x] `js/systems/BattleManager.js` 新增统一回合结果协议骨架：`protocolVersion`、`turn`、`events[]`、`outcome{status/battleEnded/winner/needSwitch/escaped/captured/actionRejected/reason}`。
- [x] 回合事件规范化：统一写入 `turn_start/action_submitted/skill_cast/hit/miss/hp_change/pp_change/item_used/catch_result/escape_result/switch_done/battle_end/stat_change`。
- [x] `executeTurn()` 重构为单出口协议收口：技能/道具/捕捉/逃跑/切换/非法动作均落入同一结果结构；通过 `finalizeTurnResult()` 保留 `battleEnded/winner/needSwitch/catchResult` 等兼容字段。
- [x] 道具与技能副作用事件化：HP 药剂和 PP 药剂写入 `item_used + hp_change/pp_change`；技能释放写入 `pp_change + skill_cast + hit/miss + hp_change`。
- [x] `js/systems/battle/BattleEffects.js` 的属性变化事件改为 `stat_change`，并支持通过 BattleManager 的事件追加回调统一入流。
- [x] `js/scenes/BattleScene.js` 适配新协议：优先读取 `result.outcome` 与新事件名（兼容旧 `skillCast`），捕捉动画优先从 `catch_result` 事件读取。

### 用户验证结果（2026-02-13）
- ✅ 启动与战斗链路稳定：预加载计数、进战、结算、返回均正常；BGM 生命周期保持 `activeBgmCount=1/0`。
- ✅ 技能分支通过：`[TURN_RESULT]` 中可见 `protocolVersion: 2`，并稳定出现 `turn_start/action_submitted/pp_change/skill_cast/...` 事件序列。
- ✅ 逃跑分支通过：强制失败时 `escape_result(success=false)` 且敌方继续行动；强制成功时直接 `battle_end`，`outcome.escaped=true`。
- ✅ 捕捉分支通过：失败时 `item_used + catch_result(success=false)` 且敌方继续行动；成功时 `item_used + catch_result(success=true) + battle_end`，`outcome.captured=true`。
- ✅ 主动换宠分支通过：`switch_done` 事件正常产出并进入敌方行动回合。
- ✅ 任务事件未重复累计：`GameEvents.listenerCount(...)` 全程为 `1`，多场击败统计与实际场次一致，无 `+2/+3` 重复推进。

### 测试备注
- ℹ️ 用户反馈“没看到 `events` 数组本体”已确认是测试钩子仅打印 `eventTypes` 导致；执行 `Array.isArray(window.__lastTurnResult?.events)` 可验证 `events` 真实存在且为数组。

### 结果说明
- 本步骤目标“BattleManager 统一回合结果协议”已完成并通过用户回归。
- 按用户约束，在本次验证通过前未进入后续步骤；当前仅记录 Phase 5 步骤 3 产出，不启动 Phase 6。

---

## Phase 5 步骤 4：BattlePostFlow 幂等收口 ✅（用户回归通过）
**更新日期：** 2026-02-13

### 本轮已完成
- [x] `js/scenes/BattleScene.js` 新增战后收口状态锁：`postFlowLocked`、`returnTriggered`、`bgmStopTriggered`，并将捕捉成功/逃跑成功/战斗结束三条入口统一改为 `finalizeBattleOnce(...)`。
- [x] `js/scenes/battle/BattlePostFlow.js` 新增唯一收口函数 `finalizeBattleOnce(flow, payload)`，把 `handleBattleEnd -> processPostBattle -> processEvolution -> returnToMap` 串为单向流水，防止回流重复执行。
- [x] 战后跳转链路统一透传 `returnData`：技能学习、进化、返回来源场景共用同一透传策略，保证克洛斯子场景上下文不丢失。
- [x] BGM 停止统一走 `fadeOutBattleBgm(...)` 单入口；通过 `bgmStopTriggered` 抑制重复 stop，`cleanupBattleBgm()` 仅在必要时强制收尾。
- [x] `js/scenes/battle/BattleHud.js` 弹窗确认按钮改为一次性消费：首次点击即禁用交互并执行回调，防止连点触发多次跳转。
- [x] 兼容测试注入修复：`js/systems/DamageCalculator.js` 增加上下文兜底（`randomInt/truncate4` 回退到 `DamageCalculator` 静态引用），避免 monkey patch 脱离 `this` 时抛错。

### 用户验证结果（2026-02-13）
- ✅ 用例“克洛斯子场景 -> 战斗胜利 -> 进化 -> 返回原子场景”通过：`KloseScene` 能回到 `subScene=2`，`returnData` 链路正常。
- ✅ 胜利快速结算回归通过：按测试脚本强制高伤后，战斗可正常结束并返回地图，未再出现 `this.randomInt is not a function`。
- ✅ 启动与战斗控制台链路正常：无新增阻断错误，战斗回合执行与场景切换稳定。
- ✅ BGM 生命周期保持稳定：日志仍维持 `activeBgmCount=1/0`，未出现叠音累计。

### 结果说明
- 本步骤目标“BattlePostFlow 幂等收口”已完成并通过用户验证。
- 按用户要求，当前仅记录 Phase 5 步骤 4；在收到新的明确指令前，不进入后续步骤。

---

## Phase 5 步骤 5：BattleAnimator 接口收窄 ✅（用户回归通过）
**更新日期：** 2026-02-13

### 本轮已完成
- [x] `js/scenes/battle/BattleAnimator.js` 收窄为高层演出门面：仅对外保留 `createBackground/createMainBattleArea/createCharacterSprite/playTurnAnimations/playCatchAnimation`。
- [x] `js/scenes/BattleScene.js` 的 `BATTLE_SCENE_FACADE_METHODS.BattleAnimator` 同步收窄，删除低层动画方法暴露，避免场景层拼接底层步骤。
- [x] `BattleScene.executeTurn()` 改为统一调用 `playTurnAnimations(result)`，将技能演出与捕捉演出收口到动画门面。
- [x] 新增动画输入锁：`BattleScene` 增加 `isAnimationPlaying/_animationLockCount`，`submitBattleIntent(...)` 在演出期间拒绝重复提交动作。
- [x] 缺图回退链统一并可观测：`battle atlas -> external still -> shape`，并通过一次性告警去重避免重复刷屏。
- [x] 动画缓存策略保留：atlas 帧序缓存与 animation key 复用仍在动画层私有实现中维护。

### 用户验证结果（2026-02-13）
- ✅ 启动与进战稳定：`BootScene` 预加载计数正常，进战无 `Facade method missing`。
- ✅ 接口收窄验证通过：`Object.keys(BattleAnimator)` 仅剩 5 个高层方法；`playSkillCastAnimation/playElfClip/getAtlasFrameNames` 均为 `undefined`。
- ✅ 三类技能表现通过：物理、特殊、状态技能均可正常结算并返回，无新增阻断异常。
- ✅ 回退链验证通过：移除 `btl_010_still` 后回退 `ext_still_010`；再移除 `ext_still_010` 后回退 shape，战斗可继续。
- ✅ 缺图告警去重通过：同一回退场景只输出一次对应 warning（external 回退一次、shape 回退一次）。
- ✅ 连续进出战斗与导航链稳定：返回场景/BGM 生命周期维持正常（`activeBgmCount` 仍在 `1/0` 区间）。

### 结果说明
- Phase 5 步骤 5 目标“BattleAnimator 接口收窄（只管演出，不碰业务）”已完成并通过用户回归。
- 按用户约束，当前仅记录步骤 5；在用户明确允许前，不进入步骤 6。

---

## Phase 5 步骤 6：BattlePanels 结构化拆分 ✅（用户回归通过）
**更新日期：** 2026-02-13

### 本轮已完成
- [x] 将 `js/scenes/battle/BattlePanels.js` 收敛为门面壳：仅保留共享状态、公开 API、子模块装配与方法转发。
- [x] 新增 `js/scenes/battle/panels/` 子目录并拆分 5 个视图模块：
  - `ActionButtonsView.js`（战斗/道具/精灵/逃跑按钮）
  - `SkillPanelView.js`（技能网格与 PP 展示）
  - `ItemPanelView.js`（道具分类、格子与点击）
  - `CapsulePanelView.js`（胶囊弹层与捕捉意图）
  - `SwitchPanelView.js`（换宠与强制换宠 UI）
- [x] 保持 `BattleScene` 兼容：`BATTLE_SCENE_FACADE_METHODS` 既有方法名不变，外部调用无感。
- [x] 所有面板动作统一走 `submitPanelIntent(...) -> BattleScene.submitBattleIntent(...)`，子模块不直接改写 `PlayerData/ItemBag/CatchSystem`。
- [x] `index.html` 新增 5 个 panels 脚本，并放在 `BattlePanels.js` 之前加载，确保门面可装配子视图。
- [x] 面板生命周期统一：每个子模块提供 `mount/update/unmount`，并对 `show*/close*` 路径保持幂等。
- [x] 修复场景复用残留状态：在 `createBottomControlPanel()` 强制重置 `isItemPanelOpen/forceSwitchMode/selectedSwitchIndex` 与容器引用；在 `refreshPanelVisibility()` 增加状态自愈，避免“面板已销毁但状态仍为打开”导致技能区消失。

### 用户验证结果（2026-02-13）
- ✅ 结构与兼容性通过：`BattlePanels` 与 5 个子模块对象均可访问，公开方法清单完整。
- ✅ 幂等与状态矩阵通过：道具/胶囊/换宠面板重复开关无报错；战斗↔道具切换 20 次后状态稳定（`[false, true, true]`）。
- ✅ 捕捉分支通过：失败后敌方继续行动；成功后正常结束战斗并返回地图。
- ✅ 强制换宠链路通过：实战中倒地后出现换宠流程，提交 `switch` 后战斗可继续。
- ✅ 回归问题已修复：用户在步骤 8→9 过渡中发现“战斗中部面板消失”，补丁后复测得到 `[true, false, false, true, true]`，UI 状态恢复正常。

### 结果说明
- Phase 5 步骤 6 目标“BattlePanels 结构化拆分（交互壳 + 子视图）”已完成并通过用户回归。
- 当前已按用户要求在测试验证后补记实施与验证结论；后续步骤待用户新指令。

---

## Phase 5 步骤 7：BattleManager 结构化拆分 ✅（用户回归通过）
**更新日期：** 2026-02-13

### 本轮已完成
- [x] 新增 `js/systems/battle/manager/BattleTurnProtocol.js`：抽离统一回合协议壳（`createTurnResult/appendTurnEvent/finalizeTurnResult`）与兼容字段回填。
- [x] 新增 `js/systems/battle/manager/BattleActionExecutor.js`：抽离技能执行路径（PP、命中、伤害、效果）和事件写入。
- [x] 新增 `js/systems/battle/manager/BattleActionResolver.js`：抽离 `item_use/catch_attempt/switch/escape/skill` 分支解析与敌方行动准备。
- [x] 新增 `js/systems/battle/manager/BattleOutcomeFlow.js`：抽离回合后检查、胜败处理、经验/升级/进化待处理与任务事件发射。
- [x] 重构 `js/systems/BattleManager.js` 为门面编排层：保留对外 API 与常量，内部改为委托 `battle/manager/*`。
- [x] 更新 `index.html`：新增 `battle/manager/*.js`，并保证加载顺序在 `BattleManager.js` 前。
- [x] 回归中联动修复 UI 生命周期问题：
  - `js/scenes/battle/BattlePanels.js` 增加战斗重进清理、状态重置与技能面板自愈重建。
  - `js/scenes/battle/panels/SkillPanelView.js`、`js/scenes/battle/panels/ActionButtonsView.js` 增加失效容器检测，避免复用悬空引用。

### 用户验证结果（2026-02-13）
- ✅ 模块装配通过：`typeof BattleTurnProtocol/BattleActionExecutor/BattleActionResolver/BattleOutcomeFlow` 均可用，`BattleManager` 关键接口存在。
- ✅ 协议与事件流通过：`protocolVersion===2`、`events[]`、`outcome{...}` 在技能/道具/逃跑/换宠分支均正常产出。
- ✅ `switch_done` 事件验证通过：主动换宠后 `window.__lastTurnResult.events` 可命中 `switch_done`。
- ✅ 监听幂等验证通过：10 场战斗前后 `GameEvents.listenerCount(GameEvents.EVENTS.QUEST_PROGRESS)` 为 `{before:1, after:1, ok:true}`。
- ✅ 回归问题修复通过：用户复测后技能面板保持可见（`hasSkillContainer:true, skillVisible:true, skillChildren:4, skillButtons:4`），不再出现“UI 消失但可点击”。

### 结果说明
- Phase 5 步骤 7 目标“BattleManager 结构化拆分（门面稳定 + 规则分层）”已完成并通过用户回归。
- 已按用户要求在测试通过后补记本轮产出与验证结论。

---

## Phase 6：状态异常系统 ✅（用户回归通过）
**更新日期：** 2026-02-14

### 本轮已完成
- [x] 新增 `js/systems/StatusEffect.js`：统一管理异常状态元数据、施加/覆盖/清除、回合末结算、行动阻断与展示顺序。
- [x] 状态模型落地到精灵实例数据：`js/systems/Elf.js`、`js/systems/PlayerData.js`、`js/systems/CatchSystem.js` 增加 `status` 持久化字段并兼容旧存档。
- [x] 战斗状态效果接入：
  - `js/systems/battle/BattleEffects.js` 支持 `effect.type='status'`，并兼容 `exhausted/selfExhausted` 到疲惫状态。
  - `js/systems/battle/manager/BattleActionExecutor.js` 增加控制类状态阻断（`action_blocked`），并实现“睡眠受击后解除、当回合仍不可行动”。
  - `js/systems/BattleManager.js` + `js/systems/battle/manager/BattleOutcomeFlow.js` 增加回合末状态结算（中毒/冻伤/烧伤每回合 `maxHp/8`，写入 `status_damage/hp_change/status_removed` 事件）。
- [x] 伤害系统联动：`js/systems/DamageCalculator.js` 接入烧伤威力减半（攻击技能威力按 50% 计算）。
- [x] 资源与 HUD 联动：
  - `data/assets/UIAssets.js`、`data/AssetMappings.js` 新增 `statusIcons` 映射与查询 API。
  - `js/scenes/BootScene.js` 新增异常状态图标预加载。
  - `js/scenes/battle/BattleHud.js` 新增顶部状态栏下方双方状态图标行；获得状态即时出现，结束状态即时消失。
  - `js/scenes/BattleScene.js`、`js/scenes/battle/panels/SwitchPanelView.js` 接入图标刷新。
- [x] 战斗外治疗清状态：`js/scenes/ElfManageScene.js` 的“回复(120)”同时清除异常状态；按钮可用条件改为“掉血或有异常状态”。
- [x] 脚本装配更新：`index.html` 注入 `js/systems/StatusEffect.js`。

### 状态图标映射
- `frostbite -> assets/images/ui/icons/status/dongshang.png`
- `fear -> assets/images/ui/icons/status/haipa.png`
- `paralysis -> assets/images/ui/icons/status/mabi.png`
- `exhausted -> assets/images/ui/icons/status/pibei.png`
- `burn -> assets/images/ui/icons/status/shaoshang.png`
- `sleep -> assets/images/ui/icons/status/shuimian.png`
- `poison -> assets/images/ui/icons/status/zhongdu.png`

### 用户验证结果（2026-02-14）
- ✅ 资源层验证通过：状态图标 7 个全部预加载成功，纹理 key 全部存在。
- ✅ HUD 验证通过：施加状态后图标即时出现，清除后即时消失；玩家与敌方图标行均可刷新。
- ✅ 数值验证通过：中毒/冻伤/烧伤回合末扣血均为 `maxHp/8`（样例：`maxHp=44` 时每回合扣 `5`）。
- ✅ 烧伤减伤验证通过：日志可见技能威力从 `35 -> 17`，伤害结果按降威力后计算。
- ✅ 控制类阻断验证通过：睡眠时行动被阻断且不扣 PP（`action_blocked` 存在，PP 不变）。
- ✅ 睡眠受击解控验证通过：受击后睡眠解除，同回合仍不可行动（`woken_this_turn`），下一回合恢复可行动。
- ✅ 规则验证通过：弱化类可并存（如中毒+烧伤），控制类仅保留一种（后者覆盖前者，例：最终为疲惫）。
- ✅ 战后保留与治疗清除验证通过：战斗结束后状态保留；精灵管理“回复(120)”后状态清空为 `{ weakening: {}, control: null }`。

### 结果说明
- Phase 6 目标“状态异常系统”已按计划完成并通过用户手工回归。

---

## New Plan Step1：克洛斯星 BGM 接入 ✅（用户验证通过）
**更新日期：** 2026-02-16

### 本轮已完成
- [x] `data/assets/AudioAssets.js`：新增 `KloseScene -> klose_planet` BGM 映射，并新增 `bgmPaths/bgmDataKeys`（路径与数据键解耦）。
- [x] `data/AssetMappings.js`：新增 `bgmPaths/bgmDataKeys` 聚合；`getBgmPath()` 支持非默认目录；新增 `getBgmDataKey()`；`getAllBgmAssets()` 返回 `key/path/dataKey`。
- [x] `data/BgmData.js`：新增 `Klose_BGM` Base64 数据，并保留战斗 BGM Base64 数据。
- [x] `js/scenes/BootScene.js`：BGM 预加载改为“Base64 优先（兼容 `file://` 与 `http://`），缺失时非 `file://` 回退文件路径”。
- [x] `js/scenes/KloseScene.js`：在 `create()` 中调用 `BgmManager.transitionTo('KloseScene', this)`，确保进/回克洛斯时恢复星球 BGM。

### 用户验证结果（2026-02-16）
- ✅ 启动日志显示 `BootScene` 成功预加载 `2` 个 BGM，且无 `bgm_seer_battle_1/bgm_klose_planet` 资源加载失败日志。
- ✅ 缓存验证通过：`cache.audio.exists('bgm_seer_battle_1') === true`、`cache.audio.exists('bgm_klose_planet') === true`（`http:` 环境）。
- ✅ 克洛斯 T1/T2 通过：进入 `KloseScene` 与 `1->2->3->2->1` 子场景切换期间，`currentBgmKey='bgm_klose_planet'`，`activeBgmCount=1`，无叠音。
- ✅ 克洛斯战斗切歌与恢复通过：进战后为 `bgm_seer_battle_1`，战后返回克洛斯自动恢复 `bgm_klose_planet`，日志保持单轨生命周期。

### 阶段边界
- [x] 按用户要求仅执行并完成 `new_feature-implementation.md` Step1。
- [x] 在用户验证 Step1 通过前未启动 Step2。

---

## New Plan Step1 子步骤：赛尔机器人 8 方向行走替换 ✅（用户验证通过）
**更新日期：** 2026-02-16

### 本轮已完成
- [x] `data/assets/WorldAssets.js`：新增赛尔玩家方向图集映射（`front/back/left/left_down/right_up`），并约定缺失方向通过镜像补齐。
- [x] `data/AssetMappings.js`：新增 `seerDynamicAtlases/seerDynamicClips` 聚合字段与查询 API（`getSeerDynamicAtlasKey/getAllSeerDynamicAtlases`）。
- [x] `js/scenes/BootScene.js`：新增赛尔方向图集预加载，启动日志可观测。
- [x] `js/scenes/klose/PlayerAnimator.js`（新增）：落地玩家 `start -> 数字帧循环 -> end` 动画管线；支持 8 方向映射与镜像方向（`right/right_down/left_up`）。
- [x] `js/scenes/KloseScene.js`：玩家创建由固定图块切换为赛尔方向动画体，资源缺失时保留图形回退分支。
- [x] `js/scenes/klose/MoveController.js`：接入 8 方向判定与距离阈值（`<70px` 不循环）；新增同目标同方向重复点击去重，避免动画重复重播。
- [x] 速度参数收敛：根据用户多轮体感反馈最终定格为恒速慢速 `msPerPixel=5.5`（`Linear`、`startDelay=0`）。

### 用户验证结果（2026-02-16）
- ✅ 启动阶段通过：`BootScene` 日志显示成功预加载 `5` 组赛尔方向图集。
- ✅ 资源缓存通过：`seer_dyn_front/back/left/left_down/right_up` 纹理键均存在。
- ✅ 阈值规则通过：短距移动仅 `start -> end`，长距移动出现数字帧循环并在到点回 `end`。
- ✅ 8 方向映射通过：`right -> left镜像`、`right_down -> left_down镜像`、`left_up -> right_up镜像` 实测正确。
- ✅ 视觉体验通过：锚点与循环序列优化后“走路抖动”显著降低（用户反馈“基本不晃”）。
- ✅ 交互稳定性通过：连续同位置同方向点击不再重复触发同一段行走动画。

### 阶段边界
- [x] 本轮仍属于 `new_feature-implementation.md` Step1 的扩展子步骤。
- [x] 未启动 Step2 代码实施。

---

## New Plan Step2：非战斗常驻底栏 + 弹窗化 + 继续游戏恢复 ✅（用户验证通过）
**更新日期：** 2026-02-16

### 本轮已完成
- [x] 新增统一基座：
  - `js/ui/WorldBottomBar.js`：非战斗世界场景统一底栏（地图/背包/精灵背包）。
  - `js/ui/ModalOverlayLayer.js`：弹窗透明遮罩与输入拦截基座（幂等 mount/unmount）。
- [x] 四个非战斗主场景接入统一底栏：
  - `js/scenes/SpaceshipScene.js`
  - `js/scenes/CaptainRoomScene.js`
  - `js/scenes/TeleportScene.js`
  - `js/scenes/KloseScene.js`
- [x] 地图按钮行为收敛：
  - `SpaceshipScene`：地图按钮禁用（灰显）。
  - `TeleportScene`：地图按钮禁用（灰显）。
  - `CaptainRoomScene`、`KloseScene`：地图按钮返回 `SpaceshipScene`。
- [x] 弹窗化完成：
  - `js/scenes/ItemBagScene.js` 改为弹窗（launch 打开，stop 关闭，不 pause 底层）。
  - `js/scenes/PokedexScene.js` 改为弹窗（由精灵管理弹窗叠加打开）。
  - `js/scenes/ElfManageScene.js` 关闭逻辑改为 stop；接入 `ModalOverlayLayer`。
- [x] `ElfManageScene` 按钮区重构：`first -> cure -> elf_storage -> elf_handbook -> exp(dev)`。
- [x] 图鉴入口迁移：飞船旧资料室入口下线，图鉴入口迁移至 `ElfManageScene` 左侧动作区。
- [x] 继续游戏恢复补齐：`js/scenes/MainMenuScene.js` 支持 `klose_1/2/3` 恢复到正确 `subScene`。
- [x] `ElfBagScene` 全链路删除：
  - 删除文件：`js/scenes/ElfBagScene.js`
  - 删除脚本引用：`index.html`
  - 删除场景注册：`js/main.js`
- [x] 飞船页面补回“设置”入口：`js/scenes/SpaceshipScene.js` 新增设置房间按钮并透传 `returnScene`。

### 用户验证结果（2026-02-16）
- ✅ 启动与资源加载通过：Boot 预加载与主流程无阻断错误。
- ✅ 底栏交互通过：地图行为、禁用态与场景跳转符合预期。
- ✅ 弹窗交互通过：`ItemBag/ElfManage/Pokedex` 叠加打开/关闭稳定，底层场景可恢复交互。
- ✅ 场景恢复通过：继续游戏可恢复到正确的克洛斯子场景。
- ✅ 删除验证通过：无 `ElfBagScene` 相关未定义报错。

### 回归过程额外修复（用户测试中发现）
- [x] 修复 DevMode 连续加经验触发多段学技/进化时的返回链污染与空指针：
  - `js/systems/DevMode.js`：过滤 transient returnScene（`SkillLearnScene/EvolutionScene`），并清理无效 pending skill。
  - `js/scenes/SkillLearnScene.js`：补充 `elf/newSkillId` 防御、链式 pending skill 清洗、返回场景安全回退。
  - `js/scenes/EvolutionScene.js`：返回场景安全回退，避免回跳 transient 过场场景。
- [x] 用户复测通过：无 `SkillLearnScene.getDisplayName` 空指针异常，链式流程可正确回到世界场景。

### 阶段边界
- [x] 按用户要求，Step2 完成后才进行文档更新（`progress.md` + `architecture.md`）。
- [x] Step2 已完成并经用户控制台回归验证通过。
- [x] Step3 尚未启动。

---

## New Plan Step3：SkillsData 全 effect 实装（29 类）✅（用户控制台验证通过）
**更新日期：** 2026-02-16

### 本轮已完成
- [x] 新增战斗 effect 基础设施目录 `js/systems/battle/effects/`：
  - `EffectRegistry.js`
  - `EffectHelpers.js`
  - `EffectRuntime.js`
  - `EffectRuntimeTick.js`
- [x] 完成 “一类 `effect.type` 一文件” 落地，新增 29 个处理器文件（覆盖 `SkillsData` 全部 effect 类型）。
- [x] `BattleActionExecutor` 升级为 effect dispatcher 主入口，支持四阶段钩子：
  - `beforeDamage`
  - `onHit`
  - `afterDamage`
  - `afterSkill`
- [x] 新增 `BattleActionExecutorSupport.js`，收敛执行辅助能力（缺失 handler 告警、虚无护盾拦截、状态技封印 PP 惩罚、受击唤醒）。
- [x] `BattleManager.js` 新增 effect 事件常量（`effect_applied/effect_tick/effect_expired`），并接入 runtime 回合重置/回合末 tick/战斗结束清理。
- [x] `BattleActionResolver.js` 接入 runtime 行动顺序记录，并新增禁疗状态下 HP 药剂阻断。
- [x] `BattleEffects.js` 先后手判定接入 runtime 优先级加成。
- [x] `DamageCalculator.js` 支持 `overridePower/forceCritical`，并修正 `accuracy: null` 命中逻辑为必中。
- [x] `index.html` 完成 effect 基础设施与 29 处理器脚本注入顺序更新。

### Step3 特殊规则落地
- [x] `multiHit`：改为单次伤害结算后按命中次数汇总。
- [x] `conditional(targetHpBelow50)`：威力翻倍。
- [x] `conditional(targetBuffed)`：`basePower + positiveStageSum * bonusPowerPerStage`。
- [x] `transferBuffAndGrowingFixedDamage`：每次施放固定伤害 `+40`，上限 `400`，按施法者按战斗计数，战斗结束重置。
- [x] `fieldEffect` 约束保持：`mist` 逻辑可用，`id=204` 仍为 `waterSport`。

### 用户验证结果（2026-02-16）
- ✅ 用户执行控制台脚本 `await step3.rules()`，结果 `12/12` 全通过。
- ✅ 核心校验通过：29 类型注册覆盖、`multiHit` 单次结算、`conditional` 规则、`transfer` 递增封顶与战斗结束重置、`fieldEffect` 特例约束。
- ✅ 用户执行 `step3.all()` 返回 `kind: 'all'`（包含 `smoke29` 与 `rules` 结果对象）。

### 阶段边界
- [x] Step3 已完成并通过用户验证。
- [x] 按用户要求，Step3 验证通过后才更新文档（`progress.md` + `architecture.md`）。
- [x] Step4 已于 2026-02-17 完成（见下一节）。

---

## New Plan Step4：战斗 UI 重排 + 日志规则 + 飘字时序修复 ✅（用户控制台验证通过）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] 顶部状态栏按新规范重排（`js/scenes/battle/BattleHud.js`）：
  - 左侧头像框采用“圆角矩形外框 + 圆形内框 + Lv:XX（头像下方）”。
  - 右侧信息区外置于头像框外，显示“名字 + HP 当前/最大 + 下方长血条”。
  - 敌方状态栏镜像布局，名字/HP 对齐逻辑按最终确认口径修正（敌方名字在信息区右侧）。
- [x] 状态图标行增强（`js/scenes/battle/BattleHud.js`）：
  - 在异常状态图标后展示属性阶段标签（仅显示非 0 项，范围 `-6~+6`）。
  - 正向阶段：黄色字 + 橙色圆角底；负向阶段：淡紫字 + 深紫圆角底。
- [x] 战斗日志规则重做（`js/scenes/battle/BattleHud.js` + `js/scenes/BattleScene.js`）：
  - 日志改为只记录技能释放，不再展示伤害值/道具/逃跑/捕捉等文字。
  - 文本模板统一为：`【精灵名】使用了技能名，【状态】：XX`。
  - 颜色分段：我方名白色、敌方名紫色、技能名黄色、状态段绿色。
  - 使用多段 Text 拼接实现单行多色富文本效果。
- [x] 飘字系统落地并多轮修正（`js/scenes/battle/BattleHud.js`）：
  - 样式改为“纯文本 + 描边”，移除背景块。
  - 统一原地淡出，不再上浮。
  - 展示时长统一为 `3500ms`。
  - 颜色映射保持规则：普通伤害红/黄，效果伤害紫/白，药剂回血绿/白，效果回血紫/白。
- [x] 飘字时序修复（`js/scenes/battle/BattleAnimator.js` + `js/scenes/BattleScene.js`）：
  - 由“整回合动画后统一发放”改为“每个 `skill_cast` 动画后，按该技能事件窗口即时发放对应 `hp_change`”。
  - 解决“敌方先手时飘字延迟到回合末统一结算”的问题。
  - 场景层保留兜底逻辑：若动画层已派发飘字则不重复派发。
- [x] 交互与视觉微调：
  - 右下四个动作按钮整体下移，并在右侧区域内居中（`js/scenes/battle/panels/ActionButtonsView.js`）。
  - 物理攻击位移幅度收敛，减少冲刺距离（`js/scenes/battle/BattleAnimator.js`）。
  - 顶部倒计时层级恢复（避免被 HUD 遮挡）。
  - 克洛斯赛尔机器人 8 方向图再缩小：当前缩放系数 `0.68`（`js/scenes/klose/PlayerAnimator.js`）。

### 用户验证结果（2026-02-17）
- ✅ 敌方先手回合验证通过：`BattleActionResolver` 日志顺序为 `['enemy', 'player']`。
- ✅ 飘字分批派发验证通过（非整回合统一结算）：
  - 第一批：`['player:-2:damage']`
  - 第二批：`['enemy:-14:damage', 'player:7:effect_heal']`
- ✅ 吸取回血飘字出现验证通过：`player:+7:effect_heal`。
- ✅ 伤害/回血飘字样式验证通过：无背景块，文字描边可见，按 `3500ms` 淡出。
- ✅ 顶部状态栏、动作按钮位置与镜像规则按多轮反馈已调整到位。

### 阶段边界
- [x] Step4 已完成并通过用户控制台验证。
- [x] 按用户要求，测试通过后才更新 `progress.md` 与 `architecture.md`。
- [x] Step5 已在后续章节完成并通过用户验证。

---

## New Plan Step5：收尾清理与文档同步 ✅（用户控制台验证通过）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] `memory-bank/new_feature-implementation.md` 作为 Step5 事实源已更新：补充实施状态、落地记录与门禁口径。
- [x] `js/scenes/ElfManageScene.js` 弹窗关闭链路稳定性补丁：
  - 构造器新增 `returnScene='SpaceshipScene'` 与 `returnData={}` 默认值；
  - `init(data = {})` 防空参数；
  - `openPokedexModal()` 对父级返回链参数兜底；
  - `closePanel()` 新增目标场景存在性校验，失效时回退 `SpaceshipScene`，避免 `SceneRouter.start(undefined)`。
- [x] Step5 清理项核验通过：`js/scenes/ElfBagScene.js` 已删除，`index.html` 与 `js/main.js` 无 `ElfBagScene` 引用/注册。
- [x] 文档更新顺序遵循用户要求：先代码与计划落地，待用户回归通过后补写 `progress.md` 与 `architecture.md`。

### 用户验证结果（2026-02-17）
- ✅ 弹窗链路回归通过：`await __runStep4()` 返回 `{ ok: true, active: ['SpaceshipScene'] }`，`ItemBag -> ElfManage -> Pokedex -> 关闭` 全链路稳定。
- ✅ 删除验证通过：`typeof ElfBagScene === 'undefined'`，`Boolean(window.__seerGame.scene.keys?.ElfBagScene) === false`。
- ✅ 底栏按钮状态通过：`SpaceshipScene` 中 `map=false`、`bag=true`、`elf=true`。
- ✅ `TeleportScene` 返回来源与兜底通过：能返回 `KloseScene(subScene=2)`；来源失效时回退 `SpaceshipScene`。
- ✅ 继续游戏恢复通过：`PlayerData.currentMapId='klose_3'` 后 `MainMenuScene.continueGame()` 正确进入 `KloseScene(subScene=3)`。

### 结果说明
- Step5 已完成并通过用户控制台验证。
- 按用户约束，本轮在测试通过前未进入后续步骤；当前仅补齐 Step5 归档文档。

---

## New Plan Phase 0：基线与设计冻结 ✅（用户验收后归档）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] 全量阅读 `/memory-bank` 文档并完成本轮上下文对齐：`new_plan.md`、`new_feature-implementation.md`、`architecture.md`、`progress.md`、`claude.md`、`feature-implementation.md`、`design-document.md`、`implementation-plan.md`。
- [x] 冻结本轮边界：仅允许 UI/交互与可维护性优化；不改战斗数值公式、命中规则、克制规则与 effect 协议语义。
- [x] 梳理技能图标解析链路并形成单入口约束：`AssetMappings.getTypeIconKey(...) -> TypeIconView.render(...)`；后续 `category='status'` 覆盖必须集中在公共解析层。
- [x] 冻结技能 Tooltip 复用方案：新增 `SkillTooltipView`（`show/move/hide/unmount`）作为唯一实现，战斗/技能替换/精灵管理三界面仅做挂载调用。
- [x] 冻结技能替换与进化界面规范：`SkillLearnScene`、`EvolutionScene` 均改为弹窗化视觉容器，保留原链式返回与业务判定。
- [x] 完成回归范围定义：战斗链路、学技链路、进化链路、弹窗关闭返回链、`file://` 与 `http://` 双环境资源链路。
- [x] 阶段边界已执行：在用户验证通过前未启动 Phase 1 代码改动。

### Phase 0 目标文件与入口清单（供后续开发）
- [x] 图标映射链：`data/assets/UIAssets.js`、`data/AssetMappings.js`、`data/TypeIconData.js`、`js/scenes/BootScene.js`、`js/ui/TypeIconView.js`。
- [x] 战斗技能展示入口：`js/scenes/battle/panels/SkillPanelView.js`、`js/scenes/battle/panels/SwitchPanelView.js`。
- [x] 学技/背包技能展示入口：`js/scenes/SkillLearnScene.js`、`js/scenes/ElfManageScene.js`。
- [x] 进化弹窗与链路入口：`js/scenes/EvolutionScene.js`、`js/scenes/battle/BattlePostFlow.js`、`js/systems/DevMode.js`。
- [x] 已有弹窗基座复用位：`js/ui/ModalOverlayLayer.js`、`js/ui/WorldBottomBar.js`（用于统一生命周期与交互约束）。

### 结果说明
- Phase 0 已完成并归档为“设计冻结阶段”，本阶段不包含业务代码修改。
- 后续开发可直接按上述目标文件清单推进 Phase 1；若出现边界冲突，需先回到 Phase 0 约束重新评审。

---

## New Plan Phase 1：`status` 技能图标替换 ✅（用户验证通过）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] `data/assets/UIAssets.js`：在 `typeIcons` 新增 `status: '30px-status'` 映射。
- [x] `js/ui/TypeIconView.js`：新增统一技能图标解析入口 `resolveSkillDisplayType/getSkillIconKey/renderSkill`，并固定规则为“`category==='status'` 显示 `status` 图标，否则按 `type` 显示”。
- [x] `js/scenes/battle/panels/SkillPanelView.js`：战斗技能按钮图标改为统一调用 `TypeIconView.renderSkill(...)`。
- [x] `js/scenes/battle/panels/SwitchPanelView.js`：战斗换宠面板技能卡图标改为统一调用 `TypeIconView.renderSkill(...)`。
- [x] `js/scenes/SkillLearnScene.js`：技能学习界面“新技能卡”图标改为统一调用 `TypeIconView.renderSkill(...)`。
- [x] `js/scenes/ElfManageScene.js`：右侧技能卡图标改为统一调用 `TypeIconView.renderSkill(...)`。
- [x] `data/TypeIconData.js`：通过 `tools/generate-type-icon-data.ps1` 重新生成，补齐 `30px-status` Base64 键，保证 `file://` 可用。

### 用户验证结果（2026-02-17）
- ✅ 启动链路通过：`BootScene` 日志显示“预加载 17 个属性图标”，且无 `type_30px-status` 加载失败。
- ✅ 资源链路通过：`AssetMappings.getTypeIconKey('status')` 可解析到 `type_30px-status`，`TypeIconData['30px-status']` 存在，`textures.exists('type_30px-status')` 为 `true`。
- ✅ 公共解析规则通过：`TypeIconView.resolveSkillDisplayType(DataLoader.getSkill(2)) === 'status'`，`TypeIconView.getSkillIconKey(...) === 'type_30px-status'`；物理技能仍按原 `type` 显示。
- ✅ 界面验证通过：`ElfManageScene` 技能清单中 `缩头 | status | normal` 按 `status` 图标显示，`撞击/吸取/疾风刃` 继续按 `normal/grass` 图标显示。
- ✅ 定向场景验证通过：`SkillLearnScene` 以 `newSkillId=2` 进入后可正常显示 `status` 图标并完成“放弃学习 -> 返回”链路。
- ✅ 战斗链路 smoke 通过：战斗创建、技能释放、结算与返回地图流程正常，未出现数值与流程阻断回归。

### 阶段边界
- [x] 按用户要求，本轮仅实施 `new_plan.md` 的 Phase 1。
- [x] 在用户验证通过前未启动 Phase 2 开发。

---

## New Plan Phase 2：三界面技能悬停提示窗 ✅（用户验证通过）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] 新增统一 Tooltip 基座：`js/ui/SkillTooltipView.js`。
  - 提供 `mount/show/move/hide/unmount` 五个生命周期方法；
  - 样式收敛为灰色圆角小窗，文案固定为“技能名（黄色）+ 类别文本 + 描述”；
  - 支持鼠标跟随与边界防溢出，不拦截底层业务点击。
- [x] 入口装配更新：`index.html` 注入 `js/ui/SkillTooltipView.js`，确保战斗/学技/精灵管理三个场景可直接复用。
- [x] 战斗技能区接入 Tooltip：`js/scenes/battle/panels/SkillPanelView.js`。
  - 技能按钮统一接入 `pointerover/move/out`，悬停可见 Tooltip；
  - `PP=0` 仍允许悬停查看 Tooltip；
  - 行为修复：按钮可点击性改为实时读取当前 PP（不再使用创建时静态快照），杜绝“改成 0 PP 仍可释放”。
- [x] 战斗面板生命周期收口：`js/scenes/battle/BattlePanels.js`。
  - 技能面板重建、道具面板打开、强制换宠、战斗结束等路径统一 `hide` Tooltip，防止残留悬浮层。
- [x] 技能替换界面接入 Tooltip：`js/scenes/SkillLearnScene.js`。
  - 新技能卡与旧技能槽均支持悬停提示；
  - 场景 `shutdown/destroy` 与返回链路统一清理 Tooltip。
- [x] 精灵管理界面接入 Tooltip：`js/scenes/ElfManageScene.js`。
  - 右侧技能卡支持悬停提示；
  - 切换精灵、打开图鉴弹窗、关闭精灵管理弹窗时统一隐藏 Tooltip，避免跨弹窗残留。

### 用户验证结果（2026-02-17）
- ✅ 基座加载通过：`typeof SkillTooltipView === 'object'`。
- ✅ `SkillLearnScene` 悬停链路通过：脚本拉起学技界面后可正常交互并可“放弃学习 -> 返回世界场景”。
- ✅ Tooltip 残留检查通过：`BattleScene/SkillLearnScene/ElfManageScene` 的 `__seerSkillTooltipState.root.visible` 均为 `false`（非悬停状态）。
- ℹ️ 一次控制台报错 `Cannot read properties of undefined (reading 'skills')` 已确认是测试前置条件问题（在非战斗场景读取 `BattleScene`），非功能回归。
- ✅ 用户当前回归结论：本阶段“应该没问题”。

### 阶段边界
- [x] 按用户约束，本轮仅实施并修复 `new_plan.md` 的 Phase 2。
- [x] 在用户验证通过前未启动 Phase 3。

---

## New Plan Phase 3：技能替换界面弹窗化 ✅（用户控制台+手工回归通过）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] `js/scenes/SkillLearnScene.js` 从全屏学技界面改为弹窗语义：接入 `ModalOverlayLayer`，底层场景保持 active，关闭时 `scene.stop()` 收口。
- [x] 新增 `js/scenes/skilllearn/SkillLearnModalView.js`，抽离学技界面纯视图层：标题、白底技能区、5 技能位（上 1 下 2x2）、按钮绘制与卡片选中态。
- [x] `index.html` 新增 `SkillLearnModalView.js` 脚本装配，保证场景创建时可挂载视图模块。
- [x] 交互状态落地：
  - `替换` 按钮默认禁用，选中旧技能后启用；
  - 旧技能选中态为橙色高亮；
  - `取消` 仅放弃当前技能并继续 pending 链。
- [x] 链路保持与收口加固：
  - 替换技能时同步 `skills/skillPP`，清理被替换技能 PP；
  - pending skill 队列继续处理；
  - 学技后可衔接进化弹窗；
  - `returnScene/returnData` 透传并保留安全回退。
- [x] 上游触发口径统一：
  - `js/scenes/battle/BattlePostFlow.js` 学技入口改为 `SceneRouter.launch(...)`；
  - `js/systems/DevMode.js` 直触学技改为 `SceneRouter.launch(...)`。

### 用户验证结果（2026-02-17）
- ✅ 直接拉起学技弹窗可用：`SceneRouter.launch(host,'SkillLearnScene',...)` 成功。
- ✅ 替换验证通过：示例 `newSkillId=521`，替换后技能变为 `[301,302,521,304]`，且 `skillPP[521] === 5`。
- ✅ 取消+链式验证通过：两段 pending skill 依次处理后，`ElfBag.getByIndex(0).getPendingSkills()` 为空。
- ✅ 场景收口验证通过：链路结束后活动场景恢复到世界场景（示例 `['KloseScene']`）。

### 阶段边界
- [x] 按用户要求，本轮先完成并验证 Phase 3。
- [x] 在用户验证通过前未启动 `new_plan.md` Phase 5。

---

## New Plan Phase 4：进化界面弹窗化 ✅（用户控制台+手工回归通过）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] `js/scenes/EvolutionScene.js` 重构为结算弹窗：接入 `ModalOverlayLayer`，不再使用全屏过场结构。
- [x] 左侧信息区重构：旧形态 -> 新形态、黄色光效区、形态替换动画、等级/经验文案。
- [x] 右侧属性表重构：统一 7 行（等级/体力/攻击/防守/特攻/特防/速度），展示格式为 `+提升值 -> 新值`。
- [x] 底部确认按钮改为“动画完成后可点”，点击后按 `returnScene/returnData` 收口。
- [x] 上游触发口径统一：
  - `js/scenes/battle/BattlePostFlow.js` 进化入口改为 `SceneRouter.launch(...)`；
  - `js/systems/DevMode.js` 直触进化改为 `SceneRouter.launch(...)`。

### 用户验证结果（2026-02-17）
- ✅ 直接拉起进化弹窗通过：`SceneRouter.launch(host,'EvolutionScene',...)` 可正常显示。
- ✅ 进化动画与结算通过：控制台可见 `EvolutionScene` 完成日志并可确认返回。
- ✅ 学技->进化串链通过：在学技链后可自动衔接进化弹窗并完成收口。
- ℹ️ 测试脚本中出现一次 `ElfProgression` “无法进化：条件不满足”日志，已确认为测试时强制 `canEvolve=true` 与精灵真实条件不一致导致，非本轮弹窗改造回归。

### 阶段边界
- [x] 按用户要求，Phase 4 验证完成后才进行文档归档。
- [x] 在用户确认前未进入 `new_plan.md` Phase 5。

---

## 补充修复：弹窗样式收口 + 战斗 HUD 镜像可配置与二战锚点回归 ✅
**更新日期：** 2026-02-17

### 本轮已完成
- [x] 去除学技与进化弹窗顶部装饰圆点：
  - `js/scenes/skilllearn/SkillLearnModalView.js`
  - `js/scenes/EvolutionScene.js`
- [x] 新增战斗 HUD 左右可配置镜像：
  - `js/scenes/battle/BattleHud.js` 增加 side 级配置解析（`mirrored/hpFillOrigin/statusRowAlign`）；
  - 支持全局 `window.__seerBattleHudLayoutConfig` 与场景入参 `battleHudLayoutConfig` 分层覆盖。
- [x] `js/scenes/BattleScene.js` 增加 `battleHudLayoutConfig` 入参透传。
- [x] 修复“第二场战斗 UI 消失”回归：
  - 在 `BattleHud` 中新增状态栏本地边界计算与锚点解算，避免镜像配置下状态栏越界到屏幕外。

### 用户验证结果（2026-02-17）
- ✅ 按用户反馈复测后，战斗可从 `PLAYER_CHOOSE -> EXECUTE_TURN -> CHECK_RESULT -> PLAYER_CHOOSE` 正常循环，无新增阻断异常。
- ✅ 配置注入可用：`window.__seerBattleHudLayoutConfig = { player:{...}, enemy:{...} }` 后战斗流程可继续运行。

---

## New Plan Phase 5：模块化 / 命名 / 注释优化 ✅（用户控制台验证通过）
**更新日期：** 2026-02-17

### 本轮已完成
- [x] `js/ui/SkillTooltipView.js` 新增统一事件绑定入口 `bind(scene, target, skill, hooks)`，收口 `pointerover/move/out` Tooltip 逻辑。
- [x] 三个技能展示界面移除重复 Tooltip 绑定实现，统一调用 `SkillTooltipView.bind(...)`：
  - `js/scenes/battle/panels/SkillPanelView.js`
  - `js/scenes/skilllearn/SkillLearnModalView.js`
  - `js/scenes/ElfManageScene.js`
- [x] 四个技能图标展示入口移除局部包装函数，统一走 `TypeIconView.renderSkill(...)`：
  - `js/scenes/battle/panels/SkillPanelView.js`
  - `js/scenes/battle/panels/SwitchPanelView.js`
  - `js/scenes/skilllearn/SkillLearnModalView.js`
  - `js/scenes/ElfManageScene.js`
- [x] `js/ui/WorldBottomBar.js` 增加语义化入口 `onElfManage`（保留 `onElf` 兼容回退），并在 4 个世界场景接入：
  - `js/scenes/SpaceshipScene.js`
  - `js/scenes/CaptainRoomScene.js`
  - `js/scenes/TeleportScene.js`
  - `js/scenes/KloseScene.js`
- [x] 注释增强（仅非显然逻辑）：
  - `js/ui/TypeIconView.js` 明确“`status` 图标覆盖仅影响展示层，不改业务语义”；
  - `js/scenes/SkillLearnScene.js` 标注链式返回优先级（pending skill -> evolution -> return）；
  - `js/scenes/battle/BattlePanels.js` 标注面板切换时 Tooltip 强制清理原因。

### 用户验证结果（2026-02-17）
- ✅ 核心模块可用：`SkillTooltipView.bind`、`TypeIconView.renderSkill`、`WorldBottomBar` 均可访问。
- ✅ `status` 展示规则通过：`TypeIconView.resolveSkillDisplayType(DataLoader.getSkill(2)) === 'status'`，并解析到 `type_30px-status`。
- ✅ 结构收口通过：`SkillLearnModalView.addSkillTypeVisual/bindSkillTooltip` 与 `ElfManageScene.prototype.addSkillTypeVisual/bindSkillTooltip` 均为 `undefined`（重复实现已移除）。
- ✅ 场景链路通过：世界场景可打开 `ElfManageScene`，并可从 `KloseScene` 拉起 `SkillLearnScene` 弹窗链。
- ✅ 图片缺失告警按预期可回退（用户确认可忽略，不属于本步骤阻断问题）。
- ℹ️ 本轮回归中观察到 `BgmManager activeBgmCount=2` 与赛尔方向图集缺失回退日志，均不属于 Phase 5 代码改动范围，保留为后续独立排查项。

### 阶段边界
- [x] 已完成 `new_plan.md` 第 5 步，并在用户验证后归档文档。
- [x] 按用户要求，在用户明确“测试通过并允许继续”前，不启动第 6 步。

---

## New Plan Phase 6：回归测试与验收门禁 ✅（用户控制台+手工回归通过）
**更新日期：** 2026-02-18

### 本轮已完成
- [x] 按 `new_plan.md` 第 6 步执行功能/兼容/结构三类门禁回归，覆盖 T6-1 ~ T6-6。
- [x] T6-1（`status` 图标一致性）通过：控制台断言返回 `[true, true, true, true, true]`，确认 `TypeIconView` 解析、`TypeIconData['30px-status']` 与纹理缓存链路一致生效。
- [x] T6-2（三界面 Tooltip）通过：战斗、学技弹窗、`ElfManageScene` 悬停显示与隐藏正常；场景状态检查结果为 `tooltipVisible: false`，无悬浮层残留。
- [x] T6-3（技能替换弹窗稳定性）通过：`SkillLearnScene` 可正常进入并完成“取消仅放弃当前技能 + 继续 pending skill 链”，最终 `PlayerData.elves[0].pendingSkills` 为空。
- [x] T6-4（进化弹窗信息与返回）通过：修正测试脚本字段后（`evolveTo`），可正常拉起 `EvolutionScene`；`previewRows` 返回 7 行且均为 `+delta -> after` 格式；完成确认后可回到来源场景。
- [x] T6-5（连续流程 smoke）通过：多次世界场景/弹窗/战斗切换未出现黑屏、输入穿透或流程卡死。
- [x] T6-6（阻断错误门禁）通过：控制台统计结果 `{ errors: 0, warns: 0, blockingErrors: 0 }`。

### 用户验证结果（2026-02-18）
- ✅ 用户按步骤执行了 Phase 6 回归脚本与手工链路测试，核心门禁全部通过。
- ✅ 进化弹窗验证包含真实预览数据：`等级/体力/攻击/防守/特攻/特防/速度` 共 7 项，格式统一。
- ✅ 学技链与返回链稳定：测试后 `pendingSkills` 清空，无残留待学习状态。
- ℹ️ 回归过程中出现的精灵立绘缺失告警属于资源回退日志（非本轮阻断项），未影响功能门禁结论。

### 结果说明
- `new_plan.md` Phase 6 已完成并通过用户验证。
- 已按用户要求在验证通过后更新 `progress.md`，并同步补充 `architecture.md` 的阶段洞察。

---

## 代码模块化重构 Step 1：消除重复弹窗打开代码 ✅（用户验证通过）

**更新日期：** 2026-02-19

### 本轮已完成
- [x] 新建 `js/ui/WorldSceneModalMixin.js`：提供 `apply(scene, returnSceneKey, returnDataFn)` 方法，统一混入 `openItemBagModal()`、`openElfManageModal()`、`openSpaceshipFromBottomBar()` 三个方法。
- [x] `index.html` 新增 `WorldSceneModalMixin.js` 脚本引用（位于 `WorldBottomBar.js` 之后、Systems 区之前）。
- [x] `KloseScene.js`：删除 3 个重复方法，改为 `WorldSceneModalMixin.apply(this, 'KloseScene', () => this.getKloseReturnData())`，保留 `getKloseReturnData()` 实现。
- [x] `SpaceshipScene.js`：删除 2 个重复方法，改为 `WorldSceneModalMixin.apply(this, 'SpaceshipScene')`。
- [x] `CaptainRoomScene.js`：删除 3 个重复方法，改为 `WorldSceneModalMixin.apply(this, 'CaptainRoomScene')`。
- [x] `TeleportScene.js`：删除 2 个重复方法，改为 `WorldSceneModalMixin.apply(this, 'TeleportScene', () => this.getTeleportReturnPayload())`，保留 `getTeleportReturnPayload()` 实现。

### 新增文件
| 文件 | 行数 | 用途 |
|------|------|------|
| `js/ui/WorldSceneModalMixin.js` | ~70 | 世界场景弹窗方法混入工具，消除 4 个场景中重复的弹窗打开代码 |

### 用户验证结果（2026-02-19）
- ✅ `window.WorldSceneModalMixin` 非 undefined，`apply` 方法正确暴露。
- ✅ 克洛斯星（KloseScene）：底栏 背包/精灵背包/地图 按钮均正常，子场景导航正常。
- ✅ 飞船（SpaceshipScene）：底栏 背包/精灵背包 正常，房间入口不受影响。
- ✅ 船长室（CaptainRoomScene）：底栏 背包/精灵背包/地图 正常，任务面板不受影响。
- ✅ 传送舱（TeleportScene）：底栏 背包/精灵背包 正常，返回按钮不受影响。
- ✅ 控制台无新增错误（`errors=0`）。

### 技术说明
- 采用 Mixin 模式（而非继承或原型修改），在场景 `createBottomBar()` 时通过 `WorldSceneModalMixin.apply()` 动态注入方法，保持各场景类结构不变。
- `returnDataFn` 为可选参数，省略时默认返回空对象 `{}`，适用于 SpaceshipScene 和 CaptainRoomScene 等无需携带返回数据的场景。
- KloseScene 和 TeleportScene 各保留了场景专属的 `returnData` 生成函数（`getKloseReturnData` / `getTeleportReturnPayload`），通过闭包传入 Mixin。
- 本次重构共从 4 个文件中删除约 120 行重复代码。

---

## 代码模块化重构 Step 2：拆分大型文件 ✅（用户验证通过）

**更新日期：** 2026-02-19

### 本轮已完成

#### 2A：拆分 BattleHud.js（972 行 → 619 行 + 2 个新文件）
- [x] 新建 `js/scenes/battle/BattleLogView.js`（~290 行）：从 BattleHud 提取 13 个日志/浮动伤害数字函数。
- [x] 新建 `js/scenes/battle/BattleDialogView.js`（~190 行）：从 BattleHud 提取 7 个弹窗/计时器/菜单函数。
- [x] `BattleHud.js`：保留状态条（HP/等级/立绘/状态图标/能力增减）与日志面板框架，新增 20 个桥接方法委托至 BattleLogView 和 BattleDialogView。

#### 2B：拆分 ElfManageScene.js（690 行 → 435 行 + 1 个新文件）
- [x] 新建 `js/scenes/elfmanage/ElfDetailPanel.js`（~290 行）：从 ElfManageScene 提取 8 个右侧详情面板方法（`renderRightDetail/renderTopInfo/renderStats/renderSkills/drawPanelBlock/addElfPortrait/getHpBarColor/formatObtainedTime`），均接受 `scene` 为首参。
- [x] `ElfManageScene.js`：`renderRightDetail` 委托 `ElfDetailPanel.renderRightDetail(this)`，保留 5 个桥接方法。

#### 公共更新
- [x] `index.html`：新增 3 个 `<script>` 引用（`ElfDetailPanel.js` → `ElfManageScene.js` 之前；`BattleLogView.js`/`BattleDialogView.js` → `BattleHud.js` 之前），保证加载顺序。

### 新增文件
| 文件 | 行数 | 用途 |
|------|------|------|
| `js/scenes/battle/BattleLogView.js` | ~290 | 战斗日志队列、条目渲染、文本裁剪、浮动 HP 变化数字动画 |
| `js/scenes/battle/BattleDialogView.js` | ~190 | 居中弹窗创建/显示、回合倒计时器、菜单启停 |
| `js/scenes/elfmanage/ElfDetailPanel.js` | ~290 | 精灵管理右侧详情面板（立绘、属性、技能卡） |

### 用户验证结果（2026-02-19）
- ✅ 战斗场景：HP 条、日志面板、浮动伤害数字、回合计时器、逃跑/道具/换宠弹窗、菜单启停均正常。
- ✅ 精灵管理场景：精灵卡片、右侧详情（立绘/属性/技能）、动作按钮（回复/图鉴等）均正常。
- ✅ 控制台无新增 error（多轮战斗 + 精灵管理 + 场景切换全程零报错）。
- ✅ `BATTLE_SCENE_FACADE_METHODS` 中 BattleHud 的 26 个 facade 方法全部覆盖（6 直接实现 + 13 委托 BattleLogView + 7 委托 BattleDialogView）。

### 技术说明
- BattleHud 采用 `.call(this, ...)` 桥接模式，使子模块方法以 BattleScene 实例为 `this` 运行，与原有 mixin 模式一致。
- ElfDetailPanel 采用外部独立函数模式，所有方法接受 `scene` 为首参（与 SkillLearnModalView 相同模式）。
- 本次重构中未修改 `BattleScene.js` 的 `BATTLE_SCENE_FACADE_METHODS` 常量，因 BattleHud 仍完整暴露所有 facade 方法。

---

## 代码模块化重构 Step 3：提取通用移动与动画系统 ✅（用户验证通过）

**更新日期：** 2026-02-19

### 本轮已完成

#### 3.1–3.2：新建通用系统
- [x] 新建 `js/systems/MovementSystem.js`（~190 行）：从 MoveController 提取 3 个通用方法（`movePlayerTo`、`getDirectionFromVector`、`addWildElfMovement`），不含任何场景特有引用。
- [x] 新建 `js/systems/PlayerAnimatorSystem.js`（~280 行）：从 PlayerAnimator 提取通用动画控制器类，通过 `config.atlasKeyResolver` 注入图集 key 查询，不硬编码 `AssetMappings.getSeerDynamicAtlasKey`。

#### 3.3：更新 index.html
- [x] 在 Systems 区末尾（`DevMode.js` 之后）添加 `MovementSystem.js` 和 `PlayerAnimatorSystem.js` 脚本引用，确保在 `klose/` 模块之前加载。

#### 3.4：重构 MoveController.js（305 行 → 260 行）
- [x] `movePlayerTo()` 委托 `MovementSystem.movePlayerTo()`，传入边界、速度参数与方向/完成回调。
- [x] `addWildElfMovement()` 委托 `MovementSystem.addWildElfMovement()`，传入边界与 moveProfile。
- [x] 保留 `KloseMoveController` 门面壳：构造函数、`createMoveArea`、边界计算、蘑菇怪 profile 等场景特有逻辑。

#### 3.5：重构 PlayerAnimator.js（297 行 → 96 行）
- [x] 构造函数内创建 `PlayerAnimatorSystem` 实例，注入 `atlasKeyResolver`（封装 `AssetMappings.getSeerDynamicAtlasKey`）。
- [x] `createPlayer/playMove/playIdle/destroy` 全部委托给内部 `PlayerAnimatorSystem` 实例。
- [x] 保留 `KlosePlayerAnimator` 门面壳，提供 `getPlayerContainer/getPlayerSprite/getCurrentDirection` 访问器。

### 新增文件
| 文件 | 行数 | 用途 |
|------|------|------|
| `js/systems/MovementSystem.js` | ~190 | 通用移动系统：玩家点击移动（带边界）、八方向判定、野精灵随机游走 |
| `js/systems/PlayerAnimatorSystem.js` | ~280 | 通用玩家动画系统：精灵创建、行走/待机动画、方向解析、帧管理 |

### 用户验证结果（2026-02-19）
- ✅ `window.MovementSystem` 和 `window.PlayerAnimatorSystem` 全局挂载正常。
- ✅ 八方向判定：`getDirectionFromVector` 6 组测试全部正确。
- ✅ 克洛斯星 scene1：玩家移动、待机动画、野精灵游走、点击战斗均正常。
- ✅ 战斗返回：scene1 逃跑后返回原位置，scene2/3 战斗胜利后返回对应子场景。
- ✅ 子场景切换：scene1→2→3→2→3 全链路正常，野精灵刷新与游走不受影响。
- ✅ 控制台零报错，BGM `activeBgmCount` 稳定在 1/0。

### 技术说明
- `MovementSystem` 为纯命名空间对象（非 class），3 个方法均为无状态函数，通过参数接收全部依赖。
- `PlayerAnimatorSystem` 为可实例化类，通过 `config.atlasKeyResolver` 注入图集 key 查询策略，避免硬编码。
- `KloseMoveController` 和 `KlosePlayerAnimator` 保留为门面壳，维持 `SpawnService` 和 `KloseScene` 的调用接口不变。
- 本次重构共从 2 个场景文件中提取约 350 行通用逻辑到系统层。

---

## 代码模块化重构 Step 4：添加中文 JSDoc 方法级注释 ✅（全部完成）

**更新日期：** 2026-02-19

### 本轮已完成

#### 4.1：战斗核心系统（最高优先级）
- [x] `js/systems/BattleManager.js`：每个 `static` 字段和实例方法添加中文 JSDoc。
- [x] `js/systems/battle/effects/EffectRuntime.js`：英文注释替换为中文，每个方法添加 `@param`/`@returns`。
- [x] `js/systems/battle/effects/EffectHelpers.js`：英文注释替换为中文，每个方法添加 `@param`/`@returns`。

#### 4.2：战斗动画器（高优先级）
- [x] `js/scenes/battle/BattleAnimator.js`：每个顶层函数添加中文 JSDoc。

#### 4.3：战斗面板组件（高优先级）
- [x] `js/scenes/battle/panels/SwitchPanelView.js`：文件头注释 + 每个公开方法 JSDoc。
- [x] `js/scenes/battle/panels/ItemPanelView.js`：文件头注释 + 每个公开方法 JSDoc。
- [x] `js/scenes/battle/panels/SkillPanelView.js`：文件头注释 + 每个公开方法 JSDoc。
- [x] `js/scenes/battle/panels/CapsulePanelView.js`：文件头注释 + 每个公开方法 JSDoc。
- [x] `js/scenes/battle/panels/ActionButtonsView.js`：文件头注释 + 每个公开方法 JSDoc。

#### 4.4：战斗门面与后处理（中优先级）
- [x] `js/scenes/battle/BattlePanels.js`：每个方法添加简要 JSDoc。
- [x] `js/scenes/battle/BattlePostFlow.js`：每个方法添加简要 JSDoc。

#### 4.5：场景文件（中优先级）
- [x] `js/scenes/MainMenuScene.js`：所有公开方法添加中文 JSDoc。
- [x] `js/scenes/SettingsScene.js`：所有公开方法添加中文 JSDoc。
- [x] `js/scenes/TeleportScene.js`：所有公开方法添加中文 JSDoc。
- [x] `js/scenes/SpaceshipScene.js`：所有公开方法添加中文 JSDoc。
- [x] `js/scenes/SkillLearnScene.js`：所有公开方法添加中文 JSDoc，链式返回逻辑详细注释。

#### 4.6：UI 工具文件（低优先级）
- [x] `js/ui/SkillTooltipView.js`：每个方法添加简要 JSDoc。
- [x] `js/ui/WorldBottomBar.js`：每个方法添加简要 JSDoc。
- [x] `js/ui/ModalOverlayLayer.js`：每个方法添加简要 JSDoc。

#### 4.7：效果处理器批量文件头注释（最低优先级）
- [x] `js/systems/battle/effects/EffectRegistry.js`：英文头替换为中文 + 方法 JSDoc。
- [x] `js/systems/battle/effects/EffectRuntimeTick.js`：英文头替换为中文。
- [x] 29 个独立效果处理器文件：批量添加中文文件头注释。

#### 额外覆盖文件
- [x] `js/systems/battle/manager/BattleActionExecutorSupport.js`：英文头替换为中文 + 方法 JSDoc。
- [x] `js/ui/ElfPortraitView.js`：中文文件头 + 方法注释。
- [x] `js/ui/TypeIconView.js`：中文文件头 + 方法注释。

### 技术说明
- 注释格式统一为中文 JSDoc（`/** ... */`），复杂方法包含 `@param` 和 `@returns`。
- 仅修改注释，不修改任何逻辑代码。
- 英文文件头统一替换为中文文件头，保持与此前已注释文件风格一致。
- 按 `new_change_plan.md` 的优先级从高到低执行：核心战斗系统 → 动画器 → 面板组件 → 门面/后处理 → 场景 → UI 工具 → 效果处理器。
- 本轮共覆盖约 40+ 个文件，涉及战斗系统、场景、UI 组件三个层级。

---

## new_implementation Step1：飞船场景重构 ✅（用户验证通过）

**更新日期：** 2026-02-21

### 本轮已完成
- [x] `CaptainRoomScene` 重构为 Step1 门面：
  - 背景替换为 `CaptainRoom.png`；
  - 完全移除旧任务面板（标签页/任务列表/详情/奖励弹窗等）；
  - 保留“点击船长 -> 任务弹窗入口提示”交互。
- [x] 新增 `ElfLabScene`：
  - 背景为 `elf_lab.png`；
  - 每次进入随机显示博士 A/B 待机动画（不可交互）；
  - 去除博士 A/B 文本标注。
- [x] 飞船入口与恢复链路更新：
  - `SpaceshipScene` 实验室入口改为可用并跳转 `ElfLabScene`；
  - `MainMenuScene.continueGame()` 新增 `elf_lab -> ElfLabScene` 恢复映射。
- [x] 资源装配更新：
  - `BootScene` 新增船长室/实验室背景与博士图集预加载；
  - `index.html` 与 `js/main.js` 完成 `ElfLabScene` 注入与注册。
- [x] 室内场景交互口径统一：
  - 移除 `CaptainRoomScene` 与 `ElfLabScene` 左下“返回飞船”按钮；
  - 仅保留底栏“地图”按钮返回飞船。
- [x] BGM 接入与叠音修复：
  - `AudioAssets/BgmData` 新增 `ship_bgm`，映射到 `CaptainRoomScene/ElfLabScene`；
  - 修复“离开室内场景后 BGM 不停、进克洛斯星后双轨叠播”问题（`SceneRouter + BgmManager` 收口）。
- [x] 船长落点按用户图示多轮微调：最终锚点收敛到 `x=0.735, y=0.59`（`CaptainRoomScene`）。

### 用户验证结果（2026-02-21）
- ✅ 启动与主流程通过：主菜单、飞船、船长室、实验室、传送舱、克洛斯星可正常切换。
- ✅ 视觉与交互通过：旧任务面板已移除；实验室博士随机展示正常且不可交互；两个场景的独立返回按钮已移除。
- ✅ 音频通过：`window.__seerGame.sound.getAll().filter(key startsWith 'bgm_')` 在飞船为空数组；进入克洛斯星后保持单轨，不再叠音。
- ✅ 船长位置最终确认通过（按用户箭头目标区完成微调）。

### 阶段边界
- [x] 按用户要求，本轮仅完成 `new_implementation.md` 的 Step1。
- [x] 在用户验证 Step1 通过前未启动 Step2。

---

## new_implementation Step2：任务弹窗系统 ✅（用户控制台验证通过）

**更新日期：** 2026-02-21

### 本轮已完成
- [x] 新增 `js/scenes/CaptainQuestModalScene.js`：实现“一个 Scene + 两层容器”架构，统一承载任务列表层与任务对话层。
- [x] 新增 `js/ui/quest/QuestListPopup.js`：实现任务列表主视图（左侧船长立绘、右侧白底滚动列表、分组标题与按钮渲染）。
- [x] 新增 `js/ui/quest/QuestDialogPopup.js`：实现二层任务对话弹窗（标题栏/内容区/底部按钮区）。
- [x] 完成双击判定规则：`320ms` 时间窗口 + 轻微位移容差（`18px`）。
- [x] 完成任务状态与排序规则：`claimable -> active -> available -> locked -> completed`，组内按任务 ID 升序。
- [x] 完成按钮行为规则：
  - `available`：`领取 / 取消`
  - `active`：`确认`（仅关闭）
  - `claimable`：`确认`（完成任务并领奖）
  - `locked/completed`：完全不可交互
- [x] `CaptainRoomScene` 改造：点击船长从“Step1 提示浮层”切换为 `SceneRouter.launch('CaptainQuestModalScene')`，并加入弹窗实例幂等保护。
- [x] `index.html` 与 `js/main.js` 更新：注入 `QuestListPopup.js`、`QuestDialogPopup.js`、`CaptainQuestModalScene.js` 并注册新场景。

### 用户验证结果（2026-02-21）
- ✅ 启动链路正常：`BootScene -> DataLoader -> QuestManager.initEventBridge -> MainMenuScene` 全流程无阻断异常。
- ✅ 船长室弹窗拉起正常：控制台出现 `SceneRouter launch -> CaptainQuestModalScene`，任务弹窗场景可成功创建。
- ✅ 任务测试数据注入正常：用户在控制台成功注入 `locked` 任务与多条滚动任务（`id=950/960~971`）用于状态与滚动验证。
- ✅ 本轮日志未出现新的阻断错误，核心链路保持可达。

### 阶段边界
- [x] 按用户要求，本轮仅执行 `new_implementation.md` Step2。
- [x] 在用户确认 Step2 测试通过前，未启动 Step3。

---

## new_implementation Step3：克洛斯星精灵刷新范围调整 ✅（用户控制台验证通过）

**更新日期：** 2026-02-22

### 本轮已完成
- [x] 按 `new_implementation.md` Step3 仅调整 `data/assets/WorldAssets.js` 配置，不改动 `SpawnService` 逻辑。
- [x] `kloseScenes[2].spawnAreas` 从两个矩形改为两个椭圆：
  - `{ type: 'ellipse', x: 620, y: 180, radiusX: 120, radiusY: 70 }`
  - `{ type: 'ellipse', x: 480, y: 430, radiusX: 250, radiusY: 120 }`
- [x] `kloseScenes[3].spawnAreas` 调整为右侧中央矩形：
  - `{ type: 'rect', x: 430, y: 120, width: 520, height: 420 }`
- [x] 保持其余字段不变（`spawnCountRange`、`spawnMinDistance`、`wildMoveRadius`、`wildElfPool`、`hotspots`）。

### 用户验证结果（2026-02-22）
- ✅ 启动与加载链路正常：`BootScene/DataLoader/QuestManager/DataIntegrityChecker` 全流程无阻断异常。
- ✅ 场景链路正常：`TeleportScene -> KloseScene(1) -> 2 -> 3 -> 2` 往返稳定。
- ✅ 音频链路正常：`KloseScene` 子场景切换期间 `activeBgmCount=1`，无叠音。
- ✅ 本轮控制台未出现新增错误；Step3 配置改动已生效并通过回归。

### 阶段边界
- [x] 本轮仅执行 `new_implementation.md` Step3。
- [x] 在用户验证通过前未启动 Step4。

---

## new_implementation Step4：赫尔卡星新星球 + 可行走区寻路 ✅（用户反馈“差不多勉强算完成”）

**更新日期：** 2026-02-22

### 本轮已完成
- [x] 新增赫尔卡星基础场景链路：`HelkaScene + subScene(1/2/3)`。
  - 新增 `js/scenes/HelkaScene.js`（场景门面）
  - 新增 `js/scenes/helka/HelkaHotspotService.js`（热点跳转）
  - 新增 `js/scenes/helka/HelkaMoveController.js`（移动限制 + 自动寻路）
- [x] 资源与配置接入：
  - `data/assets/WorldAssets.js` 新增 `helkaScenes`（背景、出生点、热点、可行走区）
  - `data/AssetMappings.js` 聚合层新增 `helkaScenes` 透传
  - `data/assets/AudioAssets.js` 新增 `HelkaScene -> helka_bgm`
  - `data/BackgroundData.js`、`data/UIAssetData.js`、`data/BgmData.js` 补齐 `helka_*` Base64 数据
- [x] 传送舱入口改造：`js/scenes/TeleportScene.js` 固定排序为 `Klose -> Helka`，赫尔卡按钮文案固定“赫尔卡星”，图标接入 `helka_icon`。
- [x] 继续游戏恢复链路：`js/scenes/MainMenuScene.js` 新增 `helka_1/2/3 -> HelkaScene(subScene)`；未知 `currentMapId` 统一兜底 `SpaceshipScene`。
- [x] 用户反馈后的行为修正：
  - `js/scenes/KloseScene.js` 角色名读取统一为 `PlayerData.name || PlayerData.playerName`，消除跨地图名称不一致。
  - `js/scenes/HelkaScene.js` 底栏地图按钮改为统一返回飞船（`SpaceshipScene`），与当前项目“世界场景先回飞船再进传送舱”的规则一致。
  - `data/assets/WorldAssets.js` 热点文案去除“前往/返回”前缀，统一使用地名。
- [x] 赫尔卡 1/2 可行走规则升级为“蓝色方块可走，其他区域禁行”：
  - `WorldAssets.helkaScenes[1|2].walkableRects` 作为可走区事实源（设计坐标 1920x1120）
  - `HelkaScene` 运行时缩放 `walkableRects` 到当前画布
  - `HelkaMoveController` 点击可走区自动寻路（A* 网格 + 路径简化 + 分段移动 + 动画方向联动）
  - 点击不可走区保持原地，不执行吸附。

### 用户验证结果（2026-02-22）
- ✅ 赫尔卡星主链路可达：`TeleportScene -> HelkaScene(1/2/3)` 与 `1->2->3->2->1` 热点往返可用。
- ✅ 传送舱排序与文案通过：`Klose -> Helka`，赫尔卡按钮文案正确。
- ✅ 名称一致性通过：赛尔角色名在克洛斯/赫尔卡显示一致。
- ✅ 底栏地图行为按最新用户规则生效：赫尔卡场景点击地图先回 `SpaceshipScene`。
- ✅ 可行走区规则通过：蓝框内可移动，蓝框外不可移动；可走区内支持自动绕行到目标。
- ℹ️ 用户验收结论："差不多勉强算完成"（可继续按点位微调 walkableRects，但不阻断 Step4 收口）。

### 阶段边界
- [x] 本轮仅执行并收口 `new_implementation.md` Step4。
- [x] 在用户明确要求前未启动 Step5 业务实现。

---

## new_implementation Step5：飞船按钮调整与空间站 ✅（用户控制台验证通过）

**更新日期：** 2026-02-22

### 本轮已完成
- [x] 飞船按钮布局调整为 `船长室 | 实验室 | 空间站 / 传送舱 | 能源中心 | 设置`，并移除“机械室”入口。
- [x] 新增 `js/scenes/SpaceStationScene.js`：
  - 背景固定使用 `bg_space_station_1`；
  - 赛尔角色出生点固定在画面中心；
  - 点击移动复用 `MovementSystem + PlayerAnimatorSystem`；
  - 底栏接入 `WorldBottomBar + WorldSceneModalMixin`（地图/背包/精灵背包）；
  - 进入场景时写入 `PlayerData.currentMapId = 'space_station'` 并保存。
- [x] 场景装配更新：`index.html` 注入 `SpaceStationScene.js`，`js/main.js` 注册 `SpaceStationScene`。
- [x] 继续游戏恢复链补齐：`MainMenuScene.continueGame()` 新增 `space_station -> SpaceStationScene` 映射（未知 mapId 仍回退飞船）。
- [x] 空间站 BGM 接入：`AudioAssets` 新增 `SpaceStationScene -> space_station_bgm`，并补齐路径与 dataKey。
- [x] Base64 资源链补齐并重生成：
  - `tools/generate-asset-data.ps1` 新增 `space_station_1`；
  - `tools/generate-bgm-data.ps1` 新增 `space_station_bgm`；
  - 生成后的 `data/BackgroundData.js` 与 `data/BgmData.js` 已包含对应键。
- [x] 按用户追加要求移除空间站左上角“返回飞船”按钮：
  - 删除 `createBackButton()` 调用与方法本体；
  - 空间站返回路径统一为底栏“地图”。

### 用户验证结果（2026-02-22）
- ✅ 启动预加载通过：`BootScene` 日志显示背景资源 `7` 个、BGM `5` 个（含空间站资源）。
- ✅ 飞船入口验证通过：空间站按钮可进入 `SpaceStationScene`，机械室入口不再出现。
- ✅ 出生点验证通过：`player=[500,300]` 与 `center=[500,300]` 一致。
- ✅ BGM 验证通过：空间站内 `currentBgmKey='bgm_space_station_bgm'` 且 `activeBgmCount=1`；返回飞船后 `currentBgmKey=null` 且 `activeBgmCount=0`。
- ✅ 存档恢复验证通过：将 `PlayerData.currentMapId='space_station'` 后 `continueGame()` 可恢复到 `SpaceStationScene`。
- ✅ 用户追加回归通过：
  - `typeof window.__seerGame.scene.keys.SpaceStationScene.createBackButton === 'undefined'`；
  - 场景文本检索中“返回飞船”计数为 `0`。

### 阶段边界
- [x] 本轮仅执行并收口 `new_implementation.md` Step5。
- [x] 按用户要求，在用户测试通过后才更新 `progress.md` 与 `architecture.md`。

---

## new_task Step6：精灵仓库系统 ✅（用户回归通过）

**更新日期：** 2026-02-22

### 本轮已完成
- [x] 新增仓库数据层：`js/systems/ElfStorage.js`。
  - 仓库容量上限 `999`，背包容量口径 `6`。
  - 提供 `add/remove/getAll/getByType/getCount/isFull/getSortedEntries`。
  - 提供背包与仓库互操作：`moveBagElfToStorage/moveStorageElfToBag/swapStorageWithBag`。
- [x] 新增仓库弹窗场景与 UI 模块：
  - `js/scenes/ElfStorageScene.js`
  - `js/ui/elfstorage/StorageFilterPanel.js`
  - `js/ui/elfstorage/StorageGridPanel.js`
  - `js/ui/elfstorage/StorageDetailPanel.js`
  - `js/ui/elfstorage/StorageSwapPopup.js`
- [x] `ElfManageScene` 按 Step6 调整按钮与行为：
  - 按钮顺序收敛为 `首发 -> 回复 -> 放入仓库 -> 仓库 -> 图鉴 -> [DevExp]`。
  - 接入 `in_elf_storage.png` 图标。
  - 新增“放入仓库”动作与“仓库”场景跳转（替换式打开 `ElfStorageScene`）。
- [x] 捕捉链路接入“背包满自动入仓”：
  - `CatchSystem.addCapturedElf()` 支持“背包未满入背包、背包满入仓库、双满失败”。
  - `BattleActionResolver` / `BattleScene` 增加对应结果分支与提示文案。
- [x] 存档与 IV 模型迁移落地：
  - `PlayerData` 新增 `elfStorage` 持久化字段。
  - 旧存档六维 `iv` 读档时归一为单值 `iv:number(0~31)`（含背包与仓库）。
  - `ElfStats`、`ElfBag`、`EvolutionScene` 等链路兼容单值 IV。
- [x] 脚本装配更新：`index.html`、`js/main.js`、`js/scenes/BootScene.js`。

### 用户验证结果（2026-02-22）
- ✅ 启动与装配通过：Boot 日志显示底栏/弹窗按钮图标与属性图标预加载正常，未出现新增阻断报错。
- ✅ 仓库入口链路通过：`ElfManageScene -> ElfStorageScene` 可正常打开与返回，核心交互可达。
- ✅ 翻页功能通过（控制台脚本）：23 条仓库数据下分页结果为 `9, 9, 5, 5, 9`，与预期一致。
- ✅ 翻页按钮视觉修复通过：左右三角方向与居中问题已修正，用户确认“现在没问题了”。
- ✅ 测试数据恢复通过：分页脚本执行后可恢复原 `PlayerData.elfStorage`，并正常存档。

### 阶段边界
- [x] 本轮仅执行 `new_task_implementation.md` Step6。
- [x] 在用户验证 Step6 通过前未启动 Step7。
