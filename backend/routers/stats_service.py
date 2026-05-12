from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
from models import DBAppUser, DBUserGeoQuest, DBUserMiniQuest, DBWeeklyStat, get_utc_now
from enums import QuestStatus
from schemas import WeeklyStatResponse
from auth_utils import get_current_user

router = APIRouter(
    prefix="/stats",
    tags=["Statistics"]
)

def generate_weekly_stats():
    """
    Ця функція запускається автоматично. Вона рахує статистику
    за останні 7 днів для КОЖНОГО користувача.
    """
    db = SessionLocal()
    try:
        now = get_utc_now()
        week_ago = now - timedelta(days=7)

        users = db.query(DBAppUser).filter(DBAppUser.is_active == True).all()

        for user in users:
            geo_count = db.query(DBUserGeoQuest).filter(
                DBUserGeoQuest.user_id == user.id,
                DBUserGeoQuest.status == QuestStatus.COMPLETED,
                DBUserGeoQuest.completed_at >= week_ago,
                DBUserGeoQuest.completed_at <= now
            ).count()

            mini_count = db.query(DBUserMiniQuest).filter(
                DBUserMiniQuest.user_id == user.id,
                DBUserMiniQuest.status == QuestStatus.COMPLETED,
                DBUserMiniQuest.completed_at >= week_ago,
                DBUserMiniQuest.completed_at <= now
            ).count()

            if geo_count > 0 or mini_count > 0:
                new_stat = DBWeeklyStat(
                    user_id=user.id,
                    week_start=week_ago,
                    week_end=now,
                    geo_quests_completed=geo_count,
                    mini_quests_completed=mini_count
                )
                db.add(new_stat)

        db.commit()
        print(f"[{now}] Тижнева статистика успішно згенерована!")

    except Exception as e:
        db.rollback()
        print(f"Помилка при генерації статистики: {e}")
    finally:
        db.close()


@router.get("/my-weekly-stats", response_model=List[WeeklyStatResponse])
async def get_my_stats(
        user: DBAppUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Повертає історію тижневої статистики поточного користувача"""
    stats = db.query(DBWeeklyStat).filter(
        DBWeeklyStat.user_id == user.id
    ).order_by(DBWeeklyStat.week_end.desc()).all()

    return stats