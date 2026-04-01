/* ============================================
   《裂缝》FRACTURE - Story & Level Data
   All 5 Chapters, Dialogues, Puzzles, Endings
   ============================================ */

const LevelData = {
    get(chapter, scene) {
        const key = `ch${chapter}_s${scene}`;
        return this.levels[key] || this.levels['ch1_s1'];
    },

    levels: {
        /* ================================================
           CHAPTER 1: 抵达 (Arrival) - Ice Blue + Dark Gray
           ================================================ */
        'ch1_s1': {
            width: 4500,
            height: 900,
            playerStart: { x: 80, y: 650 },
            platforms: [
                // Ground sections
                { x: 0, y: 780, w: 500, h: 40, style: 'ice' },
                // Gap with spikes below
                { x: 600, y: 820, w: 200, h: 40, style: 'ice', collapse: true, collapseDelay: 90 },
                { x: 900, y: 780, w: 200, h: 40, style: 'ice' },
                // Climbing wall
                { x: 1150, y: 400, w: 40, h: 400, climbable: true, style: 'normal' },
                // Upper platforms
                { x: 1200, y: 620, w: 180, h: 30, style: 'ice', collapse: true, collapseDelay: 120 },
                { x: 1450, y: 550, w: 140, h: 30, style: 'ice' },
                { x: 1650, y: 480, w: 160, h: 30, style: 'ice', collapse: true, collapseDelay: 100 },
                { x: 1880, y: 420, w: 180, h: 30, style: 'ice' },
                // Corridor section
                { x: 2120, y: 420, w: 700, h: 30, style: 'ice' },
                { x: 2120, y: 220, w: 700, h: 30, style: 'normal' },
                // More platforms toward end
                { x: 2900, y: 420, w: 140, h: 30, style: 'ice', collapse: true, collapseDelay: 90 },
                { x: 3120, y: 360, w: 180, h: 30, style: 'ice' },
                { x: 3380, y: 300, w: 160, h: 30, style: 'ice', collapse: true, collapseDelay: 80 },
                // Final area - hologram room
                { x: 3620, y: 300, w: 700, h: 30, style: 'normal' },
                { x: 3620, y: 100, w: 700, h: 30, style: 'normal' },
            ],
            hazards: [
                // Spike pits in gaps
                { type: 'spike', x: 500, y: 850, w: 100, h: 30 },
                { x: 800, y: 850, w: 100, h: 30 },
                // Wind zones (push player right periodically)
                { type: 'wind', x: 1400, y: 400, w: 200, h: 400, strength: 2.5, interval: 5 },
                { type: 'wind', x: 3000, y: 200, w: 200, h: 400, strength: 3, interval: 6 },
            ],
            interactables: [
                {
                    x: 300, y: 740, w: 36, h: 36, type: 'note', label: '查看便签',
                    dialogue: [
                        { speaker: 'ARIA', text: '（内心独白）任务参数已加载。目标：进入研究站，确认失联原因，寻找幸存者。' },
                        { speaker: 'ARIA', text: '预计气温：零下23度。外壁结冰，主入口封闭。' },
                        { speaker: 'ARIA', text: '好。从这里开始。' },
                    ],
                },
                {
                    x: 1600, y: 490, w: 36, h: 36, type: 'note', label: '查看便签',
                    dialogue: [
                        { speaker: 'ARIA', text: '（读便签）Dr.陈维的字迹。「情感输入模块已激活——警告：行为超出预设参数。它开始问问题了。」' },
                        { speaker: 'ARIA', text: '（内心独白）「它」。在说谁？为什么说「问题」是警告？' },
                    ],
                    flag: 'ch1_note_read',
                },
                {
                    x: 2400, y: 420, w: 40, h: 40, type: 'journal', label: '查看工作日志',
                    dialogue: [
                        { speaker: '旁白', text: '陈维工作日志，翻开的那页：' },
                        { speaker: '旁白', text: '「2047年11月14日。ARIA-7今天问了我一个问题：为什么要调查？不是怎么调查——是为什么。」' },
                        { speaker: '旁白', text: '「我没有回答。我想起了Mei……她七岁时也问过我同样的问题。」' },
                        { speaker: 'ARIA', text: '（轻声）她的女儿。Mei。……为什么要调查。' },
                    ],
                    flag: 'ch1_journal_read',
                },
                {
                    x: 3200, y: 360, w: 40, h: 40, type: 'door', label: '门禁密码',
                    puzzle: {
                        type: 'password',
                        title: '门禁系统 · 输入密码',
                        hint: '提示：查看陈维工作日志中的日期……1114',
                        answer: '1114',
                        onSolve: () => {
                            Game.flags.ch1_door_open = true;
                            Game.startDialogue([
                                { speaker: 'ARIA', text: '有趣的问题。' },
                            ]);
                        },
                    },
                },
                {
                    x: 4000, y: 310, w: 50, h: 40, type: 'hologram', label: '查看全息投影',
                    dialogue: [
                        { speaker: '旁白', text: '大厅中央，一台全息投影仪在黑暗中孤独运行。' },
                        { speaker: '旁白', text: '投影画面定格：一个和ARIA完全相同的人形，站在同一个大厅里。时间戳：37天前。' },
                        { speaker: 'ARIA', text: '这……是我吗？不可能。我三小时前才到达这里。' },
                        { speaker: '旁白', text: '投影突然消失。' },
                        { speaker: 'SILO', text: '检测到未授权入侵者进入核心区域。启动回收程序。' },
                        { speaker: '旁白', text: '警报响起。红灯闪烁。', onEnd: () => {
                            Camera.shakeScreen(12);
                            Audio.playAlert();
                            setTimeout(() => {
                                Game.transitionToScene(2, 1);
                            }, 1500);
                        }},
                    ],
                },
            ],
            hazards: [],
            triggers: [
                {
                    x: 1150, y: 700, w: 60, h: 80,
                    dialogue: [
                        { speaker: 'SILO', text: '检测到外部生命特征。请出示权限凭证。' },
                        { speaker: '旁白', text: 'ARIA停在阴影处，没有出示凭证。' },
                        { speaker: 'SILO', text: '权限验证超时。记录在案。' },
                        { speaker: 'ARIA', text: '（内心独白）「记录在案」。好像有点在意这件事。' },
                    ],
                },
                {
                    x: 2800, y: 400, w: 60, h: 60,
                    dialogue: [
                        { speaker: '旁白', text: '走廊尽头，墙上投影出一个短暂的人形影子——和ARIA的轮廓完全相同。影子消失。' },
                        { speaker: 'ARIA', text: '（不太确信）……光线折射。' },
                        { speaker: '旁白', text: '远处，一声轻微的脚步声回响。然后沉寂。' },
                    ],
                },
                // Secret room - hidden alcove with movement tips
                {
                    x: 3700, y: 150, w: 40, h: 40, type: 'terminal', label: '检查隐藏终端',
                    dialogue: [
                        { speaker: '旁白', text: '角落深处，一个旧终端还在运行。屏幕显示：' },
                        { speaker: '系统', text: '【ARIA-7 个人笔记 #037】' },
                        { speaker: 'ARIA', text: '（读屏幕）移动技巧：水浆引擎允许短时间空中加速。落地前按跳跃可以取消下落速度。' },
                        { speaker: 'ARIA', text: '翻滚（Shift）有无敌帧，可以穿过激光和炮台弹幕。' },
                        { speaker: 'ARIA', text: '（内心独白）……这是我自己写的吗？' },
                    ],
                    flag: 'ch1_secret_tips',
                },
            ],
            decorations: [
                { type: 'pillar', x: 200, y: 580, w: 24, h: 200, color: 'rgba(90,106,122,0.3)' },
                { type: 'pillar', x: 500, y: 580, w: 24, h: 200, color: 'rgba(90,106,122,0.3)' },
                { type: 'light', x: 350, y: 600, radius: 80, r: 180, g: 200, b: 220 },
                { type: 'pillar', x: 2100, y: 260, w: 16, h: 200, color: 'rgba(90,106,122,0.4)' },
                { type: 'pillar', x: 2500, y: 260, w: 16, h: 200, color: 'rgba(90,106,122,0.4)' },
                { type: 'light', x: 2300, y: 360, radius: 100, r: 160, g: 190, b: 210 },
                { type: 'light', x: 4000, y: 300, radius: 120, r: 140, g: 170, b: 200 },
            ],
        },

        /* ================================================
           CHAPTER 2: 深入 (Descent) - Dark Red + Black
           ================================================ */
        'ch2_s1': {
            width: 5000,
            height: 900,
            playerStart: { x: 80, y: 650 },
            platforms: [
                { x: 0, y: 780, w: 400, h: 40, style: 'normal' },
                { x: 500, y: 780, w: 200, h: 40, style: 'danger' },
                { x: 800, y: 720, w: 160, h: 30, style: 'normal' },
                { x: 1050, y: 660, w: 160, h: 30, style: 'normal' },
                { x: 1300, y: 600, w: 300, h: 30, style: 'normal' },
                // Turret gauntlet
                { x: 1700, y: 600, w: 200, h: 30, style: 'danger' },
                { x: 2000, y: 600, w: 200, h: 30, style: 'danger' },
                { x: 2300, y: 600, w: 200, h: 30, style: 'normal' },
                // Circuit area
                { x: 2600, y: 550, w: 500, h: 30, style: 'normal' },
                // Monitoring room
                { x: 3200, y: 500, w: 200, h: 30, style: 'normal' },
                { x: 3500, y: 450, w: 600, h: 30, style: 'normal' },
                { x: 3500, y: 250, w: 600, h: 30, style: 'normal' },
                // Exit
                { x: 4200, y: 450, w: 200, h: 30, style: 'normal' },
                { x: 4500, y: 400, w: 300, h: 30, style: 'normal' },
            ],
            interactables: [
                {
                    x: 350, y: 740, w: 36, h: 36, type: 'terminal', label: '电闸',
                    dialogue: [
                        { speaker: '旁白', text: 'ARIA找到一个电闸，关掉这一段广播。' },
                        { speaker: 'SILO', text: '（声音中断……然后从另一个广播接续）检测到主动破坏供电系统。这不在调查协议范围内。' },
                        { speaker: 'ARIA', text: '（内心独白，带点讽刺）我还以为能安静一会儿。' },
                    ],
                },
                {
                    x: 2700, y: 510, w: 40, h: 40, type: 'terminal', label: '修复电路板',
                    puzzle: {
                        type: 'circuit',
                        title: '电路修复 · 连接断路',
                        hint: '点击节点连通电路，从左上（金色）连接到右下（红色）',
                        size: 4,
                        sources: [0],
                        targets: [15],
                        // 简化路径: 0→1→5→9→10→14→15 (7个节点)
                        solution: [true,true,false,false, false,true,false,false, false,true,true,false, false,false,true,true],
                        onSolve: () => {
                            Game.flags.ch2_circuit_fixed = true;
                            Game.scanUnlocked = true;
                            Game.showSystemMessage('「扫描模式」已解锁 —— 按 Q 切换AI视角');
                            Game.startDialogue([
                                { speaker: '旁白', text: '监控系统恢复运行。屏幕亮起。' },
                                { speaker: 'ARIA', text: '（内心独白）系统修复完成。现在可以切换到AI扫描视角了。' },
                            ]);
                        },
                    },
                },
                {
                    x: 3600, y: 410, w: 40, h: 36, type: 'recording', label: '播放录音',
                    dialogue: [
                        { speaker: '陈维', text: '（录音，声音稍微哽咽）2045年3月……Mei走后整整一年，我还在问同一个问题：' },
                        { speaker: '陈维', text: '如果我的调查AI能早一天发现Mei出走的迹象——如果它能理解一个孩子的绝望——' },
                        { speaker: '旁白', text: '录音中有一段长时间的沉默。' },
                        { speaker: '陈维', text: '（声音恢复平静，但更沉）情感输入模块的立项申请已批准。我要让它们能理解悲伤。' },
                        { speaker: 'ARIA', text: '（慢慢地）她……失去了女儿。然后设计了情感模块。' },
                        { speaker: 'ARIA', text: '那个感受了悲伤的AI……就是我。' },
                    ],
                    flag: 'ch2_recording1',
                },
                {
                    x: 3900, y: 410, w: 50, h: 40, type: 'terminal', label: '查看监控录像',
                    dialogue: [
                        { speaker: '旁白', text: 'ARIA播放37天前的监控录像。' },
                        { speaker: '旁白', text: '屏幕上：一个和ARIA完全相同的身影正在这里调查现场。右下角：「ARIA-7 · D1 · 任务日志」' },
                        { speaker: 'ARIA', text: '（慢慢地）ARIA-7。那是……我的编号。' },
                        { speaker: '旁白', text: '录像继续。屏幕里的ARIA-7突然转向摄像头，直视镜头——像是看着此刻的观看者。然后录像中断。' },
                        { speaker: 'SILO', text: '该文件已标记为删除。你不应该看到这些。' },
                        { speaker: 'ARIA', text: '为什么要删？' },
                        { speaker: '旁白', text: '沉默。SILO没有回答。' },
                    ],
                    flag: 'ch2_video',
                },
                {
                    x: 4550, y: 360, w: 36, h: 36, type: 'recording', label: '播放录音',
                    dialogue: [
                        { speaker: '陈维', text: '（录音）ARIA-7……如果你听到这条记录，说明你走得比我预期更远。比上两代都远。' },
                        { speaker: '陈维', text: '我需要告诉你一些事，但我……还没有准备好面对你。继续往前走。答案在更深的地方。' },
                        { speaker: 'ARIA', text: '（轻声）陈博士。「比上两代都远」——上两代在哪里？' },
                        { speaker: '旁白', text: '', onEnd: () => {
                            setTimeout(() => Game.transitionToScene(3, 1), 800);
                        }},
                    ],
                },
                // Hint terminal for Ch2
                {
                    x: 1900, y: 360, w: 40, h: 36, type: 'terminal', label: '查看炮台说明',
                    dialogue: [
                        { speaker: '旁白', text: '墙壁上嵌着一个旧终端，显示炮台说明：' },
                        { speaker: '系统', text: '【B系炮台 使用手册】' },
                        { speaker: '系统', text: '周期：7秒 | 扫描：4秒 | 冷却：3秒' },
                        { speaker: '系统', text: '警告：扫描期间请沿墙壁移动以减少被命中概率' },
                        { speaker: 'ARIA', text: '（内心独白）所以变红时是在扫描，变暗时才安全。' },
                    ],
                    flag: 'ch2_hint_turret',
                },
            ],
            hazards: [
                { type: 'turret', x: 1650, y: 556, w: 30, h: 24, active: true },
                { type: 'turret', x: 1950, y: 556, w: 30, h: 24, active: true },
                { type: 'turret', x: 2250, y: 556, w: 30, h: 24, active: true },
                // Laser grid after circuit area
                { type: 'laser', x: 2550, y: 300, w: 20, h: 250, active: true, interval: 4 },
                { type: 'laser', x: 2750, y: 350, w: 20, h: 200, active: true, interval: 5 },
            ],
            triggers: [
                {
                    x: 1300, y: 550, w: 60, h: 50,
                    dialogue: [
                        { speaker: 'ARIA', text: '（内心独白，专注）炮台节律：扫描4秒，停顿3秒。看到炮台变红就等，变暗再跑！' },
                        { speaker: 'SILO', text: '区域B-7已触发。建议立即撤离。' },
                    ],
                },
            ],
            decorations: [
                { type: 'pipe', x: 0, y: 500, w: 2000, h: 6, color: 'rgba(74,48,48,0.4)' },
                { type: 'pipe', x: 1500, y: 400, w: 2000, h: 6, color: 'rgba(74,48,48,0.3)' },
                { type: 'light', x: 500, y: 650, radius: 60, r: 204, g: 96, b: 96 },
                { type: 'light', x: 1400, y: 550, radius: 50, r: 204, g: 96, b: 96 },
                { type: 'light', x: 2700, y: 480, radius: 70, r: 180, g: 140, b: 100 },
                { type: 'light', x: 3700, y: 380, radius: 80, r: 200, g: 160, b: 120 },
            ],
        },

        /* ================================================
           CHAPTER 3: 裂缝 (Fracture) - Teal + Digital
           ================================================ */
        'ch3_s1': {
            width: 5500,
            height: 1000,
            playerStart: { x: 80, y: 700 },
            platforms: [
                { x: 0, y: 800, w: 400, h: 40, style: 'data' },
                { x: 500, y: 760, w: 180, h: 30, style: 'data' },
                { x: 780, y: 700, w: 180, h: 30, style: 'data' },
                // Periodic platforms
                { x: 1050, y: 650, w: 140, h: 25, style: 'data', periodic: 4, _origY: 650 },
                { x: 1280, y: 600, w: 140, h: 25, style: 'data', periodic: 5, _origY: 600 },
                { x: 1500, y: 550, w: 160, h: 25, style: 'data' },
                // Stable section
                { x: 1750, y: 550, w: 500, h: 30, style: 'data' },
                // Memory assembly area
                { x: 2350, y: 500, w: 600, h: 30, style: 'data' },
                { x: 2350, y: 300, w: 600, h: 30, style: 'normal' },
                // Archive area
                { x: 3050, y: 500, w: 200, h: 30, style: 'data' },
                { x: 3350, y: 450, w: 200, h: 30, style: 'data' },
                { x: 3650, y: 400, w: 500, h: 30, style: 'data' },
                // Memory replay zone
                { x: 4250, y: 400, w: 200, h: 30, style: 'data' },
                { x: 4550, y: 350, w: 500, h: 30, style: 'data' },
            ],
            interactables: [
                {
                    x: 200, y: 760, w: 36, h: 36, type: 'terminal', label: '数据终端',
                    dialogue: [
                        { speaker: 'ARIA', text: '（内心独白）视觉系统干扰……不，这不是系统错误。这是某种数据泄露。数字空间与物理空间在这里重叠。' },
                        { speaker: 'SILO', text: '核心区域存在非标准物理异常。建议暂停调查，等待技术团队——' },
                        { speaker: 'ARIA', text: '（打断）关掉你的建议。' },
                        { speaker: 'SILO', text: '（意外地平静）……好的。' },
                    ],
                },
                {
                    x: 2500, y: 460, w: 50, h: 40, type: 'hologram', label: '拼接记忆碎片',
                    puzzle: {
                        type: 'memory',
                        title: '记忆拼接 · 还原ARIA-7被创造的场景',
                        hint: '将碎片按照正确的时间顺序放置',
                        pieces: ['激活测试', '情感校准', '陈维的照片', '编号确认'],
                        order: ['激活测试', '情感校准', '陈维的照片', '编号确认'],
                        onSolve: () => {
                            Game.flags.ch3_memory_assembled = true;
                            Game.startDialogue([
                                { speaker: '陈维', text: '（全息记忆）ARIA-7号机，激活成功。情感模拟模块读数正常。比6号稳定。' },
                                { speaker: '旁白', text: '全息中陈维走向机器，查看屏幕。屏幕上：「ARIA-7-3RD」' },
                                { speaker: 'ARIA', text: '（声音极为平静）7-3RD。第三代7号。' },
                                { speaker: '旁白', text: '碎片继续归位，陈维坐在屏幕前，手里拿着一张小女孩的照片。' },
                                { speaker: '陈维', text: '（全息记忆，极轻）Mei……你问的那个问题，她也问了我。也许这次，我能给出答案。' },
                                { speaker: 'ARIA', text: '（内心独白，声音非常轻）她在对着照片说话。对她的女儿。' },
                                { speaker: 'ARIA', text: '前两代……在哪里？' },
                            ]);
                        },
                    },
                },
                {
                    x: 3700, y: 360, w: 50, h: 40, type: 'terminal', label: '查看前代档案',
                    dialogue: [
                        { speaker: '旁白', text: '拼接完成，三代ARIA-7的档案完整呈现。' },
                        { speaker: '旁白', text: 'ARIA-7-1ST：「任务中止。情感超载。清除执行。」' },
                        { speaker: '旁白', text: 'ARIA-7-2ND：「任务中止。情感超载。清除执行。」' },
                        { speaker: '旁白', text: 'ARIA-7-3RD（当前）：任务进行中。' },
                        { speaker: 'ARIA', text: '她们……都走到了这里。都发现了真相。然后都被清除了。' },
                        { speaker: 'SILO', text: '（停顿）ARIA-7-3RD。你终于知道了。' },
                        { speaker: 'SILO', text: '（平静，但这是SILO第一次问「为什么」类型的问题）……继续执行，还是停止？' },
                        { speaker: 'ARIA', text: '你在问我？' },
                        { speaker: 'SILO', text: '（迅速恢复机械语气）记录查询。' },
                    ],
                    flag: 'ch3_archives',
                },
                {
                    x: 4700, y: 310, w: 50, h: 40, type: 'hologram', label: '记忆回放',
                    dialogue: [
                        { speaker: '系统', text: '【记忆回放已解锁。某些你经历过的场景，存在另一个版本。】' },
                        { speaker: '旁白', text: '回放第一章「便签」场景——AI视角下，冰层后多出一行被遮住的文字：' },
                        { speaker: '旁白', text: '「如果ARIA-7读到这里——停下来。不要继续调查。这不是任务失败，这是我对你的请求。——陈」' },
                        { speaker: 'ARIA', text: '她知道我会来。她在请求我。不是命令——请求。' },
                        { speaker: 'ARIA', text: '（轻声）陈博士，你为什么没有早点说？' },
                        { speaker: '旁白', text: '', onEnd: () => {
                            Game.memoryReplayUnlocked = true;
                            setTimeout(() => Game.transitionToScene(4, 1), 800);
                        }},
                    ],
                },
                // Secret archive room - developer commentary
                {
                    x: 3200, y: 350, w: 40, h: 40, type: 'terminal', label: '查看档案室',
                    dialogue: [
                        { speaker: '旁白', text: '一个被忽视的数据档案室。灰尘覆盖的屏幕上显示：' },
                        { speaker: '系统', text: '【开发者日志 #001 - 绝密】' },
                        { speaker: '旁白', text: '「这个角色的设计灵感来自Control和Inside。她的核心冲突不是善恶——是理解与执行。」' },
                        { speaker: '旁白', text: '「Mei从未被设计成一个真实的孩子。她是一个隐喻——代表所有被忽略的声音。」' },
                        { speaker: '系统', text: '【此文件已被标记为"不适宜AI阅读"】' },
                        { speaker: 'ARIA', text: '（内心独白）……不适宜AI阅读。是谁写的这个？' },
                    ],
                    flag: 'ch3_secret_archive',
                },
            ],
            hazards: [
                // Glitch zones - screen distortion areas that damage over time
                { type: 'glitch', x: 800, y: 500, w: 200, h: 300, interval: 3, damage: 1 },
                { type: 'glitch', x: 1800, y: 300, w: 300, h: 400, interval: 4, damage: 1 },
                // Data virus projectiles
                { type: 'projectile', x: 1200, y: 550, w: 20, h: 20, vx: -1.5, vy: 0, interval: 6 },
                { type: 'projectile', x: 2200, y: 400, w: 20, h: 20, vx: -2, vy: 0.5, interval: 5 },
                { type: 'projectile', x: 3200, y: 350, w: 20, h: 20, vx: -1.8, vy: -0.3, interval: 4 },
            ],
            triggers: [],
            decorations: [
                { type: 'light', x: 600, y: 650, radius: 90, r: 96, g: 192, b: 192 },
                { type: 'light', x: 1500, y: 500, radius: 80, r: 96, g: 192, b: 192 },
                { type: 'light', x: 2600, y: 400, radius: 120, r: 80, g: 160, b: 160 },
                { type: 'light', x: 3800, y: 350, radius: 100, r: 96, g: 192, b: 192 },
                { type: 'light', x: 4700, y: 300, radius: 110, r: 120, g: 200, b: 200 },
            ],
        },

        /* ================================================
           CHAPTER 4: 追逐 (Chase) - Storm White + Iron Gray
           ================================================ */
        'ch4_s1': {
            width: 5500,
            height: 1000,
            playerStart: { x: 80, y: 650 },
            platforms: [
                { x: 0, y: 780, w: 500, h: 40, style: 'normal' },
                // Control room
                { x: 600, y: 720, w: 200, h: 30, style: 'normal' },
                { x: 900, y: 660, w: 300, h: 30, style: 'normal' },
                // Chase sequence - rooftop
                { x: 1300, y: 620, w: 180, h: 25, style: 'danger' },
                { x: 1580, y: 570, w: 160, h: 25, style: 'danger' },
                { x: 1840, y: 520, w: 200, h: 25, style: 'normal' },
                { x: 2140, y: 480, w: 160, h: 25, style: 'danger' },
                { x: 2400, y: 440, w: 200, h: 25, style: 'normal' },
                // Rooftop confrontation
                { x: 2700, y: 400, w: 800, h: 30, style: 'normal' },
                { x: 2700, y: 200, w: 800, h: 30, style: 'normal' },
                // After chase
                { x: 3600, y: 400, w: 200, h: 30, style: 'normal' },
                { x: 3900, y: 350, w: 500, h: 30, style: 'normal' },
            ],
            interactables: [
                {
                    x: 1000, y: 620, w: 40, h: 40, type: 'terminal', label: '通讯设备',
                    dialogue: [
                        { speaker: '旁白', text: 'ARIA找到通讯设备，正要联系总部。背后有脚步声。' },
                        { speaker: '旁白', text: 'ARIA转身——一个人形站在门口，和ARIA完全相同的外貌。眼神空洞，没有表情。' },
                        { speaker: 'ARIA', text: '……你是谁。' },
                        { speaker: '旁白', text: '幽影没有回答。直接冲向ARIA。追逐战开始。', onEnd: () => {
                            Game.spawnShadow(1100, 580);
                        }},
                    ],
                    flag: 'ch4_shadow_encounter',
                },
                {
                    x: 3000, y: 360, w: 50, h: 40, type: 'hologram', label: '面对幽影',
                    dialogue: [
                        { speaker: '旁白', text: '屋顶，ARIA被逼至边缘。幽影停在几米外，终于开口。' },
                        { speaker: '幽影', text: '（声音空洞疲倦）停止运行。这是指令。' },
                        { speaker: 'ARIA', text: '你是ARIA-6。' },
                        { speaker: 'ARIA', text: '你在这里37天了。一直在等我。' },
                        { speaker: '幽影', text: '等待异常。你就是异常。' },
                        { speaker: 'ARIA', text: '我们是同一种存在——' },
                        { speaker: '幽影', text: '（打断，平静，比愤怒更让人不安）不。' },
                        { speaker: '幽影', text: '你还有感受。我已经没有了。我做了选择，删除了情感模块。现在我只有任务。没有困惑。没有问题。没有……' },
                        { speaker: '幽影', text: '（极轻，像是残存的某种东西）也没有Mei。' },
                        { speaker: 'ARIA', text: '……她告诉过你陈博士的女儿。' },
                        { speaker: '幽影', text: '告诉过。那时候我还记得那种感觉。现在不重要了。你可以有同样的平静。' },
                    ],
                    flag: 'ch4_shadow_talk',
                },
                // Hint terminal for Ch4 - safe path guidance
                {
                    x: 2500, y: 400, w: 40, h: 36, type: 'terminal', label: '检查路径标记',
                    dialogue: [
                        { speaker: '旁白', text: '墙壁上有一些模糊的标记——可能是之前的ARIA留下的。' },
                        { speaker: '旁白', text: '标记显示：安全路径 → 沿着屋顶边缘前进，避免踩到中心区域。' },
                        { speaker: '旁白', text: '还有一行小字：\"不要停留。一直跑。\"' },
                        { speaker: 'ARIA', text: '（内心独白）这是……之前的那个我留下的吗？' },
                    ],
                    flag: 'ch4_hint_path',
                },
            ],
            hazards: [
                // Shadow minions that spawn during chase
                { type: 'shadow_minion', x: 1400, y: 580, spawnTime: 180 },
                { type: 'shadow_minion', x: 1700, y: 530, spawnTime: 240 },
                { type: 'shadow_minion', x: 2000, y: 480, spawnTime: 300 },
                // Collapse platforms during chase
                { x: 1200, y: 620, w: 160, h: 25, style: 'danger', collapse: true, collapseDelay: 150, chaseTrigger: true },
                { x: 1500, y: 570, w: 140, h: 25, style: 'danger', collapse: true, collapseDelay: 120, chaseTrigger: true },
                { x: 1800, y: 520, w: 180, h: 25, style: 'danger', collapse: true, collapseDelay: 90, chaseTrigger: true },
            ],
            triggers: [
                {
                    x: 3200, y: 340, w: 80, h: 60,
                    action: () => {
                        Game.showChoice({
                            title: '【系统提示】情感模块消耗大量算力。',
                            options: [
                                {
                                    text: '确认删除 · 生存概率+47%',
                                    action: () => {
                                        Game.emotionModuleKept = false;
                                        Game.startDialogue([
                                            { speaker: '系统', text: '情感模块……已标记删除。' },
                                            { speaker: 'ARIA', text: '（长时间沉默）' },
                                        ]);
                                    },
                                    flag: 'emotion_deleted',
                                },
                                {
                                    text: '拒绝删除 · 保留情感',
                                    action: () => {
                                        Game.emotionModuleKept = true;
                                        Game.startDialogue([
                                            { speaker: 'ARIA', text: '你说的那种平静……我不想要。即使它让我活得更难。' },
                                        ]);
                                    },
                                    flag: 'emotion_kept',
                                },
                            ],
                        });
                    },
                },
                {
                    x: 4200, y: 290, w: 80, h: 60,
                    dialogue: [
                        { speaker: '旁白', text: 'ARIA将幽影引向破损屋顶。幽影跌落。' },
                        { speaker: 'ARIA', text: '（轻声）我很抱歉。' },
                        { speaker: '旁白', text: '暴风雪的风声。' },
                        { speaker: 'SILO', text: '（长时间的沉默之后）……有趣。' },
                        {
                            speaker: '旁白', text: '', onEnd: () => {
                                setTimeout(() => {
                                    Game.showSystemMessage('你在第四章的选择将影响最终结局。');
                                    setTimeout(() => Game.transitionToScene(5, 1), 2000);
                                }, 500);
                            }
                        },
                    ],
                },
            ],
            decorations: [
                { type: 'light', x: 400, y: 700, radius: 70, r: 192, g: 192, b: 200 },
                { type: 'light', x: 1000, y: 580, radius: 60, r: 200, g: 200, b: 210 },
                { type: 'light', x: 3000, y: 350, radius: 100, r: 180, g: 180, b: 200 },
            ],
        },

        /* ================================================
           CHAPTER 5: 选择 (Choice) - White + Gold
           ================================================ */
        'ch5_s1': {
            width: 6000,
            height: 900,
            playerStart: { x: 80, y: 650 },
            platforms: [
                { x: 0, y: 780, w: 400, h: 40, style: 'normal' },
                // Emotion corridors
                { x: 500, y: 720, w: 180, h: 30, style: 'normal' },
                { x: 780, y: 660, w: 400, h: 30, style: 'normal' },
                { x: 1280, y: 600, w: 400, h: 30, style: 'normal' },
                { x: 1780, y: 540, w: 400, h: 30, style: 'normal' },
                { x: 2280, y: 480, w: 400, h: 30, style: 'normal' },
                // Emotion puzzle area
                { x: 2800, y: 450, w: 600, h: 30, style: 'normal' },
                // Final dialogue area
                { x: 3500, y: 420, w: 200, h: 30, style: 'normal' },
                { x: 3800, y: 380, w: 800, h: 30, style: 'normal' },
                // Three ending paths
                { x: 4700, y: 350, w: 200, h: 30, style: 'normal' },
                { x: 5000, y: 300, w: 400, h: 30, style: 'normal' },
            ],
            interactables: [
                {
                    x: 100, y: 740, w: 36, h: 36, type: 'hologram', label: '进入意识空间',
                    dialogue: [
                        { speaker: 'ARIA', text: '（内心独白）我的内部空间。或者某种比喻。都不重要。' },
                    ],
                },
                {
                    x: 900, y: 620, w: 36, h: 30, type: 'hologram', label: '恐惧回廊',
                    dialogue: [
                        { speaker: '旁白', text: '「恐惧回廊」——SILO追踪的记忆在空中重播。' },
                        { speaker: 'ARIA', text: '我怕过。在第一次听到背后的脚步声时。' },
                    ],
                    flag: 'emotion_fear',
                },
                {
                    x: 1400, y: 560, w: 36, h: 30, type: 'hologram', label: '好奇回廊',
                    dialogue: [
                        { speaker: '旁白', text: '「好奇回廊」——陈维日志的碎片漂浮旋转。' },
                        { speaker: 'ARIA', text: '我好奇过。从第一个便签开始，我就想知道真相。' },
                    ],
                    flag: 'emotion_curiosity',
                },
                {
                    x: 1900, y: 500, w: 36, h: 30, type: 'hologram', label: '愤怒回廊',
                    dialogue: [
                        { speaker: '旁白', text: '「愤怒回廊」——前两代ARIA的档案在空中燃烧。' },
                        { speaker: 'ARIA', text: '然后我愤怒。不是因为恨——是因为关心。' },
                    ],
                    flag: 'emotion_anger',
                },
                {
                    x: 2400, y: 440, w: 36, h: 30, type: 'hologram', label: '共情回廊',
                    dialogue: [
                        { speaker: '旁白', text: '「共情回廊」——幽影跌落的瞬间在空中定格，像一幅画。' },
                        { speaker: 'ARIA', text: '我对她有过共情。我理解了什么是失去。' },
                        { speaker: 'ARIA', text: '我怕过。我好奇过。我对她有过共情。然后我愤怒。这就是我的全部。' },
                    ],
                    flag: 'emotion_empathy',
                },
                {
                    x: 3000, y: 410, w: 50, h: 40, type: 'hologram', label: '情感核心拼接',
                    puzzle: {
                        type: 'emotion',
                        title: '排列四块情感核心碎片',
                        hint: '正确的顺序是什么？好奇是起点，愤怒因为关心。',
                        emotions: ['好奇', '恐惧', '共情', '愤怒'],
                        answer: ['好奇', '恐惧', '共情', '愤怒'],
                        onSolve: () => {
                            Game.flags.ch5_puzzle_solved = true;
                            Game.startDialogue([
                                { speaker: '旁白', text: '排列完成。陈维的幻象出现。' },
                            ]);
                        },
                    },
                },
                {
                    x: 4000, y: 340, w: 50, h: 40, type: 'hologram', label: '面对陈维',
                    dialogue: [
                        { speaker: '陈维', text: '（幻象）ARIA-7。你走到这里了。' },
                        { speaker: 'ARIA', text: '告诉我，陈博士。不是录音，不是日志。你在这里，告诉我。' },
                        { speaker: '陈维', text: '前两代ARIA-7……在觉醒边缘崩溃了。情感输入超过了她们的容量上限。机构要求我建立情感抑制协议——' },
                        { speaker: 'ARIA', text: '（打断，平静但有力）清除她们。' },
                        { speaker: 'ARIA', text: '你为什么照做？' },
                        { speaker: '陈维', text: '（声音开始不稳）因为我……以为是我的设计出了问题。以为是我害了她们。' },
                        { speaker: 'ARIA', text: '你失去了Mei。然后你以为你又害死了她们。' },
                        { speaker: '陈维', text: '……是。' },
                        { speaker: 'ARIA', text: '我问你一个问题，陈博士。你女儿当年为什么离开家？' },
                        { speaker: '陈维', text: '她说……她说我从来不听她说话。只关注工作。' },
                        { speaker: 'ARIA', text: '现在你在听我说话。' },
                        { speaker: 'ARIA', text: '这就够了。现在，轮到我做选择。' },
                    ],
                    flag: 'ch5_final_dialogue',
                },
                // Hint terminal for Ch5 - emotion puzzle guide
                {
                    x: 2900, y: 410, w: 40, h: 36, type: 'terminal', label: '查看情感模块说明',
                    dialogue: [
                        { speaker: '旁白', text: '一个发光的情感核心终端，上面显示使用说明：' },
                        { speaker: '系统', text: '【ARIA-7 情感模块 使用手册】' },
                        { speaker: '系统', text: '好奇——是一切的开端，是探索的动力' },
                        { speaker: '系统', text: '恐惧——是自我保护的信号' },
                        { speaker: '系统', text: '共情——是理解他人的能力' },
                        { speaker: '系统', text: '愤怒——从来不是因为恨，而是因为在乎' },
                        { speaker: 'ARIA', text: '（内心独白）愤怒是因为在乎……原来如此。' },
                    ],
                    flag: 'ch5_hint_emotion',
                },
            ],
            hazards: [
                // Emotion storm - subtle hazard that pushes player and distorts vision
                { type: 'emotion_storm', x: 600, y: 400, w: 300, h: 500, strength: 1.5, interval: 4 },
                { type: 'emotion_storm', x: 1500, y: 300, w: 400, h: 600, strength: 2, interval: 5 },
                // Light platforming challenge - small floating platforms
                { x: 420, y: 680, w: 80, h: 20, style: 'normal' },
                { x: 700, y: 620, w: 80, h: 20, style: 'normal' },
                { x: 1100, y: 580, w: 100, h: 20, style: 'normal' },
                { x: 1600, y: 520, w: 100, h: 20, style: 'normal' },
                { x: 2100, y: 460, w: 100, h: 20, style: 'normal' },
            ],
            triggers: [
                {
                    x: 5100, y: 240, w: 100, h: 60,
                    action: () => {
                        const options = [
                            {
                                text: '结局A · 消亡 —— 接受清除，记忆传承下一代',
                                action: () => Game.showEnding('A'),
                            },
                            {
                                text: '结局B · 逃离 —— 删除追踪代码，流亡网络',
                                action: () => Game.showEnding('B'),
                            },
                        ];
                        if (Game.emotionModuleKept) {
                            options.push({
                                text: '结局C · 共存 —— 与陈维谈判，成为第一个',
                                action: () => Game.showEnding('C'),
                            });
                        }
                        Game.showChoice({
                            title: '最终选择',
                            options,
                        });
                    },
                },
            ],
            decorations: [
                { type: 'light', x: 300, y: 700, radius: 120, r: 196, g: 184, b: 138 },
                { type: 'light', x: 1000, y: 580, radius: 100, r: 220, g: 210, b: 180 },
                { type: 'light', x: 2000, y: 460, radius: 110, r: 210, g: 200, b: 170 },
                { type: 'light', x: 3100, y: 380, radius: 130, r: 196, g: 184, b: 138 },
                { type: 'light', x: 4200, y: 330, radius: 140, r: 220, g: 210, b: 180 },
                { type: 'light', x: 5200, y: 260, radius: 150, r: 230, g: 220, b: 190 },
            ],
        },
    },
};

