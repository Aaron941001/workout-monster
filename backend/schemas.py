from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: UUID
    created_at: datetime
    settings: Optional[dict] = {}

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserStatsBase(BaseModel):
    weight_kg: float
    waist_cm: Optional[float] = None
    body_fat_pct: Optional[float] = None
    tdee_current: Optional[float] = None

class UserOnboarding(BaseModel):
    age: int
    gender: str # male/female
    height_cm: float
    weight_kg: float
    activity_level: str # sedentary, lightly_active, etc.
    goal: str # cut, maintain, bulk

class UserStats(UserStatsBase):
    id: UUID
    date: datetime
    class Config:
        orm_mode = True

class User(UserBase):
    id: UUID
    created_at: datetime
    settings: Optional[dict] = {}
    stats: List[UserStats] = []

    class Config:
        orm_mode = True

class WorkoutSetCreate(BaseModel):
    workout_id: UUID
    exercise_id: UUID
    set_order: int
    weight_kg: float
    reps: int
    rpe: float

class WorkoutSetResponse(BaseModel):
    id: UUID
    weight_kg: float
    reps: int
    rpe: float
    class Config:
        orm_mode = True

class Workout(BaseModel):
    id: UUID
    start_time: datetime
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    class Config:
        orm_mode = True
    class Config:
        orm_mode = True

class FoodLogCreate(BaseModel):
    name: str # "Lunch", "Snack", etc.
    calories: int
    protein: int
    carbs: int
    fats: int

class FoodLogResponse(FoodLogCreate):
    id: UUID
    date: datetime
    time: datetime
    class Config:
        orm_mode = True

class ExerciseBase(BaseModel):
    name: str
    name_zh: Optional[str] = None
    type: str # compound/isolation
    primary_muscle: str
    equipment: Optional[str] = None
    description: Optional[str] = None

class Exercise(ExerciseBase):
    id: UUID
    class Config:
        orm_mode = True
