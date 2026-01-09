/**
 * game.js - Core game logic for Scoundrel card game
 *
 * Handles all game state, rules, and card interactions.
 * Exports the Game class for use by UI layer.
 */

// ==================== Card Utilities ====================

const SUITS = {
    HEARTS: '♥',
    DIAMONDS: '♦',
    CLUBS: '♣',
    SPADES: '♠'
};

const RANKS = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

/**
 * Card type determination
 */
function getCardType(card) {
    if (card.suit === SUITS.CLUBS || card.suit === SUITS.SPADES) {
        return 'monster';
    }
    if (card.suit === SUITS.DIAMONDS) {
        return 'weapon';
    }
    if (card.suit === SUITS.HEARTS) {
        return 'potion';
    }
    return 'unknown';
}

/**
 * Fisher-Yates shuffle with optional seed
 * @param {Array} array - Array to shuffle (modified in place)
 * @param {number} seed - Optional seed for reproducible shuffles
 */
function shuffle(array, seed = null) {
    let rng;

    if (seed !== null) {
        // Simple seeded random number generator
        rng = (function(s) {
            return function() {
                s = Math.sin(s) * 10000;
                return s - Math.floor(s);
            };
        })(seed);
    } else {
        rng = Math.random;
    }

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

/**
 * Create a Scoundrel deck (44 cards)
 * Removes: Jokers, red face cards (J/Q/K ♥♦), red Aces (A♥, A♦)
 */
function createDeck() {
    const deck = [];

    // All clubs and spades (monsters) - including face cards and Aces
    [SUITS.CLUBS, SUITS.SPADES].forEach(suit => {
        Object.entries(RANKS).forEach(([rank, value]) => {
            deck.push({ suit, rank, value });
        });
    });

    // Diamonds 2-10 (weapons) - no face cards or Aces
    Object.entries(RANKS).forEach(([rank, value]) => {
        if (value >= 2 && value <= 10) {
            deck.push({ suit: SUITS.DIAMONDS, rank, value });
        }
    });

    // Hearts 2-10 (potions) - no face cards or Aces
    Object.entries(RANKS).forEach(([rank, value]) => {
        if (value >= 2 && value <= 10) {
            deck.push({ suit: SUITS.HEARTS, rank, value });
        }
    });

    return deck; // Should be 44 cards: 26 monsters + 9 weapons + 9 potions
}

// ==================== Game Class ====================

export class Game {
    constructor() {
        this.reset();
    }

    /**
     * Initialize or reset the game state
     * @param {number} seed - Optional seed for reproducible games
     */
    reset(seed = null) {
        this.seed = seed !== null ? seed : Date.now();
        this.health = 20;
        this.maxHealth = 20;
        this.turn = 0;
        this.deck = shuffle(createDeck(), this.seed);
        this.discard = [];
        this.room = [];
        this.weapon = null; // { value, lastDefeated, defeatedMonsters: [] }
        this.canAvoid = true; // Track if avoid was used last turn
        this.roomCarriedCard = null; // The 4th card carried to next room
        this.potionUsedThisTurn = false;
        this.selectedCards = [];
        this.gameOver = false;
        this.gameWon = false;
        this.defeatingCard = null; // Track which card defeated the player
        this.eventLog = [];

        this.logEvent('Game started! Good luck, Scoundrel.', 'info');
    }

    /**
     * Get current game state for persistence
     */
    getState() {
        return {
            seed: this.seed,
            health: this.health,
            turn: this.turn,
            deck: this.deck,
            discard: this.discard,
            room: this.room,
            weapon: this.weapon,
            canAvoid: this.canAvoid,
            roomCarriedCard: this.roomCarriedCard,
            potionUsedThisTurn: this.potionUsedThisTurn,
            selectedCards: this.selectedCards,
            gameOver: this.gameOver,
            gameWon: this.gameWon,
            defeatingCard: this.defeatingCard,
            eventLog: this.eventLog
        };
    }

    /**
     * Restore game state from saved data
     */
    setState(state) {
        Object.assign(this, state);
    }

    /**
     * Add an event to the log
     */
    logEvent(message, type = 'info') {
        this.eventLog.push({ message, type, timestamp: Date.now() });
    }

    /**
     * Draw cards until room has 4 cards
     * Starts with carried card if one exists
     */
    drawRoom() {
        if (this.gameOver) return false;

        this.room = [];
        this.potionUsedThisTurn = false;
        this.selectedCards = [];

        // Start with carried card if one exists
        if (this.roomCarriedCard) {
            this.room.push(this.roomCarriedCard);
            this.logEvent(`Carried ${this.roomCarriedCard.suit}${this.roomCarriedCard.rank} to new room`, 'info');
            this.roomCarriedCard = null;
        }

        // Draw until we have 4 cards
        while (this.room.length < 4 && this.deck.length > 0) {
            this.room.push(this.deck.shift());
        }

        this.turn++;

        // Check if we won (deck is empty and room isn't full)
        if (this.room.length < 4 && this.deck.length === 0) {
            this.endGame(true);
            return false;
        }

        this.logEvent(`Turn ${this.turn}: Entered new room with ${this.room.length} cards`, 'turn');
        return true;
    }

    /**
     * Avoid the current room (place all 4 cards on bottom of deck)
     */
    avoidRoom() {
        if (!this.canAvoid || this.gameOver || this.room.length !== 4) {
            return false;
        }

        // Place all cards on bottom of deck in order
        this.deck.push(...this.room);
        this.room = [];
        this.canAvoid = false;
        this.roomCarriedCard = null;

        this.logEvent('Avoided the room! All cards moved to bottom of deck.', 'warning');

        // Draw next room
        this.drawRoom();
        return true;
    }

    /**
     * Select a card from the room
     * @param {number} index - Index of card in room array
     */
    selectCard(index) {
        if (this.gameOver || !this.room[index]) return false;

        const cardIndex = this.selectedCards.indexOf(index);

        if (cardIndex >= 0) {
            // Deselect
            this.selectedCards.splice(cardIndex, 1);
        } else if (this.selectedCards.length < 3) {
            // Select (max 3)
            this.selectedCards.push(index);
        }

        return true;
    }

    /**
     * Check if a card can be resolved
     */
    canResolveCard(card) {
        const type = getCardType(card);

        if (type === 'potion' && this.potionUsedThisTurn) {
            return { canResolve: false, reason: 'Only one potion per room' };
        }

        if (type === 'monster' && this.weapon) {
            // Check weapon's non-increasing rule
            if (this.weapon.lastDefeated !== null && card.value > this.weapon.lastDefeated) {
                return {
                    canResolve: true,
                    reason: `Monster too strong for weapon (${card.value} > ${this.weapon.lastDefeated})`,
                    forceBareHanded: true
                };
            }
        }

        return { canResolve: true };
    }

    /**
     * Resolve a weapon card
     */
    resolveWeapon(card) {
        // Discard old weapon and its defeated monsters
        if (this.weapon) {
            this.discard.push({ suit: SUITS.DIAMONDS, rank: String(this.weapon.value), value: this.weapon.value });
            this.discard.push(...this.weapon.defeatedMonsters);
            this.logEvent(`Discarded old weapon ♦${this.weapon.value} with ${this.weapon.defeatedMonsters.length} defeated monsters`, 'info');
        }

        // Equip new weapon
        this.weapon = {
            value: card.value,
            lastDefeated: null,
            defeatedMonsters: []
        };

        this.logEvent(`Equipped weapon ${card.suit}${card.rank} (value ${card.value})`, 'success');
    }

    /**
     * Resolve a potion card
     */
    resolvePotion(card) {
        if (this.potionUsedThisTurn) {
            this.discard.push(card);
            this.logEvent(`${card.suit}${card.rank} discarded - only one potion per room`, 'warning');
            return;
        }

        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + card.value);
        const healed = this.health - oldHealth;

        this.potionUsedThisTurn = true;
        this.discard.push(card);

        this.logEvent(`Used potion ${card.suit}${card.rank} - healed ${healed} HP (${oldHealth} → ${this.health})`, 'success');
    }

    /**
     * Resolve a monster card
     * Example: With ♦7 weapon, last defeated 9:
     *   - Fight ♠8: 8-7=1 damage, stack on weapon (last defeated → 8)
     *   - Fight ♣6: 6-7=0 damage, stack on weapon (last defeated → 6)
     *   - Cannot fight ♠10 (10 > 6) with weapon → bare-handed (10 damage)
     */
    resolveMonster(card) {
        let damage = card.value;
        let usedWeapon = false;

        // Check if weapon can be used
        if (this.weapon) {
            const canUseWeapon = this.weapon.lastDefeated === null || card.value <= this.weapon.lastDefeated;

            if (canUseWeapon) {
                // Use weapon
                damage = Math.max(0, card.value - this.weapon.value);
                usedWeapon = true;

                // Monster is defeated - stack on weapon
                this.weapon.defeatedMonsters.push(card);
                this.weapon.lastDefeated = card.value;

                this.logEvent(
                    `Fought ${card.suit}${card.rank} (${card.value}) with ♦${this.weapon.value} - took ${damage} damage, defeated monster (last: ${this.weapon.lastDefeated})`,
                    damage === 0 ? 'success' : 'warning'
                );
            } else {
                // Weapon can't be used (non-increasing rule violated)
                this.discard.push(card);
                this.logEvent(
                    `${card.suit}${card.rank} (${card.value}) too strong for weapon (last defeated: ${this.weapon.lastDefeated}) - fought bare-handed, took ${damage} damage!`,
                    'danger'
                );
            }
        } else {
            // No weapon - bare-handed
            this.discard.push(card);
            this.logEvent(`Fought ${card.suit}${card.rank} (${card.value}) bare-handed - took ${damage} damage!`, 'danger');
        }

        // Take damage
        if (damage > 0) {
            this.health -= damage;

            if (this.health <= 0) {
                this.defeatingCard = card;
                this.endGame(false);
            }
        }
    }

    /**
     * Resolve selected cards and handle room completion
     */
    faceRoom() {
        if (this.selectedCards.length !== 3 || this.gameOver) {
            return false;
        }

        // Resolve cards in the order they were selected (not sorted by position)
        for (const index of this.selectedCards) {
            const card = this.room[index];
            const type = getCardType(card);

            switch (type) {
                case 'weapon':
                    this.resolveWeapon(card);
                    break;
                case 'potion':
                    this.resolvePotion(card);
                    break;
                case 'monster':
                    this.resolveMonster(card);
                    break;
            }

            if (this.gameOver) break;
        }

        // Find the unselected card (4th card)
        const carriedIndex = [0, 1, 2, 3].find(i => !this.selectedCards.includes(i));
        if (carriedIndex !== undefined) {
            this.roomCarriedCard = this.room[carriedIndex];
        }

        // Clear room and reset avoid
        this.room = [];
        this.canAvoid = true;
        this.selectedCards = [];

        // Draw next room if game isn't over
        if (!this.gameOver) {
            this.drawRoom();
        }

        return true;
    }

    /**
     * End the game and calculate score
     */
    endGame(won) {
        this.gameOver = true;
        this.gameWon = won;

        if (won) {
            // Score = remaining health
            const score = this.health;
            this.logEvent(`Victory! You cleared the dungeon with ${this.health} HP remaining. Score: ${score}`, 'success');
        } else {
            // Score = negative sum of remaining monster values
            const remainingMonsters = [
                ...this.deck.filter(c => getCardType(c) === 'monster'),
                ...this.room.filter(c => getCardType(c) === 'monster')
            ];
            const monsterSum = remainingMonsters.reduce((sum, card) => sum + card.value, 0);
            const score = -monsterSum;
            this.logEvent(`Defeated! Health: ${this.health}. Score: ${score} (${remainingMonsters.length} monsters remaining)`, 'danger');
        }
    }

    /**
     * Calculate current score
     */
    getScore() {
        if (this.gameWon) {
            return this.health;
        } else if (this.gameOver) {
            // Negative sum of remaining monsters
            const remainingMonsters = [
                ...this.deck.filter(c => getCardType(c) === 'monster'),
                ...this.room.filter(c => getCardType(c) === 'monster')
            ];
            return -remainingMonsters.reduce((sum, card) => sum + card.value, 0);
        }
        return 0;
    }
}

// Export utilities for UI
export { getCardType, SUITS };
