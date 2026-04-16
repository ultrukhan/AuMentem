from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from backend.models import DBAppUser
from backend.auth_utils import get_current_user
from backend.schemas import AppUserUpdate, AppUserResponse

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
        raise HTTPException(status_code=400, detail = "Цей нікнейм вже зайнятий іншим користувачем!")

    return user


