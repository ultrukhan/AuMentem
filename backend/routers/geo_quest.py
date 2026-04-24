from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from geoalchemy2.elements import WKTElement
from backend.database import get_db
from backend.models import DBAppUser, DBPlace, DBGeoQuest, DBUserGeoQuest, get_utc_now
from backend.schemas import UserGeoQuestResponse, NearestGeoQuestResponse, QuestCompleteRequest
from backend.auth_utils import get_current_user
from backend.enums import QuestStatus
import uuid
import os
import shutil
from typing import List
import time
import cloudinary
import cloudinary.utils
from backend.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

router = APIRouter(
    prefix="/geo-quests",
    tags=["Geo Quests"]
)

cloudinary.config(
  cloud_name = CLOUDINARY_CLOUD_NAME,
  api_key = CLOUDINARY_API_KEY,
  api_secret = CLOUDINARY_API_SECRET
)


@router.get("/generate-upload-signature")
async def get_upload_signature(user: DBAppUser = Depends(get_current_user)):
    """Генеруємо підпис для фронтенда"""
    timestamp = int(time.time())
    params_to_sign = {
        "timestamp": timestamp,
        "folder": "geo_proofs"
    }

    signature = cloudinary.utils.api_sign_request(
        params_to_sign,
        cloudinary.config().api_secret
    )

    return {
        "timestamp": timestamp,
        "signature": signature,
        "api_key": cloudinary.config().api_key,
        "cloud_name": cloudinary.config().cloud_name,
        "folder": "geo_proofs"
    }
@router.post("/{geo_quest_id}/start", response_model=UserGeoQuestResponse)
async def start_geo_quest(
        geo_quest_id: uuid.UUID,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Додає гео-квест користувачу і ставить статус IN_PROGRESS"""

    quest = db.query(DBGeoQuest).filter(DBGeoQuest.id == geo_quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Гео-квест не знайдено")

    now = get_utc_now()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    active_quest = db.query(DBUserGeoQuest).filter(
        DBUserGeoQuest.geo_quest_id == geo_quest_id,
        DBUserGeoQuest.user_id == user.id,
        DBUserGeoQuest.status == QuestStatus.IN_PROGRESS
    ).first()

    if active_quest:
        raise HTTPException(status_code=400, detail="Ви вже взяли цей квест, але ще не завершили його!")

    completed_today = db.query(DBUserGeoQuest).filter(
        DBUserGeoQuest.geo_quest_id == geo_quest_id,
        DBUserGeoQuest.user_id == user.id,
        DBUserGeoQuest.status == QuestStatus.COMPLETED,
        DBUserGeoQuest.completed_at >= start_of_today
    ).first()

    if completed_today:
        raise HTTPException(
            status_code=400,
            detail="Ви вже виконали цей квест сьогодні. Повертайтеся завтра після 00:00!"
        )

    user_geo_quest = DBUserGeoQuest(
        user_id=user.id,
        geo_quest_id=quest.id,
        status=QuestStatus.IN_PROGRESS,
        started_at=now
    )

    db.add(user_geo_quest)
    db.commit()

    db.refresh(user_geo_quest)
    user_geo_quest = db.query(DBUserGeoQuest).options(
        joinedload(DBUserGeoQuest.geo_quest).joinedload(DBGeoQuest.place),
        joinedload(DBUserGeoQuest.user)
    ).filter(DBUserGeoQuest.id == user_geo_quest.id).first()

    return user_geo_quest

@router.patch("/my-quests/{user_geo_quest_id}/complete", response_model=UserGeoQuestResponse)
async def complete_quest(
        user_geo_quest_id: uuid.UUID,
        payload: QuestCompleteRequest,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Змінює статус квесту на COMPLETED.
    Перевіряє радіус 10 метрів за переданими координатами і зберігає доказ.
    """
    user_quest = db.query(DBUserGeoQuest).options(
        joinedload(DBUserGeoQuest.geo_quest).joinedload(DBGeoQuest.place)
    ).filter(
        DBUserGeoQuest.id == user_geo_quest_id,
        DBUserGeoQuest.user_id == user.id,
        DBUserGeoQuest.status == QuestStatus.IN_PROGRESS
    ).first()

    if not user_quest:
        raise HTTPException(status_code=404, detail="Ваш активний квест не знайдено")

    user_point = WKTElement(f'POINT({payload.lng} {payload.lat})', srid=4326)
    target_coordinates = user_quest.geo_quest.place.coordinates
    distance = db.query(func.ST_Distance(target_coordinates, user_point)).scalar()

    if distance > 10.0:
        raise HTTPException(
            status_code=400,
            detail=f"Ви занадто далеко! Відстань: {distance:.1f} м."
        )

    current_time = get_utc_now()
    user_quest.photo_proof_url = payload.photo_url
    user_quest.status = QuestStatus.COMPLETED
    user_quest.completed_at = current_time
    user_quest.is_verified = True
    user_quest.verified_at = current_time

    db.commit()
    db.refresh(user_quest)

    return user_quest

@router.get("/nearest", response_model=List[NearestGeoQuestResponse])
async def get_nearest_geo_quests(
        lat: float,
        lng: float,
        limit: int = 5,
        db: Session = Depends(get_db),
        user: DBAppUser = Depends(get_current_user)
):
    """
    Повертає список найближчих гео-квестів відносно переданих координат юзера.
    """
    user_point = WKTElement(f'POINT({lng} {lat})', srid=4326)

    results = db.query(
        DBGeoQuest,
        func.ST_Distance(DBPlace.coordinates, user_point).label('distance')
    ).join(
        DBPlace, DBGeoQuest.place_id == DBPlace.id
    ).order_by(
        func.ST_Distance(DBPlace.coordinates, user_point)
    ).limit(limit).all()

    response = []
    for quest, distance in results:
        response.append({
            "geo_quest": quest,
            "distance_meters": round(distance, 2)
        })

    return response