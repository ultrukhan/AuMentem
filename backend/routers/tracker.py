from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DBAppUser, DBStateLog
from backend.schemas import StateLogCreate, StateLogResponse, OnlyMessageResponse
from backend.auth_utils import get_current_user
from sqlalchemy.exc import IntegrityError


router = APIRouter(
    prefix="/tracker",
    tags=["tracker"]
)

@router.post("/state", response_model=StateLogResponse)
async def save_state(state: StateLogCreate,
                         user: DBAppUser = Depends(get_current_user),
                         db: Session = Depends(get_db)
):
    """
    Ендпоінт для запису стану.
    """
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
