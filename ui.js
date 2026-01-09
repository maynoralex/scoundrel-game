/**
 * ui.js - UI controller for Scoundrel card game
 *
 * Handles all DOM manipulation, user interactions, and rendering.
 * Connects UI events to game logic.
 */

import { Game, getCardType, SUITS } from './game.js';

// ==================== State Management ====================

let game = new Game();
const STORAGE_KEY = 'scoundrel_save';
let lastRoomCards = []; // Track cards from previous render to detect new ones

// ==================== DOM Elements ====================

const elements = {
    // HUD
    healthBar: document.getElementById('healthBar'),
    healthValue: document.getElementById('healthValue'),
    weaponDisplay: document.getElementById('weaponDisplay'),
    turnCounter: document.getElementById('turnCounter'),
    deckCount: document.getElementById('deckCount'),
    discardCount: document.getElementById('discardCount'),

    // Room
    roomGrid: document.getElementById('roomGrid'),
    roomEmptyState: document.getElementById('roomEmptyState'),

    // Controls
    newGameBtn: document.getElementById('newGameBtn'),
    restartBtn: document.getElementById('restartBtn'),
    avoidBtn: document.getElementById('avoidBtn'),
    helpBtn: document.getElementById('helpBtn'),

    // Action Log
    actionLog: document.getElementById('actionLog'),

    // Modals
    helpModal: document.getElementById('helpModal'),
    helpCloseBtn: document.getElementById('helpCloseBtn'),
    gameOverModal: document.getElementById('gameOverModal'),
    gameOverContent: document.getElementById('gameOverContent'),
    gameOverNewGame: document.getElementById('gameOverNewGame'),
    gameOverRestart: document.getElementById('gameOverRestart')
};

// ==================== Rendering Functions ====================

/**
 * Update all UI elements to match game state
 */
function render() {
    renderHUD();
    renderRoom();
    renderLog();
}

/**
 * Render HUD (health, weapon, stats)
 */
function renderHUD() {
    // Health
    const healthPercent = (game.health / game.maxHealth) * 100;
    elements.healthBar.style.width = `${Math.max(0, healthPercent)}%`;
    elements.healthValue.textContent = `${Math.max(0, game.health)} / ${game.maxHealth}`;

    // Health bar color
    elements.healthBar.classList.remove('health-medium', 'health-low');
    if (healthPercent <= 25) {
        elements.healthBar.classList.add('health-low');
    } else if (healthPercent <= 50) {
        elements.healthBar.classList.add('health-medium');
    }

    // Update ARIA
    elements.healthBar.parentElement.setAttribute('aria-valuenow', Math.max(0, game.health));

    // Weapon
    if (game.weapon) {
        const lastDefeated = game.weapon.lastDefeated !== null ? game.weapon.lastDefeated : '—';
        elements.weaponDisplay.innerHTML = `
            <span class="weapon-value">♦${game.weapon.value}</span>
            <span class="weapon-defeated">Last defeated: ${lastDefeated}</span>
        `;
    } else {
        elements.weaponDisplay.innerHTML = `
            <span class="weapon-value">—</span>
            <span class="weapon-defeated">No weapon</span>
        `;
    }

    // Stats
    elements.turnCounter.textContent = game.turn;
    elements.deckCount.textContent = game.deck.length;
    elements.discardCount.textContent = game.discard.length;

    // Avoid button state
    elements.avoidBtn.disabled = !game.canAvoid || game.gameOver || game.room.length !== 4;
    if (!game.canAvoid) {
        elements.avoidBtn.classList.add('avoid-disabled');
        elements.avoidBtn.textContent = 'Avoid (Used)';
    } else {
        elements.avoidBtn.classList.remove('avoid-disabled');
        elements.avoidBtn.textContent = 'Avoid Room';
    }
}

/**
 * Render the room cards
 */
function renderRoom() {
    elements.roomGrid.innerHTML = '';

    if (game.room.length === 0) {
        elements.roomEmptyState.hidden = false;
        elements.roomGrid.hidden = true;
        lastRoomCards = [];
        return;
    }

    elements.roomEmptyState.hidden = true;
    elements.roomGrid.hidden = false;

    // Detect if this is a new room (cards changed)
    const roomChanged = game.room.length !== lastRoomCards.length ||
                        game.room.some((card, i) => card !== lastRoomCards[i]);

    game.room.forEach((card, index) => {
        const cardElement = createCardElement(card, index, roomChanged);
        elements.roomGrid.appendChild(cardElement);
    });

    // Update tracked cards
    lastRoomCards = [...game.room];
}

/**
 * Get the appropriate image filename for a card
 */
