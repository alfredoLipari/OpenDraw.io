import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import AsyncGenerator
import random
from time import sleep

import jwt
import motor
from bson import ObjectId
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from loguru import logger
from openai import OpenAI
from passlib.context import CryptContext

from configuration.config import TIMEOUT, create_mongo_client, get_openai_client, ALGORITHM, \
    ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, MAX_SCORE, TOP_LEADERBOARD_SIZE, objects
from opendraw import utils
from opendraw.models import Task, Status, GuessRequest, PaginatedTasks, UserInDB, User, Token, TokenData, UserCreate, \
    BaseUser, GuessResponse, PaginatedLeaderboard

BASE_PATH = "/api/v1"


def on_startup_app():
    logger.info("Startup")
    asyncio.create_task(move_expired_tasks())


def on_shutdown_app():
    logger.info("Shutdown")


@asynccontextmanager
async def lifespan(app: FastAPI):
    on_startup_app()
    yield
    on_shutdown_app()


app = FastAPI(lifespan=lifespan, name="Opendraw", version="0.1.0", title="Opendraw API", description="Opendraw API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # This allows all methods
    allow_headers=["*"],  # This allows all headers
)

mongo_client = create_mongo_client()
db = mongo_client.taskdb

async def get_database() -> AsyncGenerator:
    try:
        yield db
    finally:
        pass


# Dependency for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency for JWT authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user(db, username: str):
    user_data = await db.users.find_one({"username": username})
    if user_data:
        return UserInDB(username=user_data["username"], hashed_password=user_data["hashed_password"],
                        id=str(user_data["_id"]))


async def authenticate_user(db, username: str, password: str):
    user = await get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def get_current_user(token: str = Depends(oauth2_scheme),
                           db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception
    user = await get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


@app.get("/health")
async def root():
    return "Hello world", 200


@app.get(BASE_PATH + "/health")
async def root():
    return "Healthy", 200


@app.get(BASE_PATH + "/task/{task_id}", response_model=Task)
async def get_task(task_id: str, db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database),
                   current_user: UserInDB = Depends(get_current_user)):
    try:
        task_data = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": current_user.id})
    except Exception as e:
        logger.exception(f"Error while fetching task: {e}")
        raise HTTPException(status_code=404, detail="Invalid task ID format")

    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data['id'] = str(task_data['_id'])

    task = Task(**task_data)

    return task


@app.post(BASE_PATH + "/task", response_model=Task)
async def create_task(db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database),
                      current_user: UserInDB = Depends(get_current_user)):
    # Check if there's already a running task for the current user
    existing_task = await db.tasks.find_one({"user_id": current_user.id, "status": Status.RUNNING})
    if existing_task:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a running task. Complete it before starting a new one."
        )
    object_name = utils.get_random_object()
    created_on = utils.get_current_timestamp()
    task = Task(
        object_name=object_name,
        status=Status.RUNNING,
        created_on=created_on,
        user_id=current_user.id
    )
    task_saved = await db.tasks.insert_one(task.model_dump(exclude={"id"}))
    task.id = str(task_saved.inserted_id)
    return task


@app.post(BASE_PATH + "/guess/{task_id}", response_model=GuessResponse)
async def guess(task_id: str, guess_request: GuessRequest,
                db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database),
                openai_client: OpenAI = Depends(get_openai_client), current_user: UserInDB = Depends(get_current_user)):
    guess_received_on = utils.get_current_timestamp()
    image_b64 = guess_request.image_b64

    try:
        task_data = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": current_user.id})
    except Exception as e:
        raise HTTPException(status_code=404, detail="Invalid task ID format")

    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data['id'] = str(task_data['_id'])
    guess_response = GuessResponse(**task_data)

    if guess_response.status != Status.RUNNING:
        return guess_response

    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text",
                     "text": "You are given a sketch of an object. Just tell what the object is without any explanation or details or special characters just the word."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                        },
                    },
                ],
            }
        ],
        max_tokens=300,
    )

    object_detected = response.choices[0].message.content.strip().lower()
    object_detected = ''.join(char for char in object_detected if char.isalnum()) # Remove special characters
    guess_response.ai_says = object_detected

    logger.debug("ChatGPT says: " + object_detected + " for task_id: " + task_id)

    if object_detected == guess_response.object_name.strip().lower():
        completion_time = guess_received_on - guess_response.created_on
        # Update user's score
        task_score = MAX_SCORE * (1 - ((completion_time - 1) / (TIMEOUT * 1000 - 1)))
        guess_response.status = Status.COMPLETED
        guess_response.score = task_score
        await db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": guess_response.model_dump(exclude={"id", "ai_says"})}
        )
        await db.users.update_one(
            {"username": current_user.username},
            {"$inc": {"score": task_score}}
        )

    return guess_response

