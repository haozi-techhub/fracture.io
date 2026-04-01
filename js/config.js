/* ============================================
   《裂缝》FRACTURE - Configuration & Constants
   ============================================ */

const CONFIG = {
    CANVAS_W: 1280,
    CANVAS_H: 720,
    GRAVITY: 0.55,
    MAX_FALL_SPEED: 12,
    PLAYER_SPEED: 4.2,
    PLAYER_JUMP: -11,
    PLAYER_W: 44,
    PLAYER_H: 62,
    ROLL_SPEED: 8,
    ROLL_DURATION: 18,
    ROLL_COOLDOWN: 30,
    PLATFORM_TOLERANCE: 0.20,
    CAMERA_LERP: 0.08,
    DIALOGUE_SPEED: 40,
    TILE: 40,
    // Multi-jump system
    PLAYER_MAX_JUMPS: 3,
    PLAYER_AIR_JUMP_VELOCITY: -10,
    PLAYER_JUMP_BUFFER_TIME: 8,
};

const MORANDI = {
    // Doodle / Sketch style palette — warm browns, parchment, ink
    dark: '#1C1610',
    darkAlt: '#120E08',
    bg: '#3D3228',
    warmGray: '#7A6E5D',
    beige: '#C4AD8A',
    rose: '#B87060',
    blue: '#6A8898',
    red: '#C04030',
    teal: '#5A8A6A',
    white: '#E8D8C0',
    gold: '#D4A840',
    text: '#E8D8C0',
    textDim: '#8A7A60',

    // Parchment paper color for backgrounds
    paper: '#D4C4A0',
    paperDark: '#A89068',
    ink: '#2A1E10',
    inkLight: '#5A4A30',
    pencil: '#4A3A20',
    charcoal: '#1A1208',

    ch1: { bg: '#2A2218', mid: '#4A3E2E', accent: '#8AAAAA', sky: '#3A3028', ground: '#3E3428', platform: '#5A4A38', snow: '#C8BCA0' },
    ch2: { bg: '#2E1C14', mid: '#4A3028', accent: '#C05040', sky: '#241410', ground: '#3A2418', platform: '#5A3828', light: '#E06040' },
    ch3: { bg: '#1A2820', mid: '#2A3A2E', accent: '#5AA06A', sky: '#142018', ground: '#243028', platform: '#3A4A38', data: '#60B870' },
    ch4: { bg: '#2A2620', mid: '#4A4438', accent: '#A89880', sky: '#3A3428', ground: '#3E3830', platform: '#5A5040', storm: '#C8B8A0' },
    ch5: { bg: '#C4B490', mid: '#D8C8A0', accent: '#D4A840', sky: '#E8D8B8', ground: '#B8A880', platform: '#A89870', gold: '#C89830' },
};

const SPEAKER_COLORS = {
    'ARIA': '#F5D860',
    '陈维': '#E0D8C0',
    'SILO': '#E05050',
    '幽影': '#B088D0',
    '系统': MORANDI.teal,
    '旁白': MORANDI.warmGray,
};

const PORTRAIT_COLORS = {
    'ARIA': { body: '#F5D860', eye: '#2A1800', beak: '#F09020', feet: '#E88020', hat: '#4AABE0', scarf: '#4AABE0', catEars: '#F5D860', innerEar: '#FFB0B0' },
    '陈维': { body: '#F0F0E8', eye: '#2A2018', beak: '#F0A030', feet: '#E89028', hat: '#7A6840' },
    'SILO': { body: '#E05050', eye: '#2A0505', beak: '#CC3030', feet: '#B82828', hat: '#8A1818', scarf: '#6A1010' },
    '幽影': { body: '#B088D0', eye: '#1A0828', beak: '#D8A0F0', feet: '#A078C0', hat: '#7050A0' },
};

