# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本代码库工作时提供指导。

## 项目概述

**《裂缝》FRACTURE** 是一款浏览器端的叙事平台游戏，采用手绘/素描美术风格。讲述 AI ARIA-7 调查神秘北极研究站的故事。游戏包含 5 个章节、3 个结局，以及主题切换系统（完全改变视觉风格）。

**参考游戏**: Inside, Limbo, Control, Celeste, Goose Goose Duck

## 运行游戏

直接在浏览器中打开 `fracture-game/index.html`，无需服务器或构建步骤。

## 架构

### 技术栈
- **渲染**: HTML5 Canvas 2D（无 WebGL）
- **音频**: Web Audio API 合成（无外部音频文件）
- **结构**: Vanilla JS + IIFE 模块模式，全局命名空间
- **无需构建** — 直接在浏览器运行

### 脚本加载顺序
`config.js` → `engine.js` → `game.js` → `story.js` → `main.js`

### 核心系统

**游戏状态** (`game.js`):
```
MENU → CHAPTER_INTRO → PLAYING → DIALOGUE → PUZZLE → CHOICE → CUTSCENE → TRANSITION → ENDING
```
完整枚举定义在 `config.js`:
```javascript
const GAME_STATES = {
    MENU: 'menu',
    CHAPTER_INTRO: 'chapter_intro',
    PLAYING: 'playing',
    DIALOGUE: 'dialogue',
    PUZZLE: 'puzzle',
    CHOICE: 'choice',
    CUTSCENE: 'cutscene',
    TRANSITION: 'transition',
    ENDING: 'ending',
};
```

**障碍物类型** (`story.js` 关卡数据):
- `turret` — 第2章，周期性射击（用扫描模式查看规律）
- `spike` — 接触即死
- `wind` — 周期性推动玩家
- `laser` — 开关式激光束
- `glitch` — 伤害区域伴随画面失真
- `projectile` — 慢速敌方射弹
- `collapse` — 落地后 1.5 秒平台倒塌
- `emotion_storm` — 第5章，推动玩家
- `shadow_minion` — 第4章追逐中生成

**作弊码** (`engine.js` + `game.js`):
在标题画面通过 `Input._cheatBuffer` 输入:
| 名称 | 按键 | 效果 |
|------|------|------|
| Konami | ↑↑↓↓←→←→ BA | 解锁全部结局 |
| IDDQD | ↑↓←→ ABAB | 无敌模式开关 |
| Showpeed | ←←▼▼ | 加速模式开关 |

**秘密发现系统** (`game.js`):
- `Game._secretsFound` — 已发现秘密/提示计数
- `Game._allSecretsFound` — 发现5个以上秘密时为 true（触发隐藏结局 D 提示）
- `Game._totalDeaths` — 死亡次数；每死亡5次 ARIA 会评论
- `Game._platformDeaths` — 每个平台的死亡次数（3次以上显示 RIP 标记）

**渲染器** (`engine.js`): Canvas 上下文，角色绘制（鹅鸭杀风格 — 圆润身材、小短腿、粗轮廓），平台绘制，粒子系统，每章视差背景。通过 `_getTheme()` 路由到主题特定的绘制函数。

**输入** (`engine.js`): 键盘 + 鼠标 + 触控（移动端虚拟摇杆）。暴露: `Input.left/right/jump/interact/roll/scan/enter`

**音频** (`engine.js`): 纯 Web Audio API 合成。函数: `playJump()`, `playLand()`, `playDialogue()`, `playSILO()`, `playPuzzleSolve()`, `playEndingA/B/C()` 等。

**玩家物理** (`game.js`):
- 多段跳系统: `CONFIG.PLAYER_MAX_JUMPS`（默认3）, `CONFIG.PLAYER_AIR_JUMP_VELOCITY`
- 跳跃缓冲: `CONFIG.PLAYER_JUMP_BUFFER_TIME`（帧）
- 翻滚: `CONFIG.ROLL_DURATION` + `CONFIG.ROLL_COOLDOWN`，期间无敌帧
- 碰撞: `CONFIG.PLATFORM_TOLERANCE`（落地判定比视觉宽度宽20%）

**背景系统** (`engine.js`): 每章视差层定义在关卡数据中（`story.js`）。每层有 `depth`（0-1，越小越远）、`color`、`shapes[]`。使用 `_drawBgLayer_parallax()` 及各主题样式变体。

**主题系统** (`config.js` + `engine.js`):
- `THEMES` 枚举: `DOODLE`, `GGG`, `RDR`, `PIXEL`
- `THEME_DEFS` 对象包含每主题: `character`（bodyShape, eyeScale, legStyle 等）, `platform`（edgeStyle, roughness）, `background`（paperTexture, scanLines, vignetteStyle）, `particles`（shape, dustColor）, `palette`, `chapters`（ch1-ch5 颜色覆盖）, `cssClass`
- `getCurrentTheme()` 返回当前主题定义
- `setTheme(themeId)` 切换主题并更新容器 CSS 类
- `Renderer._getTheme()` 缓存当前主题；`invalidateThemeCache()` 刷新

