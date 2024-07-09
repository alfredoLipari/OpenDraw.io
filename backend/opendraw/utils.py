import base64
import random
import time
from uuid import uuid4
from configuration.config import objects



def create_task_id() -> str:
    return str(uuid4())


def get_current_timestamp() -> int:
    # current timestamp in millis
    return int(time.time() * 1000)


def get_random_object() -> str:
    return random.choice(objects)


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')
