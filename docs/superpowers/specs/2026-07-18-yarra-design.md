# Yarra — 设计文档

日期：2026-07-18

## 概览

一个像素风环保主题探索小游戏。世界污染严重，墨尔本的一座 AI 数据中心大量消耗和浪费水资源。主角是一位亚裔女酷儿，她要走遍墨尔本的三处自然地景（Albert Park 湖泊、Dandenong 森林、St Kilda 海滩）采集污染样本（鱼线、塑料瓶、混合垃圾），集齐全部 12 件样本后，进入数据中心关闭最后一个控水闸门，让 Yarra 河的水回到它该去的地方。

无战斗、无失败状态——张力来自探索与收集，情感来自轻量英文叙事与结局。

## 技术栈与架构

纯前端网页游戏，无构建工具，零外部依赖，浏览器直接打开 `index.html` 运行。沿用已验证的模式（见 pixel-game-sonnet 项目）：

- 虚拟画布 320×180，CSS 放大 + `image-rendering: pixelated`
- 所有美术为代码绘制的像素网格 sprite（无外部图片素材）
- 纯逻辑模块用 Node 内置测试器（`node --test`）单元测试；渲染/DOM 模块浏览器手动验证

### 场景状态机（核心架构）

```
TITLE → MAP ⇄ SITE_LAKE
            ⇄ SITE_FOREST
            ⇄ SITE_OCEAN
        MAP → DATACENTER（三 site 全部完成后解锁）→ ENDING
```

- 每个场景独立文件，实现统一接口：`{ enter(state), update(dt, input, state), render(ctx, state), exit(state) }`
- 全局 `gameState`（收集进度、site 完成状态）跨场景持久，场景切换只改"当前场景"指针

### 文件结构

```
yarra/
├── index.html
├── styles.css
├── package.json          # 仅 test script（node --test tests/*.test.js）
├── src/
│   ├── game-state.js     # 纯逻辑：inventory、site 完成判定、数据中心解锁判定
│   ├── player.js          # 纯逻辑：8方向移动、边界钳制（沿用上次模式）
│   ├── items.js            # 纯逻辑：可拾取物位置数据、拾取距离判定
│   ├── dialogue.js          # 纯逻辑+数据：全部英文文案（开场/独白/结局）、逐条推进
│   ├── input.js              # 键盘：方向键/WASD + 交互键（E 或 Space）
│   ├── render.js              # 像素绘制：主角、物品、UI、文字条
│   ├── scenes/
│   │   ├── map.js             # 墨尔本地图 hub
│   │   ├── lake.js            # Albert Park 湖泊
│   │   ├── forest.js          # Dandenong 森林
│   │   ├── ocean.js           # St Kilda 海滩
│   │   ├── datacenter.js      # 数据中心最终关
│   │   └── ending.js          # 结局画面
│   └── main.js                # 主循环 + 场景状态机接线
└── tests/                     # game-state / player / items / dialogue / input 的单元测试
```

## 主角

- 亚裔女酷儿像素造型：黑色短发带一撮青绿色挑染、亚裔肤色、工装背带裤、采样背包
- 8方向自由移动（方向键/WASD，对角线速度归一化），移动范围钳制在场景边界内
- 朝向随水平移动左右翻转；无血量、无受伤机制

## 场景设计

### 地图 Hub（墨尔本）

- 风格化像素墨尔本地图：Yarra 河蓝色像素带穿过画面
- 四个入口节点：湖泊、森林、海滩、数据中心；主角行走到节点附近按交互键进入
- 已完成的 site 节点显示 ✓ 标记；数据中心节点在未解锁时显示锁图标，走近提示 "The gate won't open yet — I still need more evidence."（措辞见 dialogue.js）
- 地图 UI 显示总进度 `N/12 samples`

### 三个采集 Site（共同规则）

