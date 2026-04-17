from backend.database import Base
from datetime import datetime,timezone
import uuid
from sqlalchemy import Column,Table, Integer, String,Boolean,DateTime, Uuid, ForeignKey, UniqueConstraint,Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum
from backend.enums import *

def get_utc_now():
    return datetime.now(timezone.utc)

user_hobby_table = Table(
    "user_hobby",
    Base.metadata,
    Column("user_id", Uuid, ForeignKey("app_user.id", ondelete="CASCADE"), primary_key=True),
    Column("hobby_id", Integer, ForeignKey("hobby.id", ondelete="CASCADE"), primary_key=True)
)

mini_quest_hobby_table = Table(
    "mini_quest_hobby",
    Base.metadata,
    Column("mini_quest_id", Uuid, ForeignKey("mini_quest.id", ondelete="CASCADE"), primary_key=True),
    Column("hobby_id", Integer, ForeignKey("hobby.id", ondelete="CASCADE"), primary_key=True)
)

class DBHobby(Base):
    __tablename__ = "hobby"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class DBAppUser(Base):
    __tablename__ = "app_user"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    nickname = Column(String,unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    last_login_at =Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    verification_code = Column(String, nullable=True)
    hobbies = relationship("DBHobby", secondary=user_hobby_table,backref="users")

class DBPost(Base):
    __tablename__ = "post"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey("app_user.id"), nullable=False)
    #user_mini_quest_id = Column(Uuid, ForeignKey("user_mini_quest.id"), nullable=True)
    #user_geo_quest_id = Column(Uuid, ForeignKey("user_geo_quest.id"), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    user = relationship("DBAppUser", backref="posts")
    #user_mini_quest = relationship("DBUserMiniQuest", backref="posts")
    #user_geo_quest = relationship("DBUserGeoQuest", backref="posts")
    reactions = relationship("DBPostReaction", backref="post", cascade="all, delete-orphan")

class DBPostReaction(Base):
    __tablename__ = "post_reaction"

    __table_args__ = (UniqueConstraint("post_id", "user_id","reaction_type",name ="_reaction_unique"),)
    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    post_id = Column(Uuid, ForeignKey("post.id",ondelete="CASCADE"), nullable=False)
    user_id = Column(Uuid, ForeignKey("app_user.id",ondelete="CASCADE"), nullable=False)
    reaction_type = Column(Enum(ReactionType), nullable=False)

class DBStateLog(Base):
    __tablename__ = "mood_log"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey('app_user.id'), nullable=False)
    state = Column(Enum(MoodState), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("DBAppUser", backref="mood_logs")

class DBTimeCapsule(Base):
    __tablename__ = "time_capsule"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey('app_user.id'), nullable=False)
    message = Column(String, nullable=False)
    is_viewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("DBAppUser", backref="time_capsule")
