# Project Seer - 架构文档

## 项目结构

```
/Seer/
├── index.html          # 游戏入口页面
├── css/
│   └── main.css        # 全局样式
├── js/
│   ├── lib/
│   │   └── phaser.js   # Phaser 3.90.0 游戏引擎
│   ├── main.js         # 游戏主配置与入口
│   ├── scenes/         # 游戏场景
│   │   └── BootScene.js
│   ├── systems/        # 核心系统
│   │   ├── DataLoader.js
│   │   ├── SaveSystem.js
│   │   └── PlayerData.js
│   └── utils/          # 工具类
│       └── SceneManager.js
├── data/               # 游戏数据（JavaScript 模块）
│   ├── ElvesData.js    # 精灵基础数据
│   ├── SkillsData.js   # 技能数据
│   └── TypeChartData.js # 属性克制表
├── assets/
│   ├── images/         # 图片资源
│   └── audio/          # 音频资源
└── memory-bank/        # 开发文档
```

---

## 核心文件说明

### 入口层

| 文件 | 作用 |
|------|------|
| `index.html` | HTML5 入口，加载 CSS、数据脚本和 JS，包含 `#game-container` 容器 |
| `css/main.css` | 全局样式：body 重置、黑色背景、禁止滚动与文本选择、游戏容器居中 |

### 引擎层

| 文件 | 作用 |
|------|------|
| `js/lib/phaser.js` | Phaser 3.90.0 游戏引擎，提供渲染、物理、输入、场景管理等功能 |
| `js/main.js` | 定义 `gameConfig`（1000x600, #1a1a2e 背景）并实例化 `Phaser.Game` |

### 场景层 (`js/scenes/`)

| 文件 | Scene Key | 作用 |
|------|-----------|------|
| `BootScene.js` | `BootScene` | 启动场景，调用 DataLoader 加载数据，执行验证测试 |

### 系统层 (`js/systems/`)

| 文件 | 作用 |
|------|------|
| `DataLoader.js` | 同步加载数据，提供 `getElf()`、`getSkill()`、`getTypeEffectiveness()` 方法 |
| `SaveSystem.js` | LocalStorage 存档管理，提供 `save()`、`load()`、`hasSave()`、`deleteSave()` 方法 |
| `PlayerData.js` | 玩家数据管理器，管理精灵、物品、货币，提供 `createNew()`、`loadFromSave()`、`saveToStorage()` 方法 |

### 工具层 (`js/utils/`)

| 文件 | 作用 |
|------|------|
| `SceneManager.js` | 场景切换工具，提供 `changeScene()` 安全切换、`sceneExists()` 验证 |

### 数据层 (`data/`)

> **注意**：使用 JavaScript 模块而非 JSON 文件，避免 `file://` 协议下的 CORS 问题

| 文件 | 作用 |
|------|------|
| `ElvesData.js` | 精灵基础数据（ID、名称、属性、基础数值、可学技能、努力值收益等） |
| `SkillsData.js` | 技能数据（ID、名称、类型、威力、命中、PP、效果等） |
| `TypeChartData.js` | 属性克制表（二维映射，倍率值 2/1/0.5/0） |

---

## 架构设计原则

1. **模块分离**：场景、系统、工具分目录管理
2. **数据驱动**：精灵/技能/物品数据存储在 `/data/` JavaScript 模块
3. **场景驱动**：游戏流程通过 Phaser Scene 切换实现
4. **全局工具**：`SceneManager`、`DataLoader`、`SaveSystem`、`PlayerData` 通过 `window` 全局访问
5. **离线优先**：无需服务器，直接用浏览器打开 `index.html` 即可运行

---

## 待实现模块

| 目录 | 计划内容 |
|------|----------|
| `js/systems/` | Elf, ElfBag, BattleManager, DamageCalculator, CatchSystem, QuestManager 等 |
| `js/scenes/` | MainMenuScene, SpaceshipScene, CaptainRoomScene, TeleportScene, KloseScene, BattleScene, ElfBagScene 等 |
| `data/` | ItemsData.js, QuestsData.js |
