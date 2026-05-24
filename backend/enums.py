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

class ReportReason(str,enum.Enum):
    SPAM = "SPAM"
    OFFENSIVE = "OFFENSIVE"
    SCAM = "SCAM"
    NUDITY = "NUDITY"
    VIOLENCE = "VIOLENCE"
    ILLEGAL_CONTENT = "ILLEGAL_CONTENT"
    COPYRIGHT = "COPYRIGHT"
    OTHER = "OTHER"

class EventCategory(str, enum.Enum):
    SPORT = "SPORT"
    MUSIC = "MUSIC"
    ART = "ART"
    EDUCATION = "EDUCATION"
    MEETUP = "MEETUP"
    ENTERTAINMENT = "ENTERTAINMENT"
    CHARITY = "CHARITY"
    FOOD = "FOOD"
    HISTORY = "HISTORY"
    OTHER = "OTHER"
