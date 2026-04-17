from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DBAppUser, DBMiniQuest, DBUserMiniQuest, DBHobby, get_utc_now
from backend.schemas import MiniQuestResponse, UserMiniQuestResponse, QuestEvaluateRequest
from backend.auth_utils import get_current_user
from backend.enums import QuestStatus
from typing import List
import uuid

router = APIRouter(
    prefix="/mini-quests",
    tags=["Mini Quests"]
)


@router.get("/recommendations", response_model=List[MiniQuestResponse])
async def get_recommended_quests(hobby_name: str = None,
        db: Session = Depends(get_db)
):
    """
    Отримати список доступних квестів.
    Якщо передано hobby_name, фільтрує квести, які мають це хобі у своєму списку.
    """
    query = db.query(DBMiniQuest)

    if hobby_name:
        query = query.filter(DBMiniQuest.hobbies.any(DBHobby.name == hobby_name))

    quests = query.limit(5).all()
    return quests


@router.post("/{quest_id}/start", response_model=UserMiniQuestResponse)
async def start_quest(
        quest_id: uuid.UUID,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Додає квест користувачу і автоматично ставить статус IN_PROGRESS"""
    quest = db.query(DBMiniQuest).filter(DBMiniQuest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не знайдено")

    user_quest = DBUserMiniQuest(
        user_id=user.id,
        mini_quest_id=quest.id,
        status=QuestStatus.IN_PROGRESS,
        started_at=get_utc_now()
    )

    db.add(user_quest)
    db.commit()
    db.refresh(user_quest)

    return user_quest


@router.patch("/my-quests/{user_mini_quest_id}/complete", response_model=UserMiniQuestResponse)
async def complete_quest(
        user_mini_quest_id: uuid.UUID,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Змінює статус розпочатого квесту на COMPLETED та фіксує час завершення"""
    user_quest = db.query(DBUserMiniQuest).filter(
        DBUserMiniQuest.id == user_mini_quest_id,
        DBUserMiniQuest.user_id == user.id,
        DBUserMiniQuest.status == QuestStatus.IN_PROGRESS
    ).first()

    if not user_quest:
        raise HTTPException(status_code=404, detail="Ваш активний квест не знайдено")

    if user_quest.status == QuestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Цей квест вже був завершений раніше")

    user_quest.status = QuestStatus.COMPLETED
    user_quest.completed_at = get_utc_now()

    db.commit()
    db.refresh(user_quest)

    return user_quest


@router.patch("/my-quests/{user_mini_quest_id}/evaluate", response_model=UserMiniQuestResponse)
async def evaluate_quest(
        user_mini_quest_id: uuid.UUID,
        eval_data: QuestEvaluateRequest,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Ендпоінт для збереження оцінки стану після виконання квесту"""
    user_quest = db.query(DBUserMiniQuest).filter(
        DBUserMiniQuest.id == user_mini_quest_id,
        DBUserMiniQuest.user_id == user.id,
        DBUserMiniQuest.status == QuestStatus.COMPLETED,
        DBUserMiniQuest.evaluation == None
    ).first()

    if not user_quest:
        raise HTTPException(status_code=404, detail="Ваш квест не знайдено")

    if user_quest.status != QuestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Оцінити можна лише завершений квест!")

    user_quest.evaluation = eval_data.evaluation

    db.commit()
    db.refresh(user_quest)

    return user_quest