"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Get initial game state
  const gameState = {
    WAITING_FOR_PLAYERS: 1,
    PLACING_SHIPS: 2,
    PLAYING: 3,
    GAME_OVER: 4,
  };

  let currentState = 1; // Start with WAITING_FOR_PLAYERS state

  function updateGameState() {
    fetch("/game-state")
      .then((response) => response.json())
      .then((data) => {
        currentState = data.state;
        updateUI();
      });
  }

  function updateUI() {
    const shipsContainer = document.getElementById("ships-container");
    const oceanGrid = document.getElementById("ocean-grid");
    const targetGrid = document.getElementById("target-grid");

    switch (currentState) {
      case gameState.PLACING_SHIPS:
        shipsContainer.style.display = "block";
        targetGrid.style.pointerEvents = "none";
        break;
      case gameState.PLAYING:
        shipsContainer.style.display = "none";
        targetGrid.style.pointerEvents = "auto";
        break;
      // Add other states as needed
    }
  }

  // Poll for state updates every few seconds
  setInterval(updateGameState, 3000);
});
