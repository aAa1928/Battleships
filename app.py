from game import Computer, Game, GameState, Orientation, Player, ShipType, Ship

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

game = None

@app.before_request
def initialize_game():
    global game
    if game is None:
        game = Game()  

@app.route('/')
def home():
    return render_template('index.html', game_state=game.state.value)

@app.route('/game-state')
def get_game_state():
    print(f'Ship list: {game.player.unplaced_ships.__len__()}')
    print('\n')
    print(*[unplaced_ship for unplaced_ship in game.player.unplaced_ships], sep='\n')
    print('\n')
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

if __name__ == '__main__':
    app.run(debug=True)