from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from geoalchemy2.elements import WKTElement
from backend.database import get_db
from backend.models import DBAppUser, DBPlace, DBGeoQuest, DBUserGeoQuest, get_utc_now
from backend.schemas import UserGeoQuestResponse
from backend.auth_utils import get_current_user
from backend.enums import QuestStatus
import uuid
import os
import shutil

router = APIRouter(
    prefix="/geo-quests",
    tags=["Geo Quests"]
)


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

    existing_user_quest = db.query(DBUserGeoQuest).filter(
        DBUserGeoQuest.geo_quest_id == geo_quest_id,
        DBUserGeoQuest.user_id == user.id
    ).first()

    if existing_user_quest:
        raise HTTPException(status_code=400, detail="Ви вже взяли або виконали цей квест")

    user_geo_quest = DBUserGeoQuest(
        user_id=user.id,
        geo_quest_id=quest.id,
        status=QuestStatus.IN_PROGRESS,
        started_at=get_utc_now()
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
        lat: float = Form(...),
        lng: float = Form(...),
        photo: UploadFile = File(...),
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Змінює статус квесту на COMPLETED.
    Перевіряє радіус 10 метрів за переданими координатами і зберігає доказ.
    """
    user_quest = db.query(DBUserGeoQuest).options(
        joinedload(DBUserGeoQuest.geo_quest).joinedload(DBGeoQuest.place),
        joinedload(DBUserGeoQuest.user)
    ).filter(
        DBUserGeoQuest.id == user_geo_quest_id,
        DBUserGeoQuest.user_id == user.id,
        DBUserGeoQuest.status == QuestStatus.IN_PROGRESS
    ).first()

    if not user_quest:
        raise HTTPException(status_code=404, detail="Ваш активний квест не знайдено")

    user_point = WKTElement(f'POINT({lng} {lat})', srid=4326)
    target_coordinates = user_quest.geo_quest.place.coordinates

    distance = db.query(func.ST_Distance(target_coordinates, user_point)).scalar()

    if distance > 10.0:
        raise HTTPException(
            status_code=400,
            detail=f"Ви занадто далеко від цілі! Відстань: {distance:.1f} м. Підійдіть ближче."
        )

    os.makedirs("uploads/geo_proofs", exist_ok=True)
    file_extension = photo.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/geo_proofs/{file_name}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    current_time = get_utc_now()

    user_quest.photo_proof_url = f"/{file_path}"
    user_quest.status = QuestStatus.COMPLETED
    user_quest.completed_at = current_time
    user_quest.is_verified = True
    user_quest.verified_at = current_time

    db.commit()
    db.refresh(user_quest)

    return user_quest