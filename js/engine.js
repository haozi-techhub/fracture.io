/* ============================================
   《裂缝》FRACTURE - Core Engine
   Input, Audio, Rendering Utilities
   ============================================ */

/* ---- Input System ---- */
const Input = {
    keys: {},
    justPressed: {},
    _prev: {},
    mouse: { x: 0, y: 0, down: false, clicked: false },
    touch: { active: false, dx: 0, dy: 0, jump: false, interact: false, roll: false },

    // Cheat code tracking
    _cheatBuffer: [],
    CHEAT_KONAMI: ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'],
    CHEAT_IDDQD: ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyA','KeyB','KeyA','KeyB'],
    CHEAT_SHOWPEED: ['ArrowLeft','ArrowLeft','ArrowDown','ArrowDown'],

    init() {
        window.addEventListener('keydown', e => {
            if (e.ctrlKey || e.metaKey || e.altKey || e.code === 'F5' || e.code === 'F12') return;
            this.keys[e.code] = true;
            // Track cheat codes
            this._cheatBuffer.push(e.code);
            if (this._cheatBuffer.length > 20) this._cheatBuffer.shift();
            e.preventDefault();
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('mousedown', e => { this.mouse.down = true; this.mouse.clicked = true; });
        canvas.addEventListener('mouseup', () => { this.mouse.down = false; });
        canvas.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - r.left) / r.width * CONFIG.CANVAS_W;
            this.mouse.y = (e.clientY - r.top) / r.height * CONFIG.CANVAS_H;
        });
        // Allow clicking on dialogue box to advance dialogue
        document.getElementById('dialogue-box').addEventListener('click', () => { this.mouse.clicked = true; });
        document.getElementById('game-container').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            if (e.target.closest('#puzzle-overlay') || e.target.closest('#choice-panel')) return;
            this.mouse.clicked = true;
        });
        this._initTouch();
    },

    _initTouch() {
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isMobile) return;
        document.getElementById('mobile-controls').classList.remove('hidden');
        const base = document.getElementById('joystick-base');
        const thumb = document.getElementById('joystick-thumb');
        let joyActive = false, joyCenter = { x: 0, y: 0 };

        base.addEventListener('touchstart', e => {
            e.preventDefault();
            joyActive = true;
            const r = base.getBoundingClientRect();
            joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        window.addEventListener('touchmove', e => {
            if (!joyActive) return;
            const t = e.touches[0];
            const dx = t.clientX - joyCenter.x;
            const dy = t.clientY - joyCenter.y;
            const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 50);
            const angle = Math.atan2(dy, dx);
            this.touch.dx = Math.cos(angle) * (dist / 50);
            this.touch.dy = Math.sin(angle) * (dist / 50);
            thumb.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
        });
        window.addEventListener('touchend', () => {
            joyActive = false;
            this.touch.dx = 0;
            this.touch.dy = 0;
            thumb.style.transform = 'translate(0,0)';
        });

        document.getElementById('m-jump').addEventListener('touchstart', e => { e.preventDefault(); this.touch.jump = true; });
        document.getElementById('m-jump').addEventListener('touchend', () => { this.touch.jump = false; });
        document.getElementById('m-interact').addEventListener('touchstart', e => { e.preventDefault(); this.touch.interact = true; });
        document.getElementById('m-interact').addEventListener('touchend', () => { this.touch.interact = false; });
        document.getElementById('m-roll').addEventListener('touchstart', e => { e.preventDefault(); this.touch.roll = true; });
        document.getElementById('m-roll').addEventListener('touchend', () => { this.touch.roll = false; });
    },

    update() {
        for (const k in this.keys) {
            this.justPressed[k] = this.keys[k] && !this._prev[k];
        }
        this._prev = { ...this.keys };
    },

    endFrame() {
        this.mouse.clicked = false;
        for (const k in this.justPressed) this.justPressed[k] = false;
        this.touch.jump = false;
        this.touch.interact = false;
        this.touch.roll = false;
    },

    get left() { return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touch.dx < -0.3; },
    get right() { return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touch.dx > 0.3; },
    get jump() { return this.justPressed['Space'] || this.justPressed['KeyW'] || this.justPressed['ArrowUp'] || this.touch.jump; },
    get interact() { return this.justPressed['KeyE'] || this.touch.interact; },
    get roll() { return this.justPressed['ShiftLeft'] || this.justPressed['ShiftRight'] || this.touch.roll; },
    get scan() { return this.keys['KeyQ']; },
    get enter() { return this.justPressed['Enter'] || this.justPressed['Space'] || this.mouse.clicked; },
    get escape() { return this.justPressed['Escape']; },

    // Check if cheat code was just activated (call once per frame)
    checkCheat(code) {
        const buf = this._cheatBuffer.join(',');
        return buf.includes(code.join(','));
    },

    clearCheatBuffer() {
        this._cheatBuffer = [];
    }
};

/* ---- Audio System (Web Audio Synthesis - GGD Style) ---- */
const Audio = {
    ctx: null,
    masterGain: null,
    enabled: true,
    _ambient: null,
    _bgm: null,
    _footstepTimer: 0,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.35;
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            this.enabled = false;
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    _tone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    },

    // Cute GGD-style quack/honk for jump
    playJump() {
        this._tone(500, 0.08, 'sine', 0.12);
        this._tone(700, 0.06, 'sine', 0.1, 0.04);
        this._tone(850, 0.05, 'sine', 0.06, 0.08);
    },
    // Soft landing thud
    playLand() {
        this._tone(100, 0.12, 'triangle', 0.1);
        this._tone(80, 0.08, 'sine', 0.06, 0.02);
    },
    // Whoosh roll
    playRoll() {
        this._tone(180, 0.15, 'sawtooth', 0.04);
        this._tone(250, 0.1, 'sine', 0.03, 0.05);
    },
    // Cute interact chime (GGD pickup sound)
    playInteract() {
        this._tone(600, 0.06, 'sine', 0.12);
        this._tone(800, 0.08, 'sine', 0.1, 0.06);
        this._tone(1000, 0.1, 'sine', 0.08, 0.12);
    },
    // GGD-style quack dialogue sounds
    playDialogue() {
        const base = 320 + Math.random() * 100;
        this._tone(base, 0.05, 'square', 0.04);
        this._tone(base * 1.1, 0.04, 'square', 0.03, 0.03);
    },
    // SILO menacing voice
    playSILO() {
        this._tone(140, 0.2, 'sawtooth', 0.07);
        this._tone(120, 0.25, 'square', 0.05, 0.05);
        this._tone(100, 0.15, 'sawtooth', 0.04, 0.15);
    },
    // Triumphant puzzle solve (GGD task complete)
    playPuzzleSolve() {
        [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.35, 'sine', 0.14, i * 0.1));
        this._tone(1047, 0.6, 'sine', 0.08, 0.4);
    },
    // Chapter start fanfare
    playChapterStart() {
        this._tone(262, 0.5, 'sine', 0.1);
        this._tone(330, 0.4, 'sine', 0.1, 0.2);
        this._tone(392, 0.4, 'sine', 0.1, 0.4);
        this._tone(523, 0.8, 'sine', 0.12, 0.6);
    },
    // Alert / danger
    playAlert() {
        this._tone(350, 0.08, 'square', 0.12);
        this._tone(250, 0.12, 'square', 0.14, 0.08);
        this._tone(350, 0.08, 'square', 0.1, 0.2);
    },
    // GGD-style waddling footstep
    playFootstep() {
        this._footstepTimer++;
        if (this._footstepTimer % 2 !== 0) return; // play every other call
        const pitch = this._footstepTimer % 4 === 0 ? 100 : 120;
        this._tone(pitch + Math.random() * 30, 0.05, 'triangle', 0.04);
    },
    // Menu button click (cute pop)
    playMenuClick() {
        this._tone(800, 0.04, 'sine', 0.1);
        this._tone(1200, 0.06, 'sine', 0.07, 0.03);
    },
    // Tab switch sound
    playTabSwitch() {
        this._tone(600, 0.03, 'sine', 0.06);
        this._tone(900, 0.04, 'sine', 0.05, 0.02);
    },
    // Button hover (subtle)
    playHover() {
        this._tone(1000, 0.02, 'sine', 0.03);
    },
    // Puzzle wrong answer buzz
    playWrong() {
        this._tone(200, 0.15, 'square', 0.08);
        this._tone(160, 0.2, 'square', 0.06, 0.08);
    },
    // Door open
    playDoorOpen() {
        this._tone(200, 0.3, 'triangle', 0.06);
        this._tone(300, 0.2, 'triangle', 0.05, 0.1);
        this._tone(250, 0.25, 'sine', 0.04, 0.2);
    },
    // Item pickup sparkle
    playPickup() {
        [800, 1000, 1200, 1400].forEach((f, i) => this._tone(f, 0.08, 'sine', 0.06, i * 0.04));
    },
    // Damage / hit
    playDamage() {
        this._tone(150, 0.2, 'sawtooth', 0.1);
        this._tone(100, 0.3, 'square', 0.08, 0.05);
    },
    // Shadow entity warning
    playShadowWarning() {
        this._tone(80, 0.5, 'sawtooth', 0.06);
        this._tone(60, 0.6, 'sine', 0.04, 0.2);
        this._tone(50, 0.8, 'sine', 0.03, 0.5);
    },
    // Ambient background per chapter
    startAmbient(chapter) {
        this.stopAmbient();
        if (!this.enabled || !this.ctx) return;
        const nodes = [];
        if (chapter === 1) {
            // Icy wind
            const bufSize = this.ctx.sampleRate * 3;
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
            const src = this.ctx.createBufferSource();
            src.buffer = buf; src.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.value = 250;
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine'; lfo.frequency.value = 0.3;
            const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 80;
            lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
            lfo.start();
            const gain = this.ctx.createGain(); gain.gain.value = 0.06;
            src.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
            src.start();
            nodes.push(src, lfo);
            this._ambient = { nodes, gain };
        } else if (chapter === 2) {
            // Deep hum + distant dripping
            const osc = this.ctx.createOscillator();
            osc.type = 'sine'; osc.frequency.value = 50;
            const gain = this.ctx.createGain(); gain.gain.value = 0.04;
            osc.connect(gain); gain.connect(this.masterGain);
            osc.start();
            nodes.push(osc);
            this._ambient = { nodes, gain };
        } else if (chapter === 3) {
            // Digital static hum
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sawtooth'; osc1.frequency.value = 82;
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'sine'; osc2.frequency.value = 165;
            const gain = this.ctx.createGain(); gain.gain.value = 0.025;
            osc1.connect(gain); osc2.connect(gain); gain.connect(this.masterGain);
            osc1.start(); osc2.start();
            nodes.push(osc1, osc2);
            this._ambient = { nodes, gain };
        } else if (chapter === 4) {
            // Storm thunder rumble
            const bufSize = this.ctx.sampleRate * 4;
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.03;
            const src = this.ctx.createBufferSource();
            src.buffer = buf; src.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.value = 180;
            const gain = this.ctx.createGain(); gain.gain.value = 0.07;
            src.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
            src.start();
            nodes.push(src);
            this._ambient = { nodes, gain };
        } else if (chapter === 5) {
            // Ethereal pad
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sine'; osc1.frequency.value = 220;
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'sine'; osc2.frequency.value = 330;
            const gain = this.ctx.createGain(); gain.gain.value = 0.03;
            osc1.connect(gain); osc2.connect(gain); gain.connect(this.masterGain);
            osc1.start(); osc2.start();
            nodes.push(osc1, osc2);
            this._ambient = { nodes, gain };
        }
    },
    stopAmbient() {
        if (this._ambient) {
            try {
                this._ambient.nodes.forEach(n => { try { n.stop(); } catch(e){} });
                if (this._ambient.gain) this._ambient.gain.disconnect();
            } catch(e){}
            this._ambient = null;
        }
    },
    // Simple BGM loop (synthesized melody)
    startBGM() {
        if (!this.enabled || !this.ctx || this._bgm) return;

        // Ambient chord progression: Am - F - C - G
        const CHORD_PROGRESSION = [
            [220, 261.63, 329.63],  // Am
            [174.61, 220, 261.63], // F
            [261.63, 329.63, 392], // C
            [196, 246.94, 293.66], // G
        ];

        // Pentatonic melody pattern (ambient feel)
        const MELODY = [
            440, 523.25, 587.33, 523.25, 440, 392, 440, 0,
            523.25, 659.25, 783.99, 659.25, 523.25, 440, 523.25, 0,
            587.33, 698.46, 783.99, 698.46, 587.33, 523.25, 440, 0,
            493.88, 587.33, 698.46, 587.33, 493.88, 440, 493.88, 0,
        ];

        const BPM = 100;
        const BEAT_DURATION = 60000 / BPM / 2;
        const BAR_LENGTH = BEAT_DURATION * 8;

        let barIndex = 0;
        let melodyIdx = 0;

        // Persistent gain nodes for mixing
        const leadGain = this.ctx.createGain();
        leadGain.gain.value = 0.035;
        leadGain.connect(this.masterGain);

        const bassGain = this.ctx.createGain();
        bassGain.gain.value = 0.025;
        bassGain.connect(this.masterGain);

        const harmonyGain = this.ctx.createGain();
        harmonyGain.gain.value = 0.015;
        harmonyGain.connect(this.masterGain);

        const percFilter = this.ctx.createBiquadFilter();
        percFilter.type = 'highpass';
        percFilter.frequency.value = 5000;
        const percGain = this.ctx.createGain();
        percGain.gain.value = 0.03;
        percFilter.connect(percGain);
        percGain.connect(this.masterGain);

        const playBar = () => {
            if (!this._bgm) return;

            const chord = CHORD_PROGRESSION[barIndex % 4];

            // Bass line
            const bassNotes = [chord[0], chord[0] * 1.5, chord[2], chord[0]];
            const bassNoteDur = BAR_LENGTH / 4;
            bassNotes.forEach((note, i) => {
                this._toneBass(note, bassNoteDur * 0.9, i * bassNoteDur, bassGain);
            });

            // Harmony (chord tones)
            chord.forEach((note, i) => {
                this._toneHarmony(note * 2, BAR_LENGTH * 0.9, i * 50, harmonyGain);
            });

            // Melody (8th notes)
            for (let i = 0; i < 8; i++) {
                const freq = MELODY[melodyIdx % MELODY.length];
                if (freq > 0) {
                    this._toneLead(freq, BEAT_DURATION * 0.85, i * BEAT_DURATION, leadGain);
                }
                melodyIdx++;
            }

            // Hi-hat on off-beats
            for (let i = 0; i < 8; i++) {
                if (i % 2 === 1) {
                    this._playHiHat(50, i * BEAT_DURATION, percFilter);
                }
            }
            // Kick on beats 1 and 5
            this._playKick(150, 0, percFilter);
            this._playKick(150, 4 * BEAT_DURATION, percFilter);

            barIndex++;
            this._bgm.timer = setTimeout(playBar, BAR_LENGTH);
        };

        this._bgm = { timer: null, leadGain, bassGain, harmonyGain };
        playBar();
    },

    _toneLead(freq, duration, delay, outputGain) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay / 1000);
        gain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + delay / 1000 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay / 1000 + duration / 1000);
        osc.connect(gain);
        gain.connect(outputGain);
        osc.start(this.ctx.currentTime + delay / 1000);
        osc.stop(this.ctx.currentTime + delay / 1000 + duration / 1000);
    },

    _toneBass(freq, duration, delay, outputGain) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay / 1000);
        gain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + delay / 1000 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay / 1000 + duration / 1000);
        osc.connect(gain);
        gain.connect(outputGain);
        osc.start(this.ctx.currentTime + delay / 1000);
        osc.stop(this.ctx.currentTime + delay / 1000 + duration / 1000);
    },

    _toneHarmony(freq, duration, delay, outputGain) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay / 1000);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + delay / 1000 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay / 1000 + duration / 1000);
        osc.connect(gain);
        gain.connect(outputGain);
        osc.start(this.ctx.currentTime + delay / 1000);
        osc.stop(this.ctx.currentTime + delay / 1000 + duration / 1000);
    },

    _playHiHat(duration, delay, filterNode) {
        if (!this.enabled || !this.ctx) return;
        const bufSize = this.ctx.sampleRate * (duration / 1000);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(filterNode);
        src.start(this.ctx.currentTime + delay / 1000);
    },

    _playKick(duration, delay, outputNode) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime + delay / 1000);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + delay / 1000 + 0.1);
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay / 1000 + duration / 1000);
        osc.connect(gain);
        gain.connect(outputNode);
        osc.start(this.ctx.currentTime + delay / 1000);
        osc.stop(this.ctx.currentTime + delay / 1000 + duration / 1000);
    },
    stopBGM() {
        if (this._bgm) {
            clearTimeout(this._bgm.timer);
            this._bgm = null;
        }
    },
    playWind() {
        if (!this.enabled || !this.ctx) return;
        const bufSize = this.ctx.sampleRate * 2;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
        const src = this.ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 300;
        const gain = this.ctx.createGain(); gain.gain.value = 0.08;
        src.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        src.start();
        return { src, gain };
    },
    playHum() {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 55;
        gain.gain.value = 0.04;
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start();
        return { osc, gain };
    },
    playEndingA() { [220, 196, 165, 147].forEach((f, i) => this._tone(f, 1.2, 'sine', 0.1, i * 0.8)); },
    playEndingB() { [330, 392, 440, 523].forEach((f, i) => this._tone(f, 0.4, 'square', 0.06, i * 0.3)); },
    playEndingC() { [330, 440, 523, 660].forEach((f, i) => this._tone(f, 1.0, 'sine', 0.08, i * 0.6)); },
};

