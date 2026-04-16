from pydantic import BaseModel,Field,EmailStr, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from backend.enums import *
import re

class AppUserCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=50)

    @field_validator('email')
    @classmethod
    def email_to_lower(cls, value: str):
        return value.lower()

    @field_validator('password')
    @classmethod
    def validate_password(cls, value: str):
        if not re.search(r'[A-Z]', value):
            raise ValueError('Пароль має містити хоча б одну велику літеру')
        if not re.search(r'[a-z]', value):
            raise ValueError('Пароль має містити хоча б одну малу літеру')
        if not re.search(r'\d', value):
            raise ValueError('Пароль має містити хоча б одну цифру')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValueError('Пароль має містити хоча б один спеціальний символ')

        return value


class AppUserResponse(BaseModel):
    id: UUID
    nickname: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class AppUserUpdate(BaseModel):
    nickname: Optional[str] = Field(None,min_length=1, max_length=30)

class MiniQuest(BaseModel):
    id: UUID
    title: str

class Coordinates(BaseModel):
    lat: float
    lng: float

class Place(BaseModel):
    id: UUID
    name: str
    coordinates: Coordinates

    model_config = {"from_attributes": True}

class GeoQuest(BaseModel):
    id: UUID
    title: str
    place_id: UUID
    place: Place

    model_config = {"from_attributes": True}

class UserMiniQuestResponce(BaseModel):
    id: UUID
    user_id: UUID
    user: AppUserResponse
    mini_quest_id: UUID
    mini_quest: MiniQuest
    status: QuestStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes" : True}

class UserGeoQuestResponce(BaseModel):
    id: UUID
    user_id: UUID

class PostResponse(BaseModel):
    id: UUID

class StateLogCreate(BaseModel):
    state: MoodState

class StateLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    state: MoodState
    recorded_at: datetime
    model_config = {"from_attributes": True}


class TimeCapsuleCreate(BaseModel):
    message: str

class TimeCapsuleResponse(BaseModel):
    id: UUID
    user_id: UUID
    message: str
    created_at: datetime

class OnlyMessageResponse(BaseModel):
    message: str
    model_config = {"from_attributes": True}
