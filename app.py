from game import Computer, Game, GameState, Orientation, Player, ShipType, Ship

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

game = None

@app.before_request
def initialize_game():
    global game
    if game is None:
        game = Game()  
        print(game.state.value)  

@app.route('/')
def home():
    print(game.state.value)
    return render_template('index.html', game_state=game.state.value)

@app.route('/game-state')
def get_game_state():
    return jsonify({'state': game.state.value})

@app.route('/place-ship', methods=['POST'])
def place_ship():
    data = request.get_json()
    ship_type = data['type']
    position = data['position']
    orientation = data['orientation']

    try:
        # Update the game state with the placed ship
        ship = Ship(ShipType[ship_type.upper()], position, Orientation[orientation.upper()])
        game.player.place_ship(ship)
        
        # Check if all ships are placed
        if all(ship.placed for ship in game.player.ships):
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

if __name__ == '__main__':
    app.run(debug=True)