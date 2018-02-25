console.log("Hello World")

function IsWebPage() {
  return typeof jQuery != 'undefined';
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function Player(symbol, direction) {
  this.symbol = symbol;
  this.direction = direction;
  
  this.SelectMove = function(valid_moves) {
    if (valid_moves.length == 0) {
      return null;
    }
    
    return valid_moves[getRandomInt(valid_moves.length)]
  };
}

function Move(from, to, removes) {
  this.from = from;
  this.to = to;
  this.removes = removes || null;
}

function Board() {
  this.board_width = 8;
  this.board_height = 8;
  this.board_div = IsWebPage() ? $('#board') : null;
  this.board_state = [];
  this.empty_space = '0';
  
  // Init the board with player one and player two pieces.
  this.Init = function (player_one, player_two) {
    for (let i = 0; i < this.board_height; ++i) {
      this.board_state.push([]);
      for (let j = 0; j < this.board_width; ++j) {
        if (i < 2) {
          this.board_state[i].push(player_one.symbol);
        }
        else if (i > 5) {
          this.board_state[i].push(player_two.symbol);
        }
        else {
          this.board_state[i].push(this.empty_space);
        }
      }
    }
  };
  
  // Make sure the potential move is on the board at all.
  this.IsMoveInBounds = function(to) {
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
  this.IsMoveValid = function(to) {
    return this.IsMoveInBounds(to) && this.board_state[to[0]][to[1]] == this.empty_space;
  };
  
  
  // Find all valid moves for the user.
  this.FindValidMoves = function(player) {
    let valid_moves = [];
    
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        if (this.board_state[i][j] == this.empty_space) {
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
  this.MakeMove = function(move) {
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
  this.Draw = function(player_one, player_two) {
    if (this.board_div == null || this.board_div.length == 0) {
      return;
    }
    
    // Init the divs.
    if (this.board_div.children().length == 0) {
      for (let i = 0; i < this.board_height; ++i) {
        let $row = $('<div></div>').appendTo(this.board_div);
        for (let j = 0; j < this.board_width; ++j) {
          $row.append('<div id="' + i + "_" + j + '" class="cell"></div>');
        }
      }
    }
    
    let white_count = 0;
    let black_count = 0;
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        white_count += this.board_state[i][j].toLowerCase() == player_two.symbol.toLowerCase() ? 1 : 0;
        black_count += this.board_state[i][j].toLowerCase() == player_one.symbol.toLowerCase() ? 1 : 0;
       
        this.board_div.find('#' + i + "_" + j)
          .toggleClass('black', this.board_state[i][j].toLowerCase() == player_one.symbol)
          .toggleClass('white', this.board_state[i][j].toLowerCase() == player_two.symbol)
          .html(player_one.symbol.toUpperCase() == this.board_state[i][j] || player_two.symbol.toUpperCase() == this.board_state[i][j] ? "K" : "&nbsp;");
      }
    }
    
    $('#black-score').text(black_count);
    $('#white-score').text(white_count);
  };
}

function Game() {
  this.debug = false;
  this.down = 1;
  this.up = -1;
  this.turns_with_only_kings = 0;
  this.turns_with_only_kings_threshold = 100;
  this.player_one = new Player('b', this.down);
  this.player_two = new Player('w', this.up);
  this.board = new Board();
  this.board.Init(this.player_one, this.player_two);
  
  // Print the current board state.
  this.Print = function () {
    console.log(this.board.board_state);
  };
  
  this.WriteToFile = function(folder) {
    if (IsWebPage()) {
      return;
    }
    
    const fs = require('fs');
    let dir = "./data/" + folder + "/";
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    
    fs.writeFile(dir + Date.now() + "." + folder + ".json", JSON.stringify(this.board.board_state), function(err) {
      if(err) {
          return console.log(err);
      }
    });
  };
  
  // Check if there is a winner on the board.
  this.CheckWinner = function() {
    let found_player_one = false;
    let found_player_two = false;
    let only_kings = true;
    
    for (let i = 0; i < this.board.board_height; ++i) {
      for (let j = 0; j < this.board.board_width; ++j) {
        let cell_value = this.board.board_state[i][j];
        if (!found_player_one) {
          found_player_one = cell_value.toLowerCase() == this.player_one.symbol;
        }
        if (!found_player_two) {
          found_player_two = cell_value.toLowerCase() == this.player_two.symbol;
        }
        only_kings = only_kings && (cell_value == this.board.empty_space || cell_value == this.player_one.symbol.toUpperCase() || cell_value == this.player_two.symbol.toUpperCase());
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
  this.CheckForKings = function() {
    for (let i = 0; i < this.board.board_width; ++i) {
      if (this.board.board_state[0][i] == this.player_two.symbol) {
        this.board.board_state[0][i] = this.player_two.symbol.toUpperCase();
      }
      if (this.board.board_state[this.board.board_height - 1][i] == this.player_one.symbol) {
        this.board.board_state[this.board.board_height - 1][i] = this.player_one.symbol.toUpperCase();
      }
    }
  };
  
  this.AutoNextMove = function() {
    let player_one_moves = this.board.FindValidMoves(this.player_one);
    if (player_one_moves.length > 0) {
      this.board.MakeMove(this.player_one.SelectMove(player_one_moves));
    }
    this.WriteToFile("white");

    this.CheckForKings();
    this.board.Draw(this.player_one, this.player_two);
    if (this.debug) {
      console.log('');
      this.Print();
    }

    let player_two_moves = this.board.FindValidMoves(this.player_two);
    if (player_two_moves.length > 0) {
      this.board.MakeMove(this.player_two.SelectMove(player_two_moves));
    }
    this.WriteToFile("black");

    this.CheckForKings();
    this.board.Draw(this.player_one, this.player_two);

    if (this.debug) {
      console.log('');
      this.Print();
    }

    let winner = this.CheckWinner();
    if (winner == '') {
      let self = this;
      setTimeout(function() { self.AutoNextMove(); }, 0);
    }
    else if (IsWebPage()) {
      $('#result').text(this.CheckWinner());
    }
    else {
      if (winner == 'w') {
        
      }
    }
  };
}

var b = new Game();
b.debug = true;
b.Print();
b.AutoNextMove();