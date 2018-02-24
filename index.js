console.log("Hello World")

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function Player(symbol, direction) {
  this.symbol = symbol;
  this.direction = direction;
}

function Move(from, to, removes) {
  this.from = from;
  this.to = to;
  this.removes = removes || null;
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
  self.turns_with_only_kings = 0;
  self.turns_with_only_kings_threshold = 100;
  
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
    let only_kings = true;
    
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        if (!found_player_one) {
          found_player_one = this.board_state[i][j].toLowerCase() == this.player_one.symbol;
        }
        if (!found_player_two) {
          found_player_two = this.board_state[i][j].toLowerCase() == this.player_two.symbol;
        }
        only_kings = only_kings && (this.board_state[i][j] == this.empty_space || this.board_state[i][j] == this.player_one.symbol.toUpperCase() || this.board_state[i][j] == this.player_two.symbol.toUpperCase());
      }
    }
    
    if (only_kings) {
      this.turns_with_only_kings += 1;
    }
    
    return this.turns_with_only_kings > this.turns_with_only_kings_threshold ? 'DRAW' :
           found_player_one && found_player_two ? '' : 
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
        this.board_state[this.board_height - 1][i] = this.player_one.symbol.toUpperCase();
      }
    }
  };
  
  // Make sure the potential move is on the board at all.
  self.IsMoveInBounds = function(to) {
    if (to[0] >= this.board_height || to[0] < 0) {
      return false;
    }
    else if (to[1] >= this.board_width || to[1] < 0) {
      return false;
    }
    else {
      return true;
    }
  };
  
  // Check if something can move to the given cell.
  self.IsMoveValid = function(to) {
    return this.IsMoveInBounds(to) && this.board_state[to[0]][to[1]] == this.empty_space;
  };
  
  // Find all valid moves for the user.
  self.FindValidMoves = function(player) {
    let valid_moves = [];
    
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        if (this.board_state[i][j] == self.empty_space) {
          // Do nothing as there is nothing here.
        }
        else if (this.board_state[i][j].toLowerCase() == player.symbol){
          let checks = [
            [player.direction, 1],
            [player.direction, -1]
          ];
          // Add the KING movements.
          if (this.board_state[i][j] == player.symbol.toUpperCase()) {
            checks.push([-1 * player.direction, 1]);
            checks.push([-1 * player.direction, -1]);
          }
          
          for (let k = 0; k < checks.length; ++k) {
            diag = [i+checks[k][0], j+checks[k][1]];
            if (this.IsMoveValid(diag)) {
              valid_moves.push(new Move([i,j], diag, null));
            }
            else if (this.IsMoveInBounds(diag)) {
              diag_jump_symbol = this.board_state[diag[0]][diag[1]].toLowerCase();
              if (diag_jump_symbol != this.empty_space && diag_jump_symbol != player.symbol) {
                diag_jump = [i+2*checks[k][0],j+2*checks[k][1]];
                if (this.IsMoveValid(diag_jump)) {
                  valid_moves.push(new Move([i,j], diag_jump, diag));
                }
              }
            }
          }
        }
      }
    }
    
    // Jump moves are required to be taken first.
    var jump_moves = valid_moves.filter(m => {return m.removes != null});
    if (jump_moves.length > 0) {
      return jump_moves
    }
    else {
      return valid_moves;
    }
  };
  
  // Execute the given move. The player is to determine the new cells symbol.
  self.MakeMove = function(move) {
    let from_symbol = this.board_state[move.from[0]][move.from[1]];
    if (this.debug) {
      console.log("Moving " + from_symbol + " from " + move.from + " to " + move.to + ".");
    }
    this.board_state[move.from[0]][move.from[1]] = this.empty_space;
    this.board_state[move.to[0]][move.to[1]] = from_symbol;
    if (move.removes != null) {
      if (this.debug) {
        console.log("Removing " + this.board_state[move.removes[0]][move.removes[1]] + " from " + move.removes + ".");
      }
      this.board_state[move.removes[0]][move.removes[1]] = this.empty_space;
    }
  };
  
  // Draw the board state onto the DOM.
  self.Draw = function() {
    if (self.board_div == null || self.board_div.length == 0) {
      return;
    }
    
    // Init the divs.
    if (self.board_div.children().length == 0) {
      for (let i = 0; i < this.board_height; ++i) {
        let $row = $('<div></div>').appendTo(self.board_div);
        for (let j = 0; j < this.board_width; ++j) {
          $row.append('<div id="' + i + "_" + j + '" class="cell"></div>');
        }
      }
    }
    
    let white_count = 0;
    let black_count = 0;
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        white_count += this.board_state[i][j].toLowerCase() == this.player_two.symbol.toLowerCase() ? 1 : 0;
        black_count += this.board_state[i][j].toLowerCase() == this.player_one.symbol.toLowerCase() ? 1 : 0;
       
        self.board_div.find('#' + i + "_" + j)
          .toggleClass('black', this.board_state[i][j].toLowerCase() == this.player_one.symbol)
          .toggleClass('white', this.board_state[i][j].toLowerCase() == this.player_two.symbol)
          .html(this.player_one.symbol.toUpperCase() == this.board_state[i][j] || this.player_two.symbol.toUpperCase() == this.board_state[i][j] ? "K" : "&nbsp;");
      }
    }
    
    $('#black-score').text(black_count);
    $('#white-score').text(white_count);
  };
  
  self.AutoNextMove = function() {
    let player_one_moves = this.FindValidMoves(this.player_one);
    if (player_one_moves.length > 0) {
      this.MakeMove(player_one_moves[getRandomInt(player_one_moves.length)]);
    }

    this.CheckForKings();
    this.Draw();
    if (this.debug) {
      console.log('');
      this.Print();
    }

    let player_two_moves = this.FindValidMoves(this.player_two);
    if (player_two_moves.length > 0) {
      this.MakeMove(player_two_moves[getRandomInt(player_two_moves.length)]);
    }

    this.CheckForKings();
    this.Draw();

    if (this.debug) {
      console.log('');
      this.Print();
    }

    if (this.CheckWinner() == '') {
      setTimeout(function() { self.AutoNextMove(); }, 0);
    }
    else {
      $('#result').text(this.CheckWinner());
    }
  };
}

var b = new Board();
b.debug = true;
b.Print();
b.AutoNextMove();