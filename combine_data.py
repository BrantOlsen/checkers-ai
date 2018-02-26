import json
import numpy
import os

def RewriteDataToCSV(folder, player_one_or_two, label):
  csv_file = open(os.path.join('./data/', player_one_or_two +'.csv'), 'a')
  for file in os.listdir(folder):
    if ('.' + player_one_or_two + '.' in file):
      print(file)
      data = json.load(open(os.path.join(folder, file)));
      for board in data:
        board_data = numpy.asarray(board['board_state']).reshape(-1)
        numpy.putmask(board_data, board_data == 'W', 5)
        numpy.putmask(board_data, board_data == 'w', 4)
        numpy.putmask(board_data, board_data == 'B', 3)
        numpy.putmask(board_data, board_data == 'b', 2)
        numpy.putmask(board_data, board_data == '0', 1)
        for state in board_data:
          csv_file.write(state + ',')
        csv_file.write(str(label))
        csv_file.write('\n')
      
RewriteDataToCSV('./data/win', 'w', 1)
RewriteDataToCSV('./data/lose', 'w', 0)

RewriteDataToCSV('./data/win', 'b', 1)
RewriteDataToCSV('./data/lose', 'b', 0)