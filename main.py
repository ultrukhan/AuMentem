from fastapi import FastAPI,Depends,HTTPException
from backend.routers import auth,app_user,tracker,time_capsule

app = FastAPI()
app.include_router(auth.router)
app.include_router(app_user.router)
app.include_router(tracker.router)
app.include_router(time_capsule.router)