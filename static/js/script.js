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

  function convertToGridCoordinates(cellId) {
    const row = cellId.charAt(1) - 1; // Convert '1' to 0, '2' to 1, etc.
    const col =
      cellId.charAt(0).toUpperCase().charCodeAt(0) - "A".charCodeAt(0); // Convert 'A' to 0, 'B' to 1, etc.
    return { row, col };
  }

  function updateGrid() {
    fetch("/update-grid")
      .then((response) => response.json())
      .then((data) => {
        const grid = data.grid;
        console.log("Grid Data:", grid); // Debug log
        const cells = oceanGrid.getElementsByTagName("td");

        for (let cell of cells) {
          if (
            !cell.classList.contains("header-col") &&
            !cell.classList.contains("corner")
          ) {
            // Remove all possible state classes
            cell.classList.remove("ship", "hit", "miss");

            const coords = convertToGridCoordinates(cell.id);
            switch (grid[coords.row][coords.col]) {
              case 1:
                console.log("Ship found at cell:", cell.id); // Debug log
                cell.classList.add("ship");
                break;
              case 2:
                console.log("Hit at cell:", cell.id); // Debug log
                cell.classList.add("hit");
                break;
              case -1:
                console.log("Miss at cell:", cell.id); // Debug log
                cell.classList.add("miss");
                break;
            }
          }
        }
      })
      .catch((error) => console.error("Error updating grid:", error));
  }

  function placeShip(ship, cell) {
    // Send ship placement to server
    fetch("/place-ship", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: ship.type,
        position: cell.id,
        orientation: ship.orientation,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update UI
          cell.classList.add("ship");
          ship.placed = true;
          ship.position = cell.id;

          // Remove ship from selection
          const index = ships.indexOf(ship);
          if (index > -1) {
            ships.splice(index, 1);
            ship.element.remove();
          }

          // Update game state if returned
          if (data.gameState) {
            currentState = data.gameState;
            updateUI();
          }
        } else {
          console.error("Failed to place ship:", data.error);
        }
      })
      .catch((error) => console.error("Error placing ship:", error));
  }

  function validateShipPlacement() {
    // Logic to validate ship placement
  }

  let selectedShip = null;

  shipElements.forEach((shipElement) => {
    // Add right-click handler for orientation toggle
    shipElement.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent context menu from showing

      const ship = ships.find((s) => s.element === shipElement);
      const orientationIndicator = shipElement.querySelector(
        ".orientation-indicator"
      );

      if (ship.orientation === "horizontal") {
        ship.orientation = "vertical";
        orientationIndicator.innerHTML = shipOrientation.VERTICAL;
      } else {
        ship.orientation = "horizontal";
        orientationIndicator.innerHTML = shipOrientation.HORIZONTAL;
      }

      console.log(`${ship.type} orientation changed to ${ship.orientation}`);
    });

    shipElement.addEventListener("click", () => {
      selectedShip = ships.find((ship) => ship.element === shipElement);
      console.log("Selected ship:", selectedShip);
    });
  });

  oceanGrid.addEventListener("click", (event) => {
    if (currentState === gameState.PLACING_SHIPS) {
      if (!selectedShip || !event.target.id) return;
      if (
        event.target.classList.contains("header-col") ||
        event.target.classList.contains("corner")
      )
        return;

      placeShip(selectedShip, event.target);
      selectedShip = null;
    }

    updateGrid();
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
