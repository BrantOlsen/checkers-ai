import pandas
import tensorflow as tf

WHITE_FILE = "./data/w.csv"
BLACK_FILE = "./data/b.csv"

def maybe_download():
    train_path = tf.keras.utils.get_file(TRAIN_URL.split('/')[-1], TRAIN_URL)
    test_path = tf.keras.utils.get_file(TEST_URL.split('/')[-1], TEST_URL)

    return train_path, test_path

def load_data(y_name='Win'):
    """Convert the csv file into training and test data"""
    data = pandas.read_csv(WHITE_FILE, header=0)
    total_rows = data.shape[0]

    train_data = pandas.DataFrame(data.take(range(0, int(total_rows*.6 ))))
    test_data = pandas.DataFrame(data.take(range(int(total_rows*.6)+1, total_rows - 1)))

    train_x, train_y = train_data, train_data.pop(y_name)
    test_x, test_y = test_data, test_data.pop(y_name)

    return (train_x, train_y), (test_x, test_y)


def train_input_fn(features, labels, batch_size):
    """An input function for training"""
    # Convert the inputs to a Dataset.
    dataset = tf.data.Dataset.from_tensor_slices((dict(features), labels))

    # Shuffle, repeat, and batch the examples.
    dataset = dataset.shuffle(1000).repeat().batch(batch_size)

    # Return the dataset.
    return dataset


def eval_input_fn(features, labels, batch_size):
    """An input function for evaluation or prediction"""
    features=dict(features)
    if labels is None:
        # No labels, use only features.
        inputs = features
    else:
        inputs = (features, labels)

    # Convert the inputs to a Dataset.
    dataset = tf.data.Dataset.from_tensor_slices(inputs)

    # Batch the examples
    assert batch_size is not None, "batch_size must not be None"
    dataset = dataset.batch(batch_size)

    # Return the dataset.
    return dataset