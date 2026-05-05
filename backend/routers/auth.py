from models import DBAppUser,get_utc_now,DBHobby
from schemas import AppUserCreate, AppUserResponse,Token,HobbyResponse
from auth_utils import verify_password, create_access_token,get_password_hash,get_current_user
from fastapi import APIRouter, Depends, HTTPException,BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy.exc import IntegrityError
import secrets
from email_utils import send_verification_email
from typing import List
from fastapi.responses import HTMLResponse

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/register", response_model=AppUserResponse)
async def create_app_user(app_user: AppUserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
        Ендпоінт для реєстрації
        Заносить нового користувача у базу
    """
    token = secrets.token_urlsafe()

    user = DBAppUser(
        nickname = app_user.nickname,
        email = app_user.email,
        password_hash = get_password_hash(app_user.password),
        verification_code = token
    )

    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        background_tasks.add_task(send_verification_email, user.email, token)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Такий користувач вже існує!")
    return user

@router.get("/verify", response_class=HTMLResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    """
        Ендпоінт для підтвердження емейла
    """
    user = db.query(DBAppUser).filter(DBAppUser.verification_code == token).first()
    if not user:
        # Повертаємо красиву помилку замість сирого JSON
        error_html = """
            <!DOCTYPE html>
            <html lang="uk">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Помилка підтвердження</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f7f6; margin: 0; }
                    .container { background-color: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; }
                    .error-icon { font-size: 60px; margin-bottom: 20px; }
                    h1 { color: #d32f2f; margin-top: 0; }
                    p { color: #555; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="error-icon">❌</div>
                    <h1>Ой, щось не так!</h1>
                    <p>Цей лінк недійсний або вже був використаний.</p>
                    <p>Спробуйте увійти в додаток або зареєструватися знову.</p>
                </div>
            </body>
            </html>
            """
        return HTMLResponse(content=error_html, status_code=400)

    user.is_active = True
    user.verification_code = None
    db.commit()

    html_content = """
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Підтвердження Email</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f4f7f6;
                    color: #333;
                    text-align: center;
                    padding: 20px;
                }
                .container {
                    background-color: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    max-width: 400px;
                    width: 100%;
                }
                .success-icon {
                    font-size: 60px;
                    margin-bottom: 20px;
                }
                h1 { color: #2e7d32; margin-top: 0; }
                p { font-size: 16px; line-height: 1.5; color: #555; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>Емейл підтверджено!</h1>
                <p>Дякуємо! Ваша пошта успішно верифікована.</p>
                <p><strong>Тепер ви можете повернутися у додаток AuMentem та увійти у свій акаунт.</strong></p>
            </div>
        </body>
        </html>
        """

    return HTMLResponse(content=html_content, status_code=200)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Ендпоінт для входу у застосунок після реєстрації
    Повертає токен для подальшої швидкої перевірки
    """
    user = db.query(DBAppUser).filter(DBAppUser.nickname == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Невірне ім'я або пароль")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Будь ласка, підтвердіть ваш емейл")

    user.last_login_at = get_utc_now()
    db.commit()

    access_token = create_access_token(data= {"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get('/me', response_model=AppUserResponse)
async def token_verify(curr_user: DBAppUser = Depends(get_current_user)):
    """
    Ендпоінт для автоматичного входу при старті додатка.
    Перевіряє токен і одразу віддає профіль гравця.
    """
    return curr_user

@router.get("/hobbies", response_model=List[HobbyResponse])
async def get_all_hobbies(db: Session = Depends(get_db)):
    """Віддає список всіх доступних хобі для екрану реєстрації"""
    return db.query(DBHobby).all()

