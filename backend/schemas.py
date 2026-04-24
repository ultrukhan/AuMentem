from pydantic import BaseModel,Field,EmailStr, field_validator,model_validator
from typing import Optional,List
from uuid import UUID
from datetime import datetime
from backend.enums import *
import re
from geoalchemy2.shape import to_shape

class HobbyResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


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

class UserHobbiesUpdate(BaseModel):
    hobby_ids: List[int]

class AppUserResponse(BaseModel):
    id: UUID
    nickname: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class AppUserPublic(BaseModel):
    id: UUID
    nickname: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str

class AppUserUpdate(BaseModel):
    nickname: Optional[str] = Field(None,min_length=1, max_length=30)


class Coordinates(BaseModel):
    lat: float
    lng: float

class Place(BaseModel):
    id: UUID
    name: str
    coordinates: Coordinates

    model_config = {"from_attributes": True}

    @field_validator('coordinates', mode='before')
    @classmethod
    def parse_geography_to_coords(cls, value):
        if isinstance(value, dict) or isinstance(value, Coordinates):
            return value

        try:
            from geoalchemy2.shape import to_shape
            point = to_shape(value)

            return {"lat": point.y, "lng": point.x}
        except Exception:
            return value

class GeoQuest(BaseModel):
    id: UUID
    title: str
    place_id: UUID
    place: Place

    model_config = {"from_attributes": True}

class UserGeoQuestResponse(BaseModel):
    id: UUID
    user_id: UUID
    user: Optional[AppUserPublic] = None
    geo_quest_id: UUID
    geo_quest: GeoQuest
    status: QuestStatus
    photo_proof_url: Optional[str] = None
    is_verified: bool = False
    saved_to_album: bool = False
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class NearestGeoQuestResponse(BaseModel):
    geo_quest: GeoQuest
    distance_meters: float

    model_config = {"from_attributes": True}

class QuestCompleteRequest(BaseModel):
    lat: float
    lng: float
    photo_url: str

class MiniQuest(BaseModel):
    id: UUID
    title: str
    hobbies: List[HobbyResponse] = []
    model_config = {"from_attributes": True}

class QuestEvaluateRequest(BaseModel):
    evaluation: QuestEvaluation

class UserMiniQuestResponse(BaseModel):
    id: UUID
    user_id: UUID
    user: Optional[AppUserPublic] = None
    mini_quest_id: UUID
    mini_quest: Optional[MiniQuest] = None
    status: QuestStatus
    evaluation: Optional[QuestEvaluation] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes" : True}


class ReactionToggle(BaseModel):
    reaction_type: ReactionType

class ReactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    reaction_type: ReactionType

    model_config = {"from_attributes": True}

class PostResponse(BaseModel):
    id: UUID
    user_id: UUID
    user: Optional[AppUserPublic] = None
    user_mini_quest_id: Optional[UUID] = None
    user_mini_quest: Optional[UserMiniQuestResponse] = None
    user_geo_quest_id: Optional[UUID] = None
    user_geo_quest: Optional[UserGeoQuestResponse] = None
    is_anonymous: bool = False
    created_at: datetime
    reactions: list[ReactionResponse] = []

    model_config = {"from_attributes" : True}

class CreatePost(BaseModel):
    user_mini_quest_id: Optional[UUID] = None
    user_geo_quest_id: Optional[UUID] = None
    is_anonymous: bool

    @model_validator(mode='after')
    def check_quest_id(self):
        if not self.user_mini_quest_id and not self.user_geo_quest_id:
            raise ValueError("Пост має бути прив'язаний до міні-квесту АБО гео-квесту")
        if self.user_mini_quest_id and self.user_geo_quest_id:
            raise ValueError("Один пост не може стосуватися двох квестів одночасно")
        return self


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


