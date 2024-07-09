from enum import Enum

from pydantic import BaseModel

from configuration.config import TIMEOUT


class TaskRequest(BaseModel):
    pass


class Status(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ERROR = "error"


class Task(BaseModel):
    id: str | None = None
    object_name: str
    status: Status
    created_on: int
    timeout: int = TIMEOUT
    user_id: str | None = None


class PaginatedTasks(BaseModel):
    tasks: list[Task]
    total: int
    page: int
    size: int


class GuessRequest(BaseModel):
    image_b64: str


class BaseUser(BaseModel):
    username: str


class UserCreate(BaseUser):
    password: str


class User(BaseUser):
    hashed_password: str | None = None


class UserInDB(User):
    id: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
