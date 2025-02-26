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
    print(game)
    return render_template('index.html', game_state=game.state.value)

@app.route('/game-state')
def get_game_state():
    return jsonify({'state': game.state.value})

if __name__ == '__main__':
    app.run(debug=True)