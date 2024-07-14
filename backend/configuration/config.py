import os

import motor.motor_asyncio
from dotenv import load_dotenv
from openai import OpenAI
import json

load_dotenv()

# CONSTANTS
TIMEOUT = 60
MAX_SCORE = 100
TOP_LEADERBOARD_SIZE = 100

with open("configuration/objects.json", "r") as f:
    objects = json.load(f)

# MONGO CONFIG

MONGO_HOST = os.getenv("MONGO_HOST", "mongo-service")
MONGO_PORT = os.getenv("MONGO_PORT", 27017)
MONGO_PORT = int(MONGO_PORT)
MONGO_USER = os.getenv("MONGO_USER", "root")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "root")
MONGO_DB = os.getenv("MONGO_DB", "sketch")


def create_mongo_client():
    return motor.motor_asyncio.AsyncIOMotorClient(
        f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/",
        maxPoolSize=100,  
        minPoolSize=10    
    )


mongo_client = create_mongo_client()


def get_mongo_client():
    global mongo_client
    return mongo_client


# REDIS CONFIG

# REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
# REDIS_PORT = os.getenv("REDIS_PORT", 6379)
# REDIS_PORT = int(REDIS_PORT)
#
#
# def create_redis_client():
#     return Redis(host=REDIS_HOST, port=REDIS_PORT)
#
#
# redis_client = create_redis_client()
#
#
# def get_redis_client():
#     global redis_client
#     return redis_client


# OPENAI CONFIG
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def create_openai_client():
    return OpenAI(api_key=OPENAI_API_KEY)


openai_client = create_openai_client()


def get_openai_client():
    global openai_client
    return openai_client


# JWT Configuration
SECRET_KEY = os.getenv("APP_SECRET_KEY", "test_secret_key" * 30)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 120)
ACCESS_TOKEN_EXPIRE_MINUTES = int(ACCESS_TOKEN_EXPIRE_MINUTES)
