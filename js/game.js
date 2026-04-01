/* ============================================
   《裂缝》FRACTURE - Game Systems
   Player, World, Camera, Entities
   ============================================ */

/* ---- Camera ---- */
const Camera = {
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    shake: 0,

    follow(px, py, worldW, worldH) {
        this.targetX = px - CONFIG.CANVAS_W / 2 + CONFIG.PLAYER_W / 2;
        this.targetY = py - CONFIG.CANVAS_H / 2 + CONFIG.PLAYER_H / 2;
        this.x += (this.targetX - this.x) * CONFIG.CAMERA_LERP;
        this.y += (this.targetY - this.y) * CONFIG.CAMERA_LERP;
        this.x = Math.max(0, Math.min(this.x, worldW - CONFIG.CANVAS_W));
        this.y = Math.max(0, Math.min(this.y, worldH - CONFIG.CANVAS_H));
        if (this.shake > 0) {
            this.x += (Math.random() - 0.5) * this.shake;
            this.y += (Math.random() - 0.5) * this.shake;
            this.shake *= 0.92;
            if (this.shake < 0.3) this.shake = 0;
        }
    },

    shakeScreen(intensity) { this.shake = intensity; },
};

/* ---- Player ---- */
const Player = {
    x: 100, y: 400,
    vx: 0, vy: 0,
    w: CONFIG.PLAYER_W, h: CONFIG.PLAYER_H,
    facing: 1,
    grounded: false,
    animFrame: 0,
    rolling: false,
    rollTimer: 0,
    rollCooldown: 0,
    invincible: false,
    dead: false,
    colors: PORTRAIT_COLORS['ARIA'],
    footstepTimer: 0,
    canClimb: false,
    climbing: false,
    jumpCount: 0,
    jumpBufferTimer: 0,

    reset(x, y) {
        this.x = x || 100;
        this.y = y || 400;
        this.vx = 0; this.vy = 0;
        this.grounded = false;
        this.rolling = false;
        this.rollTimer = 0;
        this.dead = false;
        this.climbing = false;
        this.jumpCount = 0;
        this.jumpBufferTimer = 0;
    },

    update(platforms, hazards) {
        if (this.dead) return;

        // Roll cooldown
        if (this.rollCooldown > 0) this.rollCooldown--;

        // Rolling
        if (this.rolling) {
            this.rollTimer--;
            this.vx = this.facing * CONFIG.ROLL_SPEED;
            this.invincible = true;
            if (this.rollTimer <= 0) {
                this.rolling = false;
                this.invincible = false;
            }
        } else {
            this.invincible = false;

            // Apply cheat invincibility
            if (Game.cheatInvincible) this.invincible = true;

            // Horizontal movement
            const speedMult = Game.cheatSpeed ? 1.6 : 1;
            if (Input.left) {
                this.vx = -CONFIG.PLAYER_SPEED * speedMult;
                this.facing = -1;
            } else if (Input.right) {
                this.vx = CONFIG.PLAYER_SPEED * speedMult;
                this.facing = 1;
            } else {
                this.vx *= 0.7;
                if (Math.abs(this.vx) < 0.2) this.vx = 0;
            }

            // Jump - multi-jump system
            if (Input.jump) {
                this.jumpBufferTimer = CONFIG.PLAYER_JUMP_BUFFER_TIME;
            }

            if (this.jumpBufferTimer > 0) {
                this.jumpBufferTimer--;
                const canJump = this.grounded || this.climbing || (this.jumpCount < CONFIG.PLAYER_MAX_JUMPS);
                if (canJump && this.jumpBufferTimer > 0) {
                    if (this.grounded || this.climbing) {
                        this.vy = CONFIG.PLAYER_JUMP;
                        this.jumpCount = 1;
                    } else {
                        this.vy = CONFIG.PLAYER_AIR_JUMP_VELOCITY;
                        this.jumpCount++;
                        Renderer.addParticle(this.x + this.w / 2, this.y + this.h / 2, 'dust', 6);
                        Audio._tone(600, 0.06, 'sine', 0.08);
                    }
                    this.grounded = false;
                    this.climbing = false;
                    this.jumpBufferTimer = 0;
                    Audio.playJump();
                    Renderer.addParticle(this.x + this.w / 2, this.y + this.h, 'dust', 4);
                }
            }

            // Roll
            if (Input.roll && this.grounded && this.rollCooldown <= 0) {
                this.rolling = true;
                this.rollTimer = CONFIG.ROLL_DURATION;
                this.rollCooldown = CONFIG.ROLL_COOLDOWN;
                Audio.playRoll();
            }
        }

        // Climbing
        if (this.canClimb && !this.rolling) {
            if (Input.jump) {
                this.climbing = true;
            }
            if (this.climbing) {
                this.vy = -2.5;
                if (!Input.keys['KeyW'] && !Input.keys['ArrowUp'] && !Input.keys['Space']) {
                    this.vy = 0;
                }
            }
        } else {
            this.climbing = false;
        }

        // Gravity
        if (!this.climbing) {
            this.vy += CONFIG.GRAVITY;
            if (this.vy > CONFIG.MAX_FALL_SPEED) this.vy = CONFIG.MAX_FALL_SPEED;
        }

        // Horizontal collision
        this.x += this.vx;
        for (const p of platforms) {
            if (p.climbable || p._visible === false) continue;
            if (this._collides(p)) {
                if (this.vx > 0) this.x = p.x - this.w;
                else if (this.vx < 0) this.x = p.x + p.w;
                this.vx = 0;
            }
        }

        // Vertical collision
        this.y += this.vy;
        this.grounded = false;
        this.canClimb = false;

        for (const p of platforms) {
            if (p._visible === false) continue;
            if (p.climbable) {
                if (this.x + this.w > p.x && this.x < p.x + p.w &&
                    this.y + this.h > p.y && this.y < p.y + p.h) {
                    this.canClimb = true;
                }
                continue;
            }
            if (this._collides(p)) {
                if (this.vy > 0) {
                    // Platform tolerance: wider landing
                    const tolerance = p.w * CONFIG.PLATFORM_TOLERANCE;
                    if (this.x + this.w > p.x - tolerance && this.x < p.x + p.w + tolerance) {
                        this.y = p.y - this.h;
                        this.vy = 0;
                        this.grounded = true;
                        this.jumpCount = 0;
                        if (!p._landed) {
                            Audio.playLand();
                            p._landed = true;
                            this._landSquash = 8;
                            Renderer.addParticle(this.x + this.w / 2, this.y + this.h, 'dust', 3);
                            // Trigger collapse platform
                            if (p.collapse && !p._collapsing) {
                                p._collapsing = true;
                                p._collapseTimer = p.collapseDelay || 90;
                                p._shakeOffset = 0;
                            }
                        }
                        // Update collapse platform
                        if (p._collapsing && p._collapseTimer > 0) {
                            p._collapseTimer--;
                            p._shakeOffset = (Math.random() - 0.5) * 4;
                            if (p._collapseTimer <= 0) {
                                p._falling = true;
                                p._fallSpeed = 0;
                            }
                        }
                        if (p._falling) {
                            p._fallSpeed = (p._fallSpeed || 0) + 0.5;
                            p.y += p._fallSpeed;
                            if (p.y > 2000) p._destroyed = true;
                        }
                    }
                } else if (this.vy < 0) {
                    this.y = p.y + p.h;
                    this.vy = 0;
                }
            } else {
                p._landed = false;
            }
        }

        // Wind zone force
        if (hazards) {
            for (const h of hazards) {
                if (h.type === 'wind') {
                    const windCycle = (time / 60) % h.interval;
                    if (windCycle < h.interval * 0.5) { // Wind active 50% of time
                        const inZone = this.x + this.w > h.x && this.x < h.x + h.w &&
                                       this.y + this.h > h.y && this.y < h.y + h.h;
                        if (inZone) {
                            this.vx += h.strength * 0.15;
                            if (this.vx > CONFIG.PLAYER_SPEED * 1.5) this.vx = CONFIG.PLAYER_SPEED * 1.5;
                        }
                    }
                } else if (h.type === 'glitch') {
                    // Glitch zone - deals damage over time when player inside
                    const glitchCycle = (time / 60) % h.interval;
                    if (glitchCycle < h.interval * 0.5) {
                        const inZone = this.x + this.w > h.x && this.x < h.x + h.w &&
                                       this.y + this.h > h.y && this.y < h.y + h.h;
                        if (inZone && !this.invincible) {
                            if (!this._glitchDamageTime || time - this._glitchDamageTime > 30) {
                                this._glitchDamageTime = time;
                                this.takeDamage(h.damage || 1);
                                Camera.shakeScreen(3);
                            }
                        }
                    }
                } else if (h.type === 'projectile') {
                    // Update projectile position
                    if (!h._active || h._spawnTime === undefined) {
                        h._spawnTime = time;
                        h._active = true;
                    }
                    const projCycle = (time / 60) % h.interval;
                    if (projCycle < h.interval * 0.7) {
                        h.x += h.vx;
                        h.y += h.vy;
                        // Reset if off screen
                        if (h.x < -100 || h.y < -100 || h.y > 2000) {
                            h.x = h._origX;
                            h.y = h._origY;
                        }
                    }
                    // Check collision
                    if (!this.invincible && this._overlaps(h)) {
                        this.die();
                    }
                } else if (h.type === 'emotion_storm') {
                    // Emotion storm - pushes player and distorts
                    const stormCycle = (time / 60) % h.interval;
                    if (stormCycle < h.interval * 0.7) {
                        const inZone = this.x + this.w > h.x && this.x < h.x + h.w &&
                                       this.y + this.h > h.y && this.y < h.y + h.h;
                        if (inZone) {
                            this.vx += h.strength * 0.12;
                            if (this.vx > CONFIG.PLAYER_SPEED * 1.3) this.vx = CONFIG.PLAYER_SPEED * 1.3;
                            if (this.vx < -CONFIG.PLAYER_SPEED * 0.5) this.vx = -CONFIG.PLAYER_SPEED * 0.5;
                        }
                    }
                } else if (h.type === 'turret' && h.active) {
                    // Turret beam
                    if (!this.invincible) {
                        const beamRect = { x: h.x - 50, y: (h.y || 0) + (h.h || 24) + 12, w: 130, h: 100 };
                        if (this._overlaps(beamRect)) {
                            this.onHit({ type: 'turret_beam' });
                        }
                    }
                } else if (h.type === 'spike') {
                    // Spikes kill instantly
                    if (!this.invincible && this._overlaps(h)) {
                        this.die();
                    }
                } else if (h.type === 'laser' && h.active) {
                    // Laser damages instantly
                    if (!this.invincible && this._overlaps(h)) {
                        this.die();
                    }
                } else if (h.active !== false && h.type !== 'glitch' && h.type !== 'projectile' && h.type !== 'emotion_storm' && !this.invincible && this._overlaps(h)) {
                    this.onHit(h);
                }
            }
        }

        // Fall death
        if (this.y > 2000) {
            this.die();
        }

        // Animation
        if (Math.abs(this.vx) > 0.5) {
            this.animFrame += 0.15;
            this.footstepTimer++;
            if (this.footstepTimer > 18 && this.grounded) {
                Audio.playFootstep();
                this.footstepTimer = 0;
            }
        } else {
            this.animFrame += 0.03;
            this.footstepTimer = 0;
        }

        // Invincibility countdown
        if (this.invincible && this._invincibleTimer > 0) {
            this._invincibleTimer--;
            if (this._invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    },

    takeDamage(amount) {
        // Give player brief invincibility
        this.invincible = true;
        this._invincibleTimer = 30;
        this.vy = -5;
        Audio.playAlert();
        Renderer.addParticle(this.x + this.w / 2, this.y + this.h / 2, 'spark', 5);
    },

    onHit(hazard) {
        if (hazard.type === 'turret_beam') {
            this.x -= this.facing * 40;
            this.vy = -6;
            Camera.shakeScreen(8);
            Audio.playAlert();
        } else {
            this.die();
        }
    },

    die() {
        this.dead = true;
        this._deathTime = Date.now();
        Camera.shakeScreen(12);
        Audio.playAlert();
        // Death particle burst
        Renderer.addParticle(this.x + this.w / 2, this.y + this.h / 2, 'death', 20);

        // Track deaths and Easter eggs
        Game._deathCount = (Game._deathCount || 0) + 1;
        Game._totalDeaths = (Game._totalDeaths || 0) + 1;

        // Track deaths per platform for RIP markers
        const platKey = `p_${Math.floor(this.x / 100)}_${Math.floor(this.y / 100)}`;
        Game._platformDeaths = Game._platformDeaths || {};
        Game._platformDeaths[platKey] = (Game._platformDeaths[platKey] || 0) + 1;

        // ARIA death comments after every 5 deaths
        if (Game._totalDeaths > 0 && Game._totalDeaths % 5 === 0 && Game.state === GAME_STATES.PLAYING) {
            const comments = [
                '（内心独白）又死了。至少你在尝试。',
                '（内心独白）我数的。这是第' + Game._totalDeaths + '次了。',
                '（内心独白） persistence —— 我学会了这个词。',
                '（内心独白）如果幽影看到我死了这么多次，她会怎么想？',
            ];
            const comment = comments[Math.floor(Game._totalDeaths / 5) % comments.length];
            setTimeout(() => {
                Game.startDialogue([{ speaker: 'ARIA', text: comment }]);
            }, 1200);
        }

        // Respawn after delay with fade
        setTimeout(() => {
            this.reset(Game.currentCheckpoint.x, Game.currentCheckpoint.y);
            this._respawnTime = Date.now();
            Renderer.addParticle(this.x + this.w / 2, this.y, 'spark', 10);
        }, 1000);
    },

    _collides(rect) {
        return this.x + this.w > rect.x && this.x < rect.x + rect.w &&
               this.y + this.h > rect.y && this.y < rect.y + rect.h;
    },

    _overlaps(rect) {
        const margin = 4;
        return this.x + this.w - margin > rect.x && this.x + margin < rect.x + rect.w &&
               this.y + this.h - margin > rect.y && this.y + margin < rect.y + rect.h;
    },

    // Animation state
    _squashTimer: 0,
    _landSquash: 0,
    _jumpStretch: 0,
    _deathTime: 0,
    _respawnTime: 0,
    _interactBounce: 0,

    draw(cam, time) {
        if (this.dead) {
            // Death fade-out animation
            const elapsed = Date.now() - (this._deathTime || 0);
            if (elapsed < 800) {
                const fade = 1 - elapsed / 800;
                const spin = elapsed * 0.01;
                Renderer.ctx.save();
                Renderer.ctx.globalAlpha = fade;
                const cx = this.x - cam.x + this.w / 2;
                const cy = this.y - cam.y + this.h / 2;
                Renderer.ctx.translate(cx, cy);
                Renderer.ctx.rotate(spin);
                Renderer.ctx.scale(1 + elapsed * 0.001, 1 + elapsed * 0.001);
                Renderer.ctx.translate(-cx, -cy);
                Renderer.drawCharacter(
                    this.x, this.y, this.w, this.h,
                    this.colors, this.facing, this.animFrame, cam
                );
                Renderer.ctx.restore();
            }
            return;
        }

        // Respawn glow effect
        const respawnElapsed = Date.now() - (this._respawnTime || 0);
        const hasRespawnGlow = respawnElapsed < 600;

        // Squash/stretch based on vertical velocity
        let scaleX = 1, scaleY = 1;
        if (this.vy < -4) {
            // Jumping: stretch tall, narrow
            scaleX = 0.88;
            scaleY = 1.12;
        } else if (this.vy > 6) {
            // Falling fast: stretch down
            scaleX = 0.92;
            scaleY = 1.08;
        }
        // Land squash (decaying)
        if (this._landSquash > 0) {
            const t = this._landSquash / 8;
            scaleX = 1 + t * 0.15;
            scaleY = 1 - t * 0.12;
            this._landSquash -= 0.5;
        }
        // Interact bounce
        if (this._interactBounce > 0) {
            const t = this._interactBounce / 10;
            scaleY = 1 + Math.sin(t * Math.PI) * 0.08;
            this._interactBounce -= 0.4;
        }

        const drawX = this.x;
        const drawY = this.y;
        const drawW = this.w * scaleX;
        const drawH = this.h * scaleY;
        const offsetX = (this.w - drawW) / 2;
        const offsetY = this.h - drawH;

        Renderer.ctx.save();
        if (this.rolling) {
            Renderer.ctx.globalAlpha = 0.5;
            Renderer.drawCharacter(
                this.x - this.facing * 14, this.y,
                this.w * 1.1, this.h * 0.85, this.colors, this.facing, this.animFrame - 3, cam, true
            );
            Renderer.ctx.globalAlpha = 1.0;
        }
        if (this.invincible && Math.sin(time * 0.02) > 0) {
            Renderer.ctx.globalAlpha = 0.5;
        }

        // Respawn glow
        if (hasRespawnGlow) {
            const glowAlpha = (1 - respawnElapsed / 600) * 0.4;
            const cx = drawX + offsetX - cam.x + drawW / 2;
            const cy = drawY + offsetY - cam.y + drawH / 2;
            const grad = Renderer.ctx.createRadialGradient(cx, cy, 5, cx, cy, 40);
            grad.addColorStop(0, `rgba(245,216,96,${glowAlpha})`);
            grad.addColorStop(1, 'rgba(245,216,96,0)');
            Renderer.ctx.fillStyle = grad;
            Renderer.ctx.beginPath();
            Renderer.ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            Renderer.ctx.fill();
        }

        // Player ambient light effect
        const lightRadius = 80 + Math.sin(time * 0.003) * 10;
        const lightGrad = Renderer.ctx.createRadialGradient(
            drawX + offsetX - cam.x + drawW / 2,
            drawY + offsetY - cam.y + drawH / 2,
            10,
            drawX + offsetX - cam.x + drawW / 2,
            drawY + offsetY - cam.y + drawH / 2,
            lightRadius
        );
        lightGrad.addColorStop(0, 'rgba(245,216,96,0.12)');
        lightGrad.addColorStop(0.5, 'rgba(245,216,96,0.04)');
        lightGrad.addColorStop(1, 'rgba(245,216,96,0)');
        Renderer.ctx.fillStyle = lightGrad;
        Renderer.ctx.beginPath();
        Renderer.ctx.arc(
            drawX + offsetX - cam.x + drawW / 2,
            drawY + offsetY - cam.y + drawH / 2,
            lightRadius, 0, Math.PI * 2
        );
        Renderer.ctx.fill();

        // Interaction radius indicator
        const nearest = World.getNearestInteractable(this.x, this.y);
        if (nearest) {
            const px = this.x + this.w / 2 - cam.x;
            const py = this.y + this.h / 2 - cam.y;
            const dx = (nearest.x + nearest.w / 2) - (this.x + this.w / 2);
            const dy = (nearest.y + nearest.h / 2) - (this.y + this.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            const pulseScale = 1 + Math.sin(time * 0.008) * 0.1;
            const alpha = 0.15 + Math.sin(time * 0.006) * 0.08;
            const ringRadius = 50 * pulseScale;

            let ringColor = 'rgba(245,216,96,';
            if (nearest.type === 'terminal') ringColor = 'rgba(126,184,208,';
            else if (nearest.type === 'door') ringColor = 'rgba(220,100,100,';
            else if (nearest.type === 'note' || nearest.type === 'journal') ringColor = 'rgba(200,190,170,';

            Renderer.ctx.strokeStyle = ringColor + alpha + ')';
            Renderer.ctx.lineWidth = 2;
            Renderer.ctx.setLineDash([4, 4]);
            Renderer.ctx.beginPath();
            Renderer.ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
            Renderer.ctx.stroke();
            Renderer.ctx.setLineDash([]);

            if (dist > 60) {
                const lineAlpha = 0.1 + Math.sin(time * 0.01) * 0.05;
                Renderer.ctx.strokeStyle = ringColor + lineAlpha + ')';
                Renderer.ctx.lineWidth = 1;
                Renderer.ctx.beginPath();
                Renderer.ctx.moveTo(px, py);
                Renderer.ctx.lineTo(px + dx * 0.3, py + dy * 0.3);
                Renderer.ctx.stroke();
            }
        }

        Renderer.drawCharacter(
            drawX + offsetX, drawY + offsetY, drawW, drawH,
            this.colors, this.facing, this.animFrame, cam
        );
        Renderer.ctx.restore();

        // Walking dust particles
        if (this.grounded && Math.abs(this.vx) > 2 && time % 8 === 0) {
            Renderer.addParticle(
                this.x + this.w / 2 - this.facing * 8,
                this.y + this.h,
                'dust', 1
            );
        }
    },
};

/* ---- World / Level System ---- */
const World = {
    platforms: [],
    interactables: [],
    hazards: [],
    triggers: [],
    decorations: [],
    width: 3000,
    height: 1000,
    chapterColors: null,

    load(levelData) {
        this.platforms = (levelData.platforms || []).map(p => ({
            ...p,
            w: p.w || CONFIG.TILE * 4,
            h: p.h || CONFIG.TILE,
            style: p.style || 'normal',
            _landed: false,
            _origY: p.y,
            _visible: true,
        }));
        this.interactables = (levelData.interactables || []).map(o => ({
            ...o,
            w: o.w || 40,
            h: o.h || 40,
            triggered: false,
        }));
        this.hazards = (levelData.hazards || []).map(h => ({
            ...h,
            active: h.active !== undefined ? h.active : true,
        }));
        this.triggers = (levelData.triggers || []).map(t => ({ ...t, fired: false }));
        this.decorations = levelData.decorations || [];
        this.width = levelData.width || 3000;
        this.height = levelData.height || 1000;
    },

    update(time) {
        // Animate hazards
        for (const h of this.hazards) {
            if (h.type === 'turret') {
                // 7 second cycle: 4s scan, 3s pause (easier)
                const cycle = (time / 60) % 7;
                h.active = cycle < 4;
                if (h.active) {
                    h.beamX = h.x + Math.sin(time * 0.008) * 60;
                }
            } else if (h.type === 'collapse') {
                h.active = h._triggered || false;
            } else if (h.type === 'laser') {
                // Laser on/off cycle
                const cycle = (time / 60) % (h.interval || 4);
                h.active = cycle < (h.interval || 4) * 0.5;
            }
        }

        // Periodic platform (Ch3)
        for (const p of this.platforms) {
            if (p.periodic) {
                const cycle = (time / 60) % p.periodic;
                p._visible = cycle < p.periodic * 0.6;
                if (!p._visible) {
                    p.y = -9999;
                } else {
                    p.y = p._origY || p.y;
                }
            }
        }
    },

    draw(cam, time, chapter) {
        // Get theme-aware chapter colors
        const theme = typeof getCurrentTheme === 'function' ? getCurrentTheme() : null;
        let colors;
        if (theme && theme.chapters && theme.chapters['ch' + chapter]) {
            colors = theme.chapters['ch' + chapter];
        } else if (theme && theme.palette) {
            colors = theme.palette;
        } else {
            colors = MORANDI['ch' + chapter] || MORANDI.ch1;
        }

        // Ground
        Renderer.drawRect(0, this.height - 60, this.width, 120, colors.ground, cam);
        Renderer.drawRect(0, this.height - 60, this.width, 3, Renderer._lighten(colors.ground, 0.1), cam);

        // Platforms
        for (const p of this.platforms) {
            if (p._visible === false || p._destroyed) continue;
            const shakeX = p._shakeOffset ? p._shakeOffset : 0;
            const drawX = p.x + shakeX;
            const drawY = p.y;
            // Apply color tint for collapse warning
            const platformColor = p._collapsing ? Renderer._darken(colors.platform, 0.2) : colors.platform;
            Renderer.drawPlatform(drawX, drawY, p.w, p.h, platformColor, cam, p.style);

            // RIP marker for platforms with 3+ deaths
            const platKey = `p_${Math.floor((p.x + p.w/2) / 100)}_${Math.floor((p.y + p.h/2) / 100)}`;
            const platDeaths = Game._platformDeaths ? Game._platformDeaths[platKey] : 0;
            if (platDeaths >= 3) {
                const ctx = Renderer.ctx;
                const screenX = drawX - cam.x + p.w / 2;
                const screenY = drawY - cam.y + p.h / 2;
                ctx.save();
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = 'rgba(180, 60, 60, 0.9)';
                ctx.textAlign = 'center';
                ctx.fillText(`RIP ×${platDeaths}`, screenX, screenY + 5);
                ctx.restore();
            }
        }

        // Decorations
        for (const d of this.decorations) {
            const cx = d.x - cam.x, cy = d.y - cam.y;
            if (cx + 100 < 0 || cx - 100 > CONFIG.CANVAS_W) continue;
            Renderer.ctx.fillStyle = d.color || 'rgba(100,100,100,0.2)';
            if (d.type === 'pillar') {
                Renderer.ctx.fillRect(cx, cy, d.w || 20, d.h || 200);
            } else if (d.type === 'pipe') {
                Renderer.ctx.fillRect(cx, cy, d.w || 200, d.h || 8);
            } else if (d.type === 'light') {
                Renderer.ctx.fillStyle = `rgba(${d.r || 200},${d.g || 180},${d.b || 100},${0.1 + Math.sin(time * 0.003) * 0.05})`;
                Renderer.ctx.beginPath();
                Renderer.ctx.arc(cx, cy, d.radius || 60, 0, Math.PI * 2);
                Renderer.ctx.fill();
            }
        }

        // Interactables
        for (const obj of this.interactables) {
            if (obj.triggered && obj.hideOnTrigger) continue;
            Renderer.drawInteractable(obj.x, obj.y, obj.w, obj.h, obj.type, cam, time);
        }

        // Hazards
        for (const h of this.hazards) {
            if (h.type === 'turret') {
                Renderer.drawTurret(h.x, h.y, h.w || 30, h.h || 24, cam, time, h.active);
            } else if (h.type === 'spike') {
                Renderer.drawSpike(h.x, h.y, h.w || 100, h.h || 30, cam, time);
            } else if (h.type === 'wind') {
                Renderer.drawWindZone(h.x, h.y, h.w || 200, h.h || 400, cam, time, h.strength || 2.5, h.interval || 5);
            } else if (h.type === 'laser') {
                Renderer.drawLaser(h.x, h.y, h.w || 20, h.h || 250, cam, time, h.active);
            } else if (h.type === 'glitch') {
                Renderer.drawGlitchZone(h.x, h.y, h.w || 200, h.h || 300, cam, time, h.interval || 3);
            } else if (h.type === 'projectile') {
                Renderer.drawProjectile(h.x, h.y, h.w || 20, h.h || 20, cam, time);
            } else if (h.type === 'emotion_storm') {
                Renderer.drawEmotionStorm(h.x, h.y, h.w || 300, h.h || 500, cam, time, h.strength || 1.5, h.interval || 4);
            }
        }
    },

    getNearestInteractable(px, py) {
        let nearest = null;
        let minDist = 80;
        for (const obj of this.interactables) {
            if (obj.triggered && !obj.repeatable) continue;
            const dx = (obj.x + obj.w / 2) - (px + Player.w / 2);
            const dy = (obj.y + obj.h / 2) - (py + Player.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = obj;
            }
        }
        return nearest;
    },

    checkTriggers(px, py) {
        for (const t of this.triggers) {
            if (t.fired) continue;
            if (px + Player.w > t.x && px < t.x + (t.w || 40) &&
                py + Player.h > t.y && py < t.y + (t.h || 40)) {
                t.fired = true;
                return t;
            }
        }
        return null;
    },
};

/* ---- Main Game State ---- */
const Game = {
    state: GAME_STATES.MENU,
    chapter: 1,
    scene: 1,
    time: 0,
    currentCheckpoint: { x: 100, y: 400 },
    flags: {},
    hintsRemaining: 3,
    scanUnlocked: false,
    scanActive: false,
    memoryReplayUnlocked: false,
    emotionModuleKept: true,
    ending: null,
    dialogueQueue: [],
    currentDialogue: null,
    dialogueCharIndex: 0,
    dialogueTimer: 0,
    puzzleData: null,
    _currentInteractable: null,
    choiceData: null,
    transitionCallback: null,
    // Cheat code states
    cheatInvincible: false,
    cheatSpeed: false,
    cheatAllEndings: false,
    cheatActivated: {},
    chapterIntroTimer: 0,
    snowTimer: 0,
    ambientSound: null,

    init() {
        this.state = GAME_STATES.MENU;
        document.getElementById('title-screen').classList.add('active');
    },

    startGame() {
        Audio.resume();
        this.chapter = 1;
        this.scene = 1;
        this.flags = {};
        this.scanUnlocked = false;
        this.memoryReplayUnlocked = false;
        this.emotionModuleKept = true;
        this.hintsRemaining = 3;

        // Randomize character colors
        const newColors = randomizeCharacterColors();
        Object.assign(PORTRAIT_COLORS, newColors);
        // Also update cinematic character colors in main.js
        if (typeof updateCinematicColors === 'function') {
            updateCinematicColors(newColors);
        }

        this.transition(() => {
            document.getElementById('title-screen').classList.remove('active');
            this.showChapterIntro(1, '抵达', '研究站外部入口 · 暴风雪夜 · 冰封走廊', () => {
                this.loadScene(1, 1);
                Audio.playChapterStart();
            });
        });
    },

    showChapterIntro(num, name, desc, callback) {
        const card = document.getElementById('chapter-card');
        document.getElementById('chapter-card-number').textContent = `第${['一','二','三','四','五'][num-1]}章`;
        document.getElementById('chapter-card-name').textContent = name;
        document.getElementById('chapter-card-desc').textContent = desc;
        card.classList.add('active');
        this.state = GAME_STATES.CHAPTER_INTRO;
        this.chapterIntroTimer = 180;
        this._chapterIntroCallback = callback;
    },

    loadScene(chapter, scene) {
        this.chapter = chapter;
        this.scene = scene;
        this.state = GAME_STATES.PLAYING;

        const levelData = LevelData.get(chapter, scene);
        World.load(levelData);
        Player.reset(levelData.playerStart?.x || 100, levelData.playerStart?.y || 400);
        this.currentCheckpoint = { ...levelData.playerStart || { x: 100, y: 400 } };

        // Apply chapter-specific theme class
        const container = document.getElementById('game-container');
        container.classList.remove('ch1', 'ch2', 'ch3', 'ch4', 'ch5');
        container.classList.add('ch' + chapter);

        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('hud-chapter').textContent =
            `第${['一','二','三','四','五'][chapter-1]}章 · ${['抵达','深入','裂缝','追逐','选择'][chapter-1]}`;

        // Start chapter-specific ambient sound
        Audio.startAmbient(chapter);
    },

    update() {
        this.time++;

        switch (this.state) {
            case GAME_STATES.MENU:
                break;

            case GAME_STATES.CHAPTER_INTRO:
                this.chapterIntroTimer--;
                if (this.chapterIntroTimer <= 0 || Input.enter) {
                    document.getElementById('chapter-card').classList.remove('active');
                    if (this._chapterIntroCallback) this._chapterIntroCallback();
                }
                break;

            case GAME_STATES.PLAYING:
                this._updatePlaying();
                break;

            case GAME_STATES.DIALOGUE:
                if (Input.escape) {
                    this.skipDialogue();
                } else {
                    this._updateDialogue();
                }
                break;

            case GAME_STATES.PUZZLE:
                if (Input.escape) this.exitPuzzle();
                break;

            case GAME_STATES.CHOICE:
                break;

            case GAME_STATES.CUTSCENE:
                break;

            case GAME_STATES.TRANSITION:
                break;

            case GAME_STATES.ENDING:
                // Allow particles to continue during ending
                if (this.chapter === 5) {
                    if (this.time % 12 === 0) {
                        Renderer.addParticle(
                            Camera.x + Math.random() * CONFIG.CANVAS_W,
                            Camera.y + Math.random() * CONFIG.CANVAS_H,
                            'spark'
                        );
                    }
                }
                break;
        }

        // Check cheat codes (only in menu or playing states)
        if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.PLAYING) {
            this._checkCheatCodes();
        }
    },

    _checkCheatCodes() {
        // Konami Code: ↑↑↓↓←→←→BA
        if (!this.cheatActivated.konami && Input.checkCheat(Input.CHEAT_KONAMI)) {
            this.cheatActivated.konami = true;
            this.cheatAllEndings = true;
            this.showSystemMessage('秘技激活：全结局已解锁！', 4000);
            Audio.playPuzzleSolve();
            Renderer.addParticle(400, 300, 'spark', 20);
            Input.clearCheatBuffer();
        }
        // IDDQD: ↑↓←→ABAB (invincibility)
        if (!this.cheatActivated.iddqd && Input.checkCheat(Input.CHEAT_IDDQD)) {
            this.cheatActivated.iddqd = true;
            this.cheatInvincible = !this.cheatInvincible;
            Player.invincible = this.cheatInvincible;
            this.showSystemMessage(this.cheatInvincible ? '秘技激活：无敌模式 ON' : '秘技关闭：无敌模式 OFF', 3000);
            Audio.playPuzzleSolve();
            Input.clearCheatBuffer();
        }
        // Showpeed: ←←▼▼ (speed boost)
        if (!this.cheatActivated.showpeed && Input.checkCheat(Input.CHEAT_SHOWPEED)) {
            this.cheatActivated.showpeed = true;
            this.cheatSpeed = !this.cheatSpeed;
            this.showSystemMessage(this.cheatSpeed ? '秘技激活：加速模式 ON' : '秘技关闭：加速模式 OFF', 3000);
            Audio.playPuzzleSolve();
            Input.clearCheatBuffer();
        }
    },

    // Shadow entity for Chapter 4 chase
    shadowEntity: null,
    shadowMinions: [],

    spawnShadow(x, y) {
        this.shadowEntity = { x, y, vx: 0, facing: -1, animFrame: 0 };
    },

    spawnShadowMinion(x, y) {
        this.shadowMinions.push({ x, y, vx: 0, facing: -1, animFrame: 0, alive: true });
    },

    updateShadow() {
        if (!this.shadowEntity) return;
        const s = this.shadowEntity;
        const dx = Player.x - s.x;
        s.facing = dx > 0 ? 1 : -1;
        s.vx = Math.sign(dx) * 2.5;
        s.x += s.vx;
        s.animFrame += 0.12;

        // Update shadow minions
        for (const m of this.shadowMinions) {
            if (!m.alive) continue;
            const dx = Player.x - m.x;
            m.facing = dx > 0 ? 1 : -1;
            m.vx = Math.sign(dx) * 2;
            m.x += m.vx;
            m.animFrame += 0.1;
            // Kill player on contact
            if (Player.x + Player.w > m.x && Player.x < m.x + CONFIG.PLAYER_W &&
                Player.y + Player.h > m.y && Player.y < m.y + CONFIG.PLAYER_H) {
                Player.die();
            }
        }
    },

    drawShadow(cam, time) {
        if (!this.shadowEntity) return;
        const s = this.shadowEntity;
        Renderer.drawCharacter(
            s.x, s.y, CONFIG.PLAYER_W, CONFIG.PLAYER_H,
            PORTRAIT_COLORS['幽影'], s.facing, s.animFrame, cam, true
        );
    },

    drawShadowMinions(cam, time) {
        for (const m of this.shadowMinions) {
            if (!m.alive) continue;
            Renderer.drawCharacter(
                m.x, m.y, CONFIG.PLAYER_W * 0.7, CONFIG.PLAYER_H * 0.7,
                PORTRAIT_COLORS['幽影'], m.facing, m.animFrame, cam, true
            );
        }
    },

    _updatePlaying() {
        Player.update(World.platforms, World.hazards);
        World.update(this.time);
        Camera.follow(Player.x, Player.y, World.width, World.height);
        if (this.chapter === 4 && this.shadowEntity) this.updateShadow();

        // Shadow minion spawning during chase
        if (this.chapter === 4 && this.shadowEntity && World.hazards) {
            for (const h of World.hazards) {
                if (h.type === 'shadow_minion' && !h._spawned) {
                    if (this.time > (h.spawnTime || 180)) {
                        this.spawnShadowMinion(h.x, h.y);
                        h._spawned = true;
                    }
                }
                // Chase-triggered collapse platforms
                if (h.chaseTrigger && !h._collapsing && Player.x > h.x - 200) {
                    h._collapsing = true;
                    h._collapseTimer = h.collapseDelay || 90;
                    h._shakeOffset = 0;
                }
            }
        }

        // Snow/weather particles
        if (this.chapter === 1 || this.chapter === 4) {
            this.snowTimer++;
            if (this.snowTimer % 3 === 0) {
                Renderer.addParticle(
                    Camera.x + Math.random() * CONFIG.CANVAS_W,
                    Camera.y - 10,
                    'snow'
                );
            }
        }
        if (this.chapter === 3) {
            if (this.time % 8 === 0) {
                Renderer.addParticle(
                    Camera.x + Math.random() * CONFIG.CANVAS_W,
                    Camera.y + Math.random() * CONFIG.CANVAS_H,
                    'data'
                );
            }
        }

        // Scan mode
        if (this.scanUnlocked && Input.scan) {
            this.scanActive = true;
        } else {
            this.scanActive = false;
        }

        // Interaction check
        const nearest = World.getNearestInteractable(Player.x, Player.y);
        const prompt = document.getElementById('interact-prompt');
        const label = document.getElementById('interact-label');
        if (nearest && !nearest.triggered) {
            prompt.classList.remove('hidden');

            const dx = (nearest.x + nearest.w / 2) - (Player.x + Player.w / 2);
            const dy = (nearest.y + nearest.h / 2) - (Player.y + Player.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const scale = Math.max(0.8, Math.min(1.2, 1 - (dist - 40) / 100));
            prompt.style.transform = `scale(${scale})`;

            let promptColor = '#F5D860';
            if (nearest.type === 'terminal') promptColor = '#7EB8D0';
            else if (nearest.type === 'door') promptColor = '#DC6464';
            else if (nearest.type === 'note' || nearest.type === 'journal') promptColor = '#C8BEA0';
            prompt.style.borderColor = promptColor;

            const keyHint = navigator.maxTouchPoints > 0 ? '[TAP]' : '[E]';
            label.textContent = `${keyHint} ${nearest.label || '调查'}`;

            if (Input.interact) {
                this.triggerInteraction(nearest);
                Camera.shakeScreen(2);
            }
        } else {
            prompt.classList.add('hidden');
        }

        // Trigger zones
        const trigger = World.checkTriggers(Player.x, Player.y);
        if (trigger) {
            this.executeTrigger(trigger);
        }

        // SILO idle wave - after 30 seconds of no movement in playing state
        if (this.state === GAME_STATES.PLAYING && !this._siloWaveShown) {
            const isMoving = Input.left || Input.right || Input.jump || Input.interact;
            if (isMoving) {
                this._lastActivityTime = Date.now();
            } else {
                const idleTime = (Date.now() - (this._lastActivityTime || Date.now())) / 1000;
                if (idleTime > 30) {
                    this._siloWaveShown = true;
                    this.startDialogue([
                        { speaker: 'SILO', text: '（向玩家挥手）……你还在吗？看起来你已经站在那里很久了。' },
                    ]);
                }
            }
        }
    },

    triggerInteraction(obj) {
        obj.triggered = true;
        this._currentInteractable = obj;
        Audio.playInteract();
        Player._interactBounce = 10;
        Renderer.addParticle(obj.x + (obj.w || 40) / 2, obj.y, 'interact', 8);

        if (obj.dialogue) {
            this.startDialogue(obj.dialogue);
        }
        if (obj.puzzle) {
            this.startPuzzle(obj.puzzle);
        }
        if (obj.action) {
            obj.action();
        }
        if (obj.flag) {
            this.flags[obj.flag] = true;
            // Track secret discoveries
            if (obj.flag.includes('secret') || obj.flag.includes('hint')) {
                Game._secretsFound = (Game._secretsFound || 0) + 1;
                if (Game._secretsFound >= 5) {
                    Game._allSecretsFound = true;
                }
            }
        }
    },

    executeTrigger(trigger) {
        if (trigger.dialogue) {
            this.startDialogue(trigger.dialogue);
        }
        if (trigger.action) {
            trigger.action();
        }
        if (trigger.nextScene) {
            this.transitionToScene(trigger.nextScene.chapter, trigger.nextScene.scene);
        }
        if (trigger.flag) {
            this.flags[trigger.flag] = true;
        }
    },

    /* ---- Dialogue System ---- */
    startDialogue(lines) {
        if (!lines || lines.length === 0) return;
        this.state = GAME_STATES.DIALOGUE;
        this.dialogueQueue = [...lines];
        this._showNextLine();
    },

    _showNextLine() {
        if (this.dialogueQueue.length === 0) {
            this._endDialogue();
            return;
        }
        this.currentDialogue = this.dialogueQueue.shift();
        this.dialogueCharIndex = 0;
        this.dialogueTimer = 0;

        const box = document.getElementById('dialogue-box');
        const speaker = document.getElementById('dialogue-speaker');
        const text = document.getElementById('dialogue-text');
        const portrait = document.getElementById('dialogue-portrait');

        box.classList.remove('hidden');
        speaker.textContent = this.currentDialogue.speaker || '';
        speaker.style.color = SPEAKER_COLORS[this.currentDialogue.speaker] || (typeof getCurrentTheme === 'function' && getCurrentTheme().palette ? getCurrentTheme().palette.text : MORANDI.text);
        text.textContent = '';

        // Show skip button
        const skipBtn = document.getElementById('dialogue-skip-btn');
        if (skipBtn) {
            skipBtn.style.display = 'block';
            skipBtn.onclick = () => this.skipDialogue();
        }

        const pColors = PORTRAIT_COLORS[this.currentDialogue.speaker];
        if (pColors) {
            portrait.style.background = `radial-gradient(circle at 35% 35%, ${this._lightenCSS(pColors.body, 0.25)}, ${pColors.body})`;
            portrait.style.borderColor = pColors.body;
            portrait.style.display = 'block';
        } else {
            portrait.style.background = 'rgba(100,100,100,0.3)';
        }

        if (this.currentDialogue.speaker === 'SILO') Audio.playSILO();
    },

    _updateDialogue() {
        if (!this.currentDialogue) return;
        const fullText = this.currentDialogue.text;
        this.dialogueTimer++;

        if (this.dialogueCharIndex < fullText.length) {
            const speed = this.currentDialogue.speed || CONFIG.DIALOGUE_SPEED;
            if (this.dialogueTimer % Math.max(1, Math.floor(speed / 16)) === 0) {
                this.dialogueCharIndex++;
                document.getElementById('dialogue-text').textContent = fullText.substring(0, this.dialogueCharIndex);
                if (this.dialogueCharIndex % 3 === 0) Audio.playDialogue();
            }
        }

        if (Input.enter) {
            if (this.dialogueCharIndex < fullText.length) {
                this.dialogueCharIndex = fullText.length;
                document.getElementById('dialogue-text').textContent = fullText;
            } else {
                if (this.currentDialogue.onEnd) this.currentDialogue.onEnd();
                this._showNextLine();
            }
        }
    },

    _endDialogue() {
        this.currentDialogue = null;
        document.getElementById('dialogue-box').classList.add('hidden');
        const skipBtn = document.getElementById('dialogue-skip-btn');
        if (skipBtn) skipBtn.style.display = 'none';
        if (this.state === GAME_STATES.DIALOGUE) {
            this.state = this.ending ? GAME_STATES.ENDING : GAME_STATES.PLAYING;
        }
    },

    skipDialogue() {
        // Execute onEnd of the last queued line to preserve scene transitions
        const lastLine = this.dialogueQueue.length > 0
            ? this.dialogueQueue[this.dialogueQueue.length - 1]
            : this.currentDialogue;
        if (lastLine && lastLine.onEnd) lastLine.onEnd();
        this.dialogueQueue = [];
        this._endDialogue();
    },

    /* ---- Puzzle System ---- */
    startPuzzle(puzzleConfig) {
        this.state = GAME_STATES.PUZZLE;
        this.puzzleData = puzzleConfig;
        const overlay = document.getElementById('puzzle-overlay');
        const title = document.getElementById('puzzle-title');
        const content = document.getElementById('puzzle-content');
        const hint = document.getElementById('puzzle-hint');

        overlay.classList.remove('hidden');
        title.textContent = puzzleConfig.title;
        hint.textContent = puzzleConfig.hint || '';

        // Add exit button
        let exitBtn = document.getElementById('puzzle-exit-btn');
        if (!exitBtn) {
            exitBtn = document.createElement('button');
            exitBtn.id = 'puzzle-exit-btn';
            exitBtn.className = 'puzzle-exit-btn';
            exitBtn.textContent = '✕ 退出';
            exitBtn.addEventListener('click', () => this.exitPuzzle());
            document.getElementById('puzzle-container').appendChild(exitBtn);
        }
        exitBtn.style.display = 'block';

        if (puzzleConfig.type === 'password') {
            this._renderPasswordPuzzle(content, puzzleConfig);
        } else if (puzzleConfig.type === 'circuit') {
            this._renderCircuitPuzzle(content, puzzleConfig);
        } else if (puzzleConfig.type === 'memory') {
            this._renderMemoryPuzzle(content, puzzleConfig);
        } else if (puzzleConfig.type === 'emotion') {
            this._renderEmotionPuzzle(content, puzzleConfig);
        }
    },

    _renderPasswordPuzzle(container, config) {
        let input = '';
        const answer = config.answer;
        container.innerHTML = `
            <div class="password-display" id="pwd-display">____</div>
            <div class="numpad">
                ${[1,2,3,4,5,6,7,8,9].map(n =>
                    `<button class="numpad-btn" data-num="${n}">${n}</button>`
                ).join('')}
                <button class="numpad-btn action" data-num="clear">清除</button>
                <button class="numpad-btn" data-num="0">0</button>
                <button class="numpad-btn action" data-num="enter">确认</button>
            </div>
        `;
        container.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.num;
                if (val === 'clear') {
                    input = '';
                } else if (val === 'enter') {
                    if (input === answer) {
                        this.solvePuzzle();
                    } else {
                        Camera.shakeScreen(5);
                        Audio.playAlert();
                        input = '';
                    }
                } else if (input.length < 4) {
                    input += val;
                    Audio.playInteract();
                }
                document.getElementById('pwd-display').textContent =
                    input.padEnd(4, '_').split('').join(' ');
            });
        });
    },

    _renderCircuitPuzzle(container, config) {
        const size = config.size || 4;
        const solution = config.solution;
        let state = new Array(size * size).fill(false);
        if (config.sources) config.sources.forEach(i => state[i] = true);

        // Calculate hint path for visual guide
        const hintPath = [];
        const pathNodes = [0, 1, 5, 9, 10, 14, 15]; // The solution path
        for (let i = 0; i < pathNodes.length - 1; i++) {
            const from = pathNodes[i];
            const to = pathNodes[i + 1];
            const fromRow = Math.floor(from / size);
            const fromCol = from % size;
            const toRow = Math.floor(to / size);
            const toCol = to % size;
            hintPath.push({ fromRow, fromCol, toRow, toCol });
        }

        container.innerHTML = `
            <div class="circuit-hint-text">提示：从左上（金色）出发，依次连接：右→下→下→右→下→右→到达右下（红色）</div>
            <div class="circuit-grid" style="grid-template-columns: repeat(${size}, 48px);" id="circuit-grid">
                ${state.map((s, i) => {
                    const cls = config.sources?.includes(i) ? 'source' :
                                config.targets?.includes(i) ? 'target' : '';
                    return `<div class="circuit-node ${cls} ${s ? 'active' : ''}" data-idx="${i}"></div>`;
                }).join('')}
            </div>
            <div class="circuit-path-hint" id="circuit-path-hint">
                <svg width="${size * 48}" height="${size * 48}" style="position:absolute;pointer-events:none;opacity:0.2">
                    ${hintPath.map(p => {
                        const x1 = p.fromCol * 48 + 24;
                        const y1 = p.fromRow * 48 + 24;
                        const x2 = p.toCol * 48 + 24;
                        const y2 = p.toRow * 48 + 24;
                        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7EFFD4" stroke-width="4" stroke-linecap="round"/>`;
                    }).join('')}
                </svg>
            </div>
        `;
        container.querySelectorAll('.circuit-node').forEach(node => {
            node.addEventListener('click', () => {
                const idx = parseInt(node.dataset.idx);
                if (config.sources?.includes(idx)) return;
                state[idx] = !state[idx];
                node.classList.toggle('active');
                Audio.playInteract();
                // Check solution
                const correct = solution.every((v, i) => state[i] === v);
                if (correct) this.solvePuzzle();
            });
        });
    },

    _renderMemoryPuzzle(container, config) {
        const pieces = config.pieces;
        const order = config.order;
        let placed = [];
        let selectedPiece = null;

        const render = () => {
            container.innerHTML = `
                <div class="memory-slots">
                    ${order.map((_, i) => `
                        <div class="memory-slot ${placed[i] ? 'filled' : ''}" data-slot="${i}">
                            ${placed[i] ? placed[i] : `${i + 1}`}
                        </div>
                    `).join('')}
                </div>
                <div class="memory-pieces">
                    ${pieces.filter(p => !placed.includes(p)).map(p => `
                        <div class="memory-piece ${selectedPiece === p ? 'selected' : ''}" data-piece="${p}">${p}</div>
                    `).join('')}
                </div>
            `;
            container.querySelectorAll('.memory-piece').forEach(el => {
                el.addEventListener('click', () => {
                    selectedPiece = el.dataset.piece;
                    Audio.playInteract();
                    render();
                });
            });
            container.querySelectorAll('.memory-slot').forEach(el => {
                el.addEventListener('click', () => {
                    if (selectedPiece && !placed[el.dataset.slot]) {
                        placed[parseInt(el.dataset.slot)] = selectedPiece;
                        selectedPiece = null;
                        Audio.playInteract();
                        render();
                        if (placed.length === order.length && placed.every((p, i) => p === order[i])) {
                            setTimeout(() => this.solvePuzzle(), 400);
                        }
                    }
                });
            });
        };
        render();
    },

    _renderEmotionPuzzle(container, config) {
        const emotions = config.emotions;
        const answer = config.answer;
        let placed = [];
        let selectedEmotion = null;

        const render = () => {
            container.innerHTML = `
                <div class="emotion-slots">
                    ${answer.map((_, i) => `
                        <div class="emotion-slot ${placed[i] ? 'filled' : ''}" data-slot="${i}" data-order="${i + 1}">
                            ${placed[i] || '?'}
                        </div>
                    `).join('')}
                </div>
                <div class="memory-pieces" style="margin-top:20px">
                    ${emotions.filter(e => !placed.includes(e)).map(e => `
                        <div class="emotion-piece ${selectedEmotion === e ? 'selected' : ''}" data-emotion="${e}">${e}</div>
                    `).join('')}
                </div>
            `;
            container.querySelectorAll('.emotion-piece').forEach(el => {
                el.addEventListener('click', () => {
                    selectedEmotion = el.dataset.emotion;
                    Audio.playInteract();
                    render();
                });
            });
            container.querySelectorAll('.emotion-slot').forEach(el => {
                el.addEventListener('click', () => {
                    const idx = parseInt(el.dataset.slot);
                    if (selectedEmotion && !placed[idx]) {
                        placed[idx] = selectedEmotion;
                        selectedEmotion = null;
                        Audio.playInteract();
                        render();
                        if (placed.filter(Boolean).length === answer.length) {
                            if (placed.every((e, i) => e === answer[i])) {
                                setTimeout(() => this.solvePuzzle(), 400);
                            } else {
                                Camera.shakeScreen(5);
                                Audio.playAlert();
                                placed = [];
                                setTimeout(() => render(), 300);
                            }
                        }
                    }
                });
            });
        };
        render();
    },

    solvePuzzle() {
        Audio.playPuzzleSolve();
        Renderer.addParticle(Player.x, Player.y - 20, 'spark', 15);
        document.getElementById('puzzle-overlay').classList.add('hidden');
        this.state = GAME_STATES.PLAYING;
        this._currentInteractable = null;
        if (this.puzzleData?.onSolve) {
            this.puzzleData.onSolve();
        }
        this.puzzleData = null;
    },

    exitPuzzle() {
        document.getElementById('puzzle-overlay').classList.add('hidden');
        this.state = GAME_STATES.PLAYING;
        // Allow re-interaction since puzzle was not solved
        if (this._currentInteractable) {
            this._currentInteractable.triggered = false;
            this._currentInteractable = null;
        }
        this.puzzleData = null;
    },

    /* ---- Choice System ---- */
    showChoice(config) {
        this.state = GAME_STATES.CHOICE;
        this.choiceData = config;
        const panel = document.getElementById('choice-panel');
        const titleEl = document.getElementById('choice-title');
        const optionsEl = document.getElementById('choice-options');
        panel.classList.remove('hidden');
        titleEl.textContent = config.title || '';
        optionsEl.innerHTML = '';
        config.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => {
                panel.classList.add('hidden');
                Audio.playInteract();
                if (opt.flag) this.flags[opt.flag] = true;
                const prevState = this.state;
                if (opt.action) opt.action();
                if (this.state === prevState || this.state === GAME_STATES.CHOICE) {
                    this.state = GAME_STATES.PLAYING;
                }
            });
            optionsEl.appendChild(btn);
        });
    },

    /* ---- Transition System ---- */
    transition(callback, duration = 800) {
        const el = document.getElementById('transition');
        el.classList.add('active');
        this.state = GAME_STATES.TRANSITION;
        setTimeout(() => {
            if (callback) callback();
            setTimeout(() => {
                el.classList.remove('active');
                if (this.state === GAME_STATES.TRANSITION) {
                    this.state = GAME_STATES.PLAYING;
                }
            }, duration);
        }, duration);
    },

    transitionToScene(chapter, scene) {
        this.transition(() => {
            if (chapter !== this.chapter) {
                const names = ['抵达','深入','裂缝','追逐','选择'];
                const descs = [
                    '研究站外部入口 · 暴风雪夜 · 冰封走廊',
                    '实验室内部 · 间歇断电 · 红色应急灯',
                    '数据中心核心区 · 现实与数字空间交叠',
                    '顶层控制室 + 屋顶 · 暴风雪追逐战',
                    '意识空间 · 抽象纯白极简世界'
                ];
                this.showChapterIntro(chapter, names[chapter-1], descs[chapter-1], () => {
                    this.loadScene(chapter, scene);
                    Audio.playChapterStart();
                });
            } else {
                this.loadScene(chapter, scene);
            }
        });
    },

    showSystemMessage(text, duration = 3000) {
        const el = document.getElementById('system-message');
        document.getElementById('system-message-text').textContent = text;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), duration);
    },

    showEnding(endingId) {
        this.ending = endingId;
        this.state = GAME_STATES.ENDING;
        const endings = StoryData.endings[endingId];
        if (!endings) return;

        if (endingId === 'A') Audio.playEndingA();
        else if (endingId === 'B') Audio.playEndingB();
        else Audio.playEndingC();

        this.transition(() => {
            document.getElementById('hud').classList.add('hidden');
            this.startDialogue(endings.dialogue);
        });
    },

    /* ---- Render ---- */
    renderTitle: null,

    render() {
        // Get theme-aware background color for clear
        const theme = typeof getCurrentTheme === 'function' ? getCurrentTheme() : null;
        let clearColor = MORANDI.darkAlt;
        if (theme) {
            clearColor = theme.palette ? (theme.palette.bg || theme.palette.darkAlt || MORANDI.darkAlt) : MORANDI.darkAlt;
        }

        if (this.state === GAME_STATES.MENU) {
            if (typeof this.renderTitle === 'function') this.renderTitle();
            else Renderer.clear(clearColor);
            return;
        }
        if (this.state === GAME_STATES.CHAPTER_INTRO || this.state === GAME_STATES.TRANSITION) {
            Renderer.clear(clearColor);
            return;
        }

        // Background
        Renderer.drawBackground(this.chapter, Camera, this.time);

        // World
        World.draw(Camera, this.time, this.chapter);

        // Shadow entity (Ch4)
        if (this.chapter === 4) this.drawShadow(Camera, this.time);
        if (this.chapter === 4) this.drawShadowMinions(Camera, this.time);

        // Player
        Player.draw(Camera, this.time);

        // Particles
        Renderer.updateAndDrawParticles(Camera);

        // Chapter-specific effects
        if (this.chapter === 3) {
            Renderer.drawGlitchEffect(this.time);
        }
        if (this.scanActive) {
            Renderer.drawScanOverlay(this.time, this.chapter);
        }

        // Vignette
        Renderer.drawVignette();

        // Ending screen text
        if (this.state === GAME_STATES.ENDING) {
            this._drawEndingScreen();
        }
    },

    _drawEndingScreen() {
        const ctx = Renderer.ctx;
        ctx.fillStyle = 'rgba(26,29,33,0.6)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    },

    _lightenCSS(hex, amount) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.min(255, r + (255 - r) * amount)},${Math.min(255, g + (255 - g) * amount)},${Math.min(255, b + (255 - b) * amount)})`;
    },
};