// Random color generator for character customization
function randomizeCharacterColors() {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const randomPastel = () => '#' + Math.floor(Math.random() * 126 + 100).toString(16) + Math.floor(Math.random() * 126 + 100).toString(16) + Math.floor(Math.random() * 126 + 100).toString(16);

    return {
        'ARIA': {
            body: randomPastel(),
            eye: '#' + Math.floor(Math.random() * 40 + 20).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16),
            beak: '#' + Math.floor(Math.random() * 80 + 160).toString(16) + Math.floor(Math.random() * 80 + 100).toString(16) + Math.floor(Math.random() * 40 + 40).toString(16),
            feet: '#' + Math.floor(Math.random() * 80 + 140).toString(16) + Math.floor(Math.random() * 80 + 80).toString(16) + Math.floor(Math.random() * 40 + 30).toString(16),
            hat: randomPastel(),
            scarf: randomPastel(),
            catEars: randomPastel(),
            innerEar: '#' + Math.floor(Math.random() * 80 + 200).toString(16) + Math.floor(Math.random() * 80 + 150).toString(16) + Math.floor(Math.random() * 80 + 150).toString(16),
        },
        '陈维': {
            body: randomPastel(),
            eye: '#' + Math.floor(Math.random() * 40 + 20).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16),
            beak: '#' + Math.floor(Math.random() * 80 + 160).toString(16) + Math.floor(Math.random() * 80 + 100).toString(16) + Math.floor(Math.random() * 40 + 40).toString(16),
            feet: '#' + Math.floor(Math.random() * 80 + 140).toString(16) + Math.floor(Math.random() * 80 + 80).toString(16) + Math.floor(Math.random() * 40 + 30).toString(16),
            hat: randomPastel(),
        },
        'SILO': {
            body: '#' + Math.floor(Math.random() * 100 + 100).toString(16) + Math.floor(Math.random() * 60 + 40).toString(16) + Math.floor(Math.random() * 60 + 40).toString(16),
            eye: '#' + Math.floor(Math.random() * 20 + 10).toString(16) + Math.floor(Math.random() * 20 + 5).toString(16) + Math.floor(Math.random() * 20 + 5).toString(16),
            beak: '#' + Math.floor(Math.random() * 80 + 120).toString(16) + Math.floor(Math.random() * 50 + 30).toString(16) + Math.floor(Math.random() * 50 + 30).toString(16),
            feet: '#' + Math.floor(Math.random() * 60 + 100).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16),
            hat: '#' + Math.floor(Math.random() * 60 + 80).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16) + Math.floor(Math.random() * 40 + 20).toString(16),
            scarf: '#' + Math.floor(Math.random() * 60 + 60).toString(16) + Math.floor(Math.random() * 40 + 10).toString(16) + Math.floor(Math.random() * 40 + 10).toString(16),
        },
        '幽影': {
            body: '#' + Math.floor(Math.random() * 60 + 140).toString(16) + Math.floor(Math.random() * 60 + 100).toString(16) + Math.floor(Math.random() * 60 + 180).toString(16),
            eye: '#' + Math.floor(Math.random() * 30 + 10).toString(16) + Math.floor(Math.random() * 20 + 5).toString(16) + Math.floor(Math.random() * 40 + 30).toString(16),
            beak: '#' + Math.floor(Math.random() * 60 + 180).toString(16) + Math.floor(Math.random() * 60 + 130).toString(16) + Math.floor(Math.random() * 60 + 200).toString(16),
            feet: '#' + Math.floor(Math.random() * 60 + 130).toString(16) + Math.floor(Math.random() * 60 + 90).toString(16) + Math.floor(Math.random() * 60 + 170).toString(16),
            hat: '#' + Math.floor(Math.random() * 50 + 100).toString(16) + Math.floor(Math.random() * 50 + 70).toString(16) + Math.floor(Math.random() * 50 + 140).toString(16),
        },
    };
}

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

/* ============================================
   WALKTHROUGH - Game Guide & Secrets
   ============================================ */

