// game.js

const player1Hand = document.getElementById("player1-hand");
const player2Hand = document.getElementById("player2-hand");
const playPile = document.getElementById("play-pile");
const drawPile = document.getElementById("draw-pile");
const gameStatus = document.querySelector(".game-status");
const actionMessage = document.createElement("div");
actionMessage.id = "action-message";
actionMessage.style.textAlign = "center";
actionMessage.style.fontWeight = "bold";
actionMessage.style.marginTop = "10px";
actionMessage.style.fontSize = "1.1em";
document.querySelector(".game-header").appendChild(actionMessage);
const shapeModal = document.getElementById("shape-modal");
const shapeOptions = document.querySelectorAll(".shape-option");
const gameLog = document.getElementById("game-log");

let deck = [];
let currentPlayer = 1;
let selectedShape = null;
let stackCount = 0;
let stackType = null;

const shapes = ["circle", "triangle", "cross", "rectangle", "star"];
const whotCard = { number: 20, shape: "whot" };

const allowedCards = {
  circle: [1,2,3,4,5,7,8,10,11,12,13,14],
  triangle: [1,2,3,4,5,7,8,10,11,12,13,14],
  cross: [1,2,3,5,7,10,11,13,14],
  rectangle: [1,2,3,5,7,10,11,13,14],
  star: [1,2,3,4,5,7,8]
};

function showActionMessage(msg) {
  actionMessage.textContent = msg;
  setTimeout(() => actionMessage.textContent = "", 30000); // Message stays for 30 seconds
}

function log(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  gameLog.appendChild(entry);
  gameLog.scrollTop = gameLog.scrollHeight;
}

function createDeck() {
  deck = [];
  for (const shape in allowedCards) {
    for (const num of allowedCards[shape]) {
      deck.push({ number: num, shape });
    }
  }
  for (let i = 0; i < 5; i++) deck.push({ ...whotCard }); // Add 5 WHOT cards

  // Ensure the total number of cards is exactly 54
  const totalCards = Object.values(allowedCards).reduce((sum, nums) => sum + nums.length, 0) * shapes.length + 5;
  if (totalCards !== 54) {
    console.error(`Deck creation error: Expected 54 cards, but got ${totalCards}`);
  } else {
    console.log(`Deck created successfully with ${totalCards} cards.`);
  }

  shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function dealCards(count = 5) {
  for (let i = 0; i < count; i++) {
    drawCard(player1Hand, true);
    drawCard(player2Hand, false);
  }

  let startingCard = deck.pop();
  while ([1, 2, 5, 8, 14, 20].includes(startingCard.number)) {
    // If the starting card is a power card, put it back and draw another
    deck.unshift(startingCard);
    startingCard = deck.pop();
  }

  playPile.appendChild(createCardElement(startingCard));
  handleStartingCard(startingCard);
}

function drawCard(hand, visible) {
  if (deck.length === 0) {
    const pileCards = Array.from(playPile.children).slice(0, -1).map(el => el.card); // Exclude the leading card
    if (pileCards.length > 0) {
      shuffle(pileCards);
      deck.push(...pileCards);
      const lastCard = playPile.lastChild; // Keep the leading card
      playPile.innerHTML = "";
      playPile.appendChild(lastCard);
      log("Market was exhausted. Refilled with stack.");
      drawPile.classList.add("refilled");
      setTimeout(() => drawPile.classList.remove("refilled"), 1000);
    } else {
      log("Market is empty. No cards left to draw.");
      return;
    }
  }
  if (deck.length === 0) return;
  const card = deck.pop();
  const cardEl = createCardElement(card, visible);
  hand.appendChild(cardEl);
  updateCardCounts(); // Update the draw pile count
}

function createCardElement(card, visible = true) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.dataset.shape = visible ? card.shape : "back";
  if (visible && card.number !== 20) {
    const numberEl = document.createElement("div");
    numberEl.className = "card-number";
    numberEl.textContent = card.number;
    cardEl.appendChild(numberEl);
  } else if (visible && card.number === 20) {
    cardEl.dataset.shape = "whot";
  }
  if (visible) {
    cardEl.addEventListener("click", () => playCard(cardEl, card));
  }
  cardEl.card = card;
  return cardEl;
}

