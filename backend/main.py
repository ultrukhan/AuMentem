from contextlib import asynccontextmanager
from fastapi import FastAPI,Depends,HTTPException
from routers import auth,app_user,posts,tracker,time_capsule,mini_quest,geo_quest,feedback,stats_service,local_events
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from routers.stats_service import generate_weekly_stats
import os
import requests


def ping_myself():
    """Стукає на власний ендпоінт, щоб обманути Render"""
    base_url = os.getenv("BASE_URL", "https://altera-v8cl.onrender.com")
    url = f"{base_url}/keep-alive"

    try:
        requests.get(url, timeout=5)
        print("Ping successful: Сервер не спить!")
    except Exception as e:
        print(f"Ping failed: {e}")


scheduler = BackgroundScheduler()



@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        generate_weekly_stats,
        CronTrigger(day_of_week='mon', hour=0, minute=0, timezone='Europe/Kiev')
    )

    scheduler.add_job(ping_myself, 'interval', minutes=14)

    scheduler.start()
    print("Планувальник задач запущено!")

    yield

    scheduler.shutdown()
    print("Планувальник задач зупинено!")


app = FastAPI(lifespan=lifespan)

@app.get("/keep-alive", tags=["System"])
async def keep_alive():
    """Службовий ендпоінт для підтримки активності сервера"""
    return {"status": "ok", "message": "I am awake!"}
app.include_router(auth.router)
app.include_router(app_user.router)
app.include_router(posts.router)
app.include_router(tracker.router)
app.include_router(time_capsule.router)
app.include_router(mini_quest.router)
app.include_router(geo_quest.router)
app.include_router(feedback.router)
app.include_router(stats_service.router)
app.include_router(local_events.router)