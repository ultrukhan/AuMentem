from typing import List
from sqlalchemy import desc
from sqlalchemy.orm import Session,joinedload
from sqlalchemy.exc import IntegrityError
from backend.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from backend.models import DBPost,DBAppUser,DBPostReaction
from backend.auth_utils import get_current_user
from backend.schemas import PostResponse,CreatePost,ReactionToggle
from uuid import UUID

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
)

@router.post("/", response_model=PostResponse)
async def create_post(post:CreatePost, user: DBAppUser = Depends(get_current_user),db: Session = Depends(get_db)):
    newpost = DBPost(
        user_id= user.id,
        user_mini_quest_id=post.user_mini_quest_id,
        user_geo_quest_id=post.user_geo_quest_id,
        is_anonymous=post.is_anonymous,
    )

    db.add(newpost)
    db.commit()
    db.refresh(newpost)

    if newpost.is_anonymous:
        newpost.user = None
        if newpost.user_mini_quest:
            newpost.user_mini_quest.user = None
        if newpost.user_geo_quest:
            newpost.user_geo_quest.user = None

    return newpost

@router.get("/", response_model=List[PostResponse])
async def get_posts(user: DBAppUser = Depends(get_current_user),db: Session = Depends(get_db)):
    posts = (db.query(DBPost).options(joinedload(DBPost.user),
                                      joinedload(DBPost.user_mini_quest),
                                      joinedload(DBPost.user_geo_quest),
                                      joinedload(DBPost.reactions)).order_by(desc(DBPost.created_at)).limit(15).all())

    for post in posts:
        if post.is_anonymous:
            post.user = None
            if post.user_mini_quest:
                post.user_mini_quest.user = None
            if post.user_geo_quest:
                post.user_geo_quest.user = None

    return posts



@router.post("/{post_id}/react")
async def toggle_reaction(
    post_id: UUID,
    reaction_data: ReactionToggle,
    user: DBAppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ендпоінт для додавання або видалення реакції (Toggle).
    Якщо реакція вже є - видаляється. Якщо нема - створюється.
    """
    post = db.query(DBPost).filter(DBPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    existing_reaction = db.query(DBPostReaction).filter(
        DBPostReaction.post_id == post_id,
        DBPostReaction.user_id == user.id,
        DBPostReaction.reaction_type == reaction_data.reaction_type
    ).first()

    if existing_reaction:
        db.delete(existing_reaction)
        db.commit()
        return {"status": "removed", "message": "Реакцію видалено"}
    else:
        new_reaction = DBPostReaction(
            post_id=post_id,
            user_id=user.id,
            reaction_type=reaction_data.reaction_type
        )
        db.add(new_reaction)
        db.commit()
        return {"status": "added", "message": "Реакцію додано"}