function playCard(cardEl, card) {
  const topCard = playPile.lastChild?.card;
  if (
    card.shape === "whot" ||
    card.shape === topCard?.shape ||
    card.number === topCard?.number ||
    (topCard?.shape === "whot" && card.shape === selectedShape)
  ) {
    if (currentPlayer === 1) {
      player1Hand.removeChild(cardEl);
    } else {
      player2Hand.removeChild(cardEl);
    }
    playPile.innerHTML = "";
    playPile.appendChild(cardEl);

    // Prevent WHOT-20 action from being triggered by other action cards
    if (topCard?.shape === "whot" && card.number !== 20) {
      selectedShape = null;
    }

    if ([1, 2, 5, 8, 14, 20].includes(card.number)) {
      handleSpecialCard(card); // Only handle power cards
    } else {
      log(`${currentPlayer === 1 ? "Player 1" : "AI"} played a neutral card.`);
      showActionMessage(`${currentPlayer === 1 ? "Player 1" : "AI"} played a neutral card.`);
      setTimeout(() => endTurn(), 1000); // Ensure the turn switches to the next player
    }

    // Disable further card plays for the current turn
    Array.from(player1Hand.children).forEach(cardEl => cardEl.style.pointerEvents = "none");
    Array.from(player2Hand.children).forEach(cardEl => cardEl.style.pointerEvents = "none");

    // Check for winning condition
    if (currentPlayer === 1 && player1Hand.children.length === 0) {
      return endGame("Player 1");
    } else if (currentPlayer === 2 && player2Hand.children.length === 0) {
      return endGame("AI");
    }
  } else {
    log("Invalid move. You cannot play this card.");
    showActionMessage("Invalid move. Try again.");
  }
}

