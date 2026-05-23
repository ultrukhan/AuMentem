from fastapi import APIRouter, Depends, HTTPException,Form, Body,Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from sqlalchemy import or_
from models import DBAppUser,DBFavEvent,get_utc_now,DBLocalEvents
from schemas import LocalEventCreate,LocalEventResponse,LocalEventBase,FavEventActionResponse
from auth_utils import get_current_user
from enums import EventCategory
from uuid import UUID
from typing import List,Optional
from datetime import datetime
router = APIRouter(
    prefix = '/local-events',
    tags = ['Local Events']
)


@router.get("/", response_model=List[LocalEventResponse])
async def get_upcoming_events(
    category: Optional[EventCategory] = Query(None, description="Фільтр за категорією"),
    city: Optional[str] = Query(None, description="Фільтр за містом"),
    date_from: Optional[datetime] = Query(None, description="Показати події, що починаються з цієї дати"),
    only_free: bool = Query(False, description="Показати лише безкоштовні заходи"),
    db: Session = Depends(get_db)
):
    """
    Видає список майбутніх заходів із можливістю гнучкої фільтрації.
    """
    query = db.query(DBLocalEvents).filter(DBLocalEvents.start_time >= get_utc_now())

    if category:
        query = query.filter(DBLocalEvents.category == category)

    if city:
        query = query.filter(DBLocalEvents.city.ilike(f"%{city}%"))

    if date_from:
        query = query.filter(DBLocalEvents.start_time >= date_from)

    if only_free:
        query = query.filter(
            or_(
                DBLocalEvents.price.ilike("%безкоштовно%"),
                DBLocalEvents.price.ilike("%вільний%"),
                DBLocalEvents.price == "0"
            )
        )

    events = query.order_by(DBLocalEvents.start_time.asc()).all()

    return events


@router.get("/my/favorites", response_model=List[LocalEventResponse])
async def get_my_events(
        show_past: bool = Query(False,
                                description="Якщо True - поверне історію минулих подій, якщо False - тільки майбутні"),
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)):
    """
    Екран 'Мої події'.
    За замовчуванням видає тільки ті збережені заходи, які ще не почалися.
    """
    now = get_utc_now()

    query = (
        db.query(DBLocalEvents)
        .join(DBFavEvent, DBLocalEvents.id == DBFavEvent.event_id)
        .filter(DBFavEvent.user_id == user.id)
    )

    if show_past:
        query = query.filter(DBLocalEvents.start_time < now)
        events = query.order_by(DBLocalEvents.start_time.desc()).all()
    else:
        query = query.filter(DBLocalEvents.start_time >= now)
        events = query.order_by(DBLocalEvents.start_time.asc()).all()

    return events


@router.post("/{event_id}/favorite", response_model=FavEventActionResponse)
async def toggle_favorite_event(event_id: UUID, user: DBAppUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Додає або видаляє подію зі списку 'Мої події'"""

    event = db.query(DBLocalEvents).filter(DBLocalEvents.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Подію не знайдено!")

    existing_fav = db.query(DBFavEvent).filter(DBFavEvent.event_id == event_id,DBFavEvent.user_id == user.id).first()

    if existing_fav:
        db.delete(existing_fav)
        db.commit()
        return {"detail": "Подію видалено з ваших планів", "is_favorited": False}
    else:
        new_fav = DBFavEvent(user_id=user.id, event_id=event_id)
        db.add(new_fav)
        db.commit()
        return {"detail": "Подію успішно додано в 'Мої події'", "is_favorited": True}


@router.get("/{event_id}/attendees-count")
async def get_attendees_count(event_id: UUID, db: Session = Depends(get_db)):
    """Віддає кількість юзерів, які додали подію в обране"""

    event_exists = db.query(DBLocalEvents).filter(DBLocalEvents.id == event_id).first()
    if not event_exists:
        raise HTTPException(status_code=404, detail="Подію не знайдено!")

    count = db.query(DBFavEvent).filter(DBFavEvent.event_id == event_id).count()
    return {"event_id": event_id, "attendees_count": count}