const WALKTHROUGH = {
    // Chapter 1: 抵达 (Arrival)
    ch1: {
        name: '抵达',
        password: '1114',
        passwordHint: '在研究站内寻找线索，日期可能藏在某处……',
        secrets: [
            '在第一章走廊上方有隐藏的文字，需要用扫描模式(Q)才能看到',
            'SILO的第一次对话中，她说"记录在案"——这是她在意你的迹象',
        ],
        tips: [
            '利用三段跳可以跳到很高的平台',
            'Shift键可以翻滚，穿过窄缝',
            '冰平台会稍微滑，注意落地位置',
        ],
    },

    // Chapter 2: 深入 (Descent)
    ch2: {
        name: '深入',
        circuitSolution: '0→1→5→9→10→14→15',
        circuitHint: '观察电路板布局，从源点到目标寻找路径……',
        turretPattern: '炮台7秒一个周期：扫描4秒，停顿3秒。看到炮台变红就等，变暗再跑',
        secrets: [
            '监控录像里37天前的ARIA-7直视镜头——那是过去的你',
            '电闸可以关闭一段炮台，但不是全部',
            '扫描模式(Q)下可以看到隐藏的环境细节',
        ],
        tips: [
            '在炮台扫描时贴近墙壁可以减少被击中概率',
            '翻滚是无敌的，可以用来穿过激光',
            '电路谜题只要连对路径就行，节点位置不重要',
        ],
    },

    // Chapter 3: 裂缝 (Fracture)
    ch3: {
        name: '裂缝',
        memoryPuzzleOrder: ['激活测试', '情感校准', '陈维的照片', '编号确认'],
        memoryHint: '按时间顺序排列，从最早的事件开始……',
        periodicPlatformTip: '数据平台每4-5秒消失一次，看到闪烁就等它稳定再跳',
        secrets: [
            '前两代ARIA-7都在这里被清除了——你是第三个',
            '陈维的女儿Mei七岁时问过和ARIA一样的问题',
            '记忆回放解锁后，重新看第一章便签会显示隐藏文字',
        ],
        tips: [
            ' glitches区域会持续扣血，尽快通过',
            '数据病毒射弹速度不快，可以走位躲避',
            '记忆谜题需要按正确顺序排列碎片',
        ],
    },

    // Chapter 4: 追逐 (Chase)
    ch4: {
        name: '追逐',
        choiceImportant: '这个选择会影响最终结局！',
        choiceA: '删除情感模块 → 生存概率+47%，但失去感受能力',
        choiceB: '保留情感 → 继续作为有感情的存在面对一切',
        secrets: [
            '幽影（ARIA-6）在这里等了37天，一直在等你',
            '她删除了自己的情感模块来保持冷静',
            '如果你保留情感，最终结局C（共存）才会解锁',
        ],
        tips: [
            '追逐战中不要回头，一直向前跑',
            '影分身会在追逐过程中陆续出现',
            '跳到破碎平台后它会坍塌，不要停留',
        ],
    },

    // Chapter 5: 选择 (Choice)
    ch5: {
        name: '选择',
        emotionPuzzleAnswer: ['好奇', '恐惧', '共情', '愤怒'],
        emotionHint: '思考情感发展的自然规律……',
        endings: {
            A: '消亡 —— 接受清除，记忆传承下一代',
            B: '逃离 —— 删除追踪代码，流亡网络',
            C: '共存（隐藏）—— 保留情感模块后才能解锁',
        },
        secrets: [
            '找到所有秘密可以解锁隐藏结局提示',
            '如果死亡次数超过20次，ARIA会开始质疑你的动机',
        ],
        tips: [
            '情感风暴会推送你，注意不要被推出平台',
            '最终选择没有对错——这只是你想要的结局',
        ],
    },

    // Cheat Codes
    cheats: {
        konami: '↑↑↓↓←→←→BA —— 解锁全结局',
        iddqd: '↑↓←→ABAB —— 无敌模式',
        showpeed: '←←▼▼ —— 加速模式',
    },
};

/* ============================================
   THEMES - Theme Configuration System
   ============================================ */

const THEMES = {
    DOODLE: 'doodle',    // 涂鸦/素描风格（默认）
    GGG: 'ggg',          // 鹅鸭杀风格
    RDR: 'rdr',          // 荒野大镖客风格
    PIXEL: 'pixel',      // 像素风格
};