function handleSpecialCard(card) {
  const playerName = currentPlayer === 1 ? "Player 1" : "AI";

  if (card.number === 14) { // General Market
    log(`General Market from ${playerName}!`);
    showActionMessage(`General Market from ${playerName}!`);
    const nextPlayer = currentPlayer === 1 ? player2Hand : player1Hand;
    const nextPlayerVisible = currentPlayer === 2; // Player 1's cards are visible
    setTimeout(() => {
      log(`${currentPlayer === 1 ? "AI" : "Player 1"} picks 1 card from the market.`);
      showActionMessage(`${currentPlayer === 1 ? "AI" : "Player 1"} picks 1 card from the market.`);
      drawCard(nextPlayer, nextPlayerVisible); // Opponent draws 1 card
      setTimeout(() => {
        stackCount = 0; // Reset stack count after General Market
        stackType = null;
        reEnableCardInteractions(); // Re-enable card interactions
        if (currentPlayer === 2) {
          setTimeout(aiPlay, 1000); // Ensure AI continues its turn
        } else {
          updateStatus(); // Keep the turn with the current player
        }
      }, 1000); // Delay for better observation
    }, 1000);
  } else if (card.number === 20) { // WHOT
    if (currentPlayer === 1) {
      log("WHOT! Choose a shape.");
      shapeModal.style.display = "flex";
      shapeOptions.forEach(opt => {
        opt.onclick = () => {
          selectedShape = opt.dataset.shape;
          shapeModal.style.display = "none";
          log(`Player chose ${selectedShape} as the new shape.`);
          showActionMessage(`Player 1 needs ${selectedShape}!`);
          playPile.lastChild.card.shape = selectedShape; // Apply the selected shape to the WHOT card
          setTimeout(() => {
            endTurn(); // Switch to the other player's turn
          }, 1000);
        };
      });
    } else {
      // AI chooses a shape from its deck
      const aiShapes = Array.from(player2Hand.children).map(cardEl => cardEl.card.shape);
      const validShapes = shapes.filter(shape => aiShapes.includes(shape));
      selectedShape = validShapes.length > 0 
        ? validShapes[Math.floor(Math.random() * validShapes.length)] 
        : shapes[Math.floor(Math.random() * shapes.length)]; // Fallback to any shape if no valid shapes
      log(`AI chose ${selectedShape} as the new shape.`);
      showActionMessage(`AI needs ${selectedShape}!`);
      playPile.lastChild.card.shape = selectedShape; // Apply the selected shape to the WHOT card
      setTimeout(() => {
        endTurn(); // Switch to the other player's turn
      }, 1000);
    }
  } else if (card.number === 2) { // Pick Two
    log(`Pick Two from ${playerName}!`);
    showActionMessage(`Pick Two from ${playerName}!`);
    const nextPlayer = currentPlayer === 1 ? player2Hand : player1Hand;
    const nextPlayerVisible = currentPlayer === 2;

    // Check if the next player can counter
    const canCounter = Array.from(nextPlayer.children).some(cardEl => cardEl.card.number === 2);
    if (canCounter) {
      const blockerName = currentPlayer === 1 ? "AI" : "Player 1";
      log(`${blockerName} blocked the pick 2!`);
      showActionMessage(`${blockerName} blocked the pick 2!`);
      stackCount = 0; // Reset the stack count since it was blocked
      stackType = null;
      endTurn(); // Switch to the next player's turn
      return;
    }

    setTimeout(() => {
      log(`${currentPlayer === 1 ? "AI" : "Player 1"} picks 2 cards from the market.`);
      showActionMessage(`${currentPlayer === 1 ? "AI" : "Player 1"} picks 2 cards from the market.`);
      for (let i = 0; i < 2; i++) {
        setTimeout(() => drawCard(nextPlayer, nextPlayerVisible), i * 1000); // Delay between each card draw
      }
      setTimeout(() => {
        stackCount = 0; // Reset stack count after drawing
        stackType = null;
        if (currentPlayer === 2) {
          setTimeout(aiPlay, 1000); // Ensure AI continues its turn
        } else {
          reEnableCardInteractions(); // Re-enable card interactions
          updateStatus(); // Keep the turn with the current player
        }
      }, 3000); // Adjusted delay to account for card draws
    }, 1000);
  } else if (card.number === 5) { // Pick Three
    log(`Pick Three from ${playerName}!`);
    showActionMessage(`Pick Three from ${playerName}!`);
    const nextPlayer = currentPlayer === 1 ? player2Hand : player1Hand;
    const nextPlayerVisible = currentPlayer === 2;

    // Check if the next player can counter
    const canCounter = Array.from(nextPlayer.children).some(cardEl => cardEl.card.number === 5);
    if (canCounter) {
      const blockerName = currentPlayer === 1 ? "AI" : "Player 1";
      log(`${blockerName} blocked the pick 3!`);
      showActionMessage(`${blockerName} blocked the pick 3!`);
      stackCount = 0; // Reset the stack count since it was blocked
      stackType = null;
      endTurn(); // Switch to the next player's turn
      return;
    }

    setTimeout(() => {
      log(`${currentPlayer === 1 ? "AI" : "Player 1"} picks 3 cards from the market.`);
      showActionMessage(`${currentPlayer === 1 ? "AI" : "Player 1"} picks 3 cards from the market.`);
      for (let i = 0; i < 3; i++) {
        setTimeout(() => drawCard(nextPlayer, nextPlayerVisible), i * 1000); // Delay between each card draw
      }
      setTimeout(() => {
        stackCount = 0; // Reset stack count after drawing
        stackType = null;
        if (currentPlayer === 2) {
          setTimeout(aiPlay, 1000); // Ensure AI continues its turn
        } else {
          reEnableCardInteractions(); // Re-enable card interactions
          updateStatus(); // Keep the turn with the current player
        }
      }, 4000); // Adjusted delay to account for card draws
    }, 1000);
  } else if (card.number === 8) { // Suspension
    log(`Suspension from ${playerName}!`);
    showActionMessage(`Suspension from ${playerName}!`);
    setTimeout(() => {
      log(`${playerName} must play another card.`);
      if (currentPlayer === 2) {
        setTimeout(aiPlay, 1000); // Ensure AI continues its turn
      } else {
        reEnableCardInteractions(); // Re-enable card interactions
        updateStatus(); // Keep the current player
      }
    }, 1000); // Added delay for better observation
  } else if (card.number === 1) { // Hold On
    log(`Hold On from ${playerName}!`);
    showActionMessage(`Hold On from ${playerName}!`);
    setTimeout(() => {
      log(`${playerName} must play another card.`);
      if (currentPlayer === 2) {
        setTimeout(aiPlay, 1000); // Ensure AI continues its turn
      } else {
        reEnableCardInteractions(); // Re-enable card interactions
        updateStatus(); // Keep the current player
      }
    }, 1000); // Added delay for better observation
  }
}

