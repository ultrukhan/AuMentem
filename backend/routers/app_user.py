from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from database import get_db
from fastapi import APIRouter, Depends, HTTPException,status
from models import DBAppUser,DBHobby
from schemas import AppUserUpdate, AppUserResponse, UserHobbiesUpdate,PasswordChangeRequest
from auth_utils import get_current_user,verify_password,get_password_hash

router = APIRouter(
    prefix="/app_user",
    tags=["App_user"]
)

@router.patch("/update_nick", response_model=AppUserResponse)
async def update_nick(update_data:AppUserUpdate, user: DBAppUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """
        Ендпоінт для зміни нікнейма.
    """
    update_dict = update_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise HTTPException(status_code=400, detail="Не передано жодних даних для оновлення")

    for key, value in update_dict.items():
        setattr(user, key, value)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail = "Цей нікнейм вже зайнятий іншим користувачем!")

    return user


@router.put("/upd_hobbies", response_model=AppUserResponse)
async def set_hobbies(
        hobbies: UserHobbiesUpdate,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Оновлює список хоббі для поточного авторизованого користувача та завершує онбординг.
    """
    if not hobbies.hobby_ids:
        user.hobbies = []
    else:
        selected_hobbies = db.query(DBHobby).filter(DBHobby.id.in_(hobbies.hobby_ids)).all()

        if len(selected_hobbies) != len(hobbies.hobby_ids):
            raise HTTPException(status_code=400, detail="Одне або кілька вибраних хоббі не існують")

        user.hobbies = selected_hobbies

    user.is_onboarding_completed = True

    db.commit()
    db.refresh(user)

    return user

@router.post("/change-password")
async def change_password(payload: PasswordChangeRequest,user: DBAppUser = Depends(get_current_user),db: Session = Depends(get_db)):
    """
               Ендпоінт зміни пароля
    """

    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неправильний поточний пароль"
        )

    if payload.old_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Новий пароль не може бути таким самим, як старий"
        )
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"detail": "Пароль успішно змінено!"}


@router.get("/onboarding-status")
async def check_onboarding(
    user: DBAppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Перевіряє, чи потрібно користувачу проходити або допроходити онбординг.
    """
    return {"needs_hobby_selection": not user.is_onboarding_completed}