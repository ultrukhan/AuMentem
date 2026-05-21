from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import DBAppUser, DBStateLog, get_utc_now
from schemas import StateLogCreate, StateLogResponse, OnlyMessageResponse
from auth_utils import get_current_user
from sqlalchemy.exc import IntegrityError


router = APIRouter(
    prefix="/Tracker",
    tags=["Tracker"]
)

@router.get("/check-today")
async def check_tracker_today(
    user: DBAppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Перевіряє, чи відмічав користувач свій стан сьогодні.
    Повертає {"show_tracker": True}, якщо запису за сьогодні ще немає.
    """
    now = get_utc_now()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    existing_log = db.query(DBStateLog).filter(
        DBStateLog.user_id == user.id,
        DBStateLog.recorded_at >= start_of_today
    ).first()

    return {"show_tracker": existing_log is None}

@router.post("/state", response_model=StateLogResponse)
async def save_state(state: StateLogCreate,
                         user: DBAppUser = Depends(get_current_user),
                         db: Session = Depends(get_db)
):
    """
    Ендпоінт для запису стану.
    """
    now = get_utc_now()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    existing_log = db.query(DBStateLog).filter(
        DBStateLog.user_id == user.id,
        DBStateLog.created_at >= start_of_today
    ).first()

    if existing_log:
        raise HTTPException(
            status_code=400,
            detail="Ви вже відмічали свій стан сьогодні"
        )

    new_state = DBStateLog(user_id = user.id,
                            state = state.state)
    db.add(new_state)

    try:
        db.commit()
        db.refresh(new_state)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Не вдалося зберегти стан через конфлікт у базі даних")

    return new_state
