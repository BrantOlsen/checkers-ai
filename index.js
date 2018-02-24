console.log("Hello World")

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function Player(symbol, direction) {
  this.symbol = symbol;
  this.direction = direction;
}

function Board() {
  let self = this;
  self.debug = false;
  self.down = 1;
  self.up = -1;
  self.board_width = 8;
  self.board_height = 8;
  self.empty_space = '0';
  self.board_div = typeof jQuery != 'undefined' ? $('#board') : null;
  
  self.player_one = new Player('b', self.down);
  self.player_two = new Player('w', self.up);
  self.board_state = [];
  for (let i = 0; i < self.board_height; ++i) {
    self.board_state.push([]);
    for (let j = 0; j < self.board_width; ++j) {
      if (i < 2) {
        self.board_state[i].push(self.player_one.symbol);
      }
      else if (i > 5) {
        self.board_state[i].push(self.player_two.symbol);
      }
      else {
        self.board_state[i].push(self.empty_space);
      }
    }
  }
  
  // Print the current board state.
  self.Print = function () {
    console.log(this.board_state);
  };
  
  // Check if there is a winner on the board.
  self.CheckWinner = function() {
    let found_player_one = false;
    let found_player_two = false;
    
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
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
  };
  
  // Check if either player has peices on the opposite side of the map and turn them
  // into KINGs.
  self.CheckForKings = function() {
    for (let i = 0; i < this.board_width; ++i) {
      if (this.board_state[0][i] == this.player_two.symbol) {
        this.board_state[0][i] = this.player_two.symbol.toUpperCase();
      }
      if (this.board_state[this.board_height - 1][i] == this.player_one.symbol) {
        this.board_state[0][i] = this.player_one.symbol.toUpperCase();
      }
    }
  };
  
  self.IsMoveValid = function(to) {
    if (to[0] >= this.board_height || to[0] < 0) {
      return false;
    }
    else if (to[1] >= this.board_width || to[1] < 0) {
      return false;
    }
    
    return this.board_state[to[0]][to[1]] == this.empty_space;
  };
  
  // Find all valid moves for the user.
  self.FindValidMoves = function(player) {
    let valid_moves = [];
    
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        if (this.board_state[i][j] == self.empty_space) {
          // Do nothing as there is nothing here.
        }
        else if (this.board_state[i][j] == player.symbol){
          // To the Right Diag
          right_diag = [i+player.direction, j+1];
          if (this.IsMoveValid(right_diag)) {
            valid_moves.push({from:[i,j], to:right_diag});
          }
          // To the Left Diag
          left_diag = [i+player.direction, j-1];
          if (this.IsMoveValid(left_diag)) {
            valid_moves.push({from:[i,j], to:right_diag});
          }
        }
      }
    }
    
    return valid_moves;
  };
  
  self.MakeMove = function(player, from_to) {
    if (this.debug) {
      console.log("Moving " + player.symbol + " from " + from_to.from + " to " + from_to.to + ".");
    }
    this.board_state[from_to.from[0]][from_to.from[1]] = self.empty_space ;
    this.board_state[from_to.to[0]][from_to.to[1]] = player.symbol;
  };
  
  self.Draw = function() {
    if (self.board_div == null || self.board_div.length == 0) {
      return;
    }
    
    // Init the divs.
    if (self.board_div.children().length == 0) {
      for (let i = 0; i < this.board_height; ++i) {
        let $row = $('<div></div>').appendTo(self.board_div);
        for (let j = 0; j < this.board_width; ++j) {
          $row.append('<div id="' + i + "_" + j + '" style="display: inline-block; width: 40px; height: 40px; border: 1px solid green"></div>');
        }
      }
    }
    
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        self.board_div.find('#' + i + "_" + j).css('background-color', this.board_state[i][j] == this.player_one.symbol ? 'black' : this.board_state[i][j] == this.player_two.symbol ? 'white' : 'gray')
      }
    }
  };
  
  self.AutoNextMove = function() {
    let player_one_moves = this.FindValidMoves(this.player_one);
    if (player_one_moves.length > 0) {
      this.MakeMove(this.player_one, player_one_moves[getRandomInt(player_one_moves.length)]);
    }

    let player_two_moves = this.FindValidMoves(this.player_two);
    if (player_two_moves.length > 0) {
      this.MakeMove(this.player_two, player_two_moves[getRandomInt(player_two_moves.length)]);
    }

    this.CheckForKings();
    if (this.debug) {
      console.log('');
      this.Print();
    }
    this.Draw();
    if (this.CheckWinner() == '') {
      setTimeout(function() { self.AutoNextMove(); }, 500);
    }
    else {
      console.log(this.CheckWinner());
    }
  };
}

var b = new Board();
b.debug = true;
b.Print();
b.AutoNextMove();
console.log('Winner: ' + b.CheckWinner());