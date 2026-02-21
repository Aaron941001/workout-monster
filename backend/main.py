from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import auth, user, training, nutrition, ai

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Workout Monster API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(training.router)
app.include_router(nutrition.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Workout Monster API"}
