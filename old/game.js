class WhotGame {
    constructor() {
        this.deck = [];
        this.players = [
            { id: 1, name: 'Player 1', isAI: false, hand: [] },
            { id: 2, name: 'AI', isAI: true, hand: [] }
        ];
        this.currentPlayerIndex = 0;
        this.playPile = [];
        this.drawPile = [];
        this.currentShape = null;
        this.pickStack = { count: 0, type: null };
        this.gameLog = [];
        this.isAITurn = false;
        this.hasDrawnCard = false; // Track if player has drawn a card
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        this.createDeck();
        this.shuffleDeck();
        this.dealCards();
        this.startFirstPlay();
        this.updateUI();
    }

    createDeck() {
        const shapes = ['circle', 'cross', 'rectangle', 'star', 'triangle'];
        const numbers = {
            'circle': [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
            'cross': [1, 2, 3, 5, 7, 8, 10, 11, 13, 14],
            'rectangle': [1, 2, 3, 5, 7, 10, 11, 13, 14],
            'star': [1, 2, 3, 4, 5, 7, 8],
            'triangle': [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14]
        };

        // Add regular cards
        shapes.forEach(shape => {
            numbers[shape].forEach(number => {
                this.deck.push({ shape, number });
            });
        });

        // Add WHOT cards
        for (let i = 0; i < 5; i++) {
            this.deck.push({ shape: 'whot', number: 20 });
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        // Deal 5 cards to each player
        for (let i = 0; i < 5; i++) {
            this.players.forEach(player => {
                if (this.deck.length > 0) {
                    player.hand.push(this.deck.pop());
                }
            });
        }
    }

    startFirstPlay() {
        // Draw first card from deck to start the game
        if (this.deck.length > 0) {
            const firstCard = this.deck.pop();
            this.playPile.push(firstCard);
            this.currentShape = firstCard.shape;
            this.updatePlayPile();
        }
    }

    updatePlayPile() {
        const playPileElement = document.getElementById('play-pile');
        playPileElement.innerHTML = '';
        
        if (this.playPile.length > 0) {
            const topCard = this.playPile[this.playPile.length - 1];
            const cardElement = this.createCardElement(topCard);
            playPileElement.appendChild(cardElement);
        }
    }

    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.shape = card.shape;
        cardElement.dataset.number = card.number;
        
        const numberElement = document.createElement('div');
        numberElement.className = 'card-number';
        numberElement.textContent = card.number;
        cardElement.appendChild(numberElement);
        
        return cardElement;
    }

    updateUI() {
        // Update player hands
        this.players.forEach(player => {
            const handElement = document.getElementById(`player${player.id}-hand`);
            handElement.innerHTML = '';
            
            player.hand.forEach(card => {
                const cardElement = this.createCardElement(card);
                if (!player.isAI) {
                    cardElement.addEventListener('click', () => this.handleCardClick(card));
                }
                handElement.appendChild(cardElement);
            });
        });

        // Update game status
        const statusElement = document.querySelector('.game-status');
        const currentPlayer = this.players[this.currentPlayerIndex];
        statusElement.textContent = `${currentPlayer.name}'s Turn`;

        // Update draw pile
        const drawPileElement = document.getElementById('draw-pile');
        drawPileElement.innerHTML = '';
        if (this.deck.length > 0) {
            const backCard = document.createElement('div');
            backCard.className = 'card';
            backCard.dataset.shape = 'back';
            drawPileElement.appendChild(backCard);
        }

        // Update play pile
        this.updatePlayPile();
    }

    handleCardClick(card) {
        if (this.isAITurn) return;
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer.isAI && this.isValidPlay(card)) {
            this.playCard(card);
        }
    }

    isValidPlay(card) {
        if (this.playPile.length === 0) return true;
        
        const topCard = this.playPile[this.playPile.length - 1];
        
        // If there's a pick stack, only matching pick cards are valid
        if (this.pickStack.count > 0) {
            return card.number === this.pickStack.type;
        }
        
        return card.number === topCard.number || 
               card.shape === this.currentShape || 
               card.shape === 'whot';
    }

    playCard(card) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const cardIndex = currentPlayer.hand.findIndex(c => 
            c.shape === card.shape && c.number === card.number
        );

        if (cardIndex !== -1) {
            const playedCard = currentPlayer.hand.splice(cardIndex, 1)[0];
            this.playPile.push(playedCard);
            
            // Handle special cards
            if (playedCard.shape === 'whot') {
                if (currentPlayer.isAI) {
                    // AI automatically chooses a shape
                    const shapes = ['circle', 'cross', 'rectangle', 'star', 'triangle'];
                    const shapeCounts = {};
                    currentPlayer.hand.forEach(card => {
                        if (card.shape !== 'whot') {
                            shapeCounts[card.shape] = (shapeCounts[card.shape] || 0) + 1;
                        }
                    });
                    
                    let maxShape = 'circle';
                    let maxCount = 0;
                    for (const [shape, count] of Object.entries(shapeCounts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            maxShape = shape;
                        }
                    }
                    
                    if (maxCount === 0) {
                        maxShape = shapes[Math.floor(Math.random() * shapes.length)];
                    }
                    
                    this.currentShape = maxShape;
                    this.addToGameLog(`AI chose ${maxShape} as the new shape`);
                } else {
                    this.showShapeSelector();
                }
            } else {
                this.currentShape = playedCard.shape;
            }

            // Handle action cards
            this.handleActionCard(playedCard);
            
            this.updateUI();
        }
    }

    handleActionCard(card) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        switch (card.number) {
            case 1: // HOLD ON
                this.addToGameLog(`${currentPlayer.name} plays again!`);
                // If it's AI's turn, make it play again
                if (currentPlayer.isAI) {
                    setTimeout(() => this.makeAIMove(), 1000);
                }
                // Don't end turn, let the same player play again
                return;

            case 2: // PICK TWO
                if (this.pickStack.type === 2) {
                    this.pickStack.count += 2;
                } else {
                    this.pickStack = { count: 2, type: 2 };
                }
                this.addToGameLog(`Next player must pick ${this.pickStack.count} cards or play a 2`);
                break;

            case 5: // PICK THREE
                if (this.pickStack.type === 5) {
                    this.pickStack.count += 3;
                } else {
                    this.pickStack = { count: 3, type: 5 };
                }
                this.addToGameLog(`Next player must pick ${this.pickStack.count} cards or play a 5`);
                break;

            case 8: // SUSPENSION
                this.addToGameLog('Next player is suspended!');
                // Skip next player's turn
                this.currentPlayerIndex = (this.currentPlayerIndex + 2) % this.players.length;
                this.isAITurn = this.players[this.currentPlayerIndex].isAI;
                this.updateUI();
                // If it's AI's turn after suspension, make AI play
                if (this.isAITurn) {
                    setTimeout(() => this.makeAIMove(), 1000);
                }
                return;

            case 14: // GENERAL MARKET
                this.addToGameLog('All players draw one card!');
                // All players draw one card
                this.players.forEach(player => {
                    if (this.deck.length > 0) {
                        player.hand.push(this.deck.pop());
                    }
                });
                // End turn immediately after general market
                this.endTurn();
                return;
        }

        // End turn for all other cards
        this.endTurn();
    }

    showShapeSelector() {
        const modal = document.getElementById('shape-modal');
        modal.style.display = 'flex';
        
        const shapeOptions = document.querySelectorAll('.shape-option');
        shapeOptions.forEach(option => {
            option.onclick = () => {
                this.currentShape = option.dataset.shape;
                modal.style.display = 'none';
                this.endTurn();
            };
        });
    }

    endTurn() {
        // Check for winner
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.hand.length === 0) {
            this.handleGameOver(currentPlayer);
            return;
        }

        // Reset the drawn card flag
        this.hasDrawnCard = false;

        // Switch to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.isAITurn = this.players[this.currentPlayerIndex].isAI;
        
        // If next player is AI, trigger AI move
        if (this.isAITurn) {
            setTimeout(() => this.makeAIMove(), 1000);
        }
        
        this.updateUI();
    }

    makeAIMove() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer.isAI) return;

        // Find playable cards
        const playableCards = currentPlayer.hand.filter(card => this.isValidPlay(card));
        
        if (playableCards.length > 0) {
            // Strategy: Play special cards first, then matching shape, then any valid card
            let cardToPlay = playableCards.find(card => card.shape === 'whot') ||
                           playableCards.find(card => card.shape === this.currentShape) ||
                           playableCards[0];
            
            this.playCard(cardToPlay);
        } else {
            // No playable cards, draw from deck
            this.drawCard();
        }
    }

    drawCard() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (this.deck.length > 0) {
            // If there's a pick stack, draw the required number of cards
            if (this.pickStack.count > 0) {
                const cardsToPick = this.pickStack.count;
                for (let i = 0; i < cardsToPick; i++) {
                    if (this.deck.length > 0) {
                        currentPlayer.hand.push(this.deck.pop());
                    }
                }
                this.addToGameLog(`${currentPlayer.name} picked ${cardsToPick} cards`);
                this.pickStack = { count: 0, type: null };
            } else {
                // Normal draw
                const card = this.deck.pop();
                currentPlayer.hand.push(card);
                this.addToGameLog(`${currentPlayer.name} drew a card`);
            }
            
            this.hasDrawnCard = true;
            this.updateUI();
            
            // End turn after drawing
            setTimeout(() => this.endTurn(), 500);
        } else {
            this.endTurn();
        }
    }

    handleGameOver(winner) {
        // Create and show game over modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '2rem';
        modalContent.style.borderRadius = '10px';
        modalContent.style.textAlign = 'center';
        modalContent.style.maxWidth = '400px';
        modalContent.style.width = '90%';
        
        const title = document.createElement('h2');
        title.textContent = 'Game Over!';
        title.style.color = '#2C3E50';
        title.style.marginBottom = '1rem';
        
        const message = document.createElement('p');
        message.textContent = `${winner.name} wins the game!`;
        message.style.fontSize = '1.2rem';
        message.style.color = '#E74C3C';
        message.style.marginBottom = '1.5rem';
        
        const newGameButton = document.createElement('button');
        newGameButton.textContent = 'New Game';
        newGameButton.className = 'btn';
        newGameButton.style.marginTop = '1rem';
        newGameButton.onclick = () => {
            location.reload();
        };
        
        modalContent.appendChild(title);
        modalContent.appendChild(message);
        modalContent.appendChild(newGameButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Disable game controls
        document.getElementById('draw-pile').disabled = true;
        document.getElementById('end-turn').disabled = true;
        
        // Add to game log
        this.addToGameLog(`${winner.name} wins the game!`);
    }

    setupEventListeners() {
        document.getElementById('draw-pile').addEventListener('click', () => {
            if (!this.isAITurn && !this.hasDrawnCard) {
                this.drawCard();
            }
        });

        document.getElementById('end-turn').addEventListener('click', () => {
            if (!this.isAITurn) {
                this.endTurn();
            }
        });
    }

    addToGameLog(message) {
        const gameLog = document.getElementById('game-log');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;
        gameLog.appendChild(logEntry);
        gameLog.scrollTop = gameLog.scrollHeight;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new WhotGame();
}); 