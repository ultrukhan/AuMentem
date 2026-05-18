from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
from models import DBAppUser, DBMiniQuest, DBUserMiniQuest, DBHobby, get_utc_now
from schemas import MiniQuest, UserMiniQuestResponse, QuestEvaluateRequest
from auth_utils import get_current_user
from enums import QuestStatus
from typing import List
import uuid
from ai_services.quest_generator import generate_quests_by_hobbies

router = APIRouter(
    prefix="/mini-quests",
    tags=["Mini Quests"]
)


@router.get("/daily", response_model=List[UserMiniQuestResponse])
async def get_daily_quests(
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Генерує або повертає 5 щоденних квестів (2 за хобі, 3 рандомних).
    Усі видані квести мають початковий статус AVAILABLE.
    """
    now = get_utc_now()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    db.query(DBUserMiniQuest).filter(
        DBUserMiniQuest.user_id == user.id,
        DBUserMiniQuest.created_at < start_of_today,
        DBUserMiniQuest.status == QuestStatus.AVAILABLE
    ).delete(synchronize_session=False)

    db.commit()

    todays_quests = db.query(DBUserMiniQuest).options(
        joinedload(DBUserMiniQuest.mini_quest).joinedload(DBMiniQuest.hobbies)
    ).filter(
        DBUserMiniQuest.user_id == user.id,
        DBUserMiniQuest.created_at >= start_of_today
    ).all()

    if todays_quests:
        return todays_quests

    user_with_hobbies = db.query(DBAppUser).options(joinedload(DBAppUser.hobbies)).filter(
        DBAppUser.id == user.id).first()

    current_hobbies = user_with_hobbies.hobbies if user_with_hobbies else []
    hobby_names = [h.name for h in current_hobbies]

    ai_quests = []

    if hobby_names:
        generated_titles = await generate_quests_by_hobbies(hobby_names)

        for title in generated_titles:
            new_quest = DBMiniQuest(
                title=title,
                hobbies=user_with_hobbies.hobbies
            )
            db.add(new_quest)
            db.flush()
            ai_quests.append(new_quest)

    standard_limit = 5 - len(ai_quests)
    standard_quests = []

    if standard_limit > 0:
        query_standard = db.query(DBMiniQuest)
        exclude_ids = [q.id for q in ai_quests]
        if exclude_ids:
            query_standard = query_standard.filter(~DBMiniQuest.id.in_(exclude_ids))

        standard_quests = query_standard.order_by(func.random()).limit(standard_limit).all()

    daily_quests = ai_quests + standard_quests

    for quest in daily_quests:
        umq = DBUserMiniQuest(
            user_id=user.id,
            mini_quest_id=quest.id,
            status=QuestStatus.AVAILABLE,
            created_at=now
        )
        db.add(umq)

    db.commit()

    return db.query(DBUserMiniQuest).options(
        joinedload(DBUserMiniQuest.mini_quest).joinedload(DBMiniQuest.hobbies)
    ).filter(
        DBUserMiniQuest.user_id == user.id,
        DBUserMiniQuest.created_at >= start_of_today
    ).all()


@router.patch("/my-quests/{user_mini_quest_id}/start", response_model=UserMiniQuestResponse)
async def start_quest(
        user_mini_quest_id: uuid.UUID,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Змінює статус квесту з AVAILABLE на IN_PROGRESS"""
    user_quest = db.query(DBUserMiniQuest).filter(
        DBUserMiniQuest.id == user_mini_quest_id,
        DBUserMiniQuest.user_id == user.id
    ).first()

    if not user_quest:
        raise HTTPException(status_code=404, detail="Квест не знайдено")

    if user_quest.status != QuestStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Цей квест вже розпочато або завершено")

    user_quest.status = QuestStatus.IN_PROGRESS
    user_quest.started_at = get_utc_now()

    db.commit()
    db.refresh(user_quest)

    return user_quest


@router.patch("/my-quests/{user_mini_quest_id}/complete", response_model=UserMiniQuestResponse)
async def complete_quest(
        user_mini_quest_id: uuid.UUID,
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Змінює статус квесту на COMPLETED"""
    user_quest = db.query(DBUserMiniQuest).filter(
        DBUserMiniQuest.id == user_mini_quest_id,
        DBUserMiniQuest.user_id == user.id
    ).first()

    if not user_quest:
        raise HTTPException(status_code=404, detail="Квест не знайдено")

    if user_quest.status == QuestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Цей квест вже завершений")

    if user_quest.status == QuestStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Спочатку почніть цей квест (IN_PROGRESS), щоб його завершити")

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
    """Зберігає оцінку стану ПІСЛЯ виконання квесту"""
    user_quest = db.query(DBUserMiniQuest).filter(
        DBUserMiniQuest.id == user_mini_quest_id,
        DBUserMiniQuest.user_id == user.id,
        DBUserMiniQuest.status == QuestStatus.COMPLETED
    ).first()

    if not user_quest:
        raise HTTPException(status_code=404, detail="Завершений квест не знайдено")

    if user_quest.evaluation is not None:
        raise HTTPException(status_code=400, detail="Ви вже оцінили цей квест")

    user_quest.evaluation = eval_data.evaluation

    db.commit()
    db.refresh(user_quest)

    return user_quest