import json
import numpy
import os

def RewriteDataToCSV(folder, player_one_or_two, label, csv_file, write_labels=False):
  for file in os.listdir(folder):
    if ('.' + player_one_or_two + '.' in file):
      print(file)
      data = json.load(open(os.path.join(folder, file)));
      for board in data:
        # Convert the board data into a single row of values.
        board_data = numpy.asarray(board['board_state']).reshape(-1)
        numpy.putmask(board_data, board_data == 'W', 5)
        numpy.putmask(board_data, board_data == 'w', 4)
        numpy.putmask(board_data, board_data == 'B', 3)
        numpy.putmask(board_data, board_data == 'b', 2)
        numpy.putmask(board_data, board_data == '0', 1)
        
        # Write out the header row for the csv file.
        if (write_labels):
          i = 0
          for state in board_data:
            csv_file.write(str(i) + ',')
            i = i + 1
          csv_file.write('Win')
          csv_file.write('\n')
          write_labels = False
        
        # Write each board cell to the row and then add the win label at the end.
        for state in board_data:
          csv_file.write(state + ',')
        csv_file.write(str(label))
        csv_file.write('\n')

csv_file_white = open(os.path.join('./data/w.csv'), 'w')
RewriteDataToCSV('./data/win', 'w', 1, csv_file_white, True)
RewriteDataToCSV('./data/lose', 'w', 0, csv_file_white)

csv_file_black = open(os.path.join('./data/b.csv'), 'w')   
RewriteDataToCSV('./data/win', 'b', 1, csv_file_black, True)
RewriteDataToCSV('./data/lose', 'b', 0, csv_file_black)