from database import Base
from datetime import datetime,timezone
import uuid
from sqlalchemy import Column,Table, Integer, String,Boolean,DateTime, Uuid, ForeignKey, UniqueConstraint,Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum
from enums import *
from geoalchemy2 import Geography
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

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
    user_mini_quest_id = Column(Uuid, ForeignKey("user_mini_quest.id"), nullable=True)
    user_geo_quest_id = Column(Uuid, ForeignKey("user_geo_quest.id"), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    user = relationship("DBAppUser", backref="posts")
    user_mini_quest = relationship("DBUserMiniQuest", backref="posts")
    user_geo_quest = relationship("DBUserGeoQuest", backref="posts")
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


class DBMiniQuest(Base):
    __tablename__ = "mini_quest"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    title = Column(String, nullable=False)
    hobbies = relationship("DBHobby", secondary=mini_quest_hobby_table, backref="mini_quests")


class DBUserMiniQuest(Base):
    __tablename__ = "user_mini_quest"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey('app_user.id'), nullable=False)
    mini_quest_id = Column(Uuid, ForeignKey('mini_quest.id'), nullable=False)
    status = Column(Enum(QuestStatus), default=QuestStatus.AVAILABLE, nullable=False)
    evaluation = Column(Enum(QuestEvaluation), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("DBAppUser", backref="user_mini_quest")
    mini_quest = relationship("DBMiniQuest", backref="user_mini_quest")


class DBPlace(Base):
    __tablename__ = "place"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    coordinates = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)

class DBGeoQuest(Base):
    __tablename__ = "geo_quest"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    title = Column(String, unique=True, nullable=False)
    place_id = Column(Uuid, ForeignKey('place.id'), nullable=False)
    place = relationship("DBPlace", backref="geo_quests")

class DBUserGeoQuest(Base):
    __tablename__ = "user_geo_quest"

    id = Column(Uuid, default=uuid.uuid4, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey('app_user.id'), nullable=False)
    geo_quest_id = Column(Uuid, ForeignKey('geo_quest.id'), nullable=False)
    status = Column(Enum(QuestStatus), default=QuestStatus.AVAILABLE, nullable=False)
    photo_proof_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("DBAppUser", backref="user_geo_quests")
    geo_quest = relationship("DBGeoQuest", backref="user_geo_quests")

class DBPostReport(Base):
    __tablename__ = "post_report"
    id = Column(Uuid,default=uuid.uuid4, primary_key=True, index=True)
    post_id = Column(Uuid, ForeignKey('post.id',ondelete="CASCADE"), nullable=False)
    reporter_id = Column(Uuid, ForeignKey('app_user.id', ondelete="CASCADE"), nullable=False)
    reason = Column(Enum(ReportReason), nullable=False)
    details = Column(String, nullable=True)

    user = relationship("DBAppUser", backref="post_report")
    post = relationship("DBPost", backref="post_report")


class DBWeeklyStat(Base):
    __tablename__ = 'weekly_stats'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey('app_user.id', ondelete="CASCADE"), nullable=False)
    week_start = Column(DateTime(timezone=True), nullable=False)
    week_end = Column(DateTime(timezone=True), nullable=False)
    geo_quests_completed = Column(Integer, default=0)
    mini_quests_completed = Column(Integer, default=0)
    active_days = Column(Integer, default=0)
    top_hobby = Column(String, nullable=True)
    unique_locations = Column(Integer, default=0)
    total_score = Column(Integer, default=0)