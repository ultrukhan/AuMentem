from contextlib import asynccontextmanager
from fastapi import FastAPI,Depends,HTTPException
from routers import auth,app_user,posts,tracker,time_capsule,mini_quest,geo_quest,feedback,stats_service
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from routers.stats_service import generate_weekly_stats

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        generate_weekly_stats,
        # CronTrigger(day_of_week='mon', hour=0, minute=0)
        CronTrigger(day_of_week='tue', hour=21, minute=58, timezone='Europe/Kiev')

    )
    scheduler.start()
    print("Планувальник задач запущено!")

    yield

    scheduler.shutdown()
    print("Планувальник задач зупинено!")


app = FastAPI(lifespan=lifespan)
app.include_router(auth.router)
app.include_router(app_user.router)
app.include_router(posts.router)
app.include_router(tracker.router)
app.include_router(time_capsule.router)
app.include_router(mini_quest.router)
app.include_router(geo_quest.router)
app.include_router(feedback.router)
app.include_router(stats_service.router)