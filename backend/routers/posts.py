from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from backend.models import DBAppUser
from backend.auth_utils import get_current_user
from backend.schemas import AppUserUpdate, AppUserResponse