function reEnableCardInteractions() {
  // Re-enable card interactions for the current player
  if (currentPlayer === 1) {
    Array.from(player1Hand.children).forEach(cardEl => cardEl.style.pointerEvents = "auto");
  } else {
    Array.from(player2Hand.children).forEach(cardEl => cardEl.style.pointerEvents = "auto");
  }
}

function endTurn() {
  // Re-enable card plays for the next player
  if (currentPlayer === 1) {
    Array.from(player2Hand.children).forEach(cardEl => cardEl.style.pointerEvents = "auto");
  } else {
    Array.from(player1Hand.children).forEach(cardEl => cardEl.style.pointerEvents = "auto");
  }

  // Check if the current player has won before switching turns
  if (currentPlayer === 1 && player1Hand.children.length === 0) {
    return endGame("Player 1");
  } else if (currentPlayer === 2 && player2Hand.children.length === 0) {
    return endGame("AI");
  }

  // Switch turns
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateStatus();

  // Trigger AI's turn if it's AI's turn
  if (currentPlayer === 2) {
    setTimeout(aiPlay, 3000); // Add delay for AI's response
  }
}

function aiPlay() {
  const aiHand = Array.from(player2Hand.children);
  const topCard = playPile.lastChild?.card;

  // AI logic to find a playable card
  const playableCardEl = aiHand.find(cardEl => {
    const card = cardEl.card;
    return (
      card.shape === "whot" ||
      card.shape === topCard?.shape ||
      card.number === topCard?.number ||
      (topCard?.shape === "whot" && card.shape === selectedShape)
    );
  });

  if (playableCardEl) {
    const playableCard = playableCardEl.card;
    log("AI played a card.");
    player2Hand.removeChild(playableCardEl); // Remove the card from AI's hand
    const playedCardEl = createCardElement(playableCard, true); // Create a visible card for the play pile
    playPile.innerHTML = ""; // Clear the play pile
    playPile.appendChild(playedCardEl); // Add the played card to the play pile

    // Handle special cards or end turn for neutral cards
    if ([1, 2, 5, 8, 14, 20].includes(playableCard.number)) {
      handleSpecialCard(playableCard); // Handle any special effects of the card
    } else {
      log("AI played a neutral card.");
      showActionMessage("AI played a neutral card.");
      setTimeout(() => endTurn(), 1000); // Add delay before ending the turn
    }

    // Check for winning condition
    if (player2Hand.children.length === 0) {
      endGame("AI");
      return; // Stop further execution after the game ends
    }
  } else {
    // Handle cases where AI cannot play a card
    if (stackCount > 0) {
      log(`AI picks ${stackCount} cards from the market.`);
      showActionMessage(`AI picks ${stackCount} cards from the market.`);
      for (let i = 0; i < stackCount; i++) {
        setTimeout(() => drawCard(player2Hand, false), i * 1000); // Add delay between each card draw
      }
      setTimeout(() => {
        stackCount = 0;
        stackType = null;
        endTurn(); // Ensure the turn switches to the other player
      }, stackCount * 1000 + 500); // Adjust delay to account for all card draws
    } else {
      log("AI draws a card from the market.");
      showActionMessage("AI draws a card from the market.");
      setTimeout(() => {
        drawCard(player2Hand, false); // AI's drawn cards remain hidden
        endTurn(); // Ensure the turn switches to the other player
      }, 1000); // Add delay before ending the turn
    }
  }
}

