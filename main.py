from fastapi import FastAPI,Depends,HTTPException
from backend.routers import auth,app_user,posts

app = FastAPI()
app.include_router(auth.router)
app.include_router(app_user.router)
app.include_router(posts.router)


