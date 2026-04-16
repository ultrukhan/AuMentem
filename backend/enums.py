import enum

class QuestStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class MoodState(str, enum.Enum):
    CRITICAL = "CRITICAL"
    APATHY = "APATHY"
    POSITIVE = "POSITIVE"

class ReactionType(str, enum.Enum):
    SUPPORT = "SUPPORT"
    HUG = "HUG"
    PROUD = "PROUD"
    HEART = "HEART"

