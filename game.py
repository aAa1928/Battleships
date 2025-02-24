from collections import namedtuple
from enum import Enum

Coord = namedtuple('Point', ['x', 'y'])

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
    def __init__(self, type: ShipType, coord: Coord = None, orientation: Orientation = None):
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