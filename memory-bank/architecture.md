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
│   ├── systems/        # 核心系统（待实现）
│   └── utils/          # 工具类
│       └── SceneManager.js
├── data/               # JSON 数据文件（待实现）
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
| `index.html` | HTML5 入口，加载 CSS 和 JS，包含 `#game-container` 容器 |
| `css/main.css` | 全局样式：body 重置、黑色背景、禁止滚动与文本选择、游戏容器居中 |

### 引擎层

| 文件 | 作用 |
|------|------|
| `js/lib/phaser.js` | Phaser 3.90.0 游戏引擎，提供渲染、物理、输入、场景管理等功能 |
| `js/main.js` | 定义 `gameConfig`（1000x600, #1a1a2e 背景）并实例化 `Phaser.Game` |

### 场景层 (`js/scenes/`)

| 文件 | Scene Key | 作用 |
|------|-----------|------|
| `BootScene.js` | `BootScene` | 启动场景，负责加载核心资源，显示 "Loading..." 文字 |

### 工具层 (`js/utils/`)

| 文件 | 作用 |
|------|------|
| `SceneManager.js` | 场景切换工具，提供 `changeScene()` 安全切换、`sceneExists()` 验证、`pauseScene()`/`resumeScene()` 暂停恢复 |

---

## 架构设计原则

1. **模块分离**：场景、系统、工具分目录管理
2. **数据驱动**：精灵/技能/物品数据存储在 `/data/` JSON 文件
3. **场景驱动**：游戏流程通过 Phaser Scene 切换实现
4. **全局工具**：`SceneManager` 等工具通过 `window` 全局访问

---

## 待实现模块

| 目录 | 计划内容 |
|------|----------|
| `js/systems/` | DataLoader, SaveSystem, PlayerData, Elf, ElfBag, BattleManager, DamageCalculator, CatchSystem, QuestManager 等 |
| `js/scenes/` | MainMenuScene, SpaceshipScene, CaptainRoomScene, TeleportScene, KloseScene, BattleScene, ElfBagScene 等 |
| `data/` | elves.json, skills.json, typeChart.json, items.json, quests.json |