@app.post(BASE_PATH + "/test/task", response_model=Task)
async def create_task(db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database),
                      current_user: UserInDB = Depends(get_current_user)):

    object_name = utils.get_random_object()
    created_on = utils.get_current_timestamp()
    task = Task(
        object_name=object_name,
        status=Status.RUNNING,
        created_on=created_on,
        user_id=current_user.id
    )
    task_saved = await db.tasks.insert_one(task.model_dump(exclude={"id"}))
    task.id = str(task_saved.inserted_id)
    return task

@app.post(BASE_PATH + "/test/guess/{task_id}", response_model=GuessResponse)
async def test_guess(task_id: str,
                db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database),
                current_user: UserInDB = Depends(get_current_user)):
    guess_received_on = utils.get_current_timestamp()

    try:
        task_data = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": current_user.id})
    except Exception as e:
        raise HTTPException(status_code=404, detail="Invalid task ID format")

    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data['id'] = str(task_data['_id'])
    guess_response = GuessResponse(**task_data)

    object_detected = random.choice(objects)
    object_detected = ''.join(char for char in object_detected if char.isalnum()) # Remove special characters
    guess_response.ai_says = object_detected

    logger.debug("ChatGPT says: " + object_detected + " for task_id: " + task_id)

    if object_detected == guess_response.object_name.strip().lower():
        completion_time = guess_received_on - guess_response.created_on
        # Update user's score
        task_score = MAX_SCORE * (1 - ((completion_time - 1) / (TIMEOUT * 1000 - 1)))
        guess_response.status = Status.COMPLETED
        guess_response.score = task_score
        await db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": guess_response.model_dump(exclude={"id", "ai_says"})}
        )
        await db.users.update_one(
            {"username": current_user.username},
            {"$inc": {"score": task_score}}
        )

    return guess_response


@app.get(BASE_PATH + "/leaderboard", response_model=PaginatedLeaderboard)
async def get_leaderboard(
        page: int = Query(0, ge=0),
        size: int = Query(10, ge=1, le=TOP_LEADERBOARD_SIZE),
        db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database)
):
    skip = page * size
    total = await db.users.count_documents({})
    users = await db.users.find().sort("score", -1).skip(skip).limit(size).to_list(length=None)
    leaderboard = [
        BaseUser(username=user["username"], score=user["score"])
        for user in users
    ]
    return PaginatedLeaderboard(users=leaderboard, total=total, page=page, size=size)


@app.get(BASE_PATH + "/tasks", response_model=PaginatedTasks)
async def get_tasks(page: int = Query(0, ge=0), size: int = Query(10, ge=1),
                    db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database),
                    current_user: UserInDB = Depends(get_current_user)):
    skip = page * size
    total = await db.tasks.count_documents({"user_id": current_user.id})
    tasks = await db.tasks.find({"user_id": current_user.id}).sort("created_on", -1).skip(skip).limit(size).to_list(
        length=size)
    tasks = [Task(**task, id=str(task["_id"])) for task in tasks]

    return PaginatedTasks(tasks=tasks, total=total, page=page, size=size)


@app.post(BASE_PATH + "/login", response_model=Token)
async def login_for_access_token(login_request: UserCreate,
                                 db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database)):
    user = await authenticate_user(db, login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    token = Token(access_token=access_token, token_type="bearer")
    return token


@app.get(BASE_PATH + "/user", response_model=BaseUser)
async def get_current_user(
        current_user: UserInDB = Depends(get_current_user)):
    base_user = BaseUser(username=current_user.username, score=current_user.score)
    return base_user


@app.post(BASE_PATH + "/register", response_model=BaseUser)
async def register_user(user_create: UserCreate, db: motor.motor_asyncio.AsyncIOMotorDatabase = Depends(get_database)):
    user_in_db = await db.users.find_one({"username": user_create.username})
    if user_in_db:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user_create.password)
    user = User(**user_create.model_dump(), hashed_password=hashed_password)
    user_saved = await db.users.insert_one(user.model_dump())

    base_user = BaseUser(**user.model_dump(exclude={"hashed_password"}))

    return base_user


async def move_expired_tasks():
    while True:
        try:
            current_time = utils.get_current_timestamp()
            expiration_time = TIMEOUT * 1000  # 60 seconds in milliseconds
            expired_tasks = await db.tasks.find(
                {"created_on": {"$lt": current_time - expiration_time}, "status": Status.RUNNING}
            ).to_list(length=100)
            if expired_tasks:
                logger.debug(f"Found {len(expired_tasks)} expired tasks")
                for task_data in expired_tasks:
                    logger.debug(f"Moving task {task_data['_id']} to FAILED")
                    task_data['id'] = str(task_data['_id'])
                    task = Task(**task_data)
                    task.status = Status.FAILED
                    await db.tasks.update_one(
                        {"_id": ObjectId(task.id)},
                        {"$set": task.model_dump(exclude={"id"})}
                    )
            await asyncio.sleep(5)  # Check for expired tasks every 5 seconds
        except Exception as e:
            logger.exception(f"Error while moving expired tasks: {e}")
            await asyncio.sleep(5)  # Wait before retrying in case of error
