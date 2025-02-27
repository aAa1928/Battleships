"use strict";

const shipsContainer = document.getElementById("ships-container");
const oceanGrid = document.getElementById("ocean-grid");
const targetGrid = document.getElementById("target-grid");

const shipElements = Array.from(document.querySelectorAll(".ship"));

const ships = shipElements.map((shipElement) => ({
  element: shipElement,
  type: shipElement.classList[1], // carrier, battleship, etc.
  length: parseInt(shipElement.dataset.shipLength),
  placed: false,
  orientation: "horizontal",
  position: null,
}));

const gameState = {
  ERROR: 0,
  WAITING_FOR_PLAYERS: 1,
  PLACING_SHIPS: 2,
  PLAYING: 3,
  GAME_OVER: 4,
};

const shipOrientation = {
  HORIZONTAL: "&#x2194;",
  VERTICAL: "&#x2195;",
};

document.addEventListener("DOMContentLoaded", () => {
  let currentState = gameState.WAITING_FOR_PLAYERS;

  function updateGameState() {
    fetch("/game-state")
      .then((response) => response.json())
      .then((data) => {
        currentState = data.state;
        console.log(`Current State Updated: ${currentState}`); // Debug log
        console.log("Ships:", ships);
        updateUI();
      })
      .catch((error) => console.error("Error fetching game state:", error));
  }

  function updateUI() {
    switch (currentState) {
      case gameState.PLACING_SHIPS:
        shipsContainer.style.display = "block";
        targetGrid.style.pointerEvents = "none";
        break;
      case gameState.PLAYING:
        shipsContainer.style.display = "none";
        targetGrid.style.pointerEvents = "auto";
        break;
      // Add other states later
    }
  }

  let selectedShip = null;

  shipElements.forEach((shipElement) => {
    shipElement.addEventListener("click", () => {
      selectedShip = ships.find((ship) => ship.element === shipElement);
      console.log("Selected ship:", selectedShip);
    });
  });

  oceanGrid.addEventListener("click", (event) => {
    if (currentState === gameState.PLACING_SHIPS) {
      if (!selectedShip || !event.target.id) return;

      const cell = event.target;
      cell.classList.add("ship");

      selectedShip.placed = true;
      selectedShip.position = cell.id;

      const index = ships.indexOf(selectedShip);
      if (index > -1) {
        ships.splice(index, 1);
        selectedShip.element.remove();
      }

      selectedShip = null;
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !event.target.closest("#ocean-grid") &&
      !event.target.closest("#ships-container") &&
      selectedShip
    ) {
      selectedShip = null;
      console.log("Ship deselected");
    }
  });

  updateGameState();
  setInterval(updateGameState, 3000);
});
