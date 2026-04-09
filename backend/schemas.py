from pydantic import BaseModel,Field,EmailStr, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
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

