from collections import namedtuple
from enum import Enum
from itertools import chain, cycle
from random import randint

Coord = namedtuple('Point', ['x', 'y'])


class GameState(Enum):
    ERROR = 0
    WAITING_FOR_PLAYERS = 1
    PLACING_SHIPS = 2
    PLAYING = 3
    PLAYER_WON = 4
    COMPUTER_WON = 5


class ShipType(Enum):
    CARRIER = 5
    BATTLESHIP = 4
    CRUISER = 3
    SUBMARINE = 3
    DESTROYER = 2


class Orientation(Enum):
    HORIZONTAL = 1
    VERTICAL = 2


class Ship():

    ship_coordinates_all = []

    def __init__(self, type: ShipType, coord: Coord = None, orientation: Orientation = Orientation.HORIZONTAL):
        self.coord = coord
        self.type = type

        match type:
            case ShipType.CARRIER:
                self.size = 5
            case ShipType.BATTLESHIP:
                self.size = 4
            case ShipType.CRUISER:
                self.size = 3
            case ShipType.SUBMARINE:
                self.size = 3
            case ShipType.DESTROYER:
                self.size = 2
            case _:
                raise ValueError(f"Unknown ship type: {type}")

        self.hits = 0
        self.orientation = orientation
    
    def is_placed(self):
        return self.coord is not None

    @staticmethod
    def convert_grid_coord(grid_coord: str) -> Coord:
        """Convert grid coordinates (e.g., 'A1') to Coord object (e.g., Coord(1, 1))"""
        if not grid_coord or len(grid_coord) < 2:
            raise ValueError("Invalid grid coordinate")
        letter = grid_coord[0].upper()
        number = int(grid_coord[1:])
        if not ('A' <= letter <= 'J') or not (1 <= number <= 10):
            raise ValueError("Coordinate out of bounds")
        return Coord(number, ord(letter) - ord('A') + 1)

    @staticmethod
    def convert_to_grid_coord(coord: Coord) -> str:
        """Convert Coord object (e.g., Coord(1, 1)) to grid coordinates (e.g., 'A1')"""
        if not (1 <= coord.x <= 10) or not (1 <= coord.y <= 10):
            raise ValueError("Coordinate out of bounds")
        letter = chr(ord('A') + coord.y - 1)
        return f"{letter}{coord.x}"
    
    def __str__(self):
        return f"{self.type.name} at {self.coord} facing {self.orientation.name}"

    def __repr__(self):
        return f"Ship(type={self.type.name}, coord={self.coord}, orientation={self.orientation.name})"

class Player:
    '''
    A class representing a player in the Battleships game.
    The player has a 10x10 grid where ships can be placed and shots can be tracked.
    The grid uses the following representation:
        0: Empty space
        1: Ship
        2: Hit ship
        -1: Missed shot (hit on empty space)
    Attributes:
        grid (list of list of int): A 10x10 2D array representing the player's game board
    '''
    def __init__(self):
        self.ocean_grid = [[0 for _ in range(10)] for _ in range(10)]
        self.placed_ships = []
        
        self.carrier = Ship(ShipType.CARRIER)
        self.battleship = Ship(ShipType.BATTLESHIP)
        self.cruiser = Ship(ShipType.CRUISER)
        self.submarine = Ship(ShipType.SUBMARINE)
        self.destroyer = Ship(ShipType.DESTROYER)

        self.unplaced_ships = [self.carrier, 
                               self.battleship, 
                               self.cruiser, 
                               self.submarine, 
                               self.destroyer]

    def place_ship(self, ship: Ship):
        if ship.coord is None:
            raise ValueError("Ship coordinates cannot be None")

        if not ship.is_placed():
            self.unplaced_ships.remove(ship)
            self.placed_ships.append(ship)
        
        if ship.orientation == Orientation.HORIZONTAL:
            for x in range(ship.coord.x, ship.coord.x + ship.size):
                if x > 10:
                    raise ValueError("Ship placement out of bounds")
                self.ocean_grid[ship.coord.y - 1][x - 1] = 1
        else:  # VERTICAL
            for y in range(ship.coord.y, ship.coord.y + ship.size):
                if y > 10:
                    raise ValueError("Ship placement out of bounds")
                self.ocean_grid[y - 1][ship.coord.x - 1] = 1
    
    def fire(self, coord: Coord):
        if self.ocean_grid[coord.y - 1][coord.x - 1] == 1:  # Hit
            self.ocean_grid[coord.y - 1][coord.x - 1] = 2
            return True
        else:  # Miss
            self.ocean_grid[coord.y - 1][coord.x - 1] = -1
            return False
        
    def validate_ship_placement(self, ship: Ship, coord: Coord) -> bool:
        try:
            # Check if coordinates are within bounds
            if not (1 <= coord.x <= 10 and 1 <= coord.y <= 10):
                return False

            # Check if ship would extend beyond grid
            if ship.orientation == Orientation.HORIZONTAL:
                if coord.x + ship.size - 1 > 10:
                    return False
                check_range = [(coord.y - 1, x - 1) for x in range(coord.x, coord.x + ship.size)]
            else:  # VERTICAL
                if coord.y + ship.size - 1 > 10:
                    return False
                check_range = [(y - 1, coord.x - 1) for y in range(coord.y, coord.y + ship.size)]

            # Check if any part of ship would overlap with existing ships
            for y, x in check_range:
                if self.ocean_grid[y][x] != 0:
                    return False

            if ship.coord is None:
                ship.coord = coord
            return True
        except IndexError:
            return False



class Computer(Player):
    def __init__(self):
        super().__init__()

    def place_ships(self):
        for ship in self.unplaced_ships:
            while True:
                x = randint(1, 10)
                y = randint(1, 10)
                orientation = Orientation(randint(1, 2))
                ship.coord = Coord(x, y)
                ship.orientation = orientation
                if self.validate_ship_placement(ship, ship.coord):
                    self.place_ship(ship)
                    break

    def fire(self, coord: Coord):
        if self.ocean_grid[coord.y - 1][coord.x - 1] == 1:  # Hit
            self.ocean_grid[coord.y - 1][coord.x - 1] = 2
            return True
        else:  # Miss
            self.ocean_grid[coord.y - 1][coord.x - 1] = -1
            return False

    def validate_fire(self, coord: Coord) -> bool:
        try:
            if self.ocean_grid[coord.y - 1][coord.x - 1] in [0, 1]:
                return True
            else:
                return False
        except IndexError:
            return False


class Game:
    def __init__(self):
        self.state = GameState.PLACING_SHIPS
        self.players = Player(), Computer()
        self.player, self.opponent = self.players
        self.turn = cycle(self.players)
        self.current_player = next(self.turn)

    def check_win(self):
        flat_player_list = list(chain(*self.player.ocean_grid[:]))
        flat_opponent_list = list(chain(*self.opponent.ocean_grid[:]))

        if 1 in flat_opponent_list and 1 in flat_player_list:
            pass
        elif not (1 in flat_opponent_list):
            self.state = GameState.PLAYER_WON
        elif not (1 in flat_player_list):
            self.state = GameState.COMPUTER_WON

        return self.state