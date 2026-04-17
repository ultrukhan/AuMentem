from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DBAppUser, DBTimeCapsule
from backend.schemas import TimeCapsuleCreate, TimeCapsuleResponse, OnlyMessageResponse
from backend.auth_utils import get_current_user
from sqlalchemy.exc import IntegrityError

router = APIRouter(
    prefix="/time-capsule",
    tags=["time-capsule"]
)


@router.post("/message", response_model=TimeCapsuleResponse)
async def save_state(message: TimeCapsuleCreate,
                     user: DBAppUser = Depends(get_current_user),
                     db: Session = Depends(get_db)
):
    """
    Ендпоінт для запису повідомлення у капсулу часу.
    """
    new_message = DBTimeCapsule(user_id=user.id, message=message.message)
    db.add(new_message)

    try:
        db.commit()
        db.refresh(new_message)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Не вдалося зберегти повідомлення через конфлікт у базі даних")

    return new_message


@router.get("/latest-unread", response_model=OnlyMessageResponse)
async def get_latest_unread_message(
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Ендпоінт для отримання останнього непрочитаного повідомлення з капсули часу.
    """
    db_message = db.query(DBTimeCapsule) \
        .filter(DBTimeCapsule.user_id == user.id, DBTimeCapsule.is_viewed == False) \
        .order_by(DBTimeCapsule.created_at.desc()) \
        .first()

    if not db_message:
        raise HTTPException(status_code=404, detail="Немає нових повідомлень")

    db_message.is_viewed = True

    try:
        db.commit()
        db.refresh(db_message)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Помилка при оновленні статусу повідомлення")

    return db_message