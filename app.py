from game import Computer, Game, GameState, Orientation, Player, ShipType, Ship, Coord

from flask import Flask, render_template, request, jsonify

from pprint import pp
from random import randint

app = Flask(__name__)

game = None

@app.before_request
def initialize_game():
    global game
    if game is None:
        game = Game()
        game.opponent.place_ships()
        if not any(game.opponent.ocean_grid):
            raise ValueError("Opponent's ships not placed correctly.")

@app.route('/')
def home():
    return render_template('index.html', game_state=game.state.value)

@app.route('/game-state')
def get_game_state():
    pp(game.opponent.ocean_grid)
    return jsonify({'state': game.state.value})

@app.route('/place-ship', methods=['POST'])
def place_ship():
    data = request.get_json()
    ship_type = data['type']
    position = data['position']
    orientation = data['orientation']

    try:
        # Update the game state with the placed ship
        position = Ship.convert_grid_coord(position)

        match ship_type:
            case 'carrier':
                ship = Ship(ShipType.CARRIER, position, Orientation[orientation.upper()])
            case 'battleship':
                ship = Ship(ShipType.BATTLESHIP, position, Orientation[orientation.upper()])
            case 'cruiser':
                ship = Ship(ShipType.CRUISER, position, Orientation[orientation.upper()])
            case 'submarine':
                ship = Ship(ShipType.SUBMARINE, position, Orientation[orientation.upper()])
            case 'destroyer':
                ship = Ship(ShipType.DESTROYER, position, Orientation[orientation.upper()])

        game.player.place_ship(ship)
        
        # Check if all ships are placed
        if not game.player.unplaced_ships:
            game.state = GameState.PLAYING

        return jsonify({
            'success': True,
            'gameState': game.state.value
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/update-grid')
def update_grid():
    # from pprint import pp
    # pp(game.player.ocean_grid)
    return jsonify({
        'grid': game.player.ocean_grid
    })

@app.route('/target-grid')
def get_target_grid():
    return jsonify({
        'grid': game.opponent.ocean_grid
    })

@app.route('/update-game-state', methods=['POST'])
def update_game_state():
    data = request.get_json()
    new_state = data.get('state')
    if new_state is not None:
        game.state = GameState(new_state)
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'No state provided'}), 400

@app.route('/update-ship-list', methods=['GET'])
def get_unplaced_ships():
    unplaced_ships = [
        {
            'type': ship.type.name.lower(),
            'size': ship.size,
            'placed': ship.is_placed()
        }
        for ship in game.player.unplaced_ships
    ]
    return jsonify({
        'success': True,
        'ships': unplaced_ships
    })

@app.route('/update-target-grid', methods=['GET', 'POST'])
def update_target_grid():
    if request.method == 'POST':
        data = request.get_json()
        target_coord = Ship.convert_grid_coord(data['target'])
        try:
            hit = game.opponent.fire(target_coord)
            return jsonify({
                'success': True,
                'result': 'hit' if hit else 'miss'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    else:  # GET request
        return jsonify({
            'success': True,
            'grid': game.opponent.ocean_grid
        })

@app.route('/computer-turn', methods=['POST'])
def computer_turn():
    try:
        # Generate random coordinates for computer's shot
        x = randint(1, 10)
        y = randint(1, 10)
        coord = Coord(x, y)
        
        # Fire at player's grid
        hit = game.player.fire(coord)
        
        return jsonify({
            'success': True,
            'coord': Ship.convert_to_grid_coord(coord),
            'result': 'hit' if hit else 'miss'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/check-game-state', methods=['GET'])
def check_game_state():
    game.check_win()
    if game.state == GameState.PLAYING:
        return jsonify({'game_over': False})
    elif game.state == GameState.PLAYER_WON:
        return jsonify({'game_over': True, 'winner': 'player'})
    elif game.state == GameState.COMPUTER_WON:
        return jsonify({'game_over': True, 'winner': 'computer'})
    else:
        return jsonify({'game_over': False})

@app.route('/reset-game', methods=['POST']) # TODO
def reset_game():
    global game
    try:
        game = Game()
        game.opponent.place_ships()
        return jsonify({
            'success': True,
            'state': game.state.value
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True)