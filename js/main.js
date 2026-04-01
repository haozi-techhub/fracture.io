/* ============================================
   《裂缝》FRACTURE - Main Entry Point
   Game Loop & Initialization
   ============================================ */

(function () {
    'use strict';

    /* ---- Credits Screen ---- */
    Game.showCredits = function () {
        this.transition(() => {
            document.getElementById('hud').classList.add('hidden');
            Renderer.clear(MORANDI.darkAlt);

            const endingName = this.ending ? StoryData.endings[this.ending]?.name : '';

            const titleScreen = document.getElementById('title-screen');
            // Hide cinematic UI
            const cinOverlay = document.getElementById('cin-overlay');
            if (cinOverlay) cinOverlay.style.display = 'none';
            const cinMenu = document.getElementById('cin-final-menu');
            if (cinMenu) cinMenu.style.display = 'none';
            const cinSkip = document.getElementById('cin-skip');
            if (cinSkip) cinSkip.style.display = 'none';
            const cinFooter = document.querySelector('.cin-footer');
            if (cinFooter) cinFooter.style.display = 'none';

            // Create credits overlay
            let creditsDiv = document.getElementById('credits-overlay');
            if (!creditsDiv) {
                creditsDiv = document.createElement('div');
                creditsDiv.id = 'credits-overlay';
                creditsDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:120;text-align:center;';
                titleScreen.appendChild(creditsDiv);
            }
            creditsDiv.innerHTML = `
                <div style="font-size:14px;letter-spacing:8px;color:#9B9590;margin-bottom:12px;">—— 《裂缝》FRACTURE ——</div>
                <h1 style="font-family:var(--font-serif);font-size:52px;font-weight:700;letter-spacing:16px;color:#FFF;text-shadow:0 4px 0 #B8860B,0 6px 12px rgba(0,0,0,0.4);margin-bottom:12px;">完</h1>
                <h2 style="font-size:18px;font-weight:700;letter-spacing:10px;color:#F5D860;margin-bottom:20px;">结局${this.ending || ''}：${endingName}</h2>
                <div style="font-size:15px;color:#C1A0A0;font-style:italic;letter-spacing:2px;margin-bottom:20px;">
                    「你以为你在调查一个AI——直到你发现你就是那个AI。」
                </div>
                <div style="color:#7A7570;font-size:13px;line-height:2.2;margin-bottom:30px;">
                    游戏设计 · 剧本 · 程序<br>
                    基于《裂缝》GDD v2.0 / PRD v2.0 / 剧本 v2.0<br>
                    莫兰迪配色 · 鹅鸭杀风格<br><br>
                    ARIA-7 · 陈维博士 · SILO · 幽影/ARIA-6
                </div>
                ${Game._allSecretsFound ? '<div style="color:#B8860B;font-size:16px;letter-spacing:4px;margin-bottom:20px;">FRACTURE 2: 深渊之下... 敬请期待</div>' : ''}
                <div style="display:flex;gap:14px;">
                    <button class="menu-btn" id="btn-restart">重新开始</button>
                    <button class="menu-btn secondary" id="btn-back-title">返回标题</button>
                </div>
            `;
            titleScreen.classList.add('active');

            setTimeout(() => {
                const restartBtn = document.getElementById('btn-restart');
                const backBtn = document.getElementById('btn-back-title');
                if (restartBtn) {
                    restartBtn.onclick = () => {
                        creditsDiv.remove();
                        _restoreCinUI();
                        restoreTitle();
                        Game.startGame();
                    };
                }
                if (backBtn) {
                    backBtn.onclick = () => {
                        creditsDiv.remove();
                        _restoreCinUI();
                        restoreTitle();
                        Game.state = GAME_STATES.MENU;
                    };
                }
            }, 100);
        });
    };

    function _restoreCinUI() {
        const el = (id) => document.getElementById(id);
        if (el('cin-overlay')) el('cin-overlay').style.display = '';
        if (el('cin-final-menu')) el('cin-final-menu').style.display = '';
        if (el('cin-skip')) el('cin-skip').style.display = '';
        const f = document.querySelector('.cin-footer');
        if (f) f.style.display = '';
    }

    // Store original title HTML on first load
    let _originalTitleHTML = '';

    function restoreTitle() {
        const titleScreen = document.getElementById('title-screen');
        // Restore original HTML if credits replaced it
        const cinOverlay = document.getElementById('cin-overlay');
        if (!cinOverlay) {
            titleScreen.innerHTML = _originalTitleHTML;
        }
        // Skip to final state
        cinematic.skipToEnd();
        titleScreen.classList.add('active');
        bindMenuEvents();
        bindTipsToggle();
        initThemeSelector();
    }

    /* ---- Tips Panel Toggle ---- */
    function bindTipsToggle() {
        const tipsToggle = document.getElementById('btn-tips-toggle');
        const tipsClose = document.getElementById('btn-tips-close');
        const tipsPanel = document.getElementById('tab-tips');
        if (tipsToggle) {
            tipsToggle.onclick = () => {
                Audio.resume();
                Audio.playTabSwitch();
                if (tipsPanel) tipsPanel.classList.toggle('active');
            };
        }
        if (tipsClose) {
            tipsClose.onclick = () => {
                Audio.resume();
                Audio.playMenuClick();
                if (tipsPanel) tipsPanel.classList.remove('active');
            };
        }
    }

    /* ---- Update Cinematic Character Colors ---- */
    function updateCinematicColors(colors) {
        if (colors['ARIA']) {
            charARIA.body = colors['ARIA'].body;
            charARIA.eye = colors['ARIA'].eye;
            charARIA.beak = colors['ARIA'].beak;
            charARIA.feet = colors['ARIA'].feet;
            charARIA.hat = colors['ARIA'].hat;
            charARIA.scarf = colors['ARIA'].scarf;
        }
        if (colors['陈维']) {
            charChen.body = colors['陈维'].body;
            charChen.eye = colors['陈维'].eye;
            charChen.beak = colors['陈维'].beak;
            charChen.feet = colors['陈维'].feet;
            charChen.hat = colors['陈维'].hat;
        }
        if (colors['SILO']) {
            charSILO.body = colors['SILO'].body;
            charSILO.eye = colors['SILO'].eye;
            charSILO.beak = colors['SILO'].beak;
            charSILO.feet = colors['SILO'].feet;
            charSILO.hat = colors['SILO'].hat;
            charSILO.scarf = colors['SILO'].scarf;
        }
        if (colors['幽影']) {
            charShadow.body = colors['幽影'].body;
            charShadow.eye = colors['幽影'].eye;
            charShadow.beak = colors['幽影'].beak;
            charShadow.feet = colors['幽影'].feet;
            charShadow.hat = colors['幽影'].hat;
        }
    }

    /* ---- Menu Event Binding ---- */
    function bindMenuEvents() {
        const startBtn = document.getElementById('btn-start');
        const ctrlBtn = document.getElementById('btn-controls');
        const backBtn = document.getElementById('btn-back');
        const storyBtn = document.getElementById('btn-story');
        const storyCloseBtn = document.getElementById('btn-story-close');

        if (startBtn) {
            startBtn.onclick = () => {
                Audio.resume();
                Audio.playMenuClick();
                Game.startGame();
            };
        }
        if (ctrlBtn) {
            ctrlBtn.onclick = () => {
                Audio.resume();
                Audio.playMenuClick();
                document.getElementById('controls-screen').classList.add('active');
            };
        }
        if (backBtn) {
            backBtn.onclick = () => {
                Audio.resume();
                Audio.playMenuClick();
                document.getElementById('controls-screen').classList.remove('active');
            };
        }
        if (storyBtn) {
            storyBtn.onclick = () => {
                Audio.resume();
                Audio.playMenuClick();
                document.getElementById('story-screen').classList.add('active');
            };
        }
        if (storyCloseBtn) {
            storyCloseBtn.onclick = () => {
                Audio.resume();
                Audio.playMenuClick();
                document.getElementById('story-screen').classList.remove('active');
            };
        }
    }

    /* ---- Theme Selector ---- */
    function initThemeSelector() {
        const themeBtn = document.getElementById('btn-theme');
        const themePanel = document.getElementById('theme-panel');
        const themeGrid = document.getElementById('theme-grid');
        const themeCloseBtn = document.getElementById('btn-theme-close');

        if (!themeBtn || !themePanel) return;

        // Dynamically generate theme cards
        function renderThemeCards() {
            if (!themeGrid) return;
            themeGrid.innerHTML = '';

            Object.entries(THEME_DEFS).forEach(([key, theme]) => {
                const card = document.createElement('div');
                card.className = 'theme-card' + (CURRENT_THEME === key ? ' active' : '');
                card.dataset.theme = key;
                card.innerHTML = `
                    <div class="theme-card-name">${theme.name}</div>
                    <div class="theme-card-name-en">${theme.nameEn}</div>
                    <div class="theme-card-desc">${theme.description}</div>
                `;
                card.addEventListener('click', () => selectTheme(key));
                themeGrid.appendChild(card);
            });
        }

        // Select theme
        function selectTheme(themeId) {
            Audio.playMenuClick();
            setTheme(themeId);
            saveThemePreference();
            renderThemeCards();

            // Show system message
            Game.showSystemMessage('主题已更换: ' + THEME_DEFS[themeId].name, 2000);

            // Close panel
            themePanel.classList.add('hidden');
        }

        // Toggle panel visibility
        themeBtn.addEventListener('click', () => {
            Audio.playTabSwitch();
            renderThemeCards();
            themePanel.classList.toggle('hidden');
        });

        // Close button
        if (themeCloseBtn) {
            themeCloseBtn.addEventListener('click', () => {
                Audio.playMenuClick();
                themePanel.classList.add('hidden');
            });
        }

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!themePanel.contains(e.target) && !themeBtn.contains(e.target)) {
                themePanel.classList.add('hidden');
            }
        });
    }

    /* ---- Main Game Loop ---- */
    let lastTime = -1;
    let accumulator = 0;
    const STEP = 1000 / 60;

    function gameLoop(timestamp) {
        if (lastTime < 0) { lastTime = timestamp; }
        const dt = timestamp - lastTime;
        lastTime = timestamp;
        accumulator += dt;

        if (accumulator > 200) accumulator = 200;

        while (accumulator >= STEP) {
            Input.update();
            Game.update();
            Input.endFrame();
            accumulator -= STEP;
        }

        Game.render();
        requestAnimationFrame(gameLoop);
    }

    /* ============================================
       CINEMATIC ENGINE
       Scene-based immersive story experience
       ============================================ */

    // Character definitions for canvas rendering
    const charARIA   = { body: '#D4A840', eye: '#1A1208', beak: '#C08030', feet: '#A06820', hat: '#6A8898', scarf: '#6A8898' };
    const charChen   = { body: '#C4AD8A', eye: '#1A1208', beak: '#C08030', feet: '#A06820', hat: '#5A4A30' };
    const charSILO   = { body: '#C04030', eye: '#1A0808', beak: '#A03020', feet: '#802818', hat: '#6A1818', scarf: '#4A1010' };
    const charShadow = { body: '#8A7A90', eye: '#1A1220', beak: '#A090B0', feet: '#706080', hat: '#504060' };
    const charExtra  = [
        { body: '#5A8A6A', eye: '#0A1810', beak: '#C08030', feet: '#A06820', hat: '#3A6A48' },
        { body: '#C08030', eye: '#1A1208', beak: '#A06820', feet: '#906018' },
        { body: '#6A8898', eye: '#081820', beak: '#C08030', feet: '#A06820', hat: '#4A7088' },
    ];

    // Scene timeline: [sceneDuration_ms]
    const SCENE_DURATIONS = [3500, 4500, 4500, 4500, 5000, 4500, 5000, Infinity];
    const TOTAL_SCENES = 8;
    const TWIST_TEXT = '你以为你在调查一个AI……\n直到你发现——你就是那个AI。';

    const cinematic = {
        scene: -1,
        startTime: 0,
        sceneStart: 0,
        finished: false,
        twistIdx: 0,
        twistTimer: 0,
        snowParticles: [],

        init() {
            // Create snow particles
            for (let i = 0; i < 80; i++) {
                this.snowParticles.push({
                    x: Math.random() * CONFIG.CANVAS_W,
                    y: Math.random() * CONFIG.CANVAS_H,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: 0.3 + Math.random() * 1.2,
                    size: 1 + Math.random() * 3,
                    alpha: 0.1 + Math.random() * 0.3,
                    wobble: Math.random() * Math.PI * 2,
                });
            }
            this.startTime = Date.now();
            this.goToScene(0);

            // Skip button
            const skipBtn = document.getElementById('cin-skip');
            if (skipBtn) {
                skipBtn.onclick = () => {
                    Audio.resume();
                    Audio.playMenuClick();
                    this.skipToEnd();
                };
            }
        },

        goToScene(n) {
            if (n === this.scene) return;
            // Deactivate all scenes
            document.querySelectorAll('.cin-scene').forEach(s => s.classList.remove('active'));
            this.scene = n;
            this.sceneStart = Date.now();

            if (n >= TOTAL_SCENES) {
                this.finished = true;
                return;
            }

            // Activate current scene
            const el = document.querySelector(`.cin-scene[data-scene="${n}"]`);
            if (el) el.classList.add('active');

            // Scene-specific triggers
            if (n === 5) {
                // Character cards: animate in
                setTimeout(() => {
                    document.querySelectorAll('.cin-char-card').forEach(c => c.classList.add('visible'));
                }, 200);
            }
            if (n === 6) {
                // Start typewriter
                this.twistIdx = 0;
                this.twistTimer = 0;
                const twistEl = document.getElementById('cin-twist-text');
                if (twistEl) twistEl.innerHTML = '';
            }
            if (n === 7) {
                // Title reveal — show menu after delay
                setTimeout(() => {
                    this._showFinalUI();
                }, 2000);
            }
        },

        skipToEnd() {
            this.finished = true;
            this.scene = 7;
            // Hide all scenes, show scene 7
            document.querySelectorAll('.cin-scene').forEach(s => s.classList.remove('active'));
            const s7 = document.querySelector('.cin-scene[data-scene="7"]');
            if (s7) s7.classList.add('active');
            // Hide skip button
            const skipBtn = document.getElementById('cin-skip');
            if (skipBtn) skipBtn.classList.add('hidden');
            this._showFinalUI();
        },

        _showFinalUI() {
            const menu = document.getElementById('cin-final-menu');
            if (menu) menu.classList.add('visible');
            const footer = document.querySelector('.cin-footer');
            if (footer) footer.classList.add('visible');
            const skipBtn = document.getElementById('cin-skip');
            if (skipBtn) skipBtn.classList.add('hidden');
            bindMenuEvents();
            bindTipsToggle();
        },

        update() {
            if (this.finished) return;
            const elapsed = Date.now() - this.sceneStart;
            const dur = SCENE_DURATIONS[this.scene] || 4000;

            // Typewriter for scene 6
            if (this.scene === 6) {
                this.twistTimer++;
                if (this.twistTimer % 4 === 0 && this.twistIdx < TWIST_TEXT.length) {
                    const ch = TWIST_TEXT[this.twistIdx];
                    const twistEl = document.getElementById('cin-twist-text');
                    if (twistEl) {
                        if (ch === '\n') {
                            twistEl.innerHTML += '<br>';
                        } else {
                            twistEl.innerHTML += ch;
                        }
                    }
                    this.twistIdx++;
                }
            }

            // Auto-advance
            if (elapsed > dur && dur !== Infinity) {
                this.goToScene(this.scene + 1);
            }
        },

        // ---- Canvas rendering per scene ----
        render() {
            // Delegate to theme-specific renderer
            const theme = typeof getCurrentTheme === 'function' ? getCurrentTheme() : null;
            const themeId = theme ? theme.character?.bodyShape || 'angular' : 'angular';

            if (themeId === 'bean') {
                this._renderGGG();
            } else if (themeId === 'cowboy') {
                this._renderRDR();
            } else if (themeId === 'pixelated') {
                this._renderPixel();
            } else {
                this._renderDoodle();
            }
        },

        // ---- Theme-specific renderers ----
        _getCinematicColors() {
            const theme = typeof getCurrentTheme === 'function' ? getCurrentTheme() : null;
            const palette = theme && theme.palette ? theme.palette : {};
            return {
                ink: palette.ink || '#2A1E10',
                gold: palette.gold || '#D4A840',
                accent: palette.accent || '#5A8A6A',
                danger: palette.danger || '#C04030',
                paper: palette.paper || '#D4C4A0',
                sky: palette.sky || '#3A3028',
                bg: palette.bg || '#3D3228',
                white: palette.white || '#E8D8C0',
            };
        },

        _renderDoodle() {
            const ctx = Renderer.ctx;
            const time = Date.now();
            const scene = this.scene;
            const elapsed = Date.now() - this.sceneStart;
            const cam = { x: 0, y: 0 };
            const c = this._getCinematicColors();

            // Paper texture background
            Renderer.drawPaperBg();

            // Dark ink wash overlay
            ctx.fillStyle = 'rgba(18,14,8,0.7)';
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

            // Warm glow center
            this._drawDoodleGlow(ctx, time, scene);
            this._drawDoodleParticles(ctx, time, scene);
            this._renderDoodleScene(ctx, time, scene, elapsed, cam);

            // Vignette
            Renderer.drawVignette();
        },

        _drawDoodleGlow(ctx, time, scene) {
            let glowColor, glowIntensity;
            if (scene <= 2) {
                glowColor = [160, 140, 100];
                glowIntensity = 0.08;
            } else if (scene === 3) {
                glowColor = [180, 50, 30];
                glowIntensity = 0.1 + Math.sin(time * 0.005) * 0.04;
            } else if (scene === 4) {
                glowColor = [212, 168, 64];
                glowIntensity = 0.1;
            } else if (scene === 5) {
                glowColor = [140, 120, 90];
                glowIntensity = 0.06;
            } else if (scene === 6) {
                glowColor = [140, 120, 150];
                glowIntensity = 0.08 + Math.sin(time * 0.004) * 0.03;
            } else {
                glowColor = [212, 168, 64];
                glowIntensity = 0.12;
            }
            const grad = ctx.createRadialGradient(
                CONFIG.CANVAS_W / 2 + Math.sin(time * 0.0003) * 80,
                CONFIG.CANVAS_H * 0.38 + Math.cos(time * 0.0004) * 20,
                60,
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2, CONFIG.CANVAS_H * 0.85
            );
            grad.addColorStop(0, `rgba(${glowColor.join(',')},${glowIntensity})`);
            grad.addColorStop(0.5, `rgba(${glowColor.join(',')},${glowIntensity * 0.25})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        },

        _drawDoodleParticles(ctx, time, scene) {
            const dotCount = scene === 3 ? 50 : (scene >= 7 ? 40 : 30);
            for (let i = 0; i < Math.min(dotCount, this.snowParticles.length); i++) {
                const p = this.snowParticles[i];
                p.x += p.vx + Math.sin(time * 0.001 + p.wobble) * 0.2;
                p.y += p.vy;
                if (p.y > CONFIG.CANVAS_H + 5) { p.y = -5; p.x = Math.random() * CONFIG.CANVAS_W; }
                if (p.x < -5) p.x = CONFIG.CANVAS_W + 5;
                if (p.x > CONFIG.CANVAS_W + 5) p.x = -5;
                const a = p.alpha * (scene === 3 ? 0.4 : 0.6);
                ctx.fillStyle = `rgba(180,160,120,${a})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        },

        _renderDoodleScene(ctx, time, scene, elapsed, cam) {
            // Pencil sketch lines for scene 0
            if (scene === 0) {
                for (let i = 0; i < 5; i++) {
                    const ly = 200 + i * 80;
                    const lx = (time * 0.2 + i * 300) % (CONFIG.CANVAS_W + 400) - 200;
                    Renderer.sketchyLine(lx, ly, lx + 150 + Math.sin(i) * 50, ly, 'rgba(180,160,120,0.06)', 1, 3);
                }
            }

            if (scene === 1) {
                this._drawStation(ctx, time, Math.min(elapsed / 1500, 1));
            }

            if (scene === 2) {
                this._drawStation(ctx, time, 1);
                const labGlow = 0.12 + Math.sin(time * 0.003) * 0.06;
                const lgx = CONFIG.CANVAS_W / 2 - 15;
                const lgy = CONFIG.CANVAS_H * 0.52;
                ctx.fillStyle = `rgba(212,168,64,${labGlow})`;
                ctx.beginPath();
                ctx.arc(lgx, lgy, 35, 0, Math.PI * 2);
                ctx.fill();
                const chenAlpha = Math.min(elapsed / 2000, 0.7);
                ctx.globalAlpha = chenAlpha;
                Renderer.drawCharacter(lgx - 22, lgy - 10, 44, 62, charChen, 1, time * 0.001, cam);
                ctx.globalAlpha = 1;
            }

            if (scene === 3) {
                this._drawStation(ctx, time, 1);
                const pulse = Math.sin(time * 0.006) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(180,40,30,${0.02 + pulse * 0.03})`;
                ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
                if (Math.random() < 0.12) {
                    const gy = Math.random() * CONFIG.CANVAS_H;
                    ctx.fillStyle = `rgba(42,30,16,${0.04 + Math.random() * 0.06})`;
                    ctx.fillRect(0, gy, CONFIG.CANVAS_W, 1 + Math.random() * 3);
                }
            }

            if (scene === 4) {
                this._drawGround(ctx, time);
                const walkProgress = Math.min(elapsed / 3000, 1);
                const ariaX = -60 + walkProgress * (CONFIG.CANVAS_W / 2 - 22);
                const ariaY = 564;
                const spotAlpha = Math.min(walkProgress * 0.15, 0.12);
                const spotGrad = ctx.createRadialGradient(ariaX + 22, ariaY + 31, 10, ariaX + 22, ariaY + 31, 100);
                spotGrad.addColorStop(0, `rgba(212,168,64,${spotAlpha})`);
                spotGrad.addColorStop(1, 'rgba(212,168,64,0)');
                ctx.fillStyle = spotGrad;
                ctx.beginPath();
                ctx.arc(ariaX + 22, ariaY + 31, 120, 0, Math.PI * 2);
                ctx.fill();
                const animF = walkProgress < 1 ? time * 0.005 : Math.sin(time * 0.003) * 0.3;
                Renderer.drawCharacter(ariaX, ariaY, 44, 62, charARIA, 1, animF, cam);
            }

            if (scene === 5) {
                this._drawGround(ctx, time);
                const chars = [charChen, charSILO, charShadow];
                const positions = [CONFIG.CANVAS_W * 0.28, CONFIG.CANVAS_W * 0.5, CONFIG.CANVAS_W * 0.72];
                for (let i = 0; i < 3; i++) {
                    const delay = i * 500;
                    const alpha = Math.max(0, Math.min((elapsed - delay) / 800, 1));
                    if (alpha > 0) {
                        ctx.globalAlpha = alpha;
                        const bobY = Math.sin(time * 0.002 + i * 2) * 2;
                        Renderer.drawCharacter(positions[i] - 22, 564 + bobY, 44, 62, chars[i], i === 2 ? -1 : 1, time * 0.001, cam);
                        ctx.globalAlpha = 1;
                    }
                }
            }

            if (scene === 6) {
                this._drawGround(ctx, time);
                const ariaX = CONFIG.CANVAS_W * 0.35;
                Renderer.drawCharacter(ariaX, 564, 44, 62, charARIA, 1, time * 0.001, cam);
                const shadowFlicker = Math.sin(time * 0.008) > -0.2 ? 1 : 0.2;
                ctx.globalAlpha = shadowFlicker * 0.75;
                Renderer.drawCharacter(CONFIG.CANVAS_W * 0.6, 564, 44, 62, charShadow, -1, time * 0.001, cam, true);
                ctx.globalAlpha = 1;
                const lineAlpha = 0.12 + Math.sin(time * 0.005) * 0.06;
                Renderer.sketchyLine(ariaX + 44, 564 + 31, CONFIG.CANVAS_W * 0.6, 564 + 31, `rgba(140,120,150,${lineAlpha})`, 1.5, 4);
            }

            if (scene >= 7) {
                this._drawGround(ctx, time);
                this._drawIdleChars(ctx, time, cam);
            }

            // Pencil scan line
            const scanY = (time * 0.03) % CONFIG.CANVAS_H;
            ctx.strokeStyle = 'rgba(42,30,16,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, scanY);
            for (let sx = 0; sx < CONFIG.CANVAS_W; sx += 15) {
                ctx.lineTo(sx, scanY + (Math.random()-0.5)*1.5);
            }
            ctx.stroke();

            // Scene 3: extra screen shake effect
            if (scene === 3 && Math.random() < 0.03) {
                Camera.shakeScreen(3);
            }
        },

        // ---- GGG Theme Cinematic ----
        _renderGGG() {
            const ctx = Renderer.ctx;
            const time = Date.now();
            const scene = this.scene;
            const elapsed = Date.now() - this.sceneStart;
            const cam = { x: 0, y: 0 };
            const c = this._getCinematicColors();

            // Bright cartoon background gradient
            const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
            grad.addColorStop(0, '#B8E0F7');
            grad.addColorStop(0.4, '#FFF5E6');
            grad.addColorStop(1, '#FFE4E1');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

            // Cartoon clouds
            this._drawGGGClouds(ctx, time, scene);

            // Rainbow glow
            this._drawGGGGlow(ctx, time, scene);

            // Sparkle particles
            this._drawGGGParticles(ctx, time, scene);

            // Scene art
            this._renderGGGScene(ctx, time, scene, elapsed, cam);

            // Vignette (soft)
            this._drawGGGOverlay(ctx, time, scene);
        },

        _drawGGGClouds(ctx, time, scene) {
            const cloudY = 80;
            for (let i = 0; i < 4; i++) {
                const cx = ((i * 350 + time * 0.02) % (CONFIG.CANVAS_W + 200)) - 100;
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.arc(cx, cloudY + i * 20, 50 + i * 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.arc(cx + 40, cloudY + i * 20 - 10, 35 + i * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        },

        _drawGGGGlow(ctx, time, scene) {
            const glowColors = [
                [255, 182, 193], // pink
                [255, 215, 0],   // gold
                [135, 206, 235], // sky blue
            ];
            const idx = scene % 3;
            const glow = glowColors[idx];
            const intensity = 0.15 + Math.sin(time * 0.003) * 0.05;
            const grad = ctx.createRadialGradient(
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H * 0.3, 20,
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H * 0.3, 300
            );
            grad.addColorStop(0, `rgba(${glow.join(',')},${intensity})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        },

        _drawGGGParticles(ctx, time, scene) {
            // Colorful sparkle particles
            const colors = ['#FFD700', '#FF6B6B', '#87CEEB', '#FFB6C1', '#98FB98'];
            for (let i = 0; i < 30; i++) {
                const px = (i * 73 + time * 0.1) % CONFIG.CANVAS_W;
                const py = (i * 47 + time * 0.05) % CONFIG.CANVAS_H;
                const twinkle = Math.sin(time * 0.01 + i) * 0.5 + 0.5;
                const color = colors[i % colors.length];
                ctx.fillStyle = color;
                ctx.globalAlpha = twinkle * 0.7;
                ctx.beginPath();
                // Star shape
                const size = 3 + (i % 3) * 2;
                for (let j = 0; j < 4; j++) {
                    const angle = (j / 4) * Math.PI * 2 + time * 0.002;
                    ctx.lineTo(px + Math.cos(angle) * size, py + Math.sin(angle) * size);
                    ctx.lineTo(px + Math.cos(angle + Math.PI/4) * (size*0.4), py + Math.sin(angle + Math.PI/4) * (size*0.4));
                }
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        },

        _renderGGGScene(ctx, time, scene, elapsed, cam) {
            // Scene-specific GGG cartoon art
            if (scene === 1 || scene === 2) {
                // Cute research station (rounded, cartoon)
                const cx = CONFIG.CANVAS_W / 2;
                const baseY = CONFIG.CANVAS_H * 0.55;
                // Main dome
                ctx.fillStyle = '#FFB6C1';
                ctx.beginPath();
                ctx.arc(cx, baseY - 60, 80, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(cx, baseY - 60, 70, Math.PI, 0);
                ctx.fill();
                // Door
                ctx.fillStyle = '#87CEEB';
                ctx.beginPath();
                ctx.arc(cx, baseY, 25, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(cx - 25, baseY, 50, 40);
            }

            if (scene === 4 || scene === 5) {
                this._drawGround(ctx, time);
                // Draw characters with bounce animation
                const walkProgress = Math.min(elapsed / 3000, 1);
                const ariaX = -60 + walkProgress * (CONFIG.CANVAS_W / 2 - 22);
                const ariaY = 564 + Math.abs(Math.sin(walkProgress * Math.PI * 4)) * -8;
                ctx.globalAlpha = Math.min(walkProgress * 2, 1);
                Renderer.drawCharacter(ariaX, ariaY, 44, 62, charARIA, 1, time * 0.008, cam);
                ctx.globalAlpha = 1;
            }

            if (scene >= 7) {
                this._drawGround(ctx, time);
                this._drawIdleChars(ctx, time, cam);
            }
        },

        _drawGGGOverlay(ctx, time, scene) {
            // Soft vignette for GGG
            const grad = ctx.createRadialGradient(
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2, CONFIG.CANVAS_H * 0.3,
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2, CONFIG.CANVAS_H * 0.9
            );
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, 'rgba(255,182,193,0.2)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        },

        // ---- RDR Theme Cinematic ----
        _renderRDR() {
            const ctx = Renderer.ctx;
            const time = Date.now();
            const scene = this.scene;
            const elapsed = Date.now() - this.sceneStart;
            const cam = { x: 0, y: 0 };

            // Desert sunset gradient
            const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
            grad.addColorStop(0, '#FF6347');
            grad.addColorStop(0.3, '#CD853F');
            grad.addColorStop(0.6, '#8B4513');
            grad.addColorStop(1, '#3D2914');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

            // Dust particles
            this._drawRDRDust(ctx, time, scene);

            // Sun glow
            this._drawRDRSunGlow(ctx, time, scene);

            // Scene art
            this._renderRDRScene(ctx, time, scene, elapsed, cam);

            // Sepia overlay
            ctx.fillStyle = 'rgba(139,69,19,0.1)';
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        },

        _drawRDRDust(ctx, time, scene) {
            for (let i = 0; i < 20; i++) {
                const dx = (i * 73 + time * 0.3) % CONFIG.CANVAS_W;
                const dy = (i * 47 + time * 0.1) % CONFIG.CANVAS_H;
                ctx.fillStyle = `rgba(210,180,140,${0.15 + Math.sin(time * 0.001 + i) * 0.05})`;
                ctx.beginPath();
                ctx.arc(dx, dy, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        },

        _drawRDRSunGlow(ctx, time, scene) {
            const sunX = CONFIG.CANVAS_W * 0.75;
            const sunY = CONFIG.CANVAS_H * 0.25;
            const grad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 150);
            grad.addColorStop(0, 'rgba(255,215,0,0.4)');
            grad.addColorStop(0.5, 'rgba(255,140,0,0.2)');
            grad.addColorStop(1, 'rgba(255,69,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        },

        _renderRDRScene(ctx, time, scene, elapsed, cam) {
            if (scene === 1 || scene === 2) {
                // Mesa silhouettes
                ctx.fillStyle = 'rgba(61,41,20,0.6)';
                for (let i = 0; i < 3; i++) {
                    const mx = i * 400 + 100;
                    ctx.beginPath();
                    ctx.moveTo(mx, CONFIG.CANVAS_H);
                    ctx.lineTo(mx + 80, CONFIG.CANVAS_H - 180 - i * 30);
                    ctx.lineTo(mx + 150, CONFIG.CANVAS_H - 160 - i * 20);
                    ctx.lineTo(mx + 200, CONFIG.CANVAS_H);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            if (scene === 4 || scene >= 7) {
                this._drawGround(ctx, time);
                const walkProgress = Math.min((scene === 4 ? elapsed : 1000) / 3000, 1);
                const ariaX = -60 + walkProgress * (CONFIG.CANVAS_W / 2 - 22);
                const ariaY = 564;
                ctx.globalAlpha = Math.min(walkProgress * 2, 1);
                Renderer.drawCharacter(ariaX, ariaY, 44, 62, charARIA, 1, time * 0.003, cam);
                ctx.globalAlpha = 1;
            }
        },

        // ---- Pixel Theme Cinematic ----
        _renderPixel() {
            const ctx = Renderer.ctx;
            const time = Date.now();
            const scene = this.scene;
            const elapsed = Date.now() - this.sceneStart;
            const cam = { x: 0, y: 0 };

            // Deep blue/purple solid background
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

            // Pixel grid
            ctx.strokeStyle = 'rgba(74,74,110,0.3)';
            ctx.lineWidth = 1;
            const gridSize = 16;
            for (let x = 0; x < CONFIG.CANVAS_W; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, CONFIG.CANVAS_H);
                ctx.stroke();
            }
            for (let y = 0; y < CONFIG.CANVAS_H; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(CONFIG.CANVAS_W, y);
                ctx.stroke();
            }

            // Pixel particles
            this._drawPixelParticles(ctx, time, scene);

            // Neon glow
            this._drawPixelGlow(ctx, time, scene);

            // Scanlines
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let y = 0; y < CONFIG.CANVAS_H; y += 4) {
                ctx.fillRect(0, y, CONFIG.CANVAS_W, 2);
            }

            // Scene art
            this._renderPixelScene(ctx, time, scene, elapsed, cam);
        },

        _drawPixelParticles(ctx, time, scene) {
            for (let i = 0; i < 25; i++) {
                const px = (i * 97 + time * 0.15) % CONFIG.CANVAS_W;
                const py = (i * 73 + time * 0.08) % CONFIG.CANVAS_H;
                const blink = Math.sin(time * 0.01 + i * 0.5) > 0 ? 1 : 0.3;
                ctx.fillStyle = `rgba(255,255,255,${blink * 0.8})`;
                ctx.fillRect(Math.floor(px / 4) * 4, Math.floor(py / 4) * 4, 4, 4);
            }
        },

        _drawPixelGlow(ctx, time, scene) {
            const glowColors = ['#e94560', '#4361ee', '#00d4ff'];
            const idx = scene % 3;
            const glow = glowColors[idx];
            const intensity = 0.1 + Math.sin(time * 0.004) * 0.05;
            const grad = ctx.createRadialGradient(
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H * 0.4, 10,
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H * 0.4, 250
            );
            grad.addColorStop(0, glow + '33');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        },

        _renderPixelScene(ctx, time, scene, elapsed, cam) {
            if (scene === 4 || scene >= 7) {
                this._drawGround(ctx, time);
                const walkProgress = Math.min((scene === 4 ? elapsed : 1000) / 3000, 1);
                const ariaX = -60 + walkProgress * (CONFIG.CANVAS_W / 2 - 22);
                const ariaY = 564;
                ctx.globalAlpha = Math.min(walkProgress * 2, 1);
                Renderer.drawCharacter(ariaX, ariaY, 44, 62, charARIA, 1, time * 0.003, cam);
                ctx.globalAlpha = 1;
            }
        },

        // Draw research station silhouette (sketchy, hand-drawn)
        _drawStation(ctx, time, opacity) {
            ctx.globalAlpha = opacity;
            const baseY = CONFIG.CANVAS_H * 0.58;
            const cx = CONFIG.CANVAS_W / 2;
            const inkColor = '#1A1208';

            // Main building — sketchy rect
            Renderer.sketchyRect(cx - 120, baseY - 120, 240, 180, 'rgba(42,30,16,0.25)', inkColor, 2, 3);
            // Tower
            Renderer.sketchyRect(cx - 30, baseY - 200, 60, 80, 'rgba(42,30,16,0.2)', inkColor, 2, 2);
            // Antenna — sketchy line
            Renderer.sketchyLine(cx, baseY - 200, cx, baseY - 235, inkColor, 2, 2);
            // Blinking light
            const blink = Math.sin(time * 0.004) > 0.3 ? 0.6 : 0.15;
            ctx.fillStyle = `rgba(180,40,30,${blink})`;
            ctx.beginPath();
            ctx.arc(cx, baseY - 237, 3, 0, Math.PI * 2);
            ctx.fill();
            // Windows — small sketchy rectangles
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 5; c++) {
                    Renderer.sketchyRect(cx - 100 + c * 42, baseY - 100 + r * 45, 20, 12, 'rgba(212,168,64,0.08)', 'rgba(42,30,16,0.15)', 1, 1);
                }
            }
            // Side buildings
            Renderer.sketchyRect(cx - 220, baseY - 60, 100, 120, 'rgba(42,30,16,0.2)', inkColor, 1.5, 3);
            Renderer.sketchyRect(cx + 120, baseY - 80, 100, 140, 'rgba(42,30,16,0.2)', inkColor, 1.5, 3);
            // Hatching on buildings for depth
            Renderer.drawHatching(cx - 220, baseY - 60, 100, 120, 'rgba(42,30,16,0.06)', 10, -0.6);
            Renderer.drawHatching(cx + 120, baseY - 80, 100, 140, 'rgba(42,30,16,0.06)', 10, -0.6);
            // Ground
            ctx.fillStyle = 'rgba(42,30,16,0.15)';
            ctx.fillRect(0, baseY + 60, CONFIG.CANVAS_W, CONFIG.CANVAS_H - baseY - 60);
            // Ground line
            Renderer.sketchyLine(0, baseY + 60, CONFIG.CANVAS_W, baseY + 60, 'rgba(42,30,16,0.2)', 1.5, 4);

            ctx.globalAlpha = 1;
        },

        // Draw ground strip (sketchy)
        _drawGround(ctx, time) {
            ctx.fillStyle = 'rgba(42,30,16,0.2)';
            ctx.fillRect(0, 630, CONFIG.CANVAS_W, 90);
            // Top edge — wavy sketchy line
            Renderer.sketchyLine(0, 630, CONFIG.CANVAS_W, 630, 'rgba(42,30,16,0.35)', 2.5, 3);
            // Surface texture
            ctx.fillStyle = 'rgba(42,30,16,0.08)';
            ctx.fillRect(0, 630, CONFIG.CANVAS_W, 10);
            // Hatching
            Renderer.drawHatching(0, 645, CONFIG.CANVAS_W, 40, 'rgba(42,30,16,0.04)', 12, -0.5);
        },

        // Draw idle walking characters for final scene
        _idleChars: [
            { colors: charARIA,    speed: 0.6, y: 564, dir: 1, offset: 0 },
            { colors: charSILO,   speed: 0.45, y: 568, dir: -1, offset: 400 },
            { colors: charChen,    speed: 0.55, y: 566, dir: 1, offset: 800 },
            { colors: charShadow,  speed: 0.35, y: 570, dir: -1, offset: 200 },
        ],

        _drawIdleChars(ctx, time, cam) {
            const allChars = [...this._idleChars];
            charExtra.forEach((c, i) => {
                allChars.push({ colors: c, speed: 0.42 + i * 0.05, y: 565 + i * 2, dir: i % 2 === 0 ? 1 : -1, offset: 150 + i * 250 });
            });
            for (const c of allChars) {
                const totalW = CONFIG.CANVAS_W + 120;
                let px = ((time * c.speed + c.offset) % totalW);
                if (c.dir < 0) px = totalW - px;
                px -= 60;
                const animF = time * 0.006 * c.speed;
                Renderer.drawCharacter(px, c.y, 44, 62, c.colors, c.dir, animF, cam);
            }
        },
    };

    function animateTitle() {
        cinematic.update();
        cinematic.render();
    }

    /* ---- HUD Settings & Exit ---- */
    function initHUDSettings() {
        const settingsOverlay = document.getElementById('settings-overlay');
        const hudSettingsBtn = document.getElementById('hud-settings-btn');
        const hudExitBtn = document.getElementById('hud-exit-btn');
        const settingsCloseBtn = document.getElementById('btn-settings-close');
        const settingsResumeBtn = document.getElementById('btn-settings-resume');
        const settingsQuitBtn = document.getElementById('btn-settings-quit');
        const sfxSlider = document.getElementById('sfx-volume');
        const musicSlider = document.getElementById('music-volume');
        const sfxVal = document.getElementById('sfx-volume-val');
        const musicVal = document.getElementById('music-volume-val');
        const fpsToggle = document.getElementById('show-fps');

        // Volume sliders
        sfxSlider.addEventListener('input', () => {
            const v = sfxSlider.value / 100;
            Audio.setMasterVolume(v * 0.35);
            sfxVal.textContent = sfxSlider.value + '%';
        });
        musicSlider.addEventListener('input', () => {
            const v = musicSlider.value / 100;
            Audio.setMusicVolume(v);
            musicVal.textContent = musicSlider.value + '%';
        });

        // FPS toggle
        fpsToggle.addEventListener('change', () => {
            Game._showFPS = fpsToggle.checked;
        });

        // Settings button in HUD
        hudSettingsBtn.addEventListener('click', () => {
            settingsOverlay.classList.remove('hidden');
            Game._prevState = GAME_STATES.PLAYING;
            Game.state = GAME_STATES.MENU;
        });

        // Exit button in HUD
        hudExitBtn.addEventListener('click', () => {
            const exitConfirm = document.getElementById('exit-confirm');
            exitConfirm.classList.remove('hidden');
            Game._prevState = GAME_STATES.PLAYING;
            Game.state = GAME_STATES.MENU;
        });

        // Close settings
        settingsCloseBtn.addEventListener('click', () => {
            settingsOverlay.classList.add('hidden');
            Game.state = GAME_STATES.PLAYING;
        });

        // Resume button
        settingsResumeBtn.addEventListener('click', () => {
            settingsOverlay.classList.add('hidden');
            Game.state = GAME_STATES.PLAYING;
        });

        // Quit to menu button
        settingsQuitBtn.addEventListener('click', () => {
            settingsOverlay.classList.add('hidden');
            quitToMenu();
        });

        // Exit confirm dialog buttons
        const exitConfirm = document.getElementById('exit-confirm');
        const exitYesBtn = document.getElementById('btn-exit-yes');
        const exitNoBtn = document.getElementById('btn-exit-no');

        exitYesBtn.addEventListener('click', () => {
            exitConfirm.classList.add('hidden');
            quitToMenu();
        });

        exitNoBtn.addEventListener('click', () => {
            exitConfirm.classList.add('hidden');
            Game.state = GAME_STATES.PLAYING;
        });
    }

    function quitToMenu() {
        // Stop ambient
        Audio.stopAmbient();
        Audio.stopBGM();

        // Reset game state
        Game.state = GAME_STATES.MENU;
        Game._totalDeaths = 0;

        // Hide HUD and overlays
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('settings-overlay').classList.add('hidden');
        document.getElementById('exit-confirm').classList.add('hidden');

        // Restore title screen
        restoreTitle();
    }

    /* ---- Style Picker (Initial Theme Selection) ---- */
    function initStylePicker() {
        const picker = document.getElementById('style-picker');
        const grid = document.getElementById('style-picker-grid');
        if (!picker || !grid) {
            // No picker in DOM, start normally
            startAfterStylePick();
            return;
        }

        // If user already has a saved theme preference, skip the picker
        const savedTheme = localStorage.getItem('fracture_theme');
        if (savedTheme && THEME_DEFS[savedTheme]) {
            picker.classList.remove('active');
            startAfterStylePick();
            return;
        }

        // Mark current theme as selected
        const cards = grid.querySelectorAll('.style-card');
        cards.forEach(card => {
            const themeId = card.dataset.theme;

            card.addEventListener('click', () => {
                Audio.resume();
                Audio.playMenuClick();

                // Apply theme
                setTheme(themeId);
                saveThemePreference();

                // Animate selection
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                // Fade out picker, start game
                setTimeout(() => {
                    picker.style.transition = 'opacity 0.6s ease';
                    picker.style.opacity = '0';
                    setTimeout(() => {
                        picker.classList.remove('active');
                        picker.style.opacity = '';
                        picker.style.transition = '';
                        startAfterStylePick();
                    }, 600);
                }, 300);
            });
        });
    }

    function startAfterStylePick() {
        // Show title screen and start cinematic
        document.getElementById('title-screen').classList.add('active');

        // Save original title HTML for restoring after credits
        _originalTitleHTML = document.getElementById('title-screen').innerHTML;

        // Initialize cinematic
        cinematic.init();
        bindMenuEvents();
        bindTipsToggle();
        initThemeSelector();
    }

    /* ---- Initialize Everything ---- */
    function init() {
        Renderer.init();
        Input.init();
        Audio.init();
        Game.init();
        Game.renderTitle = animateTitle;

        // Theme system (load preference)
        loadThemePreference();

        // HUD Settings & Exit buttons
        initHUDSettings();

        // Show style picker or skip to cinematic
        initStylePicker();

        // Start main game loop
        requestAnimationFrame(gameLoop);

        console.log('《裂缝》FRACTURE v2.0 — 游戏已加载');
        console.log('ARIA-7 · 深渊-9研究站 · 失联第37天');
    }

    /* ---- Canvas roundRect Polyfill ---- */
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
            let r;
            if (typeof radii === 'number') {
                r = { tl: radii, tr: radii, br: radii, bl: radii };
            } else if (Array.isArray(radii)) {
                r = {
                    tl: radii[0] || 0, tr: radii[1] || radii[0] || 0,
                    br: radii[2] || radii[0] || 0, bl: radii[3] || radii[1] || radii[0] || 0
                };
            } else {
                r = { tl: 0, tr: 0, br: 0, bl: 0 };
            }
            this.moveTo(x + r.tl, y);
            this.lineTo(x + w - r.tr, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
            this.lineTo(x + w, y + h - r.br);
            this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
            this.lineTo(x + r.bl, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
            this.lineTo(x, y + r.tl);
            this.quadraticCurveTo(x, y, x + r.tl, y);
            this.closePath();
            return this;
        };
    }

    /* ---- Boot ---- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
