#  Copyright 2016 The TensorFlow Authors. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""An Example of a DNNClassifier for the Iris dataset."""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import tensorflow as tf
import checkers_data
import json
import combine_data
import numpy

parser = argparse.ArgumentParser()
parser.add_argument('--batch_size', default=100, type=int, help='batch size')
parser.add_argument('--train_steps', default=1000, type=int, help='number of training steps')
parser.add_argument('--log_dir', default='./logs', type=str, help='directory to put logs for TensorBoard')
parser.add_argument('--predict', default=None, type=str, help='predict json')

def main(argv):
  args = parser.parse_args(argv[1:])
  if not tf.gfile.Exists(args.log_dir):
    tf.gfile.MakeDirs(args.log_dir)
   
  # Fetch the data
  (train_x, train_y), (test_x, test_y) = checkers_data.load_data()

  # Feature columns describe how to use the input.
  my_feature_columns = []
  for key in train_x.keys():
      my_feature_columns.append(tf.feature_column.numeric_column(key=key))

  # Build 2 hidden layer DNN with 10, 10 units respectively.
  classifier = tf.estimator.DNNClassifier(
      feature_columns=my_feature_columns,
      # Two hidden layers of 10 nodes each.
      hidden_units=[8, 8],
      # The model must choose between 3 classes.
      n_classes=3,
      model_dir=args.log_dir)

  if (args.predict is None):
    for i in range(1,3):
      # Train the Model.
      classifier.train(
          input_fn=lambda:checkers_data.train_input_fn(train_x, train_y, args.batch_size),
          steps=args.train_steps)

      # Evaluate the model.
      eval_result = classifier.evaluate(
          input_fn=lambda:checkers_data.eval_input_fn(test_x, test_y, args.batch_size))
      print (eval_result)
      print('\nTest set accuracy: {:0.3f}\n'.format(eval_result.get('accuracy')))
  else:
    predict_input = json.load(open(args.predict, 'r'))
    predict_input_as_array= [];
    for px in predict_input:
      predict_input_as_array.append(combine_data.ConvertBoardStateToRow(px))
    predict_input_as_dict = dict()
    for i in range(len(predict_input_as_array)):
      for j in range(len(predict_input_as_array[i])):
        key = str(j)
        if (key in predict_input_as_dict):
          predict_input_as_dict[key].append(int(predict_input_as_array[i][j]))
        else:
          predict_input_as_dict[key] = [int(predict_input_as_array[i][j])]
    
    predictions = classifier.predict(
        input_fn=lambda:checkers_data.eval_input_fn(predict_input_as_dict,
                                                labels=None,
                                                batch_size=args.batch_size))
    predict_array = []
    for pred in predictions:
      predict_dict = dict();
      predict_dict['class_id'] = numpy.asscalar(pred['class_ids'][0])
      predict_dict['probability'] = numpy.asscalar(pred['probabilities'][predict_dict['class_id']])
      predict_array.append(predict_dict)
    print(predict_array)
    
    with open('predictions.json', 'w') as outfile:
      json.dump(predict_array, outfile)
      
tf.logging.set_verbosity(tf.logging.ERROR)
tf.app.run(main)