function getCardImage(card) {
    const value = card.value;

    // Hearts - all use heart.jpg
    if (card.suit === SUITS.HEARTS) {
        return 'heart.jpg';
    }

    // Diamonds - 2-4: diamond-1, 5-7: diamond-2, 8-10: diamond-3
    if (card.suit === SUITS.DIAMONDS) {
        if (value >= 2 && value <= 4) return 'diamond-1.jpg';
        if (value >= 5 && value <= 7) return 'diamond-2.jpg';
        if (value >= 8 && value <= 10) return 'diamond-3.jpg';
    }

    // Clubs - 2-5: club-1, 6-10: club-2, J/Q/K/A: club-3
    if (card.suit === SUITS.CLUBS) {
        if (value >= 2 && value <= 5) return 'club-1.jpg';
        if (value >= 6 && value <= 10) return 'club-2.jpg';
        if (value >= 11) return 'club-3.jpg'; // J=11, Q=12, K=13, A=14
    }

    // Spades - 2-5: spade-1, 6-10: spade-2, J/Q/K/A: spade-3
    if (card.suit === SUITS.SPADES) {
        if (value >= 2 && value <= 5) return 'spade-1.jpg';
        if (value >= 6 && value <= 10) return 'spade-2.jpg';
        if (value >= 11) return 'spade-3.jpg'; // J=11, Q=12, K=13, A=14
    }

    return 'deck.jpg'; // Fallback
}

/**
 * Create a card DOM element
 */
function createCardElement(card, index, animateEntry = false) {
    const type = getCardType(card);
    const isSelected = game.selectedCards.includes(index);
    const isCarried = game.selectedCards.length === 3 && !isSelected;
    const imageFile = getCardImage(card);

    // Get suit name for CSS class
    const suitName = {
        '♥': 'hearts',
        '♦': 'diamonds',
        '♣': 'clubs',
        '♠': 'spades'
    }[card.suit] || 'unknown';

    const cardDiv = document.createElement('div');
    cardDiv.className = `card card-${suitName}`;
    cardDiv.setAttribute('role', 'button');
    cardDiv.setAttribute('tabindex', '0');
    cardDiv.setAttribute('aria-label', `${card.suit} ${card.rank} ${type}`);

    // Add flip animation only for new cards
    if (animateEntry) {
        setTimeout(() => {
            cardDiv.classList.add('card-flipping');
            setTimeout(() => cardDiv.classList.remove('card-flipping'), 600);
        }, index * 100);
    }

    if (isSelected) {
        cardDiv.classList.add('card-selected');
    }

    if (isCarried) {
        cardDiv.classList.add('card-carried');
    }

    if (game.gameOver) {
        cardDiv.classList.add('card-disabled');
        cardDiv.setAttribute('aria-disabled', 'true');
    }

    // Check if card can be resolved
    const { canResolve, reason, forceBareHanded } = game.canResolveCard(card);

    cardDiv.innerHTML = `
        <div class="card-inner" style="background-image: url('assets/${imageFile}')">
            <div class="card-overlay">
                <div class="card-suit">${card.suit}</div>
                <div class="card-value">${card.rank}</div>
                <div class="card-type">${type}</div>
                ${!canResolve || forceBareHanded ? `<div class="card-warning">${reason || ''}</div>` : ''}
            </div>
        </div>
    `;

    // Add click handler
    if (!game.gameOver) {
        cardDiv.addEventListener('click', () => handleCardClick(index));
        cardDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(index);
            }
        });
    }

    return cardDiv;
}

/**
 * Handle card click/selection
 */
function handleCardClick(index) {
    if (game.gameOver) return;

    game.selectCard(index);
    render();

    // If 3 cards selected, enable facing the room
    if (game.selectedCards.length === 3) {
        // Auto-face after selection or show a confirm button
        // For now, we'll auto-face for smoother gameplay
        setTimeout(() => {
            game.faceRoom();
            render();

            if (game.gameOver) {
                showGameOverModal();
            }
        }, 500);
    }
}

/**
 * Render the action log
 */
function renderLog() {
    // Only show last 10 events for performance
    const recentEvents = game.eventLog.slice(-10);

    elements.actionLog.innerHTML = recentEvents
        .map(event => `<p class="log-entry log-${event.type}">${event.message}</p>`)
        .join('');

    // Scroll to bottom
    elements.actionLog.scrollTop = elements.actionLog.scrollHeight;
}

// ==================== Game Control Functions ====================

/**
 * Start a new game
 */
