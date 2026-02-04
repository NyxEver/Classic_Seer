# CLAUDE.md

## 目标

构建一个无需后端、无需构建、本地存档、可离线运行的 HTML5 精灵养成类网页游戏。

---

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **引擎**: Phaser 3
- **数据**: JSON 配置文件
- **存档**: LocalStorage
- **禁止**: Node.js、npm、任何构建工具、后端服务

---

## 架构偏好

- 数据与逻辑分离：配置放 `/data/*.json`，逻辑放 `/js/`
- 模块化设计：职责单一，禁止巨型单文件
- 状态最小化：UI 状态从核心数据推导
- 依赖透明：只使用完整生产级库，禁止 Mock/Stub

---

## 代码风格

- 命名语义清晰，无歧义
- 必须添加必要注释，代码对他人和未来维护者可理解
- 添加解释性注释，保持结构简单清晰
- 遵循 SOLID 与 DRY 原则
- 错误处理明确，禁止空 catch

---

## 不希望出现

- 补丁式修改、忽视整体设计
- 未使用的变量和函数
- 难以阅读的代码
- 省略必要注释
- 臆测接口行为或需求
- 自行实现已有成熟库的功能
- 占位实现或伪集成代码

---

## 规则

### Always（每次必须执行）

1. 写代码前完整阅读 `memory-bank/@architecture.md`
2. 写代码前完整阅读 `memory-bank/@design-document.md`
3. 使用绝对路径
4. 验证依赖真实存在且为生产级实现
5. 完成重大功能后更新 `memory-bank/@architecture.md`

### 实施前

- 需求不清时必须先确认
- 新增模块前评估现有实现
- 优先复用成熟库，禁止重复造轮子

### 项目结构
Seer/
├── index.html          # 游戏入口
├── css/                # 样式文件
├── js/                 # 游戏逻辑
│   ├── lib/
│   │   └── phaser.js   # Phaser 3 完整库
│   ├── scenes/         # 各游戏场景
│   ├── systems/        # 核心系统
│   └── utils/          # 工具函数
├── data/               # JSON 游戏数据
├── assets/             # 图片、音频资源
└── memory-bank/        # 架构与设计文档
├── @architecture.md
└── @design-document.md
└── @claude.md