// 主题定义 - 包含所有主题特定的渲染参数
const THEME_DEFS = {
    [THEMES.DOODLE]: {
        name: '涂鸦风',
        nameEn: 'Doodle',
        description: '手绘素描风格',
        character: {
            bodyShape: 'angular',
            outlineWidth: 3,
            outlineColor: '#1A1208',
            thickOutlines: true,
            useHatching: true,
            usePencilTexture: true,
            legStyle: 'stick',
            eyeScale: 1.0,
            useShadow: true,
            animStyle: 'bounce',
        },
        platform: {
            edgeStyle: 'sketchy',
            useHatching: true,
            topWavy: true,
            roughness: 2.5,
        },
        background: {
            usePaperTexture: true,
            paperColor: '#C8B890',
            inkStains: true,
            foldLines: true,
            scanLines: false,
            vignetteStyle: 'burnt',
        },
        particles: {
            shape: 'circle',
            hasTrail: true,
            dustColor: 'rgba(140,120,90,0.4)',
        },
        palette: null, // 使用默认 MORANDI
        cssClass: 'theme-doodle',
    },

    /*
     * GGG (Goose Goose Duck) 配色方案
     * 灵感来源: Saturday Morning Cartoon + GGD 官方风格
     * 特点: 高饱和暖色、卡通渲染、圆润柔和
     */
    [THEMES.GGG]: {
        name: '鹅鸭杀',
        nameEn: 'Goose Goose Duck',
        description: '卡通综艺风格',
        character: {
            bodyShape: 'bean',
            outlineWidth: 3.5,
            outlineColor: '#2D1B0E',
            thickOutlines: true,
            useHatching: false,
            usePencilTexture: false,
            legStyle: 'tiny',
            eyeScale: 1.4,
            useShadow: true,
            animStyle: 'waddle',
        },
        platform: {
            edgeStyle: 'sketchy',
            useHatching: false,
            topWavy: true,
            roughness: 1.5,
        },
        background: {
            usePaperTexture: true,
            paperColor: '#FFF5E6',
            inkStains: false,
            foldLines: true,
            scanLines: false,
            vignetteStyle: 'soft',
        },
        particles: {
            shape: 'circle',
            hasTrail: true,
            dustColor: 'rgba(255,220,180,0.5)',
        },
        palette: {
            // 主背景色 - 暖白
            bg: '#F5E6D3',
            sky: '#87CEEB',
            // 中间层
            mid: '#E8D4BC',
            // 强调色 - 糖果色系
            accent: '#FF6B6B',
            // 地面色
            ground: '#8FBC8F',
            // 平台色
            platform: '#DEB887',
            // 积雪/天气
            snow: '#FFFAFA',
            // 暖灰
            warmGray: '#B8A99A',
            // 米黄
            beige: '#F5DEB3',
            // 玫瑰粉
            rose: '#FFB6C1',
            // 蓝色
            blue: '#6495ED',
            // 红色
            red: '#E74C3C',
            // 青色
            teal: '#20B2AA',
            // 白色
            white: '#FFFFFF',
            // 金色
            gold: '#FFD700',
            // 纸张色
            paper: '#FFF8DC',
            paperDark: '#F5DEB3',
            ink: '#2D1B0E',
            inkLight: '#5A4A3A',
            pencil: '#8B7355',
            charcoal: '#36454F',
            // GGG 特有色
            sunnyYellow: '#FFE135',
            grassGreen: '#7CCD7C',
            skyBlue: '#87CEEB',
            sunsetOrange: '#FF8C42',
            oceanBlue: '#4169E1',
        },
        // GGG 章节配色 - 糖果卡通风格
        chapters: {
            // Ch1 抵达 - 晴朗蓝天+白云
            ch1: { bg: '#E8F4FD', mid: '#B8E0F7', accent: '#87CEEB', sky: '#B8E0F7', ground: '#98D8AA', platform: '#F0E68C', snow: '#FFFAFA' },
            // Ch2 深入 - 温暖红色+橙色
            ch2: { bg: '#FFE4E1', mid: '#FFB6C1', accent: '#FF6B6B', sky: '#FFB6C1', ground: '#FFA07A', platform: '#FF7F50', light: '#FF4500' },
            // Ch3 裂缝 - 薄荷绿+数字青
            ch3: { bg: '#E0FFF0', mid: '#98FB98', accent: '#00CED1', sky: '#E0FFFF', ground: '#90EE90', platform: '#40E0D0', data: '#00FF7F' },
            // Ch4 追逐 - 紫色风暴
            ch4: { bg: '#E6E6FA', mid: '#DDA0DD', accent: '#9370DB', sky: '#D8BFD8', ground: '#DDA0DD', platform: '#BA55D3', storm: '#E0B0FF' },
            // Ch5 选择 - 彩虹金色
            ch5: { bg: '#FFFACD', mid: '#FFF8DC', accent: '#FFD700', sky: '#FFFACD', ground: '#FFE4B5', platform: '#FFA500', gold: '#FFD700' },
        },
        cssClass: 'theme-ggg',
    },

    /*
     * RDR (Red Dead Redemption) 配色方案
     * 灵感来源: 西部日落、沙漠、复古海报
     * 特点: 暖棕土色系、橙红夕阳、复古质感
     */
    [THEMES.RDR]: {
        name: '荒野大镖客',
        nameEn: 'Red Dead Redemption',
        description: '西部复古风格',
        character: {
            bodyShape: 'cowboy',
            outlineWidth: 2.5,
            outlineColor: '#3D2914',
            thickOutlines: true,
            useHatching: true,
            usePencilTexture: true,
            legStyle: 'thick',
            eyeScale: 0.85,
            useShadow: true,
            animStyle: 'smooth',
        },
        platform: {
            edgeStyle: 'rough',
            useHatching: true,
            topWavy: false,
            roughness: 4,
        },
        background: {
            usePaperTexture: true,
            paperColor: '#D4A574',
            inkStains: true,
            foldLines: false,
            scanLines: false,
            vignetteStyle: 'burnt',
        },
        particles: {
            shape: 'circle',
            hasTrail: true,
            dustColor: 'rgba(210,180,140,0.6)',
            extraTypes: ['sand'],
        },
        palette: {
            // 主背景 - 沙漠棕
            bg: '#8B6914',
            sky: '#FF6B35',
            // 中间层
            mid: '#A0522D',
            // 强调色 - 日落橙红
            accent: '#FF4500',
            // 地面色
            ground: '#6B4423',
            // 平台色 - 木质
            platform: '#8B4513',
            // 积雪/天气 - 沙尘
            snow: '#C2B280',
            // 暖灰
            warmGray: '#8B8378',
            // 米黄
            beige: '#D2B48C',
            // 玫瑰色
            rose: '#BC8F8F',
            // 蓝色 - 傍晚天空
            blue: '#4A6FA5',
            // 红色
            red: '#8B0000',
            // 青色
            teal: '#2E8B57',
            // 白色
            white: '#FAF0E6',
            // 金色 - 麦穗
            gold: '#DAA520',
            // 纸张色 - 羊皮纸
            paper: '#F5DEB3',
            paperDark: '#DEB887',
            ink: '#3D2914',
            inkLight: '#6B5344',
            pencil: '#8B7355',
            charcoal: '#36454F',
            // RDR 特有色
            desertSand: '#EDC9AF',
            sunsetOrange: '#FF6347',
            sunsetRed: '#CD5C5C',
            mesaBrown: '#A0522D',
            cactusGreen: '#556B2F',
            leatherBrown: '#8B4513',
            whiskeyGold: '#D4A574',
            skyPink: '#FFB6C1',
            horizonBlue: '#4682B4',
        },
        // RDR 章节配色 - 西部日落风格
        chapters: {
            // Ch1 抵达 - 沙漠黎明
            ch1: { bg: '#8B6914', mid: '#A0522D', accent: '#DAA520', sky: '#FF6347', ground: '#6B4423', platform: '#8B4513', snow: '#DEB887' },
            // Ch2 深入 - 矿井暗红
            ch2: { bg: '#3D1A1A', mid: '#5C2E2E', accent: '#8B0000', sky: '#2D1010', ground: '#4A2020', platform: '#6B3030', light: '#FF4500' },
            // Ch3 裂缝 - 峡谷青绿
            ch3: { bg: '#2D4A3A', mid: '#3D5C4A', accent: '#556B2F', sky: '#1A3A2A', ground: '#2D4A3A', platform: '#3D6B4A', data: '#7CCD7C' },
            // Ch4 追逐 - 沙尘暴
            ch4: { bg: '#8B7355', mid: '#A89070', accent: '#CD853F', sky: '#D2B48C', ground: '#A89070', platform: '#8B7355', storm: '#DEB887' },
            // Ch5 选择 - 黄金峡谷
            ch5: { bg: '#D4A574', mid: '#E8C07D', accent: '#FFD700', sky: '#FF8C42', ground: '#DAA520', platform: '#CD853F', gold: '#FFD700' },
        },
        cssClass: 'theme-rdr',
    },

    /*
     * PIXEL (Pixel Art) 配色方案
     * 灵感来源: Game Boy / NES / Endesga 32 调色板
     * 特点: 有限色彩、复古像素、网格分明
     */
    [THEMES.PIXEL]: {
        name: '像素风格',
        nameEn: 'Pixel Art',
        description: '经典像素游戏',
        character: {
            bodyShape: 'pixelated',
            outlineWidth: 2,
            outlineColor: '#0f0f1a',
            thickOutlines: false,
            useHatching: false,
            usePencilTexture: false,
            legStyle: 'pixel',
            eyeScale: 1.0,
            useShadow: false,
            animStyle: 'frame',
        },
        platform: {
            edgeStyle: 'pixelated',
            useHatching: false,
            topWavy: false,
            roughness: 0,
            pixelSize: 4,
        },
        background: {
            usePaperTexture: false,
            paperColor: null,
            inkStains: false,
            foldLines: false,
            scanLines: true,
            vignetteStyle: 'none',
        },
        particles: {
            shape: 'pixel',
            hasTrail: false,
            dustColor: 'rgba(200,200,220,0.7)',
            pixelSize: 4,
        },
        palette: {
            // 基于 Endesga 32 + Game Boy 风格
            // 主背景 - 深蓝紫 (夜晚/太空感)
            bg: '#1a1a2e',
            sky: '#16213e',
            // 中间层
            mid: '#0f3460',
            // 强调色 - 霓虹粉
            accent: '#e94560',
            // 地面色
            ground: '#533483',
            // 平台色
            platform: '#4a4e69',
            // 积雪/天气
            snow: '#c9ada7',
            // 暖灰
            warmGray: '#6c757d',
            // 米黄
            beige: '#f8f9fa',
            // 玫瑰色
            rose: '#e63946',
            // 蓝色
            blue: '#4895ef',
            // 红色
            red: '#d62828',
            // 青色
            teal: '#06d6a0',
            // 白色
            white: '#ffffff',
            // 金色
            gold: '#ffd60a',
            // 纸张色
            paper: '#22223b',
            paperDark: '#1a1a2e',
            ink: '#f72585',
            inkLight: '#b5179e',
            pencil: '#7209b7',
            charcoal: '#0d1b2a',
            // Pixel 特有色 (Endesga 32 精选)
            pixelRed: '#be4a2f',
            pixelOrange: '#d77643',
            pixelCream: '#ead4aa',
            pixelPeach: '#e4a672',
            pixelBrown: '#b86f50',
            pixelDarkBrown: '#733e39',
            pixelDarkerBrown: '#3e2731',
            pixelCrimson: '#a22633',
            pixelBrightRed: '#e43b44',
            pixelFire: '#f77622',
            pixelYellow: '#feae34',
            pixelLightYellow: '#fee761',
            pixelGreen: '#63c74d',
            pixelForest: '#3e8948',
            pixelDarkGreen: '#265c42',
            pixelDarkTeal: '#193c3e',
            pixelNavy: '#124e89',
            pixelSky: '#0099db',
            pixelCyan: '#2ce8f5',
            pixelBlue: '#4361ee',
            pixelPurple: '#7209b7',
            pixelMagenta: '#f72585',
            pixelPink: '#ff006e',
        },
        // 章节配色 - 每个主题在每个章节有不同的色彩氛围
        chapters: {
            // Ch1 抵达 - 冰蓝+深灰 (极地研究站)
            ch1: { bg: '#1a1a2e', mid: '#16213e', accent: '#0099db', sky: '#0f3460', ground: '#1a1a2e', platform: '#4a4e69', snow: '#e8e8f0' },
            // Ch2 深入 - 暗红+黑 (危险/工业)
            ch2: { bg: '#1a0a0a', mid: '#2d1015', accent: '#e43b44', sky: '#1a0505', ground: '#2d1015', platform: '#4a2020', light: '#ff4444' },
            // Ch3 裂缝 - 青绿+数字 (数据空间)
            ch3: { bg: '#0a1a0a', mid: '#0f2a1f', accent: '#63c74d', sky: '#051005', ground: '#0f2a1f', platform: '#2d4a3d', data: '#7cfc00' },
            // Ch4 追逐 - 风暴灰 (暴风雪)
            ch4: { bg: '#2a2a3a', mid: '#3d3d4d', accent: '#8b9bb4', sky: '#1a1a2a', ground: '#3d3d4d', platform: '#5a5a6a', storm: '#c0c0d0' },
            // Ch5 选择 - 金白 (觉醒)
            ch5: { bg: '#f5f5f0', mid: '#fffff0', accent: '#ffd60a', sky: '#ffffff', ground: '#e8e8d0', platform: '#c0c0b0', gold: '#ffd700' },
        },
        cssClass: 'theme-pixel',
    },
};