### 文件结构

```
fracture-game/
├── index.html          # HTML结构，所有UI覆盖层，加载脚本
├── css/style.css       # 样式（含主题特定CSS覆盖）
└── js/
    ├── config.js        # CONFIG, MORANDI调色板, GAME_STATES, PORTRAIT_COLORS, THEMES, THEME_DEFS
    ├── engine.js        # Input, Audio, Renderer（核心绘图辅助）
    ├── game.js          # 游戏状态机, Player, World, Dialogue, Puzzle, Choice系统
    ├── story.js         # LevelData（5章关卡）+ StoryData（结局）
    └── main.js          # 入口点, 游戏循环, 标题画面动画, 电影引擎
```

### 角色视觉

所有角色绘制为"圆润豆子"形状，小短腿，大眼睛，喙，腮红标记。定义在 `PORTRAIT_COLORS`（config.js）— 每个角色有: `body, eye, beak, feet, hat` 颜色。

电影式标题画面的角色定义在 `main.js`（`charARIA`, `charChen`, `charSILO`, `charShadow`）。

### 操作方式
- **桌面端**: 方向键 / WASD 移动，空格/W 跳跃，Shift 翻滚，E 交互，Q 扫描模式（第2章后），Enter 继续对话
- **移动端**: 虚拟摇杆 + 按钮（触屏设备自动显示）

### 画布分辨率
1280×720（CONFIG.CANVAS_W/CANVAS_H），自动缩放适应窗口保持宽高比。

## 主题系统架构

每个主题（`THEME_DEFS[key]`）包含:

| 属性 | 用途 |
|------|------|
| `character.bodyShape` | 路由到 `drawCharacter_*` 方法: `angular`（Doodle）, `bean`（GGG）, `cowboy`（RDR）, `pixelated`（Pixel） |
| `character.eyeScale` | 眼睛大小倍数（GGG 为 1.4, RDR 为 0.85） |
| `character.legStyle` | `stick`, `tiny`, `thick`, `pixel` |
| `platform.edgeStyle` | `sketchy`（Doodle/GGG）, `rough`（RDR）, `pixelated`（Pixel） |
| `background.usePaperTexture` | `true` 纸纹背景，`false` 纯色+扫描线 |
| `background.scanLines` | Pixel 主题 CRT 扫描线效果 |
| `particles.shape` | `circle`（默认）, `pixel`（Pixel） |
| `palette` | 完整颜色集: `bg, sky, accent, gold, ink, paper, danger` 等 |
| `chapters` | 每章颜色覆盖（`ch1` 到 `ch5`） |
| `cssClass` | 添加到 `#game-container` 的 CSS 类 |

主题切换应用 CSS 类到容器，Renderer 缓存主题颜色。engine.js 中的 `_hexToRgba()` 工具函数将主题颜色转换为 rgba 字符串。

## 常见开发任务

### 添加新章节
1. 在 `story.js` 的 `LevelData.levels` 下添加关卡数据，key 为 `chX_sY`
2. 定义 platforms, interactables（含对话/谜题）, hazards, triggers, decorations
3. 如需新调色板，在 `config.js` 的 `MORANDI` 中添加

### 添加新谜题类型
1. 在 `Game` 类（`game.js`）中添加渲染方法: `_renderXxxPuzzle()`
2. 在 `startPuzzle()` 中根据 `puzzleConfig.type` 调用
3. 添加解答逻辑并调用 `solvePuzzle()` 完成

### 添加新交互类型
1. 在 `Renderer.drawInteractable()`（`engine.js`）中添加绘制代码
2. 在 `triggerInteraction()`（`game.js`）中添加触发逻辑

### 添加新主题
1. 在 `config.js` 的 `THEMES` 枚举和 `THEME_DEFS` 对象中添加条目
2. 在 `style.css` 中添加 CSS 覆盖（如 `.theme-newtheme #dialogue-box`）
3. 如主题有独特角色身形，在 engine.js 添加 `drawCharacter_newshape()` 方法
4. 如主题有独特背景层样式，在 engine.js 添加 `_drawBgLayer_newstyle()` 方法

### 添加提示终端（游戏内可发现指南）
在 `story.js` 关卡数据中放置 `type: 'terminal'` 且 `flag` 包含 'hint' 或 'secret' 的交互物。标记由 `Game.flags[]` 追踪并计入 `Game._secretsFound`。

### WALKTHROUGH 系统
内置游戏指南在 `config.js` 的 `WALKTHROUGH` 常量中，提供每章:
- `name`, `password`, `passwordHint`
- `secrets[]` — 隐藏发现物
- `tips[]` — 游戏提示
- `circuitSolution` — 第2章电路谜题答案
- `memoryOrder` — 第3章记忆谜题顺序
- `emotionOrder` — 第5章情感谜题顺序

外部攻略: 项目根目录的 `WALKTHROUGH.md`。
