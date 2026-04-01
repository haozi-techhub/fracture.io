# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**《裂缝》FRACTURE** is a browser-based narrative platformer with hand-drawn/sketch aesthetics. It tells the story of ARIA-7, an AI investigating a mysterious arctic research station. The game features 5 chapters, 3 endings, and a theme-switching system that completely transforms the visual style.

**Key reference games**: Inside, Limbo, Control, Celeste, Goose Goose Duck

## Running the Game

Open `fracture-game/index.html` directly in any modern browser. No server or build step required.

## Architecture

### Stack
- **Rendering**: HTML5 Canvas 2D (no WebGL)
- **Audio**: Web Audio API synthesis (no external audio files)
- **Structure**: Vanilla JS with IIFE module pattern, all state in global namespace
- **No build step** — runs directly in browser

### Script Load Order
`config.js` → `engine.js` → `game.js` → `story.js` → `main.js`

### Core Systems

**Game States** (`game.js`):
`MENU → CHAPTER_INTRO → PLAYING → DIALOGUE → PUZZLE → CHOICE → CUTSCENE → TRANSITION → ENDING`

**Renderer** (`engine.js`): Canvas context, character drawing (Goose Goose Duck style — fat bean bodies, tiny legs, thick outlines), platform drawing, particle system, background layers with parallax per chapter. Uses theme routing via `_getTheme()` to dispatch to theme-specific drawing functions.

**Input** (`engine.js`): Keyboard + mouse + touch (mobile joystick). Exposes: `Input.left/right/jump/interact/roll/scan/enter`

**Audio** (`engine.js`): Web Audio synthesis only — no external audio files. Functions: `playJump()`, `playLand()`, `playDialogue()`, `playSILO()`, `playPuzzleSolve()`, `playEndingA/B/C()`, etc.

**Theme System** (`config.js` + `engine.js`):
- `THEMES` enum: `DOODLE`, `GGG`, `RDR`, `PIXEL`
- `THEME_DEFS` object contains per-theme: `character` (bodyShape, eyeScale, legStyle, etc.), `platform` (edgeStyle, roughness), `background` (paperTexture, scanLines, vignetteStyle), `particles` (shape, dustColor), `palette` (all colors), `chapters` (ch1-ch5 color overrides), `cssClass`
- `getCurrentTheme()` returns current theme definition
- `setTheme(themeId)` switches theme and updates CSS class on game container
- `Renderer._getTheme()` caches current theme; `invalidateThemeCache()` refreshes

### File Structure

```
fracture-game/
├── index.html          # HTML structure, all UI overlays, loads scripts
├── css/style.css       # Styles (includes theme-specific CSS overrides)
└── js/
    ├── config.js        # CONFIG, MORANDI palette, GAME_STATES, PORTRAIT_COLORS, THEMES, THEME_DEFS
    ├── engine.js        # Input, Audio, Renderer (core drawing helpers)
    ├── game.js          # Game state machine, Player, World, Dialogue, Puzzle, Choice systems
    ├── story.js         # LevelData (all 5 chapters) + StoryData (endings)
    └── main.js          # Entry point, game loop, title screen animation, cinematic engine
```

### Character Visuals

All characters drawn as "fat bean" shapes with tiny stubby legs, big eyes, beak, blush marks. Defined in `PORTRAIT_COLORS` (config.js) — each character has: `body, eye, beak, feet, hat` colors.

Character definitions for the cinematic title screen are in `main.js` (`charARIA`, `charChen`, `charSILO`, `charShadow`).

### Controls
- **Desktop**: Arrow keys / WASD move, Space/W jump, Shift roll, E interact, Q scan mode (Ch2+), Enter continue dialogue
- **Mobile**: Virtual joystick + buttons (auto-shown on touch devices)

### Canvas Resolution
1280×720 (CONFIG.CANVAS_W/CANVAS_H), auto-scales to viewport while maintaining aspect ratio.

## Theme System Architecture

Each theme (`THEME_DEFS[key]`) contains:

| Property | Purpose |
|----------|---------|
| `character.bodyShape` | Routed in `drawCharacter_*` methods: `angular` (Doodle), `bean` (GGG), `cowboy` (RDR), `pixelated` (Pixel) |
| `character.eyeScale` | Eye size multiplier (1.4 for GGG, 0.85 for RDR) |
| `character.legStyle` | `stick`, `tiny`, `thick`, `pixel` |
| `platform.edgeStyle` | `sketchy` (Doodle/GGG), `rough` (RDR), `pixelated` (Pixel) |
| `background.usePaperTexture` | `true` for paper texture, `false` for solid + scanlines |
| `background.scanLines` | CRT scanline effect for Pixel theme |
| `particles.shape` | `circle` (default), `pixel` (Pixel) |
| `palette` | Full color set: `bg, sky, accent, gold, ink, paper, danger, etc.` |
| `chapters` | Per-chapter color overrides (`ch1` through `ch5`) |
| `cssClass` | CSS class added to `#game-container` for theme-specific UI styling |

Theme switching applies CSS classes to the container and the Renderer caches theme colors. The `_hexToRgba()` utility in engine.js converts theme hex colors to rgba strings.

## Common Development Tasks

### Adding a new chapter
1. Add level data to `story.js` under `LevelData.levels` with key `chX_sY`
2. Define platforms, interactables (with dialogue/puzzles), hazards, triggers, decorations
3. Add chapter color palette to `MORANDI` in `config.js` if needed

### Adding a new puzzle type
1. Add render method in `Game` class (`game.js`): `_renderXxxPuzzle()`
2. Call it from `startPuzzle()` based on `puzzleConfig.type`
3. Add solve logic and call `solvePuzzle()` when complete

### Adding a new interactable type
1. Add drawing code in `Renderer.drawInteractable()` (`engine.js`)
2. Add trigger logic in `triggerInteraction()` in `game.js`

### Adding a new theme
1. Add entry to `THEMES` enum and `THEME_DEFS` object in `config.js`
2. Add CSS overrides in `style.css` (e.g., `.theme-newtheme #dialogue-box`)
3. If theme has unique character body shape, add `drawCharacter_newshape()` method in engine.js
4. If theme has unique background layer style, add `_drawBgLayer_newstyle()` method in engine.js
