from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
from models import (
    DBAppUser, DBUserGeoQuest, DBUserMiniQuest, DBWeeklyStat,
    get_utc_now, DBGeoQuest, DBMiniQuest, DBHobby, mini_quest_hobby_table
)
from enums import QuestStatus
from schemas import WeeklyStatResponse
from auth_utils import get_current_user
from email_utils import send_weekly_stats_email
from sqlalchemy import func, desc, and_

router = APIRouter(
    prefix="/stats",
    tags=["Statistics"]
)


def generate_weekly_stats():
    db = SessionLocal()
    try:
        now = get_utc_now()
        week_ago = now - timedelta(days=7)

        top_geo_quest = db.query(DBGeoQuest.title, func.count(DBUserGeoQuest.id).label('cnt')) \
            .join(DBUserGeoQuest).filter(DBUserGeoQuest.status == QuestStatus.COMPLETED,
                                         DBUserGeoQuest.completed_at >= week_ago) \
            .group_by(DBGeoQuest.title).order_by(desc('cnt')).first()

        top_mini_quest = db.query(DBMiniQuest.title, func.count(DBUserMiniQuest.id).label('cnt')) \
            .join(DBUserMiniQuest).filter(DBUserMiniQuest.status == QuestStatus.COMPLETED,
                                          DBUserMiniQuest.completed_at >= week_ago) \
            .group_by(DBMiniQuest.title).order_by(desc('cnt')).first()

        global_top_geo = top_geo_quest.title if top_geo_quest else "Немає даних"
        global_top_mini = top_mini_quest.title if top_mini_quest else "Немає даних"

        users = db.query(DBAppUser).filter(DBAppUser.is_active == True).all()

        for user in users:
            geo_q = db.query(DBUserGeoQuest).filter(
                DBUserGeoQuest.user_id == user.id,
                DBUserGeoQuest.status == QuestStatus.COMPLETED,
                DBUserGeoQuest.completed_at >= week_ago
            )
            mini_q = db.query(DBUserMiniQuest).filter(
                DBUserMiniQuest.user_id == user.id,
                DBUserMiniQuest.status == QuestStatus.COMPLETED,
                DBUserMiniQuest.completed_at >= week_ago
            )

            geo_count = geo_q.count()
            mini_count = mini_q.count()

            geo_days = db.query(func.date(DBUserGeoQuest.completed_at)).filter(
                DBUserGeoQuest.user_id == user.id,
                DBUserGeoQuest.completed_at >= week_ago
            )
            mini_days = db.query(func.date(DBUserMiniQuest.completed_at)).filter(
                DBUserMiniQuest.user_id == user.id,
                DBUserMiniQuest.completed_at >= week_ago
            )
            active_days_count = geo_days.union(mini_days).distinct().count()

            user_top_hobby = db.query(DBHobby.name, func.count(DBHobby.id).label('h_cnt')) \
                .join(mini_quest_hobby_table).join(DBMiniQuest).join(DBUserMiniQuest) \
                .filter(DBUserMiniQuest.user_id == user.id,
                        DBUserMiniQuest.status == QuestStatus.COMPLETED,
                        DBUserMiniQuest.completed_at >= week_ago) \
                .group_by(DBHobby.name).order_by(desc('h_cnt')).first()

            hobby_name = user_top_hobby.name if user_top_hobby else None

            unique_locs = db.query(DBGeoQuest.place_id).join(DBUserGeoQuest) \
                .filter(DBUserGeoQuest.user_id == user.id,
                        DBUserGeoQuest.status == QuestStatus.COMPLETED,
                        DBUserGeoQuest.completed_at >= week_ago) \
                .distinct().count()

            if geo_count > 0 or mini_count > 0:
                new_stat = DBWeeklyStat(
                    user_id=user.id,
                    week_start=week_ago,
                    week_end=now,
                    geo_quests_completed=geo_count,
                    mini_quests_completed=mini_count,
                    active_days=active_days_count,
                    top_hobby=hobby_name,
                    unique_locations=unique_locs
                )
                db.add(new_stat)

                try:
                    send_weekly_stats_email(
                        email_to=user.email,
                        geo_count=geo_count,
                        mini_count=mini_count,
                        active_days=active_days_count,
                        top_hobby=hobby_name,
                        unique_locs=unique_locs,
                        global_geo=global_top_geo,
                        global_mini=global_top_mini
                    )
                except Exception as email_err:
                    print(f"Помилка імейлу для {user.email}: {email_err}")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Помилка генерації статистики: {e}")
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