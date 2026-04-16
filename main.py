from fastapi import FastAPI,Depends,HTTPException
from backend.routers import auth,app_user

app = FastAPI()
app.include_router(auth.router)
app.include_router(app_user.router)


