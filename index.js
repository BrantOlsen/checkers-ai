console.log("Hello World")

function Player(symbol) {
  this.symbol = symbol;
}

function Board() {
  let self = this;
  self.player_one = new Player('b');
  self.player_two = new Player('w');
  self.board_state = [];
  for (let i = 0; i < 8; ++i) {
    self.board_state.push([]);
    for (let j = 0; j < 8; ++j) {
      if (i < 2) {
        self.board_state[i].push(self.player_one.symbol);
      }
      else if (i > 5) {
        self.board_state[i].push(self.player_two.symbol);
      }
      else {
        self.board_state[i].push(0);
      }
    }
  }
  
  // Print the current board state.
  self.Print = function () {
    console.log(this.board_state);
  }
  
  // Check if there is a winner on the board.
  self.CheckWinner = function() {
    let found_player_one = false;
    let found_player_two = false;
    
    for (let i = 0; i < 8; ++i) {
      for (let j = 0; j < 8; ++j) {
        if (!found_player_one) {
          found_player_one = this.board_state[i][j] == this.player_one.symbol;
        }
        else if (!found_player_two) {
          found_player_two = this.board_state[i][j] == this.player_two.symbol;
        }
      }
    }
    
    return found_player_one && found_player_two ? '' : 
           !found_player_one && found_player_two ? this.player_two.symbol :
           this.player_one.symbol;
  }
}

var b = new Board();
b.Print();
console.log('Winner: ' + b.CheckWinner());