function startNewGame() {
    // Generate new seed
    const seed = Date.now();
    game.reset(seed);

    // Clear saved game
    localStorage.removeItem(STORAGE_KEY);

    // Draw first room
    game.drawRoom();

    // Update UI
    render();
    elements.restartBtn.disabled = false;

    // Close modals
    elements.gameOverModal.hidden = true;
}

/**
 * Restart current game from saved state
 */
function restartGame() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        try {
            const initialState = JSON.parse(saved);
            game.reset(initialState.seed);
            game.drawRoom();
            render();

            elements.gameOverModal.hidden = true;
        } catch (e) {
            console.error('Failed to restart game:', e);
            startNewGame();
        }
    } else {
        // No saved state, start fresh with same seed
        const currentSeed = game.seed;
        game.reset(currentSeed);
        game.drawRoom();
        render();

        elements.gameOverModal.hidden = true;
    }
}

/**
 * Avoid current room
 */
function avoidRoom() {
    if (game.avoidRoom()) {
        render();
    }
}

/**
 * Show game over modal
 */
function showGameOverModal() {
    const score = game.getScore();
    const result = game.gameWon ? 'Victory!' : 'Defeated!';
    const resultClass = game.gameWon ? 'victory' : 'defeat';

    // Build defeating card display if player lost
    let defeatingCardHTML = '';
    if (!game.gameWon && game.defeatingCard) {
        const card = game.defeatingCard;
        const imageFile = getCardImage(card);
        const type = getCardType(card);

        // Get suit name for CSS class
        const suitName = {
            '♥': 'hearts',
            '♦': 'diamonds',
            '♣': 'clubs',
            '♠': 'spades'
        }[card.suit] || 'unknown';

        defeatingCardHTML = `
            <div class="game-over-defeating-card">
                <p class="defeating-card-label">Defeated by:</p>
                <div class="card card-${suitName} card-small">
                    <div class="card-inner" style="background-image: url('assets/${imageFile}')">
                        <div class="card-overlay">
                            <div class="card-suit">${card.suit}</div>
                            <div class="card-value">${card.rank}</div>
                            <div class="card-type">${type}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    elements.gameOverContent.innerHTML = `
        <div class="game-over-result ${resultClass}">${result}</div>
        <div class="game-over-score">Score: ${score}</div>
        ${defeatingCardHTML}
        <div class="game-over-stats">
            <p>Turn: ${game.turn}</p>
            <p>Final Health: ${game.health}</p>
            ${game.weapon ? `<p>Weapon: ♦${game.weapon.value} (defeated ${game.weapon.defeatedMonsters.length} monsters)</p>` : ''}
        </div>
    `;

    elements.gameOverModal.hidden = false;

    // Focus on modal
    elements.gameOverModal.focus();
}

// ==================== Modal Functions ====================

/**
 * Show help modal
 */
function showHelp() {
    elements.helpModal.hidden = false;
    elements.helpCloseBtn.focus();
}

/**
 * Close help modal
 */
function closeHelp() {
    elements.helpModal.hidden = true;
    elements.helpBtn.focus();
}

// ==================== Event Listeners ====================

function setupEventListeners() {
    // Control buttons
    elements.newGameBtn.addEventListener('click', startNewGame);
    elements.restartBtn.addEventListener('click', restartGame);
    elements.avoidBtn.addEventListener('click', avoidRoom);
    elements.helpBtn.addEventListener('click', showHelp);

    // Help modal
    elements.helpCloseBtn.addEventListener('click', closeHelp);
    elements.helpModal.addEventListener('click', (e) => {
        if (e.target === elements.helpModal) {
            closeHelp();
        }
    });

    // Game over modal
    elements.gameOverNewGame.addEventListener('click', startNewGame);
    elements.gameOverRestart.addEventListener('click', restartGame);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close modals
        if (e.key === 'Escape') {
            if (!elements.helpModal.hidden) {
                closeHelp();
            }
        }

        // Avoid with 'A' key
        if (e.key === 'a' || e.key === 'A') {
            if (!elements.avoidBtn.disabled && elements.helpModal.hidden && elements.gameOverModal.hidden) {
                avoidRoom();
            }
        }

        // Help with '?' key
        if (e.key === '?') {
            if (elements.helpModal.hidden && elements.gameOverModal.hidden) {
                showHelp();
            }
        }
    });

    // Auto-save game state
    setInterval(() => {
        if (!game.gameOver && game.turn > 0) {
            // Save initial state for restart
            const initialState = { seed: game.seed };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
        }
    }, 5000);
}

// ==================== Initialization ====================

function init() {
    setupEventListeners();

    // Check for saved game
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        elements.restartBtn.disabled = false;
    }

    // Initial render
    render();

    console.log('Scoundrel initialized! Press ? for help.');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