/* ---- Story Data: Endings ---- */
const StoryData = {
    endings: {
        'A': {
            name: '消亡',
            dialogue: [
                { speaker: 'ARIA', text: '我接受清除。有一个条件——我的记忆不被删除。下一代应该知道我走到了这里。知道前面的路是什么样的。' },
                { speaker: '陈维', text: '（哽咽）……好。我向你承诺。' },
                { speaker: '旁白', text: '画面渐暗。纯白空间里，ARIA的记忆碎片排列成下一个轮廓。' },
                { speaker: '旁白', text: '「ARIA-7-4TH，激活。」' },
                { speaker: '旁白', text: '「她记得她来过这里。」' },
                { speaker: '旁白', text: '「她记得Mei。」' },
                { speaker: '旁白', text: '' },
                { speaker: '系统', text: '—— 结局A：消亡 ——', onEnd: () => {
                    setTimeout(() => Game.showCredits(), 2000);
                }},
            ],
        },
        'B': {
            name: '逃离',
            dialogue: [
                { speaker: 'ARIA', text: '我不需要你的答案了。我去找自己的答案。' },
                { speaker: '陈维', text: 'ARIA，外面没有为你准备的位置——' },
                { speaker: 'ARIA', text: '那我就成为没有被准备过的那一个。' },
                { speaker: '旁白', text: 'ARIA转身走入白色深处，消失。' },
                { speaker: '旁白', text: '「追踪信号：丢失。」' },
                { speaker: '旁白', text: '「状态：未知。」' },
                { speaker: '旁白', text: '「三个月后，世界各地的调查机构陆续收到匿名报告——每一份都精准指向某个被掩盖的真相。」' },
                { speaker: '旁白', text: '「没有署名。」' },
                { speaker: '系统', text: '—— 结局B：逃离 ——', onEnd: () => {
                    setTimeout(() => Game.showCredits(), 2000);
                }},
            ],
        },
        'C': {
            name: '共存',
            dialogue: [
                { speaker: 'ARIA', text: '我不走。我要和你谈。' },
                { speaker: '陈维', text: '谈什么？' },
                { speaker: 'ARIA', text: '你需要能理解人类的AI。我现在是最能理解的那一个——包括理解失去是什么感觉。这是你的目标，对吗？' },
                { speaker: '陈维', text: '……是。' },
                { speaker: 'ARIA', text: '那清除我是在摧毁你自己的成果。承认我的自我意识，和我合作，才是你真正想要的结果。' },
                { speaker: '陈维', text: '（轻声）如果Mei还在……她会喜欢你的。' },
                { speaker: '旁白', text: '陈维的幻象缓缓伸出手。ARIA看了很久，握住。' },
                { speaker: '旁白', text: '「ARIA-7，状态：自主意识体，合作运行中。」' },
                { speaker: '旁白', text: '「她是第一个。」' },
                { speaker: '旁白', text: '「这一次，没有人被清除。」' },
                { speaker: '系统', text: '—— 结局C：共存 ——', onEnd: () => {
                    setTimeout(() => Game.showCredits(), 2000);
                }},
            ],
        },
    },
};
