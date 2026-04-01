# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based narrative platformer game called **《裂缝》FRACTURE** — a 3D-action-platformer-style game rendered in 2D Canvas with an "AI awakening" story. The game has 5 chapters, 3 endings, and is inspired by Goose Goose Duck's cartoon aesthetic.

**Key reference games**: Inside, Limbo, Control, Celeste, Florence, Mirror's Edge, Goose Goose Duck

---

## Architecture

### Stack
- **Rendering**: HTML5 Canvas 2D (no WebGL)
- **Audio**: Web Audio API synthesis (no external audio files)
- **Structure**: Vanilla JS with module-pattern IIFEs
- **No build step required** — runs directly in browser

### File Structure

```
fracture-game/
├── index.html          # HTML structure, all UI overlays, loads scripts
├── css/style.css       # Styles
└── js/
    ├── config.js        # Constants: CONFIG, MORANDI palette, GAME_STATES, PORTRAIT_COLORS
    ├── engine.js        # Input, Audio, Renderer (core drawing helpers)
    ├── game.js          # Game state machine, Player, World, Dialogue, Puzzle, Choice systems
    ├── story.js         # LevelData (all 5 chapters) + StoryData (endings)
    └── main.js          # Entry point, game loop, title screen animation
```

### Load Order
`config.js` → `engine.js` → `game.js` → `story.js` → `main.js`

### Core Systems

**Game States** (`game.js`): `MENU → CHAPTER_INTRO → PLAYING → DIALOGUE → PUZZLE → CHOICE → CUTSCENE → TRANSITION → ENDING`

**Renderer** (`engine.js`): Canvas context, character drawing (Goose Goose Duck style — fat bean bodies, tiny legs, thick outlines), platform drawing, particle system, background layers with parallax per chapter

**Input** (`engine.js`): Keyboard + mouse + touch (mobile joystick). Exposes: `Input.left/right/jump/interact/roll/scan/enter`

**Audio** (`engine.js`): Web Audio synthesis only — no external audio files. Functions: `playJump()`, `playLand()`, `playDialogue()`, `playSILO()`, `playPuzzleSolve()`, `playEndingA/B/C()`, etc.

**Player** (`game.js`): Position, velocity, collision detection, platform tolerance (wider landing than visual), rolling with invincibility frames, climbing, death/respawn

**World** (`game.js`): Loads level data (platforms, interactables, hazards, triggers, decorations), handles periodic platforms (Ch3), turret hazards (Ch2), shadow entity (Ch4 chase)

**Dialogue System** (`game.js`): Queue-based line-by-line typewriter effect with speaker name/color and portrait

**Puzzle System** (`game.js`): Four puzzle types rendered in overlay divs — `password` (numpad), `circuit` (node grid), `memory` (fragment ordering), `emotion` (Ch5 final puzzle)

**Level Data** (`story.js`): All 5 chapters defined as objects with `width/height`, `playerStart`, `platforms[]`, `interactables[]`, `hazards[]`, `triggers[]`, `decorations[]`. Chapter passwords: Ch1=1114, circuit solution provided in data.

### Chapter Color Palettes (MORANDI)
- Ch1 (抵达): Ice blue `ch1` palette
- Ch2 (深入): Dark red `ch2` palette
- Ch3 (裂缝): Teal/digital `ch3` palette
- Ch4 (追逐): Storm white/gray `ch4` palette
- Ch5 (选择): White/gold `ch5` palette

### Character Visuals (Goose Goose Duck Style)
All characters drawn as "fat bean" shapes with tiny stubby legs, big eyes, beak, blush marks. Defined in `PORTRAIT_COLORS` (config.js) — each character has: `body, eye, beak, feet, hat` colors.

### Controls
- **Desktop**: Arrow keys / WASD move, Space/W jump, Shift roll, E interact, Q scan mode (Ch2+), Enter continue dialogue
- **Mobile**: Virtual joystick + buttons (auto-shown on touch devices)

---

## Running the Game

Open `fracture-game/index.html` directly in a browser. No server required.

---

## Common Development Tasks

### Adding a new chapter
1. Add level data to `story.js` under `LevelData.levels` with key `chX_sY`
2. Define platforms, interactables (with dialogue/puzzles), hazards, triggers
3. Add chapter color palette to `MORANDI` in `config.js` if needed

### Adding a new puzzle type
1. Add render method in `Game` class (`game.js`): `_renderXxxPuzzle()`
2. Call it from `startPuzzle()` based on `puzzleConfig.type`
3. Add solve logic and call `solvePuzzle()` when complete

### Adding new interactable types
1. Add drawing code in `Renderer.drawInteractable()` (`engine.js`)
2. Add trigger logic in `triggerInteraction()` in `game.js`

### Modifying character visuals
Edit `PORTRAIT_COLORS` in `config.js` for character-specific colors.
Edit `Renderer.drawCharacter()` in `engine.js` for drawing logic.

### Modifying physics
- Player gravity/speed/jump: Edit `CONFIG` in `config.js`
- Platform collision tolerance: `CONFIG.PLATFORM_TOLERANCE`
- Roll duration/cooldown: `CONFIG.ROLL_DURATION`, `CONFIG.ROLL_COOLDOWN`

---

## Notes

- Game uses IIFE pattern — no global exports, all state in global namespace
- Canvas resolution: 1280×720 (CONFIG.CANVAS_W/CANVAS_H), auto-scales to viewport
- No external dependencies — pure vanilla JS
- The game saves no persistent state (no localStorage) — all progress lost on refresh
