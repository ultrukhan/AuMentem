import enum

class QuestStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    AVAILABLE = "AVAILABLE"

class MoodState(str, enum.Enum):
    CRITICAL = "CRITICAL"
    APATHY = "APATHY"
    POSITIVE = "POSITIVE"

class ReactionType(str, enum.Enum):
    SUPPORT = "SUPPORT"
    HUG = "HUG"
    PROUD = "PROUD"
    HEART = "HEART"

class QuestEvaluation(str, enum.Enum):
    BETTER = "BETTER"
    WORSE = "WORSE"
    SAME = "SAME"
