from backend.models import DBAppUser
from backend.schemas import AppUserCreate, AppUserResponse,Token
from backend.auth_utils import verify_password, create_access_token,get_password_hash,get_current_user
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.database import get_db
from sqlalchemy.exc import IntegrityError


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/register", response_model=AppUserResponse)
async def create_app_user(app_user: AppUserCreate , db: Session = Depends(get_db)):
    """
        Ендпоінт для реєстрації
        Заносить нового користувача у базу
        """
    user = DBAppUser(
        nickname = app_user.nickname,
        email = app_user.email,
        password_hash = get_password_hash(app_user.password)
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Такий користувач вже існує!")
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Ендпоінт для входу у застосунок після реєстрації
    Повертає токен для подальшої швидкої перевірки
    """
    user = db.query(DBAppUser).filter(DBAppUser.nickname == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Невірне ім'я або пароль")

    access_token = create_access_token(data= {"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get('/me', response_model=AppUserResponse)
async def verify(curr_user: DBAppUser = Depends(get_current_user)):
    """
    Ендпоінт для автоматичного входу при старті додатка.
    Перевіряє токен і одразу віддає профіль гравця.
    """
    return curr_user


