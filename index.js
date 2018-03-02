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
  
  this.SelectMove = function(valid_moves, board) {
    if (valid_moves.length == 0) {
      return null;
    }
    
    return valid_moves[getRandomInt(valid_moves.length)]
  };
}

function SmartPlayer(symbol, direction) {
  this.symbol = symbol;
  this.direction = direction;
  
  this.SelectMove = function(valid_moves, board) {
    if (valid_moves.length == 0) {
      return null;
    }
    
    var board_states = [];
    console.log("Orig Board:");
    console.log(board.board_state);
    for (let i = 0; i < valid_moves.length; ++i) {
      (function(index) {
        let new_board = board.Copy();
        new_board.MakeMove(valid_moves[i]);
        board_states.push(new_board.board_state);
        console.log("New Board (" + i + "):");
        console.log(new_board.board_state);
      })(i);
    }
         
    const fs = require('fs');
    const ex = require('child_process');
    fs.writeFileSync('./predict.json', JSON.stringify(board_states));
    ex.execSync('python train.py --predict ./predict.json');
    var predictions = JSON.parse(fs.readFileSync('./predictions.json'));
    // [{"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}, {"class_id": 0, "probability": 1.0}]
    var index_to_use = 0;
    var max_prob = 0;
    var using_losing_move = true;
    for (let i = 0; i < predictions.length; ++i) {
      if (predictions[i].class_id == 1 && (max_prob < predictions[i].probability || using_losing_move)) {
        index_to_use = i;
        max_prob = predictions[i].probability;
        using_losing_move = false;
      }
      else if (predictions[i].class_id == 0 && max_prob > predictions[i].probability && using_losing_move) {
        index_to_use = i;
        max_prob = predictions[i].probability;
      }
    }
    console.log(predictions);
    console.log(predictions[index_to_use]);
    return valid_moves[index_to_use]
  };
}

function Move(from, to, removes) {
  this.from = from;
  this.to = to;
  this.removes = removes || [];
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
  
  this.Copy = function() {
    let copy = new Board();
    copy.board_state = this.board_state.map(function(arr) {
        return arr.slice();
    });
    return copy;
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
  
  // Find all valid moves for the given cell.
  this.FindValidMoveForCell = function(player, i, j) {
    let valid_moves = [];
    
    let checks = [
      [player.direction, 1],
      [player.direction, -1]
    ];
    // Add the KING movements.
    if (this.board_state[i][j] == player.symbol.toUpperCase()) {
      checks.push([-1 * player.direction, 1]);
      checks.push([-1 * player.direction, -1]);
    }
    
    if (this.board_state[i][j].toLowerCase() == player.symbol) {
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
              let diag_jump_move = new Move([i,j], diag_jump, [diag])
              // Jump moves need to search for a second jump.
              let potential_board = this.Copy();
              potential_board.MakeMove(diag_jump_move);
              // Check if a second or more jump is possible after the first.
              let diag_jump_move_addtl = potential_board.FindValidMoveForCell(player, diag_jump[0], diag_jump[1])
                .filter((value) => { return value.removes.length != 0 });
              if (diag_jump_move_addtl.length > 0) {
                // Add moves for each possible additional jumps.
                for (let m = 0; m < diag_jump_move_addtl.length; ++m) {
                  let diag_jump_move_add = new Move([i,j], diag_jump_move_addtl[m].to, diag_jump_move.removes.concat(diag_jump_move_addtl[m].removes));
                  valid_moves.push(diag_jump_move_add);
                }
              }
              // No second jump is possible so just add these.
              else {
                valid_moves.push(diag_jump_move);
              }
            }
          }
        }
      }
    }

    return valid_moves;
  };
  
  // Find all valid moves for the user.
  this.FindValidMoves = function(player) {
    let valid_moves = [];
    
    for (let i = 0; i < this.board_height; ++i) {
      for (let j = 0; j < this.board_width; ++j) {
        let new_moves = this.FindValidMoveForCell(player, i, j)
        valid_moves = valid_moves.concat(new_moves);
      }
    }
    
    // Jump moves are required to be taken first.
    var jump_moves = valid_moves.filter(m => {return m.removes.length > 0});
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
    for (let i = 0; i < move.removes.length; ++i) {
      if (this.debug) {
        console.log("Removing " + this.board_state[move.removes[i][0]][move.removes[i][1]] + " from " + move.removes + ".");
      }
      this.board_state[move.removes[i][0]][move.removes[i][1]] = this.empty_space;
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
  this.player_one_board_states = [];
  this.player_two = new SmartPlayer('w', this.up);
  this.player_two_board_states = [];
  this.board = new Board();
  this.board.Init(this.player_one, this.player_two);
  
  // Print the current board state.
  this.Print = function () {
    console.log(this.board.board_state);
  };
  
  this.WriteToFile = function(object_to_write, folder, identifier) {
    if (IsWebPage()) {
      return;
    }
    
    const fs = require('fs');
    let dir = "./data/" + folder + "/";
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    
    fs.writeFile(dir + Date.now() + "." + identifier + ".json", JSON.stringify(object_to_write), function(err) {
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
      this.board.MakeMove(this.player_one.SelectMove(player_one_moves, this.board));
    }
    this.player_one_board_states.push(this.board.Copy());

    this.CheckForKings();
    this.board.Draw(this.player_one, this.player_two);
    if (this.debug) {
      console.log('');
      this.Print();
    }

    let player_two_moves = this.board.FindValidMoves(this.player_two);
    if (player_two_moves.length > 0) {
      this.board.MakeMove(this.player_two.SelectMove(player_two_moves, this.board));
    }
    this.player_two_board_states.push(this.board.Copy());

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
      $('#result').text(winner);
    }
    else {
      this.WriteToFile(this.player_one_board_states, winner == this.player_one.symbol ? 'win' : 'lose', this.player_one.symbol);
      this.WriteToFile(this.player_two_board_states, winner == this.player_two.symbol ? 'win' : 'lose', this.player_two.symbol);
      console.log(winner);
    }
  };
}

let num_of_games_to_play = 1;
for (let i = 0; i < num_of_games_to_play; ++i) {
  var b = new Game();
  b.debug = false;
  //b.Print();
  b.AutoNextMove();
}