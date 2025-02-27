from collections import namedtuple
from enum import Enum
from itertools import cycle
from random import randint

Coord = namedtuple('Point', ['x', 'y'])


class GameState(Enum):
    ERROR = 0
    WAITING_FOR_PLAYERS = 1
    PLACING_SHIPS = 2
    PLAYING = 3
    GAME_OVER = 4


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

    def place(self):
        raise NotImplementedError()

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
        self.unplaced_ships = [Ship(ShipType.CARRIER), 
                               Ship(ShipType.BATTLESHIP), 
                               Ship(ShipType.CRUISER), 
                               Ship(ShipType.SUBMARINE), 
                               Ship(ShipType.DESTROYER)]


class Computer(Player):
    def __init__(self):
        super().__init__()


class Game:
    def __init__(self):
        self.state = GameState.PLACING_SHIPS
        self.players = Player(), Computer()
        self.player, self.opponent = self.players
        self.turn = cycle(self.players)
        self.current_player = next(self.turn)

