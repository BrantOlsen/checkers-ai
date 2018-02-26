import json
import numpy
import tensorflow as tf
import os

def LoadData(folder, player_one_or_two):
  training_data = []
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
        training_data.append(board_data)
  print(tf.size(training_data))
      
with tf.Session() as sess:
  LoadData('./data/win', 'w')
  