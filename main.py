from fastapi import FastAPI,Depends,HTTPException
from backend.routers import auth,app_user,posts,tracker,time_capsule,mini_quest

app = FastAPI()
app.include_router(auth.router)
app.include_router(app_user.router)
app.include_router(posts.router)
app.include_router(tracker.router)
app.include_router(time_capsule.router)
app.include_router(mini_quest.router)