function updateCardCounts() {
  const drawCount = deck.length;
  let marketDisplay = document.getElementById("market-count-display");
  if (!marketDisplay) {
    marketDisplay = document.createElement("div");
    marketDisplay.id = "market-count-display";
    marketDisplay.style.textAlign = "center";
    marketDisplay.style.fontSize = "0.9em";
    marketDisplay.style.marginTop = "3px";
    document.querySelector(".game-header").appendChild(marketDisplay);
  }
  marketDisplay.textContent = `Market: ${drawCount} card(s)`;
  const p1Count = player1Hand.children.length;
  const p2Count = player2Hand.children.length;
  let countDisplay = document.getElementById("card-count-display");
  if (!countDisplay) {
    countDisplay = document.createElement("div");
    countDisplay.id = "card-count-display";
    countDisplay.style.textAlign = "center";
    countDisplay.style.fontSize = "0.9em";
    countDisplay.style.marginTop = "5px";
    document.querySelector(".game-header").appendChild(countDisplay);
  }
  countDisplay.textContent = `Player 1: ${p1Count} card(s) | AI: ${p2Count} card(s)`;
}

function checkDoubleTurn() {
  const top = playPile.lastChild?.card;
  if (!top) return false;
  return top.number === 1 || top.number === 8;
}

function updateStatus() {
  const isDoubleTurn = checkDoubleTurn();
  gameStatus.classList.toggle("double-turn", isDoubleTurn);
  gameStatus.textContent = currentPlayer === 1 ? "Player 1's Turn" : "AI's Turn";
}

function handleStartingCard(card) {
  const playerAffected = player1Hand;
  if (card.number === 14) {
    log("Game started with General Market!");
    drawCard(playerAffected, true);
  } else if (card.number === 2) {
    log("Game started with Pick Two!");
    drawCard(playerAffected, true);
    drawCard(playerAffected, true);
    stackCount = 2;
    stackType = 2;
  } else if (card.number === 5) {
    log("Game started with Pick Three!");
    drawCard(playerAffected, true);
    drawCard(playerAffected, true);
    drawCard(playerAffected, true);
    stackCount = 3;
    stackType = 5;
  } else if (card.number === 8) {
    log("Game started with Skip!");
    currentPlayer = 2;
  } else if (card.number === 1) {
    log("Game started with Hold On! Player 1 plays again.");
    currentPlayer = 1;
  } else if (card.number === 20) {
    log("Game started with WHOT! Player 1 must choose a shape.");
    shapeModal.style.display = "flex";
    shapeOptions.forEach(opt => {
      opt.onclick = () => {
        selectedShape = opt.dataset.shape;
        shapeModal.style.display = "none";
        log(`Player 1 chose ${selectedShape} as WHOT start.`);
        showActionMessage(`Player 1 needs ${selectedShape}!`);
        playPile.lastChild.card.shape = selectedShape;
        currentPlayer = 2; // Switch to the opponent's turn
        updateStatus();
      };
    });
  }
}

function endGame(winner) {
  alert(`${winner} wins the game!`);
  log(`${winner} wins the game!`);
  drawPile.removeEventListener("click", drawHandler);
}

function drawHandler() {
  if (currentPlayer === 1) {
    if (stackCount > 0) {
      log(`Player 1 picks ${stackCount} cards from the market.`);
      showActionMessage(`Player 1 picks ${stackCount} cards from the market.`);
      for (let i = 0; i < stackCount; i++) drawCard(player1Hand, true);
      stackCount = 0;
      stackType = null;
    } else {
      log("Player 1 draws a card from the market.");
      showActionMessage("Player 1 draws a card from the market.");
      drawCard(player1Hand, true);
    }
    currentPlayer = 2;
    updateStatus();
    setTimeout(aiPlay, 1000);
  }
}

drawPile.addEventListener("click", drawHandler);
updateCardCounts();

// Initialize game
createDeck();
dealCards();
updateStatus();
log("Game started!");