- 每个 site 为一屏场景，4 件样本半隐藏在环境元素中（视觉上部分可见，鼓励探索）
- 走近样本（拾取判定半径内）时物品高亮/闪烁，按交互键拾取
- 顶部显示该 site 进度（如 `2/4`）；集齐 4 件后播放一句完成独白，site 标记完成
- 每个 site 场景下边缘有一个出口标记（exit marker），走近按交互键随时返回地图（未集齐也可离开，已拾取进度跨进出持久保留）
- 进入时显示一句环境独白（底部文字条，按键关闭）

### Site 1 — Albert Park 湖泊（4 段鱼线 fishing line）

- 藏点：缠在芦苇丛、漂在水线边、挂在公园长椅下、绕在浮标上
- 环境细节：黑天鹅（black swans）、城市天际线剪影、湖面反光

### Site 2 — Dandenong 森林（4 个塑料瓶 plastic bottles）

- 藏点：蕨类植物后、树洞里、溪流石缝边、步道边的草丛
- 环境细节：高大桉树（mountain ash）、琴鸟（lyrebird）剪影、透过树冠的光斑

### Site 3 — St Kilda 海滩（4 件混合垃圾：鱼线 ×2、瓶盖、塑料袋）

- 藏点：礁石缝间、沙滩半埋、码头木柱旁、海藻堆里
- 环境细节：防波堤上的小企鹅（little penguins）、海浪动画、远处的 Luna Park 剪影

### 数据中心（最终关）

- 解锁条件：12/12 样本集齐
- 走廊式内部场景：成排服务器机架（指示灯闪烁）、地面冷却水管（水流动画）、红色警示灯
- 走到尽头的控水闸门前按交互键 → 开闸序列：管道水流动画停止 → 警示灯红转绿 → 服务器灯光暗下 → 切入 ENDING

### 结局（ENDING）

- 像素画面：Yarra 河水位恢复、河岸绿意、主角背影远眺
- 短诗式结尾文字（英文）+ 样本清单回顾（12 件样本图标排列）
- 显示 "Play Again" 按钮，点击后完全重置回 TITLE

## 叙事文案（英文，轻量）

全部文案集中在 `dialogue.js`，具体措辞在实现时撰写，遵循以下节拍：

- **开场（TITLE → MAP 前）**：3-4 句背景交代——污染的世界、吞水的数据中心、主角决定行动
- **每个 site 进入独白**：1 句，环境观察视角（如湖泊："The swans nest in it now — fishing line, wound through the reeds."）
- **每个 site 完成独白**：1 句，主角感想，体现个性与温度
- **数据中心锁定提示**：1 句
- **开闸时刻**：1-2 句
- **结局**：4-6 行短诗式收束 + 样本清单

语气基调：安静、观察式、有微光的希望；不说教。

## 交互与 UI

- 移动：方向键 / WASD（8方向）
- 交互：E 或 Space（拾取、进入场景、推进对话、开闸）
- UI：顶部左角场景名 + site 内进度；地图场景显示总进度；底部文字条用于独白/对话，带 "Press E" 提示
- TITLE 画面：游戏名 "YARRA" + "Press E to start" + 操作说明一行

## 不在本次范围内（YAGNI）

- 音效/背景音乐
- 血量/失败/敌人/计时
- 存档（刷新即重置）
- 触屏/鼠标操作（结局 Play Again 按钮除外，该按钮同时支持交互键）
- 外部图片素材、地图编辑器
- 多语言切换

## 测试策略

- **纯逻辑单元测试**（`node --test`）：
  - `game-state.js`：拾取累计、site 完成判定（4/4）、数据中心解锁判定（3 site 全完成）、总进度计数、完全重置
  - `player.js`：8方向移动、对角线归一化、边界钳制
  - `items.js`：拾取半径判定（在内/在外/边界）、已拾取物品不可重复拾取
  - `dialogue.js`：文案序列逐条推进、结束判定
  - `input.js`：按键→方向向量、交互键单次触发（按住不重复触发）
- **浏览器手动验证**：完整流程走通（TITLE→地图→三 site 采集→解锁→数据中心→开闸→结局→Play Again 重置）、视觉效果、场景切换无残留状态