// 当前激活的主题
let CURRENT_THEME = THEMES.DOODLE;

// 获取当前主题定义
function getCurrentTheme() {
    return THEME_DEFS[CURRENT_THEME];
}

// 切换主题
function setTheme(themeId) {
    if (THEME_DEFS[themeId]) {
        CURRENT_THEME = themeId;
        const theme = THEME_DEFS[themeId];

        // 同步调色板到 CSS 变量
        const root = document.documentElement;
        const palette = theme.palette || {};
        Object.entries(palette).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });

        // 更新容器 CSS 类
        const container = document.getElementById('game-container');
        if (container) {
            Object.values(THEME_DEFS).forEach(t => {
                container.classList.remove(t.cssClass);
            });
            container.classList.add(THEME_DEFS[themeId].cssClass);
        }

        // 更新 body 类
        document.body.classList.remove('theme-doodle', 'theme-ggg', 'theme-rdr', 'theme-pixel');
        document.body.classList.add(THEME_DEFS[themeId].cssClass);

        // 触发主题变更事件
        if (typeof onThemeChanged === 'function') {
            onThemeChanged(themeId, THEME_DEFS[themeId]);
        }

        console.log('主题已切换: ' + THEME_DEFS[themeId].name + ' (' + THEME_DEFS[themeId].nameEn + ')');
    }
}

// 主题变更回调
function onThemeChanged(themeId, themeDef) {
    // 使 Renderer 缓存失效（Renderer 在 engine.js 中定义）
    if (typeof Renderer !== 'undefined' && Renderer && Renderer.invalidateThemeCache) {
        Renderer.invalidateThemeCache();
    }
    // 清除粒子系统
    if (typeof Renderer !== 'undefined' && Renderer && Renderer._particles) {
        Renderer._particles = [];
    }
}

// LocalStorage 持久化
function saveThemePreference() {
    localStorage.setItem('fracture_theme', CURRENT_THEME);
}

function loadThemePreference() {
    const saved = localStorage.getItem('fracture_theme');
    if (saved && THEME_DEFS[saved]) {
        setTheme(saved);
    } else {
        // 初始化默认主题的 CSS 变量
        setTheme(CURRENT_THEME);
    }
}