/* ---- Renderer Utilities ---- */
const Renderer = {
    canvas: null,
    ctx: null,
    _particles: [],

    // Theme routing
    _cachedTheme: null,
    _themeDirty: true,

    invalidateThemeCache() {
        this._themeDirty = true;
        this._paperCanvas = null;
    },

    _getTheme() {
        if (this._themeDirty || !this._cachedTheme) {
            this._cachedTheme = typeof getCurrentTheme === 'function'
                ? getCurrentTheme()
                : THEME_DEFS[THEMES.DOODLE];
            this._themeDirty = false;
        }
        return this._cachedTheme;
    },

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_W;
        this.canvas.height = CONFIG.CANVAS_H;
        this._resize();
        window.addEventListener('resize', () => this._resize());
    },

    _resize() {
        const aspect = CONFIG.CANVAS_W / CONFIG.CANVAS_H;
        const winAspect = window.innerWidth / window.innerHeight;
        if (winAspect > aspect) {
            this.canvas.style.height = '100vh';
            this.canvas.style.width = (window.innerHeight * aspect) + 'px';
        } else {
            this.canvas.style.width = '100vw';
            this.canvas.style.height = (window.innerWidth / aspect) + 'px';
        }
    },

    clear(color = '#120E08') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    },

    /* ---- Doodle / Sketch Utilities ---- */
    // Paper texture overlay (cached)
    _paperCanvas: null,
    _generatePaperTexture() {
        if (this._paperCanvas) return this._paperCanvas;
        const c = document.createElement('canvas');
        c.width = CONFIG.CANVAS_W;
        c.height = CONFIG.CANVAS_H;
        const cx = c.getContext('2d');
        // Base parchment
        cx.fillStyle = '#C8B890';
        cx.fillRect(0, 0, c.width, c.height);
        // Noise grain
        for (let i = 0; i < 12000; i++) {
            const x = Math.random() * c.width;
            const y = Math.random() * c.height;
            const v = Math.random() * 40 - 20;
            cx.fillStyle = `rgba(${120+v},${100+v},${70+v},${0.03 + Math.random()*0.04})`;
            cx.fillRect(x, y, 1 + Math.random()*2, 1 + Math.random()*2);
        }
        // Coffee stain spots
        for (let i = 0; i < 5; i++) {
            const sx = Math.random() * c.width;
            const sy = Math.random() * c.height;
            const sr = 30 + Math.random() * 80;
            const grad = cx.createRadialGradient(sx, sy, 0, sx, sy, sr);
            grad.addColorStop(0, `rgba(100,80,40,${0.02 + Math.random()*0.03})`);
            grad.addColorStop(1, 'rgba(100,80,40,0)');
            cx.fillStyle = grad;
            cx.beginPath();
            cx.arc(sx, sy, sr, 0, Math.PI * 2);
            cx.fill();
        }
        // Fold lines
        cx.strokeStyle = 'rgba(100,80,50,0.04)';
        cx.lineWidth = 1;
        cx.beginPath();
        cx.moveTo(c.width/2, 0); cx.lineTo(c.width/2, c.height);
        cx.moveTo(0, c.height/2); cx.lineTo(c.width, c.height/2);
        cx.stroke();
        this._paperCanvas = c;
        return c;
    },

    drawPaperBg() {
        const paper = this._generatePaperTexture();
        this.ctx.drawImage(paper, 0, 0);
    },

    // Sketchy line: draws a wobbly line between two points
    sketchyLine(x1, y1, x2, y2, color, width = 2, roughness = 3) {
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const steps = Math.max(4, Math.floor(dist / 15));
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const mx = x1 + (x2-x1)*t + (Math.random()-0.5)*roughness;
            const my = y1 + (y2-y1)*t + (Math.random()-0.5)*roughness;
            ctx.lineTo(mx, my);
        }
        ctx.stroke();
        // Double-stroke for pencil feel
        if (width > 1) {
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = width * 0.5;
            ctx.beginPath();
            ctx.moveTo(x1 + (Math.random()-0.5)*2, y1 + (Math.random()-0.5)*2);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                ctx.lineTo(
                    x1 + (x2-x1)*t + (Math.random()-0.5)*roughness*1.5,
                    y1 + (y2-y1)*t + (Math.random()-0.5)*roughness*1.5
                );
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    },

    // Sketchy rectangle with rough edges
    sketchyRect(x, y, w, h, fillColor, strokeColor, lineWidth = 2.5, roughness = 3) {
        const ctx = this.ctx;
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x+1, y+1, w-2, h-2);
        }
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Draw 4 rough edges
            const r = roughness;
            const drawEdge = (ax, ay, bx, by) => {
                ctx.beginPath();
                ctx.moveTo(ax + (Math.random()-0.5)*r, ay + (Math.random()-0.5)*r);
                const segs = Math.max(3, Math.floor(Math.sqrt((bx-ax)**2+(by-ay)**2) / 20));
                for (let i = 1; i <= segs; i++) {
                    const t = i / segs;
                    ctx.lineTo(
                        ax + (bx-ax)*t + (Math.random()-0.5)*r,
                        ay + (by-ay)*t + (Math.random()-0.5)*r
                    );
                }
                ctx.stroke();
            };
            drawEdge(x, y, x+w, y);
            drawEdge(x+w, y, x+w, y+h);
            drawEdge(x+w, y+h, x, y+h);
            drawEdge(x, y+h, x, y);
        }
    },

    // Cross-hatching for shadows
    drawHatching(x, y, w, h, color, density = 8, angle = -0.7) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const maxDim = Math.max(w, h) * 2;
        for (let i = -maxDim; i < maxDim; i += density) {
            ctx.beginPath();
            const sx = x + w/2 + cos * i - sin * maxDim;
            const sy = y + h/2 + sin * i + cos * maxDim;
            const ex = x + w/2 + cos * i + sin * maxDim;
            const ey = y + h/2 + sin * i - cos * maxDim;
            ctx.moveTo(sx + (Math.random()-0.5)*1.5, sy + (Math.random()-0.5)*1.5);
            ctx.lineTo(ex + (Math.random()-0.5)*1.5, ey + (Math.random()-0.5)*1.5);
            ctx.stroke();
        }
        ctx.restore();
    },

    // Ink splatter decoration
    drawInkSplatter(x, y, size, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        // Main blob
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const r = size * (0.5 + Math.random() * 0.5);
            const px = x + Math.cos(a) * r;
            const py = y + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.quadraticCurveTo(
                x + Math.cos(a - 0.3) * r * 1.2,
                y + Math.sin(a - 0.3) * r * 1.2,
                px, py
            );
        }
        ctx.closePath();
        ctx.fill();
        // Small satellite drops
        for (let i = 0; i < 4; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = size * (1.2 + Math.random() * 1.5);
            ctx.beginPath();
            ctx.arc(x + Math.cos(a)*d, y + Math.sin(a)*d, 1 + Math.random()*2, 0, Math.PI*2);
            ctx.fill();
        }
    },

    // Sketchy circle
    sketchyCircle(x, y, radius, fillColor, strokeColor, lineWidth = 2.5) {
        const ctx = this.ctx;
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const segs = 24;
            for (let i = 0; i <= segs; i++) {
                const a = (i / segs) * Math.PI * 2;
                const r = radius + (Math.random()-0.5) * 3;
                const px = x + Math.cos(a) * r;
                const py = y + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    },

    /* ---- Drawing Helpers ---- */
    drawRect(x, y, w, h, color, cam) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - cam.x, y - cam.y, w, h);
    },

    drawRoundRect(x, y, w, h, r, color, cam) {
        const cx = x - cam.x, cy = y - cam.y;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(cx, cy, w, h, r);
        this.ctx.fill();
    },

    drawCircle(x, y, radius, color, cam) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x - cam.x, y - cam.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawText(text, x, y, color, size = 14, align = 'left', font = null) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px ${font || "'Noto Sans SC', sans-serif"}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    },

    /* ---- Character Drawing - Theme Router ---- */
    drawCharacter(x, y, w, h, colors, facing, animFrame, cam, isGhost = false) {
        const theme = this._getTheme();
        const handlerName = 'drawCharacter_' + theme.character.bodyShape;

        if (typeof this[handlerName] === 'function') {
            return this[handlerName](x, y, w, h, colors, facing, animFrame, cam, isGhost);
        }

        // Fallback to angular (doodle) style
        return this.drawCharacter_angular(x, y, w, h, colors, facing, animFrame, cam, isGhost);
    },

    /* ---- Character Drawing: Angular (Doodle / Sketch Style) ---- */
    drawCharacter_angular(x, y, w, h, colors, facing, animFrame, cam, isGhost = false) {
        const cx = x - cam.x, cy = y - cam.y;
        const ctx = this.ctx;
        const time = Date.now();
        const centerX = cx + w / 2;
        const theme = this._getTheme();
        const inkColor = theme.character.outlineColor;

        // Animation
        const bounce = Math.sin(animFrame * 0.35) * 2;
        const legAnim = Math.sin(animFrame * 0.25) * 5;
        const wobble = Math.sin(animFrame * 0.18) * 0.04;

        // Body dimensions — angular, triangular shape
        const bodyW = w * 0.9;
        const bodyH = h * 0.7;
        const bodyCY = cy + h * 0.32 + bounce;

        ctx.save();
        if (isGhost) ctx.globalAlpha = 0.35;
        ctx.translate(centerX, bodyCY);
        ctx.rotate(wobble);
        ctx.translate(-centerX, -bodyCY);

        // Ground shadow — rough oval scribble
        ctx.fillStyle = 'rgba(20,16,8,0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX, cy + h + 3, w * 0.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- Legs (stick-figure style, sketchy) ----
        const footColor = colors.feet || '#C08030';
        // Left leg
        this.sketchyLine(centerX - 8, bodyCY + bodyH*0.38, centerX - 12, cy + h - 2 + legAnim, inkColor, 2.5, 2);
        // Right leg
        this.sketchyLine(centerX + 8, bodyCY + bodyH*0.38, centerX + 12, cy + h - 2 - legAnim, inkColor, 2.5, 2);
        // Feet — small angular shapes
        ctx.fillStyle = footColor;
        ctx.beginPath();
        ctx.moveTo(centerX - 18, cy + h + legAnim);
        ctx.lineTo(centerX - 6, cy + h - 4 + legAnim);
        ctx.lineTo(centerX - 4, cy + h + legAnim);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = inkColor; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + 18, cy + h - legAnim);
        ctx.lineTo(centerX + 6, cy + h - 4 - legAnim);
        ctx.lineTo(centerX + 4, cy + h - legAnim);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = inkColor; ctx.lineWidth = 1.8; ctx.stroke();

        // ---- Main Body (angular, pointy, like reference) ----
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.moveTo(centerX, bodyCY - bodyH * 0.5);
        ctx.lineTo(centerX + facing * bodyW * 0.1, bodyCY - bodyH * 0.48);
        ctx.lineTo(centerX + bodyW * 0.45, bodyCY + bodyH * 0.1);
        ctx.lineTo(centerX + bodyW * 0.35, bodyCY + bodyH * 0.42);
        ctx.lineTo(centerX - bodyW * 0.35, bodyCY + bodyH * 0.42);
        ctx.lineTo(centerX - bodyW * 0.45, bodyCY + bodyH * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = inkColor;
        ctx.lineWidth = theme.character.outlineWidth;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Hatching shadow
        if (theme.character.useHatching) {
            const shadowSide = facing > 0 ? -1 : 1;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, bodyCY - bodyH * 0.5);
            ctx.lineTo(centerX + shadowSide * bodyW * 0.45, bodyCY + bodyH * 0.1);
            ctx.lineTo(centerX + shadowSide * bodyW * 0.35, bodyCY + bodyH * 0.42);
            ctx.lineTo(centerX, bodyCY + bodyH * 0.42);
            ctx.closePath();
            ctx.clip();
            this.drawHatching(
                centerX + shadowSide * bodyW * 0.05 - 20, bodyCY - bodyH*0.3,
                bodyW * 0.5, bodyH * 0.7,
                'rgba(26,18,8,0.15)', 6
            );
            ctx.restore();
        }

        // ---- Belly patch ----
        ctx.fillStyle = this._lighten(colors.body, 0.18);
        ctx.beginPath();
        ctx.ellipse(centerX + facing * 2, bodyCY + bodyH * 0.1, bodyW * 0.22, bodyH * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // ---- Arms ----
        const armWave = Math.sin(animFrame * 0.3) * 8;
        this.sketchyLine(
            centerX - facing * bodyW * 0.3, bodyCY - bodyH * 0.05,
            centerX - facing * bodyW * 0.6, bodyCY + bodyH * 0.15 + armWave,
            inkColor, 2.2, 2
        );
        this.sketchyLine(
            centerX + facing * bodyW * 0.3, bodyCY - bodyH * 0.05,
            centerX + facing * bodyW * 0.55, bodyCY + bodyH * 0.2 - armWave * 0.5,
            inkColor, 2.2, 2
        );

        // ---- Eyes ----
        const eyeX = centerX + facing * bodyW * 0.12;
        const eyeY = bodyCY - bodyH * 0.25;
        const eyeR = 7;

        const blinkCycle = (time % 4000) / 4000;
        const isBlinking = blinkCycle > 0.96;

        this.sketchyCircle(eyeX, eyeY, eyeR, '#F0E8D0', inkColor, 2);

        if (!isBlinking) {
            ctx.fillStyle = colors.eye || '#1A1208';
            ctx.beginPath();
            ctx.arc(eyeX + facing * 2, eyeY + 1, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#F0E8D0';
            ctx.beginPath();
            ctx.arc(eyeX + facing * 3, eyeY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            this.sketchyLine(eyeX - eyeR, eyeY, eyeX + eyeR, eyeY, inkColor, 2, 1);
        }

        // ---- Beak ----
        const beakColor = colors.beak || '#D08030';
        const beakX = centerX + facing * bodyW * 0.35;
        const beakY = bodyCY - bodyH * 0.15;
        ctx.fillStyle = beakColor;
        ctx.beginPath();
        ctx.moveTo(beakX, beakY - 4);
        ctx.lineTo(beakX + facing * 14, beakY + 1);
        ctx.lineTo(beakX, beakY + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // ---- Hat ----
        if (colors.hat) {
            const hatBaseY = bodyCY - bodyH * 0.48;
            ctx.fillStyle = colors.hat;
            ctx.beginPath();
            ctx.moveTo(centerX - bodyW * 0.3, hatBaseY + 2);
            ctx.lineTo(centerX + facing * 3, hatBaseY - 20);
            ctx.lineTo(centerX + bodyW * 0.3, hatBaseY + 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.stroke();
            this.sketchyLine(
                centerX - bodyW * 0.28, hatBaseY + 1,
                centerX + bodyW * 0.28, hatBaseY + 1,
                this._darken(colors.hat, 0.3), 2, 1.5
            );
        }

        // ---- Scarf ----
        if (colors.scarf) {
            const scarfY = bodyCY - bodyH * 0.35;
            ctx.fillStyle = colors.scarf;
            ctx.beginPath();
            ctx.moveTo(centerX - bodyW * 0.35, scarfY);
            ctx.quadraticCurveTo(centerX, scarfY + 5, centerX + bodyW * 0.35, scarfY);
            ctx.lineTo(centerX + bodyW * 0.3, scarfY + 8);
            ctx.quadraticCurveTo(centerX, scarfY + 12, centerX - bodyW * 0.3, scarfY + 8);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            const scarfBounce = Math.sin(animFrame * 0.25) * 4;
            ctx.beginPath();
            ctx.moveTo(centerX - facing * bodyW * 0.25, scarfY + 6);
            ctx.quadraticCurveTo(
                centerX - facing * bodyW * 0.5, scarfY + 18 + scarfBounce,
                centerX - facing * bodyW * 0.4, scarfY + 25 + scarfBounce
            );
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    },

    /* ---- Character Drawing: Bean (Goose Goose Duck Style) ---- */
    drawCharacter_bean(x, y, w, h, colors, facing, animFrame, cam, isGhost = false) {
        const cx = x - cam.x, cy = y - cam.y;
        const ctx = this.ctx;
        const time = Date.now();
        const centerX = cx + w / 2;
        const theme = this._getTheme();
        const inkColor = theme.character.outlineColor;

        const bounce = Math.sin(animFrame * 0.35) * 3;
        const waddle = Math.sin(animFrame * 0.25) * 6;
        const bodyW = w * 0.95;
        const bodyH = h * 0.75;
        const bodyCY = cy + h * 0.35 + bounce;

        ctx.save();
        if (isGhost) ctx.globalAlpha = 0.35;

        // Ground shadow
        ctx.fillStyle = 'rgba(20,16,8,0.25)';
        ctx.beginPath();
        ctx.ellipse(centerX, cy + h + 2, w * 0.45, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bean body (ellipse)
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(centerX, bodyCY, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = inkColor;
        ctx.lineWidth = theme.character.outlineWidth;
        ctx.stroke();

        // Belly
        ctx.fillStyle = this._lighten(colors.body, 0.15);
        ctx.beginPath();
        ctx.ellipse(centerX + facing * 3, bodyCY + bodyH * 0.05, bodyW * 0.28, bodyH * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tiny legs
        const legColor = colors.feet || '#C08030';
        ctx.fillStyle = legColor;
        ctx.fillRect(centerX - 10 + waddle * 0.3, bodyCY + bodyH * 0.4, 6, 8);
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(centerX - 10 + waddle * 0.3, bodyCY + bodyH * 0.4, 6, 8);
        ctx.fillStyle = legColor;
        ctx.fillRect(centerX + 4 - waddle * 0.3, bodyCY + bodyH * 0.4, 6, 8);
        ctx.strokeRect(centerX + 4 - waddle * 0.3, bodyCY + bodyH * 0.4, 6, 8);

        // Big eyes
        const eyeX = centerX + facing * bodyW * 0.15;
        const eyeY = bodyCY - bodyH * 0.2;
        const eyeR = 8 * theme.character.eyeScale;

        const blinkCycle = (time % 4000) / 4000;
        const isBlinking = blinkCycle > 0.96;

        ctx.fillStyle = '#F0E8D0';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (!isBlinking) {
            ctx.fillStyle = colors.eye || '#1A1208';
            ctx.beginPath();
            ctx.arc(eyeX + facing * 2.5, eyeY + 1, eyeR * 0.55, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#F0E8D0';
            ctx.beginPath();
            ctx.arc(eyeX + facing * 3.5, eyeY - 2, eyeR * 0.25, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(eyeX - eyeR, eyeY);
            ctx.lineTo(eyeX + eyeR, eyeY);
            ctx.stroke();
        }

        // Beak
        const beakColor = colors.beak || '#D08030';
        const beakX = centerX + facing * bodyW * 0.32;
        const beakY = bodyCY - bodyH * 0.1;
        ctx.fillStyle = beakColor;
        ctx.beginPath();
        ctx.ellipse(beakX, beakY, 6, 4, facing * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hat
        if (colors.hat) {
            const hatY = bodyCY - bodyH * 0.45;
            ctx.fillStyle = colors.hat;
            ctx.beginPath();
            ctx.ellipse(centerX, hatY, bodyW * 0.35, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(centerX, hatY - 8, bodyW * 0.2, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Scarf
        if (colors.scarf) {
            const scarfY = bodyCY - bodyH * 0.3;
            ctx.fillStyle = colors.scarf;
            ctx.beginPath();
            ctx.ellipse(centerX, scarfY, bodyW * 0.4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    },

    /* ---- Character Drawing: Cowboy (Red Dead Redemption Style) ---- */
    drawCharacter_cowboy(x, y, w, h, colors, facing, animFrame, cam, isGhost = false) {
        const cx = x - cam.x, cy = y - cam.y;
        const ctx = this.ctx;
        const time = Date.now();
        const centerX = cx + w / 2;
        const theme = this._getTheme();
        const inkColor = theme.character.outlineColor;

        const sway = Math.sin(animFrame * 0.2) * 2;
        const legSwing = Math.sin(animFrame * 0.25) * 8;

        const bodyW = w * 0.85;
        const bodyH = h * 0.65;
        const bodyCY = cy + h * 0.35 + sway;

        ctx.save();
        if (isGhost) ctx.globalAlpha = 0.35;

        // Dust shadow
        ctx.fillStyle = 'rgba(180,150,100,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, cy + h + 4, w * 0.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thick legs
        const legColor = colors.feet || '#5A4030';
        ctx.strokeStyle = legColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(centerX - 10, bodyCY + bodyH * 0.4);
        ctx.quadraticCurveTo(
            centerX - 12 + legSwing * 0.3,
            cy + h - 10,
            centerX - 8,
            cy + h - 2
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 10, bodyCY + bodyH * 0.4);
        ctx.quadraticCurveTo(
            centerX + 12 - legSwing * 0.3,
            cy + h - 10,
            centerX + 8,
            cy + h - 2
        );
        ctx.stroke();

        // Boots
        ctx.fillStyle = '#3A2810';
        ctx.beginPath();
        ctx.ellipse(centerX - 8, cy + h, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 8, cy + h, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (trapezoid, western style)
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.moveTo(centerX - bodyW * 0.3, bodyCY - bodyH * 0.4);
        ctx.lineTo(centerX + bodyW * 0.3, bodyCY - bodyH * 0.4);
        ctx.lineTo(centerX + bodyW * 0.35, bodyCY + bodyH * 0.3);
        ctx.lineTo(centerX - bodyW * 0.35, bodyCY + bodyH * 0.3);
        ctx.closePath();
        ctx.fill();

        // Vest details
        ctx.strokeStyle = this._darken(colors.body, 0.2);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, bodyCY - bodyH * 0.3);
        ctx.lineTo(centerX, bodyCY + bodyH * 0.25);
        ctx.stroke();
        ctx.strokeRect(centerX - bodyW * 0.2, bodyCY - bodyH * 0.1, bodyW * 0.15, bodyH * 0.2);
        ctx.strokeRect(centerX + bodyW * 0.05, bodyCY - bodyH * 0.1, bodyW * 0.15, bodyH * 0.2);

        ctx.strokeStyle = inkColor;
        ctx.lineWidth = theme.character.outlineWidth;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX - bodyW * 0.3, bodyCY - bodyH * 0.4);
        ctx.lineTo(centerX + bodyW * 0.3, bodyCY - bodyH * 0.4);
        ctx.lineTo(centerX + bodyW * 0.35, bodyCY + bodyH * 0.3);
        ctx.lineTo(centerX - bodyW * 0.35, bodyCY + bodyH * 0.3);
        ctx.closePath();
        ctx.stroke();

        // Cross-hatching shadow
        if (theme.character.useHatching) {
            const shadowSide = facing > 0 ? -1 : 1;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, bodyCY - bodyH * 0.4);
            ctx.lineTo(centerX + shadowSide * bodyW * 0.3, bodyCY - bodyH * 0.2);
            ctx.lineTo(centerX + shadowSide * bodyW * 0.35, bodyCY + bodyH * 0.3);
            ctx.lineTo(centerX, bodyCY + bodyH * 0.3);
            ctx.closePath();
            ctx.clip();
            this.drawHatching(
                centerX - 20, bodyCY - bodyH * 0.2,
                bodyW * 0.6, bodyH * 0.6,
                'rgba(58,40,16,0.15)', 6, -0.7
            );
            ctx.restore();
        }

        // Arms
        const armSwing = Math.sin(animFrame * 0.3) * 6;
        ctx.strokeStyle = colors.body;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(centerX - facing * bodyW * 0.25, bodyCY - bodyH * 0.2);
        ctx.quadraticCurveTo(
            centerX - facing * bodyW * 0.5,
            bodyCY + armSwing,
            centerX - facing * bodyW * 0.4,
            bodyCY + bodyH * 0.2 + armSwing * 0.5
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + facing * bodyW * 0.25, bodyCY - bodyH * 0.2);
        ctx.quadraticCurveTo(
            centerX + facing * bodyW * 0.45,
            bodyCY - armSwing * 0.5,
            centerX + facing * bodyW * 0.35,
            bodyCY + bodyH * 0.15 - armSwing * 0.3
        );
        ctx.stroke();

        // Head
        const headCY = bodyCY - bodyH * 0.5;

        // Eyes
        const eyeX = centerX + facing * bodyW * 0.1;
        const eyeY = headCY - 3;
        const eyeR = 5;

        const blinkCycle = (time % 5000) / 5000;
        const isBlinking = blinkCycle > 0.97;

        this.sketchyCircle(eyeX, eyeY, eyeR, '#F0E8D0', inkColor, 2);

        if (!isBlinking) {
            ctx.fillStyle = colors.eye || '#1A1208';
            ctx.beginPath();
            ctx.arc(eyeX + facing * 1.5, eyeY + 1, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            this.sketchyLine(eyeX - eyeR, eyeY, eyeX + eyeR, eyeY, inkColor, 1.5, 1);
        }

        // Wide brim hat
        if (colors.hat) {
            const hatBaseY = headCY - 15;
            ctx.fillStyle = colors.hat;
            ctx.beginPath();
            ctx.ellipse(centerX, hatBaseY + 5, bodyW * 0.55, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(centerX, hatBaseY - 8, bodyW * 0.25, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = this._darken(colors.hat, 0.4);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(centerX, hatBaseY + 2, bodyW * 0.26, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Scarf
        if (colors.scarf) {
            const scarfY = headCY + 5;
            ctx.fillStyle = colors.scarf;
            ctx.beginPath();
            ctx.moveTo(centerX - bodyW * 0.3, scarfY);
            ctx.quadraticCurveTo(centerX, scarfY + 8, centerX + bodyW * 0.3, scarfY);
            ctx.lineTo(centerX + bodyW * 0.25, scarfY + 12);
            ctx.quadraticCurveTo(centerX, scarfY + 18, centerX - bodyW * 0.25, scarfY + 12);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            const scarfFlow = Math.sin(animFrame * 0.2) * 5;
            ctx.beginPath();
            ctx.moveTo(centerX - facing * bodyW * 0.2, scarfY + 10);
            ctx.quadraticCurveTo(
                centerX - facing * bodyW * 0.6,
                scarfY + 20 + scarfFlow,
                centerX - facing * bodyW * 0.5,
                scarfY + 30 + scarfFlow
            );
            ctx.strokeStyle = colors.scarf;
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.strokeStyle = inkColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    },

    /* ---- Character Drawing: Pixelated ---- */
    drawCharacter_pixelated(x, y, w, h, colors, facing, animFrame, cam, isGhost = false) {
        const ctx = this.ctx;
        const theme = this._getTheme();
        const pixelSize = theme.platform?.pixelSize || 4;
        const centerX = Math.floor((x - cam.x) / pixelSize) * pixelSize + pixelSize * 3;
        const centerY = Math.floor((y - cam.y) / pixelSize) * pixelSize;

        ctx.save();
        if (isGhost) ctx.globalAlpha = 0.5;

        const frame = Math.floor(animFrame) % 4;

        const bodyW = w * 0.8;
        const bodyH = h * 0.6;
        const bodyCY = centerY + h * 0.35;

        // Pixel body
        ctx.fillStyle = colors.body;
        for (let py = 0; py < bodyH; py += pixelSize) {
            for (let px = 0; px < bodyW; px += pixelSize) {
                const dx = px - bodyW / 2;
                const dy = py - bodyH / 2;
                if (dx * dx / (bodyW * bodyW / 4) + dy * dy / (bodyH * bodyH / 4) > 1) continue;
                ctx.fillRect(centerX - bodyW/2 + px, bodyCY - bodyH/2 + py, pixelSize, pixelSize);
            }
        }

        ctx.strokeStyle = theme.character.outlineColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - bodyW/2, bodyCY - bodyH/2, bodyW, bodyH);

        // Pixel legs
        const legColor = colors.feet || '#C08030';
        ctx.fillStyle = legColor;
        const legOffset = [0, pixelSize, 0, -pixelSize][frame];
        ctx.fillRect(centerX - 10, bodyCY + bodyH/2 - pixelSize, pixelSize * 2, pixelSize * 2 + legOffset);
        ctx.fillRect(centerX + 4, bodyCY + bodyH/2 - pixelSize, pixelSize * 2, pixelSize * 2 - legOffset);

        // Pixel eyes
        const eyeX = centerX + facing * pixelSize * 2;
        const eyeY = bodyCY - pixelSize * 2;
        ctx.fillStyle = '#F0E8D0';
        ctx.fillRect(eyeX - pixelSize, eyeY - pixelSize, pixelSize * 2, pixelSize * 2);
        ctx.fillStyle = colors.eye || '#1A1208';
        ctx.fillRect(eyeX - pixelSize/2 + facing, eyeY - pixelSize/2, pixelSize, pixelSize);

        // Pixel hat
        if (colors.hat) {
            ctx.fillStyle = colors.hat;
            ctx.fillRect(centerX - pixelSize * 3, bodyCY - bodyH/2 - pixelSize * 3, pixelSize * 6, pixelSize * 2);
        }

        ctx.restore();
    },

    /* ---- Platform Drawing - Theme Router ---- */
    drawPlatform(x, y, w, h, color, cam, style = 'normal') {
        const theme = this._getTheme();
        const handlerName = 'drawPlatform_' + theme.platform.edgeStyle;

        if (typeof this[handlerName] === 'function') {
            return this[handlerName](x, y, w, h, color, cam, style);
        }

        return this.drawPlatform_sketchy(x, y, w, h, color, cam, style);
    },

    /* ---- Platform Drawing: Sketchy (Doodle Style) ---- */
    drawPlatform_sketchy(x, y, w, h, color, cam, style) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        if (cx + w < 0 || cx > CONFIG.CANVAS_W || cy + h < 0 || cy > CONFIG.CANVAS_H) return;

        const theme = this._getTheme();
        const inkColor = theme.character.outlineColor;

        ctx.fillStyle = color;
        ctx.fillRect(cx, cy, w, h);

        this.sketchyRect(cx, cy, w, h, null, inkColor, 2.5, 2.5);

        if (theme.platform.topWavy) {
            ctx.fillStyle = this._lighten(color, 0.15);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            for (let i = 0; i <= w; i += 8) {
                ctx.lineTo(cx + i, cy + Math.sin(i * 0.2 + cx * 0.1) * 2 - 1);
            }
            ctx.lineTo(cx + w, cy + 5);
            ctx.lineTo(cx, cy + 5);
            ctx.closePath();
            ctx.fill();
        }

        if (theme.platform.useHatching) {
            this.drawHatching(cx, cy + h * 0.6, w, h * 0.4, 'rgba(26,18,8,0.1)', 7, -0.6);
        }

        for (let i = 0; i < Math.floor(w / 60); i++) {
            const lx = cx + 20 + i * 60 + Math.random() * 10;
            this.sketchyLine(lx, cy + 4, lx + 8, cy + h * 0.5, 'rgba(26,18,8,0.12)', 1, 2);
        }

        if (style === 'ice') {
            ctx.strokeStyle = 'rgba(180,200,200,0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const sx = cx + w * (0.1 + i * 0.3);
                ctx.beginPath();
                ctx.moveTo(sx, cy + 2);
                ctx.lineTo(sx + 12, cy + h * 0.4);
                ctx.stroke();
            }
        } else if (style === 'danger') {
            for (let i = 0; i < Math.floor(w / 50); i++) {
                const dx = cx + 15 + i * 50;
                this.sketchyLine(dx, cy + 4, dx + 12, cy + h - 4, 'rgba(180,40,30,0.4)', 1.5, 2);
                this.sketchyLine(dx + 12, cy + 4, dx, cy + h - 4, 'rgba(180,40,30,0.4)', 1.5, 2);
            }
        } else if (style === 'data') {
            for (let i = 0; i < 3; i++) {
                const lx = cx + 8 + i * (w / 3);
                this.sketchyLine(lx, cy + h * 0.4, lx + w * 0.2, cy + h * 0.4, 'rgba(90,160,106,0.3)', 1.5, 2);
            }
        }
    },

    /* ---- Platform Drawing: Pixelated ---- */
    drawPlatform_pixelated(x, y, w, h, color, cam, style) {
        const ctx = this.ctx;
        const theme = this._getTheme();
        const pixelSize = theme.platform?.pixelSize || 4;
        const cx = Math.floor((x - cam.x) / pixelSize) * pixelSize;
        const cy = Math.floor(y - cam.y) / pixelSize * pixelSize;
        const pw = Math.ceil(w / pixelSize) * pixelSize;
        const ph = Math.ceil(h / pixelSize) * pixelSize;

        if (cx + pw < 0 || cx > CONFIG.CANVAS_W || cy + ph < 0 || cy > CONFIG.CANVAS_H) return;

        ctx.fillStyle = color;
        for (let py = 0; py < ph; py += pixelSize) {
            for (let px = 0; px < pw; px += pixelSize) {
                if (px === 0 || px >= pw - pixelSize || py === 0 || py >= ph - pixelSize) {
                    ctx.fillStyle = this._darken(color, 0.2);
                } else {
                    ctx.fillStyle = color;
                }
                ctx.fillRect(cx + px, cy + py, pixelSize, pixelSize);
            }
        }

        ctx.strokeStyle = theme.character.outlineColor;
        ctx.lineWidth = pixelSize;
        ctx.strokeRect(cx, cy, pw, ph);
    },

    /* ---- Platform Drawing: Rough (RDR Style) ---- */
    drawPlatform_rough(x, y, w, h, color, cam, style) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        if (cx + w < 0 || cx > CONFIG.CANVAS_W || cy + h < 0 || cy > CONFIG.CANVAS_H) return;

        const theme = this._getTheme();
        const inkColor = theme.background?.paperColor ? this._darken(theme.background.paperColor, 0.3) : '#3A2810';

        ctx.fillStyle = color;
        ctx.fillRect(cx, cy, w, h);

        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(cx + 2, cy + Math.random() * 2);
        ctx.lineTo(cx + w - 2, cy + Math.random() * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + w, cy);
        for (let i = 0; i <= h; i += 8) {
            ctx.lineTo(cx + w + Math.random() * 4 - 2, cy + i);
        }
        ctx.lineTo(cx + w, cy + h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy + h);
        for (let i = 0; i <= w; i += 8) {
            ctx.lineTo(cx + i, cy + h + Math.random() * 4 - 2);
        }
        ctx.lineTo(cx + w, cy + h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy + h);
        for (let i = 0; i <= h; i += 8) {
            ctx.lineTo(cx + Math.random() * 4 - 2, cy + i);
        }
        ctx.lineTo(cx, cy);
        ctx.stroke();

        ctx.strokeStyle = this._darken(color, 0.15);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < w / 40; i++) {
            const lx = cx + 20 + i * 40 + Math.random() * 10;
            this.sketchyLine(lx, cy + 5, lx - 5, cy + h - 3, ctx.strokeStyle, 1, 3);
        }

        if (theme.palette && theme.palette.sand) {
            ctx.fillStyle = 'rgba(180,150,100,0.1)';
            ctx.fillRect(cx, cy, w, h);
        }
    },

    /* ---- Background Drawing - Theme Aware ---- */
    drawBackground(chapter, cam, time) {
        const ctx = this.ctx;
        const theme = this._getTheme();

        // Get chapter-specific colors from theme, or fall back to MORANDI
        let baseColors;
        if (theme.chapters && theme.chapters['ch' + chapter]) {
            // Use theme's chapter-specific colors
            baseColors = theme.chapters['ch' + chapter];
        } else if (theme.palette) {
            // Use theme's base palette
            baseColors = theme.palette;
        } else {
            // Fall back to MORANDI
            baseColors = MORANDI['ch' + chapter] || MORANDI.ch1;
        }

        // Draw background based on theme
        if (theme.background.usePaperTexture) {
            // Paper texture background (Doodle, GGG, RDR)
            this.drawPaperBg();

            // Tint overlay per chapter
            const tintGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
            tintGrad.addColorStop(0, baseColors.sky || baseColors.bg);
            tintGrad.addColorStop(1, baseColors.bg);
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = tintGrad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
            ctx.globalAlpha = 1;

            // Ink stains for some themes
            if (theme.background.inkStains) {
                const stainCount = 3 + Math.floor(Math.random() * 2);
                for (let i = 0; i < stainCount; i++) {
                    const sx = Math.random() * CONFIG.CANVAS_W;
                    const sy = Math.random() * CONFIG.CANVAS_H;
                    const sr = 20 + Math.random() * 60;
                    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
                    grad.addColorStop(0, `rgba(80,60,30,${0.02 + Math.random() * 0.02})`);
                    grad.addColorStop(1, 'rgba(80,60,30,0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else {
            // Solid background (Pixel theme)
            ctx.fillStyle = baseColors.bg || '#1A1A2E';
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

            // CRT scanlines
            if (theme.background.scanLines) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                for (let y = 0; y < CONFIG.CANVAS_H; y += 4) {
                    ctx.fillRect(0, y, CONFIG.CANVAS_W, 2);
                }
            }

            // Simple parallax stars
            ctx.fillStyle = baseColors.white || '#E8E8F0';
            for (let i = 0; i < 50; i++) {
                const sx = (i * 137 + cam.x * 0.1) % CONFIG.CANVAS_W;
                const sy = (i * 89 + cam.y * 0.05) % CONFIG.CANVAS_H;
                ctx.fillRect(sx, sy, 2, 2);
            }
        }

        // Parallax layers (chapter-specific backgrounds)
        this._drawBgLayer(baseColors, cam, time, chapter);
    },

    _drawBgLayer(colors, cam, time, chapter) {
        const theme = this._getTheme();
        const handlerName = '_drawBgLayer_' + theme.character.bodyShape;

        if (typeof this[handlerName] === 'function') {
            return this[handlerName](colors, cam, time, chapter);
        }

        // Default to angular (doodle) style
        return this._drawBgLayer_angular(colors, cam, time, chapter);
    },

    /* ---- Background Layers: Angular (Doodle Style) ---- */
    _drawBgLayer_angular(colors, cam, time, chapter) {
        const ox1 = -cam.x * 0.05;
        const ox2 = -cam.x * 0.15;
        const ox3 = -cam.x * 0.3;
        this._drawBgFarLayer_angular(colors, ox1, time, chapter);
        this._drawBgMidLayer_angular(colors, ox2, time, chapter);
        this._drawBgNearLayer_angular(colors, ox3, time, chapter);
    },

    _drawBgFarLayer_angular(colors, ox, time, chapter) {
        const ctx = this.ctx;
        const theme = this._getTheme();
        const inkColor = colors.ink || colors.mid || '#2A1E10';
        const accentColor = colors.accent || '#B87060';

        if (chapter === 1) {
            ctx.strokeStyle = this._hexToRgba(inkColor, 0.15);
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, CONFIG.CANVAS_H);
            for (let x = 0; x <= CONFIG.CANVAS_W; x += 6) {
                const mh = 300 + Math.sin((x + ox) * 0.005) * 60 + Math.sin((x + ox) * 0.012) * 30;
                ctx.lineTo(x, mh + (Math.random()-0.5)*3);
            }
            ctx.lineTo(CONFIG.CANVAS_W, CONFIG.CANVAS_H);
            ctx.closePath();
            ctx.fillStyle = this._hexToRgba(inkColor, 0.06);
            ctx.fill();
            ctx.stroke();
        } else if (chapter === 2) {
            ctx.fillStyle = this._hexToRgba(inkColor, 0.08);
            for (let i = 0; i < 6; i++) {
                const bw = 60 + Math.sin(i * 2.3) * 30;
                const bh = 80 + Math.sin(i * 1.7) * 50;
                const bx = 100 + i * 200 + ox * 0.3;
                this.sketchyRect(bx, CONFIG.CANVAS_H - bh - 100, bw, bh + 100, this._hexToRgba(inkColor, 0.06), this._hexToRgba(inkColor, 0.12), 1.5, 2);
            }
        } else if (chapter === 3) {
            ctx.strokeStyle = this._hexToRgba(accentColor, 0.15);
            ctx.lineWidth = 0.5;
            const gs = 80;
            for (let x = (ox % gs); x < CONFIG.CANVAS_W; x += gs) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.CANVAS_H); ctx.stroke();
            }
            for (let y = 0; y < CONFIG.CANVAS_H; y += gs) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CONFIG.CANVAS_W, y); ctx.stroke();
            }
        } else if (chapter === 4) {
            for (let i = 0; i < 5; i++) {
                const ccx = (i * 250 + ox * 0.2 + time * 0.008) % (CONFIG.CANVAS_W + 300) - 150;
                this.sketchyCircle(ccx, 80 + i * 30, 60 + i * 10, null, this._hexToRgba(inkColor, 0.06), 1);
                this.sketchyCircle(ccx + 40, 70 + i * 30, 40 + i * 8, null, this._hexToRgba(inkColor, 0.05), 1);
            }
        } else if (chapter === 5) {
            const goldColor = colors.gold || '#D4A840';
            for (let i = 0; i < 8; i++) {
                const fx = (i * 180 + Math.sin(time * 0.0008 + i) * 60) % CONFIG.CANVAS_W;
                const fy = 80 + Math.sin(time * 0.001 + i * 0.6) * 150;
                this.sketchyRect(fx, fy, 15 + i * 2, 15 + i * 2, null, this._hexToRgba(goldColor, 0.2), 1, 2);
            }
        }
    },

    _drawBgMidLayer_angular(colors, ox, time, chapter) {
        const ctx = this.ctx;
        const ink = colors.ink || '#2A1E10';
        const accent = colors.accent || '#5A9A6A';
        const gold = colors.gold || '#B48C32';
        const danger = colors.danger || '#B4321E';

        if (chapter === 1) {
            for (let i = 0; i < 5; i++) {
                const bw = 60 + Math.sin(i * 2.3) * 30;
                const bh = 100 + Math.sin(i * 1.7) * 60;
                const bx = 150 + i * 220 + ox * 0.5;
                ctx.fillStyle = this._hexToRgba(ink, 0.08);
                ctx.fillRect(bx, CONFIG.CANVAS_H - 200 - bh, bw, bh + 200);
                this.drawHatching(bx, CONFIG.CANVAS_H - 200 - bh, bw, bh + 200, this._hexToRgba(ink, 0.04), 10, -0.5);
            }
        } else if (chapter === 2) {
            const pulse = Math.sin(time * 0.003) * 0.5 + 0.5;
            ctx.fillStyle = this._hexToRgba(danger, 0.02 + pulse * 0.02);
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
            for (let i = 0; i < 4; i++) {
                const py = 100 + i * 140;
                this.sketchyLine(0, py + Math.sin(ox * 0.01 + i) * 10, CONFIG.CANVAS_W, py + Math.cos(ox * 0.01 + i) * 10, this._hexToRgba(ink, 0.1), 3, 4);
            }
        } else if (chapter === 3) {
            for (let i = 0; i < 6; i++) {
                const fx = ((time * 0.15 + i * 200) % (CONFIG.CANVAS_W + 200)) - 100;
                const fy = 100 + Math.sin(time * 0.002 + i * 1.5) * 150 + i * 50;
                this.sketchyLine(fx, fy, fx + 25 + i * 4, fy, this._hexToRgba(accent, 0.1), 2, 3);
            }
        } else if (chapter === 4) {
            for (let i = 0; i < 4; i++) {
                const ccx = (i * 280 + ox * 0.4 + time * 0.015) % (CONFIG.CANVAS_W + 350) - 175;
                this.sketchyCircle(ccx, 120 + i * 35, 50 + i * 8, this._hexToRgba(ink, 0.03), this._hexToRgba(ink, 0.06), 1);
            }
        } else if (chapter === 5) {
            for (let i = 0; i < 10; i++) {
                const fx = (i * 140 + Math.sin(time * 0.001 + i) * 50) % CONFIG.CANVAS_W;
                const fy = 100 + Math.sin(time * 0.002 + i * 0.7) * 180;
                this.sketchyRect(fx, fy, 18 + i * 2, 18 + i * 2, null, this._hexToRgba(gold, 0.06), 1, 2);
            }
        }
    },

    _drawBgNearLayer_angular(colors, ox, time, chapter) {
        const ctx = this.ctx;
        const ink = colors.ink || '#2A1E10';
        const accent = colors.accent || '#5A9A6A';
        const gold = colors.gold || '#B48C32';
        const sky = colors.sky || '#B8E0F7';

        if (chapter === 1) {
            ctx.fillStyle = this._hexToRgba(sky, 0.08);
            for (let i = 0; i < 8; i++) {
                const x = ((i * 200 + ox * 0.5 + time * 0.1) % (CONFIG.CANVAS_W + 300)) - 150;
                const y = 100 + Math.sin(time * 0.002 + i * 1.2) * 150 + i * 60;
                this.sketchyCircle(x, y, 4 + i * 2, this._hexToRgba(sky, 0.06), null);
            }
        } else if (chapter === 2) {
            for (let i = 0; i < 3; i++) {
                const py = 150 + i * 180 + Math.sin(time * 0.001 + i) * 5;
                this.sketchyLine(0, py, CONFIG.CANVAS_W, py, this._hexToRgba(ink, 0.12), 2.5, 4);
            }
        } else if (chapter === 3) {
            for (let i = 0; i < 4; i++) {
                const fx = ((time * 0.3 + i * 150) % (CONFIG.CANVAS_W + 150)) - 75;
                const fy = 150 + Math.sin(time * 0.003 + i * 2) * 120 + i * 80;
                this.sketchyLine(fx, fy, fx + 35 + i * 6, fy, this._hexToRgba(accent, 0.12), 2, 3);
            }
        } else if (chapter === 4) {
            ctx.strokeStyle = this._hexToRgba(ink, 0.08);
            ctx.lineWidth = 1;
            for (let i = 0; i < 15; i++) {
                const x = (i * 90 + ox * 0.6 + time * 0.2) % CONFIG.CANVAS_W;
                const y = (time * 1.5 + i * 50) % CONFIG.CANVAS_H;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - 15, y + 25);
                ctx.stroke();
            }
        } else if (chapter === 5) {
            ctx.fillStyle = this._hexToRgba(gold, 0.05);
            for (let i = 0; i < 6; i++) {
                const fx = (i * 220 + Math.sin(time * 0.0006 + i) * 80) % CONFIG.CANVAS_W;
                const fy = 100 + Math.sin(time * 0.001 + i * 0.8) * 200;
                this.sketchyRect(fx, fy, 12, 12, this._hexToRgba(gold, 0.06), this._hexToRgba(gold, 0.1), 1, 2);
            }
        }
    },

    /* ---- Background Layers: Bean (GGG Style) ---- */
    _drawBgLayer_bean(colors, cam, time, chapter) {
        const ctx = this.ctx;
        const theme = this._getTheme();
        const c = theme.palette || colors;

        // Bright, cartoon-style background
        const bgColor = c.bg || c.sky || '#4A4038';
        const accentColor = c.accent || '#C87868';

        // Gradient sky
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
        grad.addColorStop(0, this._lighten(bgColor, 0.15));
        grad.addColorStop(1, bgColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // Rounded, bouncy clouds
        const cloudY = 100;
        for (let i = 0; i < 4; i++) {
            const cx = ((i * 350 + time * 0.02) % (CONFIG.CANVAS_W + 200)) - 100;
            ctx.fillStyle = this._lighten(bgColor, 0.2);
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(cx, cloudY + i * 20, 60 + i * 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.arc(cx + 50, cloudY + i * 20 - 10, 40 + i * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Cartoon-style decorations
        if (chapter === 1) {
            // Simple snowy hills (rounded)
            ctx.fillStyle = this._lighten(bgColor, 0.1);
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                const hx = (i * 500 - cam.x * 0.05) % (CONFIG.CANVAS_W + 400) - 200;
                ctx.beginPath();
                ctx.arc(hx, CONFIG.CANVAS_H + 50, 200, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 2) {
            // Industrial but cartoonish
            ctx.fillStyle = this._darken(bgColor, 0.15);
            ctx.globalAlpha = 0.2;
            for (let i = 0; i < 3; i++) {
                const bx = i * 400 + 100;
                const bh = 150 + i * 30;
                ctx.fillRect(bx - cam.x * 0.1, CONFIG.CANVAS_H - bh - 100, 80, bh);
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 3) {
            // Digital grid but softer
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = 0.15;
            ctx.lineWidth = 2;
            const gs = 60;
            const ox = (-cam.x * 0.1) % gs;
            for (let x = ox; x < CONFIG.CANVAS_W; x += gs) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.CANVAS_H); ctx.stroke();
            }
            for (let y = 0; y < CONFIG.CANVAS_H; y += gs) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CONFIG.CANVAS_W, y); ctx.stroke();
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 4) {
            // Stormy but rounded clouds
            ctx.fillStyle = this._darken(bgColor, 0.1);
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 5; i++) {
                const cx = ((i * 280 + time * 0.03) % (CONFIG.CANVAS_W + 200)) - 100;
                ctx.beginPath();
                ctx.arc(cx, 80 + i * 25, 70 + i * 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 5) {
            // Soft golden fragments
            ctx.fillStyle = theme.palette?.gold || '#D4A840';
            ctx.globalAlpha = 0.2;
            for (let i = 0; i < 8; i++) {
                const fx = (i * 180 + time * 0.05) % CONFIG.CANVAS_W;
                const fy = 100 + Math.sin(time * 0.002 + i) * 150;
                ctx.beginPath();
                ctx.arc(fx, fy, 8 + i, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    },

    /* ---- Background Layers: Cowboy (RDR Style) ---- */
    _drawBgLayer_cowboy(colors, cam, time, chapter) {
        const ctx = this.ctx;
        const theme = this._getTheme();
        const c = theme.palette || colors;

        // Desert/tropical sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
        grad.addColorStop(0, c.sky || c.sunset || '#D46030');
        grad.addColorStop(0.5, c.bg || '#8B6B4A');
        grad.addColorStop(1, this._darken(c.bg || '#8B6B4A', 0.2));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // Dust particles
        const dustColor = c.dust || '#B49664';
        ctx.fillStyle = this._hexToRgba(dustColor, 0.15 + Math.sin(time * 0.001) * 0.05);
        for (let i = 0; i < 20; i++) {
            const dx = (i * 73 + time * 0.3) % CONFIG.CANVAS_W;
            const dy = (i * 47 + time * 0.1) % CONFIG.CANVAS_H;
            ctx.beginPath();
            ctx.arc(dx, dy, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        if (chapter === 1) {
            // Distant mesas buttes
            ctx.fillStyle = this._darken(c.desert || '#B89060', 0.3);
            ctx.globalAlpha = 0.4;
            for (let i = 0; i < 3; i++) {
                const mx = i * 450 - cam.x * 0.03;
                ctx.beginPath();
                ctx.moveTo(mx, CONFIG.CANVAS_H);
                ctx.lineTo(mx + 80, CONFIG.CANVAS_H - 200 - i * 30);
                ctx.lineTo(mx + 150, CONFIG.CANVAS_H - 180 - i * 20);
                ctx.lineTo(mx + 200, CONFIG.CANVAS_H);
                ctx.closePath();
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 2) {
            // Industrial with western style
            ctx.fillStyle = this._darken(c.bg || '#5A4030', 0.3);
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 4; i++) {
                const bx = i * 300 + 50;
                const bh = 100 + i * 40;
                ctx.fillRect(bx - cam.x * 0.08, CONFIG.CANVAS_H - bh - 80, 60, bh);
                // Water tower
                ctx.fillRect(bx + 20 - cam.x * 0.08, CONFIG.CANVAS_H - bh - 140, 40, 20);
                ctx.fillRect(bx + 30 - cam.x * 0.08, CONFIG.CANVAS_H - bh - 180, 20, 40);
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 3) {
            // Digital but westernized
            ctx.strokeStyle = c.teal || '#5A8A6A';
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 2;
            const gs = 80;
            const ox = (-cam.x * 0.05) % gs;
            for (let x = ox; x < CONFIG.CANVAS_W; x += gs) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.CANVAS_H); ctx.stroke();
            }
            for (let y = 0; y < CONFIG.CANVAS_H; y += gs) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CONFIG.CANVAS_W, y); ctx.stroke();
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 4) {
            // Dust storm
            ctx.fillStyle = c.storm || '#C8B8A0';
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 8; i++) {
                const dx = (i * 180 + time * 0.5 - cam.x * 0.1) % (CONFIG.CANVAS_W + 100) - 50;
                const dy = i * 90 + Math.sin(time * 0.002 + i) * 30;
                ctx.beginPath();
                ctx.ellipse(dx, dy, 100 + i * 20, 40, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 5) {
            // Golden sunset glow
            const sunGrad = ctx.createRadialGradient(
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H * 0.7, 0,
                CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H * 0.7, 400
            );
            const sunColor = c.gold || '#D4A030';
            sunGrad.addColorStop(0, this._hexToRgba(sunColor, 0.3 + Math.sin(time * 0.001) * 0.1));
            sunGrad.addColorStop(1, this._hexToRgba(sunColor, 0));
            ctx.fillStyle = sunGrad;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

            // Floating fragments
            ctx.fillStyle = c.gold || '#C09030';
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 10; i++) {
                const fx = (i * 150 + time * 0.1) % CONFIG.CANVAS_W;
                const fy = 100 + Math.sin(time * 0.001 + i * 0.5) * 150;
                ctx.beginPath();
                ctx.arc(fx, fy, 6 + i * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    },

    /* ---- Background Layers: Pixelated ---- */
    _drawBgLayer_pixelated(colors, cam, time, chapter) {
        const ctx = this.ctx;
        const theme = this._getTheme();
        const c = theme.palette || colors;
        const pixelSize = 4;

        // Solid background
        ctx.fillStyle = c.bg || '#1A1A2E';
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // Pixel grid
        ctx.strokeStyle = this._lighten(c.bg || '#1A1A2E', 0.1);
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        for (let x = 0; x < CONFIG.CANVAS_W; x += pixelSize * 8) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CONFIG.CANVAS_H);
            ctx.stroke();
        }
        for (let y = 0; y < CONFIG.CANVAS_H; y += pixelSize * 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CONFIG.CANVAS_W, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Stars
        ctx.fillStyle = c.white || '#D8D8E0';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 97 + cam.x * 0.02) % CONFIG.CANVAS_W;
            const sy = (i * 73 + cam.y * 0.01) % (CONFIG.CANVAS_H * 0.6);
            ctx.fillRect(Math.floor(sx / pixelSize) * pixelSize, Math.floor(sy / pixelSize) * pixelSize, pixelSize, pixelSize);
        }

        // Chapter-specific pixel art
        if (chapter === 1) {
            // Pixel snow
            ctx.fillStyle = c.white || '#E8E8F0';
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 15; i++) {
                const px = (i * 100 + time * 0.2) % CONFIG.CANVAS_W;
                const py = (time * 0.5 + i * 60) % CONFIG.CANVAS_H;
                ctx.fillRect(Math.floor(px / pixelSize) * pixelSize, Math.floor(py / pixelSize) * pixelSize, pixelSize, pixelSize);
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 2) {
            // Pixel warning lights
            ctx.fillStyle = c.red || '#A83A3A';
            ctx.globalAlpha = 0.5 + Math.sin(time * 0.005) * 0.3;
            for (let i = 0; i < 5; i++) {
                const lx = i * 250 + 100;
                const ly = 150 + i * 80;
                ctx.fillRect(Math.floor(lx / pixelSize) * pixelSize, Math.floor(ly / pixelSize) * pixelSize, pixelSize * 3, pixelSize * 3);
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 3) {
            // Digital rain
            ctx.fillStyle = c.teal || '#3A8A7A';
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 8; i++) {
                const rx = i * 160 + 50;
                for (let j = 0; j < 10; j++) {
                    const ry = (time * 2 + j * 40 + i * 50) % CONFIG.CANVAS_H;
                    ctx.fillRect(Math.floor(rx / pixelSize) * pixelSize, Math.floor(ry / pixelSize) * pixelSize, pixelSize, pixelSize * 2);
                }
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 4) {
            // Pixel rain
            ctx.fillStyle = c.warmGray || '#4A4A5E';
            ctx.globalAlpha = 0.5;
            for (let i = 0; i < 20; i++) {
                const rx = i * 70 + (time * 3 % 70);
                const ry = (time * 4 + i * 40) % CONFIG.CANVAS_H;
                ctx.fillRect(Math.floor(rx / pixelSize) * pixelSize, Math.floor(ry / pixelSize) * pixelSize, pixelSize, pixelSize * 3);
            }
            ctx.globalAlpha = 1;
        } else if (chapter === 5) {
            // Pixel sparkles
            ctx.fillStyle = c.gold || '#A89830';
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 12; i++) {
                const sx = (i * 120 + Math.sin(time * 0.002 + i) * 50) % CONFIG.CANVAS_W;
                const sy = 100 + Math.sin(time * 0.003 + i * 0.8) * 150;
                // Cross shape
                ctx.fillRect(Math.floor(sx / pixelSize) * pixelSize - pixelSize, Math.floor(sy / pixelSize) * pixelSize, pixelSize * 3, pixelSize);
                ctx.fillRect(Math.floor(sx / pixelSize) * pixelSize, Math.floor(sy / pixelSize) * pixelSize - pixelSize, pixelSize, pixelSize * 3);
            }
            ctx.globalAlpha = 1;
        }
    },

    /* ---- Interactive Objects (Doodle / Sketch Style) ---- */
    drawInteractable(x, y, w, h, type, cam, time) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        if (cx + w < -50 || cx > CONFIG.CANVAS_W + 50) return;

        const theme = this._getTheme();
        const c = theme.palette || {};
        const bob = Math.sin(time * 0.004) * 3;
        const inkColor = c.ink || '#1A1208';
        const gold = c.gold || '#B48C32';
        const paper = c.paper || '#D8C8A0';
        const accent = c.accent || '#5A9A6A';
        const danger = c.danger || '#B4321E';

        // Interaction indicator — sketchy dashed circle
        const glowAlpha = 0.15 + Math.sin(time * 0.005) * 0.1;
        ctx.strokeStyle = this._hexToRgba(gold, glowAlpha);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(cx + w / 2, cy + h / 2 + bob, w * 0.7, h * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (type === 'note' || type === 'journal') {
            // Hand-drawn note on paper
            this.sketchyRect(cx + 3, cy + bob + 1, w - 6, h - 2, paper, inkColor, 2, 2);
            // Scribbled lines on paper
            for (let i = 0; i < 3; i++) {
                this.sketchyLine(cx + 9, cy + bob + 10 + i * 8, cx + w - 9, cy + bob + 10 + i * 8, this._hexToRgba(inkColor, 0.25), 1, 2);
            }
        } else if (type === 'terminal') {
            // Sketchy monitor
            this.sketchyRect(cx - 2, cy + bob - 2, w + 4, h + 4, '#3A3028', inkColor, 2.5, 2);
            // Screen area with sketchy border
            const screenAlpha = 0.3 + Math.sin(time * 0.006) * 0.12;
            ctx.fillStyle = this._hexToRgba(accent, screenAlpha);
            ctx.fillRect(cx + 4, cy + bob + 4, w - 8, h - 10);
            this.sketchyRect(cx + 4, cy + bob + 4, w - 8, h - 10, null, this._hexToRgba(accent, 0.4), 1.5, 1);
            // Blinking cursor
            if (Math.sin(time * 0.008) > 0) {
                ctx.fillStyle = this._lighten(accent, 0.2);
                ctx.fillRect(cx + 10, cy + bob + h - 14, 8, 3);
            }
        } else if (type === 'hologram') {
            // Ghostly sketch figure
            const holoColor = c.holo || '#6A8898';
            ctx.strokeStyle = this._hexToRgba(holoColor, 0.3 + Math.sin(time * 0.005) * 0.15);
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 4]);
            this.sketchyRect(cx + 2, cy + bob, w - 4, h, null, ctx.strokeStyle, 1.5, 3);
            ctx.setLineDash([]);
            // Rough silhouette
            ctx.fillStyle = this._hexToRgba(holoColor, 0.15 + Math.sin(time * 0.004) * 0.08);
            ctx.beginPath();
            ctx.moveTo(cx + w / 2, cy + bob + 5);
            ctx.lineTo(cx + w / 2 + 10, cy + bob + h * 0.6);
            ctx.lineTo(cx + w / 2 - 10, cy + bob + h * 0.6);
            ctx.closePath();
            ctx.fill();
        } else if (type === 'recording') {
            // Sketchy tape recorder
            this.sketchyRect(cx + 1, cy + bob, w - 2, h, '#4A3828', inkColor, 2, 2);
            // Two reels (circles)
            this.sketchyCircle(cx + w / 2 - 7, cy + bob + h / 2, 5, null, this._hexToRgba(gold, 0.5), 1.5);
            this.sketchyCircle(cx + w / 2 + 7, cy + bob + h / 2, 5, null, this._hexToRgba(gold, 0.5), 1.5);
        } else if (type === 'door') {
            // Heavy sketchy door
            this.sketchyRect(cx, cy, w, h, '#4A4038', inkColor, 3, 2);
            // Door handle
            this.sketchyCircle(cx + w - 10, cy + h / 2, 4, '#8A7A60', inkColor, 1.5);
            // Keypad
            const kpAlpha = 0.4 + Math.sin(time * 0.004) * 0.2;
            ctx.fillStyle = this._hexToRgba(danger, kpAlpha);
            ctx.fillRect(cx + w - 20, cy + h / 2 - 14, 14, 10);
            this.sketchyRect(cx + w - 20, cy + h / 2 - 14, 14, 10, null, inkColor, 1.5, 1);
        } else if (type === 'shadow') {
            // Ink splatter shadow
            const sAlpha = 0.2 + Math.sin(time * 0.003) * 0.1;
            ctx.fillStyle = this._hexToRgba(inkColor, sAlpha);
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                const r = (w / 2 + 2) * (0.7 + Math.random() * 0.3);
                const px = cx + w / 2 + Math.cos(a) * r;
                const py = cy + h / 2 + Math.sin(a) * r * (h / w);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.quadraticCurveTo(cx + w/2 + Math.cos(a-0.3)*r*1.1, cy + h/2 + Math.sin(a-0.3)*r*(h/w)*1.1, px, py);
            }
            ctx.closePath();
            ctx.fill();
        }
    },

    /* ---- Particle System ---- */
    addParticle(x, y, type, count = 1) {
        const theme = this._getTheme();

        for (let i = 0; i < count; i++) {
            let vx, vy, life, size;
            let particleType = type;

            // Theme-based particle type adjustment
            if (type === 'dust' && theme.particles.shape === 'pixel') {
                particleType = 'pixel_dust';
            } else if (type === 'dust' && theme.palette && theme.palette.sand) {
                particleType = 'sand';
            }

            if (particleType === 'snow') {
                vx = (Math.random() - 0.5) * 1;
                vy = Math.random() * 1.5 + 0.5;
                life = 300;
                size = 2 + Math.random() * 3;
            } else if (particleType === 'death') {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
                vx = Math.cos(angle) * (2 + Math.random() * 4);
                vy = Math.sin(angle) * (2 + Math.random() * 4) - 2;
                life = 30 + Math.random() * 25;
                size = 3 + Math.random() * 5;
            } else if (particleType === 'sand') {
                // RDR sand particles
                vx = (Math.random() - 0.3) * 3;
                vy = -(Math.random() * 1 + 0.2);
                life = 40 + Math.random() * 20;
                size = 3 + Math.random() * 4;
            } else if (particleType === 'pixel_dust') {
                // Pixel dust particles
                vx = (Math.random() - 0.5) * 2;
                vy = -(Math.random() * 1 + 0.3);
                life = 20 + Math.random() * 15;
                size = 4;
            } else if (particleType === 'dust') {
                vx = (Math.random() - 0.5) * 2;
                vy = -(Math.random() * 1.5 + 0.3);
                life = 20 + Math.random() * 15;
                size = 2 + Math.random() * 3;
            } else if (particleType === 'interact') {
                const angle = (Math.PI * 2 / count) * i;
                vx = Math.cos(angle) * (1 + Math.random() * 2);
                vy = Math.sin(angle) * (1 + Math.random() * 2) - 1.5;
                life = 25 + Math.random() * 20;
                size = 2 + Math.random() * 3;
            } else if (particleType === 'trail') {
                vx = (Math.random() - 0.5) * 0.5;
                vy = (Math.random() - 0.5) * 0.5;
                life = 15 + Math.random() * 10;
                size = 3 + Math.random() * 2;
            } else if (particleType === 'sparkle') {
                const angle = Math.random() * Math.PI * 2;
                vx = Math.cos(angle) * (1 + Math.random() * 2);
                vy = Math.sin(angle) * (1 + Math.random() * 2) - 1;
                life = 20 + Math.random() * 15;
                size = 2 + Math.random() * 3;
            } else if (particleType === 'landing') {
                vx = (Math.random() - 0.5) * 3;
                vy = -(Math.random() * 2 + 0.5);
                life = 18 + Math.random() * 12;
                size = 4 + Math.random() * 4;
            } else {
                vx = (Math.random() - 0.5) * 4;
                vy = (Math.random() - 0.8) * 4;
                life = 40 + Math.random() * 30;
                size = 2 + Math.random() * 4;
            }

            const themePalette = theme.palette;
            const c = themePalette || {};
            let dustColor = theme.particles.dustColor;
            if (particleType === 'sand') {
                dustColor = this._hexToRgba(c.sand || c.warmGray || '#B49664', 0.6);
            } else if (particleType === 'pixel_dust') {
                dustColor = this._hexToRgba(c.ink || '#0f0f1a', 0.6);
            }

            this._particles.push({
                x, y, vx, vy,
                life, maxLife: life,
                size, type: particleType,
                rot: Math.random() * Math.PI * 2,
                color: dustColor,
            });
        }
    },

    updateAndDrawParticles(cam) {
        const ctx = this.ctx;
        const theme = this._getTheme();
        const c = theme.palette || {};
        const inkColor = c.ink || '#2A1E10';
        const accentColor = c.accent || '#5A9A6A';
        const goldColor = c.gold || '#B48C32';
        const sandColor = c.sand || c.warmGray || '#B49664';
        const snowColor = c.snow || '#C8B890';

        for (let i = this._particles.length - 1; i >= 0; i--) {
            const p = this._particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) { this._particles.splice(i, 1); continue; }

            const alpha = Math.min(p.life / p.maxLife, 1);
            const sx = p.x - cam.x, sy = p.y - cam.y;
            if (sx < -20 || sx > CONFIG.CANVAS_W + 20 || sy < -20 || sy > CONFIG.CANVAS_H + 20) continue;

            // Pixel theme: render all particles as squares
            if (theme.particles.shape === 'pixel' || p.type === 'pixel_dust') {
                const ps = p.size;
                ctx.fillStyle = p.color || this._hexToRgba(c.ink || '#0f0f1a', 0.6);
                ctx.fillRect(Math.floor(sx/ps)*ps, Math.floor(sy/ps)*ps, ps, ps);
                continue;
            }

            if (p.type === 'sand') {
                // RDR sand particles
                ctx.fillStyle = this._hexToRgba(sandColor, alpha * 0.6);
                p.vy += 0.05;
                p.vx *= 0.98;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                continue;
            } else if (p.type === 'snow') {
                ctx.fillStyle = this._hexToRgba(snowColor, alpha * 0.3);
                p.vx = Math.sin(p.life * 0.05) * 0.5;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * alpha * 0.8, 0, Math.PI * 2);
                ctx.fill();
                continue;
            } else if (p.type === 'spark') {
                ctx.fillStyle = this._hexToRgba(goldColor, alpha * 0.7);
                p.vy += 0.1;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(p.rot + p.life * 0.1);
                const s = p.size * alpha;
                ctx.fillRect(-s * 0.3, -s * 1.2, s * 0.6, s * 2.4);
                ctx.fillRect(-s * 1.2, -s * 0.3, s * 2.4, s * 0.6);
                ctx.restore();
                continue;
            } else if (p.type === 'death') {
                ctx.fillStyle = this._hexToRgba(inkColor, alpha * 0.6);
                p.vy += 0.15;
                p.vx *= 0.97;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * alpha * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = this._hexToRgba(inkColor, alpha * 0.3);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * alpha * 1.3, 0, Math.PI * 2);
                ctx.stroke();
                continue;
            } else if (p.type === 'dust') {
                ctx.fillStyle = p.color || this._hexToRgba(sandColor, alpha * 0.4);
                p.vx *= 0.96;
                p.vy *= 0.95;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                continue;
            } else if (p.type === 'interact') {
                ctx.fillStyle = this._hexToRgba(goldColor, alpha * 0.6);
                p.vy += 0.05;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                continue;
            } else if (p.type === 'trail') {
                ctx.fillStyle = this._hexToRgba(inkColor, alpha * 0.3);
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * alpha * 0.7, 0, Math.PI * 2);
                ctx.fill();
                continue;
            } else if (p.type === 'sparkle') {
                ctx.strokeStyle = this._hexToRgba(goldColor, alpha * 0.7);
                ctx.lineWidth = 1.5;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(p.rot + p.life * 0.15);
                const s = p.size * alpha;
                ctx.beginPath();
                ctx.moveTo(0, -s * 1.5); ctx.lineTo(0, s * 1.5);
                ctx.moveTo(-s * 1.5, 0); ctx.lineTo(s * 1.5, 0);
                ctx.stroke();
                ctx.restore();
                continue;
            } else if (p.type === 'landing') {
                ctx.fillStyle = this._hexToRgba(sandColor, alpha * 0.4);
                p.vy += 0.08;
                p.vx *= 0.95;
                ctx.beginPath();
                ctx.ellipse(sx, sy, p.size * alpha * 1.2, p.size * alpha * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                continue;
            } else if (p.type === 'data') {
                ctx.fillStyle = this._hexToRgba(accentColor, alpha * 0.4);
            } else if (p.type === 'glitch') {
                ctx.fillStyle = this._hexToRgba(Math.random() > 0.5 ? accentColor : inkColor, alpha * 0.4);
            } else {
                ctx.fillStyle = p.color || this._hexToRgba(inkColor, alpha * 0.4);
            }

            ctx.beginPath();
            ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    /* ---- Effects (Doodle Style) ---- */
    drawScanOverlay(time, chapter) {
        const ctx = this.ctx;
        const scanY = (time * 0.4) % CONFIG.CANVAS_H;
        // Pencil-line scan
        ctx.strokeStyle = 'rgba(42,30,16,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        for (let x = 0; x < CONFIG.CANVAS_W; x += 12) {
            ctx.lineTo(x, scanY + (Math.random()-0.5)*2);
        }
        ctx.stroke();
        // Sketchy border
        this.sketchyRect(4, 4, CONFIG.CANVAS_W - 8, CONFIG.CANVAS_H - 8, null, 'rgba(42,30,16,0.08)', 1.5, 4);
    },

    drawVignette() {
        const ctx = this.ctx;
        // Burnt-edge parchment vignette
        const grad = ctx.createRadialGradient(
            CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2, CONFIG.CANVAS_H * 0.35,
            CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2, CONFIG.CANVAS_H * 0.85
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.7, 'rgba(26,18,8,0.15)');
        grad.addColorStop(1, 'rgba(26,18,8,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    },

    drawGlitchEffect(time) {
        const ctx = this.ctx;
        // Ink smear instead of digital glitch
        if (Math.random() > 0.88) {
            const y = Math.random() * CONFIG.CANVAS_H;
            const h = 2 + Math.random() * 6;
            ctx.fillStyle = `rgba(42,30,16,${0.03 + Math.random()*0.04})`;
            ctx.fillRect(0, y, CONFIG.CANVAS_W, h);
        }
        if (Math.random() > 0.94) {
            // Random ink splatter
            const sx = Math.random() * CONFIG.CANVAS_W;
            const sy = Math.random() * CONFIG.CANVAS_H;
            ctx.fillStyle = `rgba(42,30,16,${0.02 + Math.random()*0.03})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 3 + Math.random() * 8, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    /* ---- Turret Drawing (Doodle / Sketch Style) ---- */
    drawTurret(x, y, w, h, cam, time, active) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        const theme = this._getTheme();
        const c = theme.palette || {};
        const inkColor = c.ink || '#1A1208';
        const danger = c.danger || '#B4321E';
        const bodyColor = '#4A3020';
        const barrelColor = active ? (c.danger || '#C04030') : '#5A3828';
        const eyeColor = c.paper || '#D8C8A0';

        // Body — sketchy box
        this.sketchyRect(cx - 2, cy - 2, w + 4, h + 4, bodyColor, inkColor, 2.5, 2);
        // Barrel
        this.sketchyRect(cx + w/2 - 4, cy + h, 8, 14, barrelColor, inkColor, 2, 1.5);
        // Eye — sketchy circle
        this.sketchyCircle(cx + w/2, cy + h/2, 6, eyeColor, inkColor, 2);
        // Pupil
        const pupilAlpha = active ? (0.8 + Math.sin(time * 0.01) * 0.2) : 0.4;
        ctx.fillStyle = this._hexToRgba(danger, pupilAlpha);
        ctx.beginPath();
        ctx.arc(cx + w / 2, cy + h / 2 + 1, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Scan beam when active — hatched triangle
        if (active) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx + w / 2 - 4, cy + h + 14);
            ctx.lineTo(cx + w / 2 - 60, cy + h + 120);
            ctx.lineTo(cx + w / 2 + 60, cy + h + 120);
            ctx.closePath();
            ctx.clip();
            this.drawHatching(cx + w/2 - 60, cy + h + 14, 120, 110, this._hexToRgba(danger, 0.06 + Math.sin(time * 0.008) * 0.03), 8, -0.5);
            ctx.restore();
            // Beam edge lines
            this.sketchyLine(cx + w/2 - 4, cy + h + 14, cx + w/2 - 60, cy + h + 120, this._hexToRgba(danger, 0.1), 1, 3);
            this.sketchyLine(cx + w/2 + 4, cy + h + 14, cx + w/2 + 60, cy + h + 120, this._hexToRgba(danger, 0.1), 1, 3);
        }
    },

    /* ---- Spike Hazard Drawing ---- */
    drawSpike(x, y, w, h, cam, time) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        const theme = this._getTheme();
        const c = theme.palette || {};
        const iceColor = c.ice || '#8ABCCC';
        const danger = c.danger || '#C04030';
        const spikeCount = Math.max(1, Math.floor(w / 16));

        // Draw ice spike triangles
        ctx.fillStyle = iceColor;
        ctx.strokeStyle = danger;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < spikeCount; i++) {
            const sx = cx + i * 16 + 8;
            const spikeH = h + Math.sin(time * 0.005 + i * 0.5) * 3;
            ctx.beginPath();
            ctx.moveTo(sx - 7, cy + h);
            ctx.lineTo(sx, cy + h - spikeH);
            ctx.lineTo(sx + 7, cy + h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Inner shine
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(sx - 3, cy + h - 4);
            ctx.lineTo(sx, cy + h - spikeH + 6);
            ctx.lineTo(sx + 1, cy + h - 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = iceColor;
        }
    },

    /* ---- Wind Zone Drawing ---- */
    drawWindZone(x, y, w, h, cam, time, strength, interval) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        const windCycle = (time / 60) % interval;
        const active = windCycle < interval * 0.5;

        if (!active) return;

        const alpha = 0.1 + Math.sin(time * 0.01) * 0.05;
        // Draw wind streaks
        ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`;
        ctx.lineWidth = 2;
        const streakCount = 5;
        for (let i = 0; i < streakCount; i++) {
            const offsetY = (h / streakCount) * i + h / (streakCount * 2);
            const streakX = ((time * strength * 0.5) % w);
            ctx.beginPath();
            ctx.moveTo(cx + streakX % w, cy + offsetY);
            ctx.lineTo(cx + (streakX + 40) % w, cy + offsetY);
            ctx.stroke();
        }
        // Zone border indicator
        ctx.strokeStyle = `rgba(100, 180, 255, ${alpha * 0.5})`;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cx, cy, w, h);
        ctx.setLineDash([]);
    },

    /* ---- Laser Hazard Drawing ---- */
    drawLaser(x, y, w, h, cam, time, active) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        const theme = this._getTheme();
        const c = theme.palette || {};
        const danger = c.danger || '#C04030';
        const laserColor = active ? danger : 'rgba(100,60,60,0.3)';
        const alpha = active ? (0.7 + Math.sin(time * 0.02) * 0.3) : 0.2;

        // Laser beam
        ctx.fillStyle = this._hexToRgba(laserColor, alpha);
        ctx.fillRect(cx, cy, w, h);

        // Glow effect when active
        if (active) {
            ctx.shadowColor = danger;
            ctx.shadowBlur = 15 + Math.sin(time * 0.015) * 5;
            ctx.fillRect(cx, cy, w, h);
            ctx.shadowBlur = 0;

            // Emitter nodes at ends
            ctx.fillStyle = c.ink || '#1A1208';
            ctx.fillRect(cx - 4, cy - 4, w + 8, 8);
            ctx.fillRect(cx - 4, cy + h - 4, w + 8, 8);
            ctx.fillStyle = danger;
            ctx.beginPath();
            ctx.arc(cx + w/2, cy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + w/2, cy + h, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    /* ---- Glitch Zone Drawing ---- */
    drawGlitchZone(x, y, w, h, cam, time, interval) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        const glitchCycle = (time / 60) % interval;
        const active = glitchCycle < interval * 0.5;

        if (!active) {
            // Draw faint outline when inactive
            ctx.strokeStyle = 'rgba(100, 200, 200, 0.1)';
            ctx.setLineDash([5, 10]);
            ctx.strokeRect(cx, cy, w, h);
            ctx.setLineDash([]);
            return;
        }

        // Glitch visual effect
        const intensity = 0.3 + Math.sin(time * 0.02) * 0.1;
        ctx.save();
        // Random offset slices
        for (let i = 0; i < 5; i++) {
            const sliceY = cy + (h / 5) * i;
            const offsetX = (Math.random() - 0.5) * 20 * intensity;
            ctx.drawImage(ctx.canvas, cx, sliceY, w, h / 5, cx + offsetX, sliceY, w, h / 5);
        }
        // Color distortion overlay
        ctx.fillStyle = `rgba(0, 255, 255, ${intensity * 0.15})`;
        ctx.fillRect(cx, cy, w, h);
        ctx.fillStyle = `rgba(255, 0, 100, ${intensity * 0.1})`;
        ctx.fillRect(cx + 3, cy, w, h);
        ctx.restore();
    },

    /* ---- Data Virus Projectile Drawing ---- */
    drawProjectile(x, y, w, h, cam, time) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        const theme = this._getTheme();
        const c = theme.palette || {};
        const danger = c.danger || '#C04030';
        const glitchColor = c.accent || '#00FFFF';

        // Draw glitching data orb
        ctx.save();
        // Main body with glitch effect
        const pulse = Math.sin(time * 0.015) * 3;
        ctx.fillStyle = danger;
        ctx.shadowColor = danger;
        ctx.shadowBlur = 10 + pulse;
        ctx.beginPath();
        ctx.arc(cx + w/2, cy + h/2, (w/2 + pulse), 0, Math.PI * 2);
        ctx.fill();
        // Inner core
        ctx.fillStyle = glitchColor;
        ctx.beginPath();
        ctx.arc(cx + w/2 + 2, cy + h/2 - 2, w/4, 0, Math.PI * 2);
        ctx.fill();
        // Digital noise
        ctx.shadowBlur = 0;
        for (let i = 0; i < 4; i++) {
            const nx = cx + w/2 + (Math.random() - 0.5) * w;
            const ny = cy + h/2 + (Math.random() - 0.5) * h;
            ctx.fillStyle = `rgba(0, 255, 255, 0.5)`;
            ctx.fillRect(nx, ny, 3, 3);
        }
        ctx.restore();
    },

    /* ---- Emotion Storm Drawing (Ch5) ---- */
    drawEmotionStorm(x, y, w, h, cam, time, strength, interval) {
        const ctx = this.ctx;
        const cx = x - cam.x, cy = y - cam.y;
        const stormCycle = (time / 60) % interval;
        const active = stormCycle < interval * 0.7;

        if (!active) {
            // Faint outline when inactive
            ctx.strokeStyle = 'rgba(200, 180, 100, 0.1)';
            ctx.setLineDash([8, 12]);
            ctx.strokeRect(cx, cy, w, h);
            ctx.setLineDash([]);
            return;
        }

        const alpha = 0.15 + Math.sin(time * 0.008) * 0.05;
        // Emotion storm - swirling warm colors
        ctx.save();
        // Radial gradient center
        const gradX = cx + w/2;
        const gradY = cy + h/2;
        const gradient = ctx.createRadialGradient(gradX, gradY, 0, gradX, gradY, Math.max(w, h));
        gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(200, 100, 150, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(100, 50, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(cx, cy, w, h);

        // Swirling particles
        for (let i = 0; i < 6; i++) {
            const angle = (time * 0.02 + i * Math.PI / 3) % (Math.PI * 2);
            const dist = 30 + Math.sin(time * 0.01 + i) * 20;
            const px = cx + w/2 + Math.cos(angle) * dist;
            const py = cy + h/2 + Math.sin(angle) * dist;
            ctx.fillStyle = `rgba(255, 220, 150, ${0.3 + Math.sin(time * 0.01 + i) * 0.1})`;
            ctx.beginPath();
            ctx.arc(px, py, 4 + Math.sin(time * 0.02 + i) * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    /* ---- Color Utilities ---- */
    _lighten(hex, amount) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.min(255, r + (255 - r) * amount)},${Math.min(255, g + (255 - g) * amount)},${Math.min(255, b + (255 - b) * amount)})`;
    },

    _darken(hex, amount) {
        let c = hex;
        if (c.startsWith('rgb')) {
            const m = c.match(/\d+/g);
            if (m) return `rgb(${Math.max(0, m[0] * (1 - amount))},${Math.max(0, m[1] * (1 - amount))},${Math.max(0, m[2] * (1 - amount))})`;
        }
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        return `rgb(${Math.max(0, r * (1 - amount))},${Math.max(0, g * (1 - amount))},${Math.max(0, b * (1 - amount))})`;
    },

    _hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    },
};
