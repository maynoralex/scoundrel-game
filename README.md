# Scoundrel

A solo dungeon-crawl card game built with vanilla JavaScript, HTML, and CSS. Navigate through a dangerous dungeon, manage your resources, and survive to claim victory!

## Game Overview

Scoundrel is a strategic solo card game where you must survive a 44-card dungeon deck. You'll manage your health, equip weapons to fight monsters, use potions to heal, and make tactical decisions about when to fight and when to flee.

**Goal:** Clear the entire dungeon deck while staying alive. Your score is your remaining health if you win, or a negative score based on remaining monsters if you lose.

## How to Play

### Setup

- **Health:** You start with 20 HP (maximum)
- **Deck:** 44 cards shuffled randomly:
  - 26 Monsters (♣ and ♠ cards: 2-10, J=11, Q=12, K=13, A=14)
  - 9 Weapons (♦ cards: 2-10)
  - 9 Potions (♥ cards: 2-10)

### Each Turn

1. Draw cards until 4 are visible (this is your "Room")
2. You must choose one of two actions:

#### Option 1: Avoid the Room
- Place all 4 cards on the bottom of the deck in order
- **Restriction:** Cannot avoid twice in a row

#### Option 2: Face the Room
- Select 3 cards to resolve in any order you choose
- The 4th unselected card is carried forward to the next room
- Click cards to select them (they'll highlight); once 3 are selected, they resolve automatically

### Card Resolution

#### Weapons (♦)
- Equips immediately
- Discards your old weapon and all monsters it defeated
- Resets the weapon's "last defeated" value

#### Potions (♥)
- Heals you by its value (up to 20 HP maximum)
- **Restriction:** Only ONE potion per room works; extras are discarded without effect

#### Monsters (♣/♠)
- **Without a weapon:** Take full damage equal to the monster's value
- **With a weapon:**
  - Damage = Monster Value - Weapon Value (minimum 0)
  - If damage ≤ 0, the monster is defeated and stacked on your weapon
  - Your weapon tracks the last defeated monster's value

**Weapon Rule:** A weapon can only fight monsters with values ≤ the last defeated monster (non-increasing sequence). If a monster is too strong, you must fight it bare-handed!

#### Example
```
Equipped: ♦7, Last Defeated: 9

- Fight ♠8: 8 - 7 = 1 damage, defeat monster (last defeated → 8) ✓
- Fight ♣6: 6 - 7 = 0 damage, defeat monster (last defeated → 6) ✓
- Fight ♠10: Can't use weapon (10 > 6) → bare-handed = 10 damage! ✗
```

### Winning & Losing

- **Victory:** Clear all cards from the dungeon → Score = remaining health
- **Defeat:** Health drops to 0 → Score = negative sum of remaining monster values

## How to Run

### Simple Method
1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. No build step, server, or dependencies required!

### Alternative (Local Server)
If you prefer running a local server:
```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server installed globally)
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## File Structure

```
scoundrel-game/
├── index.html      # Main HTML structure and layout
├── styles.css      # All styling, themes, animations
├── game.js         # Core game logic and rules engine
├── ui.js           # UI rendering and user interactions
└── README.md       # This file
```

### File Responsibilities

**index.html**
- Page structure and semantic HTML
- HUD layout (health, weapon, stats)
- Room grid for cards
- Control buttons
- Help and game over modals
- Action log container
- Debug panel

**styles.css**
- CSS custom properties for theming
- Responsive grid layouts
- Card styling and animations (flip, hover, selection)
- HUD components (health bar, weapon display)
- Modal overlays
- Accessibility features (focus styles, reduced motion)
- Mobile-first responsive design

**game.js**
- Game state management
- Deck creation and shuffling (Fisher-Yates with optional seed)
- Game rules enforcement:
  - Non-increasing weapon rule
  - One potion per room restriction
  - Avoid restriction (no consecutive avoids)
- Card resolution logic for weapons, potions, and monsters
- Win/loss detection and score calculation
- Event logging
- State persistence interface

**ui.js**
- DOM manipulation and rendering
- User interaction handlers (clicks, keyboard shortcuts)
- HUD updates (health bar, weapon display, turn counter)
- Room card rendering with animations
- Action log display
- Modal management (help, game over)
- LocalStorage integration for game restarts
- Debug panel rendering

## Features

### Accessibility
- Fully keyboard navigable (Tab, Enter, Space)
- Arrow key support for card selection
- Visible focus indicators
- ARIA labels and live regions for screen readers
- Respects `prefers-reduced-motion` for animations

### Keyboard Shortcuts
- `A` - Avoid the current room
- `?` - Toggle help modal
- `Esc` - Close modals
- `Tab` - Navigate between interactive elements
- `Enter/Space` - Select cards or activate buttons

### Debug Features
Click the "Debug" button to see:
- Current game seed (for reproducible games)
- Next 10 cards in the deck
- Current game state (health, weapon, flags)

### Persistence
- Game seed is automatically saved to LocalStorage
- Use "Restart" button to replay the same dungeon from the beginning
- Auto-saves every 5 seconds during gameplay

## Strategy Tips

1. **Weapon Management:** Don't be too eager to switch weapons. A low-value weapon with a good defeat history can be more useful than a high-value weapon that resets your history.

2. **Plan Your Sequence:** When facing a room, the order you resolve cards matters. Fight weaker monsters first to build up your weapon's defeat chain.

3. **Avoid Wisely:** Avoiding is powerful but limited. Use it when a room is particularly dangerous or when you're waiting for better resources.

4. **Potion Timing:** Only one potion works per room. If you see multiple potions, prioritize using the highest value one first.

5. **Know When to Take Damage:** Sometimes fighting a monster bare-handed is worth it to preserve your weapon's defeat chain for future encounters.

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires ES6 module support (`<script type="module">`).

## Credits

Game design inspired by traditional solo card games.
Built as a portfolio project demonstrating clean vanilla JavaScript architecture.

## License

MIT License - Feel free to use, modify, and distribute as you see fit.

---

**Enjoy your dungeon crawl, Scoundrel!**
