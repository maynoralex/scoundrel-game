# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scoundrel is a static web application implementing a solo dungeon-crawl card game. The project uses vanilla JavaScript (ES6 modules), HTML5, and modern CSS with no external dependencies or build tools. It runs entirely in the browser.

## Running the Project

Simply open `index.html` in a web browser. No build step or local server required.

For development with live reload, you can use:
```bash
python -m http.server 8000
# or
npx http-server
```

## Architecture

### File Structure
- **index.html** - Main HTML structure, layout, and semantic markup
- **styles.css** - All styling, CSS variables, animations, and responsive design
- **game.js** - Core game logic module (exports `Game` class)
- **ui.js** - UI controller module (imports `Game`, handles DOM and interactions)

### Module System
The project uses ES6 modules with `type="module"` script tags. Key exports:
- `game.js` exports: `Game` class, `getCardType()`, `SUITS` constant
- `ui.js` is the entry point and has no exports (handles initialization)

### Game Logic Architecture (game.js)

**State Management:**
- Game state is encapsulated in the `Game` class
- Immutable game rules are enforced at the model level
- All state changes happen through method calls, not direct property mutation

**Key Rules Enforced:**
1. **Non-increasing weapon rule** - Weapon can only fight monsters ≤ last defeated value
2. **One potion per room** - Only first potion in a room provides healing
3. **Avoid restriction** - Cannot avoid room twice consecutively
4. **Carried card** - 4th unselected card carries to next room

**Deck System:**
- 44-card deck: 26 monsters (♣♠), 9 weapons (♦), 9 potions (♥)
- Fisher-Yates shuffle with optional seed for reproducible games
- Seed stored for "Restart" functionality

### UI Architecture (ui.js)

**Rendering Pattern:**
- Unidirectional data flow: Game state → UI rendering
- `render()` function updates all UI elements from game state
- No UI state except what's derived from game state
- Smart animation system: `lastRoomCards` array tracks room changes to prevent re-animating cards on selection

**Card Image System:**
- Images stored in `/assets/` directory
- Suit-based grouping: hearts (1 image), diamonds (3 tiers), clubs (3 tiers), spades (3 tiers)
- Mapping logic in `getCardImage()` function based on card value ranges
- All card rendering uses background images with overlay elements

**Event Handling:**
- Event listeners attached once on initialization
- Card selection done via game model, then UI re-renders
- Auto-face room when 3 cards selected (0.5s delay for user feedback)

**Persistence:**
- Initial game seed saved to LocalStorage every 5 seconds
- "Restart" button replays same dungeon from beginning
- "New Game" generates fresh seed and clears save

### Styling Architecture (styles.css)

**CSS Variables:**
- Theme colors defined in `:root` for easy customization
- Separate color schemes for monsters, weapons, and potions
- Responsive spacing and sizing variables

**Component Organization:**
1. Reset & Base styles
2. Accessibility (visually-hidden, focus, reduced-motion)
3. HUD components
4. Room & Card styles
5. Controls & Buttons
6. Action Log
7. Modals
8. Debug Panel

**Responsive Design:**
- Mobile-first approach
- Room grid: 4 columns → 2 columns on mobile
- HUD: 3 columns → stacked on mobile
- Breakpoint: 768px

**Width Alignment System:**
- All major sections (.hud-inner, .game-container) use `max-width: 1200px`
- HUD inner uses `calc(1200px - (var(--spacing-md) * 2))` to account for outer padding
- Ensures visual alignment across HUD, room section, and action log
- When modifying padding, adjust calc() values accordingly

### Key Gameplay Flow

1. **New Game** → `game.reset(seed)` → `game.drawRoom()` → `render()`
2. **Player selects 3 cards** → `game.selectCard(index)` × 3 → auto `game.faceRoom()`
3. **Face Room** → resolve cards → check game over → draw next room → `render()`
4. **Avoid Room** → `game.avoidRoom()` → cards to bottom of deck → draw new room
5. **Game Over** → calculate score → show modal

### Card Resolution Order (in game.js)

When facing a room with selected cards:
1. Sort selected indices to maintain visual order
2. For each card, determine type and resolve:
   - **Weapon:** Discard old weapon+monsters, equip new weapon
   - **Potion:** Heal (if first potion) or discard (if second+)
   - **Monster:** Calculate damage with weapon rules, update weapon history
3. Identify unselected card and set as `roomCarriedCard`
4. Clear room and reset turn flags
5. Draw next room automatically

### Common Modifications

**Adding new card types:**
1. Update `getCardType()` in game.js
2. Add resolution logic in `Game.faceRoom()`
3. Add CSS styles with `card-[typename]` class
4. Update help modal in index.html

**Changing game rules:**
- Modify rule enforcement in `Game` methods: `canResolveCard()`, `resolveMonster()`, etc.
- Update help text in index.html modal
- Update README.md strategy tips

**Styling changes:**
- Adjust CSS variables in `:root` for theme-wide changes
- Component-specific styles are grouped in sections with clear headers
- Card animations controlled via `.card-flipping` class with @keyframes
- Suit-based card styling: Use `.card-hearts`, `.card-diamonds`, `.card-clubs`, `.card-spades` classes (NOT type-based classes)
- Card overlay elements positioned absolutely in corners to avoid interfering with background images

## Accessibility Features

- Full keyboard navigation (Tab, Enter, Space, Arrow keys)
- ARIA labels on all interactive elements
- Live regions for action log (screen readers announce updates)
- Focus management for modals
- `prefers-reduced-motion` support for animations
- Semantic HTML with proper heading hierarchy

## Debug Features

Toggle with "Debug" button to view:
- Current game seed
- Next 10 cards in deck order
- Live game state (health, weapon, flags)

Useful for testing specific scenarios by restarting with known seed.
