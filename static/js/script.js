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
  PLAYER_WON: 4,
  COMPUTER_WON: 5,
};

const shipOrientation = {
  HORIZONTAL: "&#x2194;",
  VERTICAL: "&#x2195;",
};

document.addEventListener("DOMContentLoaded", () => {
  let currentState = gameState.WAITING_FOR_PLAYERS;

  function updateGameState() {
    updateShipList();
    displaytargetGrid();
    updateGrid();
    fetch("/game-state")
      .then((response) => response.json())
      .then((data) => {
        currentState = data.state;
        console.log(`Current State Updated: ${currentState}`); // Debug log
        console.log("Ships:", ships);
        if (currentState === gameState.PLACING_SHIPS && ships.length === 0) {
          fetch("/update-game-state", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              state: gameState.PLAYING,
            }),
          }).catch((error) =>
            console.error("Error updating game state:", error)
          );
        }
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
        document.getElementById("game-state").textContent = "PLAYING";
        break;
      // Add other states later
    }
  }

  function updateShipList() {
    fetch("/update-ship-list")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update the local ships array based on server data
          data.ships.forEach((serverShip) => {
            const localShip = ships.find(
              (ship) => ship.type === serverShip.type
            );
            if (localShip) {
              localShip.placed = serverShip.placed;
            }
          });
        } else {
          console.error("Failed to get ship list:", data.error);
        }
      })
      .catch((error) => console.error("Error getting ship list:", error));
  }

  function displaytargetGrid() {
    fetch("/update-target-grid")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error || "Failed to update target grid");
        }
        const grid = data.grid;
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
            const letter = String.fromCharCode(65 + y);
            const cell = document.querySelector(
              `#target-grid #${letter}${x + 1}`
            );
            if (cell) {
              cell.classList.remove("hit", "miss");
              switch (grid[y][x]) {
                case 2:
                  cell.classList.add("hit");
                  break;
                case -1:
                  cell.classList.add("miss");
                  break;
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error updating target grid:", error);
      });
  }

  function updateGrid() {
    fetch("/update-grid")
      .then((response) => response.json())
      .then((data) => {
        const grid = data.grid;
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
            const letter = String.fromCharCode(65 + y);
            const cell = document.querySelector(
              `#ocean-grid #${letter}${x + 1}`
            );
            cell.classList.remove("ship", "hit", "miss");

            switch (grid[y][x]) {
              case 1:
                cell.classList.add("ship");
                break;
              case 2:
                cell.classList.add("hit");
                break;
              case -1:
                cell.classList.add("miss");
                break;
            }
          }
        }
      })
      .catch((error) => console.error("Error updating grid:", error));
  }

  function resetGame() {
    fetch("/reset-game", {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Reset local game state
          currentState = data.state;

          // Clear grids
          const cells = document.querySelectorAll(
            ".grid td:not(.header-col):not(.corner)"
          );
          cells.forEach((cell) => {
            cell.classList.remove("ship", "hit", "miss");
          });

          // Reset ships container
          shipsContainer.innerHTML = `
                <h2>Ships</h2>
                <ul class="ships-list">
                    <li><div class="ship carrier" draggable="true" data-ship-length="5">
                        <div class="ship-preview">◼◼◼◼◼</div>
                        <p>Carrier (5)<span class="orientation-indicator">↔</span></p>
                    </div></li>
                    <!-- Add other ships here -->
                </ul>
            `;

          // Reinitialize ships
          shipElements = Array.from(document.querySelectorAll(".ship"));
          ships = shipElements.map((shipElement) => ({
            element: shipElement,
            type: shipElement.classList[1],
            length: parseInt(shipElement.dataset.shipLength),
            placed: false,
            orientation: "horizontal",
            position: null,
          }));

          // Reset UI
          updateUI();

          // Reattach event listeners
          attachEventListeners();

          console.log("Game reset successfully");
        } else {
          console.error("Failed to reset game:", data.error);
        }
      })
      .catch((error) => console.error("Error resetting game:", error));
  }

  // Add reset button event listener
  document.getElementById("reset-game").addEventListener("click", resetGame);

  // Function to reattach event listeners
  function attachEventListeners() {
    shipElements.forEach((shipElement) => {
      shipElement.addEventListener("contextmenu", handleShipOrientation);
      shipElement.addEventListener("click", handleShipSelection);
    });
  }

  function placeShip(ship, cell) {
    // Validate ship placement first
    if (!validateShipPlacement(ship, cell)) {
      console.error("Invalid ship placement");
      return;
    }

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

  function validateShipPlacement(ship, cell) {
    // Extract x and y coordinates from cell ID (e.g., 'A1' -> x=1, y=1)
    const x = parseInt(cell.id.substring(1));
    const y = cell.id.charCodeAt(0) - 64; // 'A'=1, 'B'=2, etc.

    // Check if coordinates are within bounds
    if (x < 1 || x > 10 || y < 1 || y > 10) {
      return false;
    }

    // Check if ship would extend beyond grid
    if (ship.orientation === "horizontal") {
      if (x + ship.length - 1 > 10) {
        return false;
      }
    } else {
      // vertical
      if (y + ship.length - 1 > 10) {
        return false;
      }
    }

    // Check if any part of ship would overlap with existing ships
    const checkRange =
      ship.orientation === "horizontal"
        ? Array.from(
            { length: ship.length },
            (_, i) => `${String.fromCharCode(y + 64)}${x + i}`
          )
        : Array.from(
            { length: ship.length },
            (_, i) => `${String.fromCharCode(y + i + 64)}${x}`
          );

    return checkRange.every(
      (id) =>
        !document.querySelector(`#ocean-grid #${id}`).classList.contains("ship")
    );
  }

  function fireTorpedo(cell) {
    if (!validateFireTorpedo(cell)) {
      return;
    }

    console.log("Firing torpedo at:", cell.id);
    fetch("/update-target-grid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: cell.id,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update cell appearance based on hit/miss
          updateTargetCell(cell, data.result);
          checkGameOver();
          // Computer's turn
          //   setTimeout(() => {}, 500);
          computerTurn();
        }
      })
      .catch((error) => console.error("Error firing torpedo:", error));
  }

  function validateFireTorpedo(cell) {
    // Check if cell is already hit or missed
    if (cell.classList.contains("hit") || cell.classList.contains("miss")) {
      console.error("Cell already hit or missed");
      return false;
    }

    // Check if cell is valid
    if (!cell.id) {
      console.error("Invalid cell");
      return false;
    }

    return true;
  }

  function checkGameOver() {
    fetch("/check-game-state")
      .then((response) => response.json())
      .then((data) => {
        if (data.gameOver) {
          currentState = gameState.GAME_OVER;
          updateUI();
          alert(`Game Over! ${data.winner} wins!`);
        }
      });
  }

  function updateTargetCell(cell, result) {
    if (result === "hit") {
      console.log(`Hit on ${cell.id}`);
      cell.classList.add("hit");
    } else {
      console.log(`Miss on ${cell.id}`);
      cell.classList.add("miss");
    }
  }

  function computerTurn() {
    fetch("/computer-turn", {
      method: "POST",
    })
      .then((data) => {
        if (data.success) {
          updateGrid(); // Update ocean grid to show computer's shot
          checkGameOver();
        }
      })
      .catch((error) => console.error("Error in computer turn:", error));
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

  targetGrid.addEventListener("click", (event) => {
    if (currentState === gameState.PLAYING) {
      const cell = event.target;
      if (
        !cell.id ||
        cell.classList.contains("header-col") ||
        cell.classList.contains("corner") ||
        cell.classList.contains("hit") ||
        cell.classList.contains("miss")
      ) {
        return;
      }
      fireTorpedo(cell);
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
