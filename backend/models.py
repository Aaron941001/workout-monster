from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    display_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    settings = Column(JSON, default={})

    stats = relationship("UserStats", back_populates="user")
    workouts = relationship("Workouts", back_populates="user")
    daily_logs = relationship("DailyLog", back_populates="user")
    training_plans = relationship("TrainingPlan", back_populates="user")

class UserStats(Base):
    __tablename__ = "user_stats"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    date = Column(Date, default=datetime.utcnow)
    weight_kg = Column(Float)
    waist_cm = Column(Float)
    body_fat_pct = Column(Float, nullable=True)
    tdee_current = Column(Float)
    
    user = relationship("User", back_populates="stats")

class Exercises(Base):
    __tablename__ = "exercises"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True)
    name_zh = Column(String, nullable=True)
    type = Column(String) # compound/isolation
    primary_muscle = Column(String)
    equipment = Column(String, nullable=True)
    description = Column(String, nullable=True)

class Workouts(Base):
    __tablename__ = "workouts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    readiness_score = Column(Integer, nullable=True)
    
    user = relationship("User", back_populates="workouts")
    sets = relationship("WorkoutSets", back_populates="workout")

class WorkoutSets(Base):
    __tablename__ = "workout_sets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_id = Column(UUID(as_uuid=True), ForeignKey("workouts.id"))
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"))
    set_order = Column(Integer)
    weight_kg = Column(Float)
    reps = Column(Integer)
    rpe = Column(Float)
    is_warmup = Column(Boolean, default=False)
    
    workout = relationship("Workouts", back_populates="sets")
    exercise = relationship("Exercises")

class DailyLog(Base):
    __tablename__ = "daily_log"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    date = Column(Date, default=datetime.utcnow)
    calories_target = Column(Integer)
    calories_actual = Column(Integer, default=0)
    protein_target = Column(Integer)
    protein_actual = Column(Integer, default=0)
    carbs_target = Column(Integer)
    carbs_actual = Column(Integer, default=0)
    fats_target = Column(Integer)
    fats_actual = Column(Integer, default=0)
    training_day = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="daily_logs")

class FoodLog(Base):
    __tablename__ = "food_log"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String) # e.g. "Breakfast", "Chicken"
    calories = Column(Integer)
    protein = Column(Integer)
    carbs = Column(Integer)
    fats = Column(Integer)
    date = Column(Date, default=datetime.utcnow)
    time = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

# New models for custom workout plans
class TrainingPlan(Base):
    __tablename__ = "training_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String)
    name_zh = Column(String, nullable=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="training_plans")
    exercises = relationship("PlanExercise", back_populates="plan", cascade="all, delete-orphan")

class PlanExercise(Base):
    __tablename__ = "plan_exercises"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("training_plans.id"))
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"))
    day_name = Column(String)  # e.g., "Upper A", "Lower B"
    day_name_zh = Column(String, nullable=True)
    sets = Column(Integer)
    reps_min = Column(Integer)
    reps_max = Column(Integer)
    order = Column(Integer)  # Display order within the day
    
    plan = relationship("TrainingPlan", back_populates="exercises")
    exercise = relationship("Exercises")

# New model for food database
class FoodItem(Base):
    __tablename__ = "food_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    name_zh = Column(String, nullable=True)
    calories = Column(Float)  # per serving
    protein_g = Column(Float)
    carbs_g = Column(Float)
    fat_g = Column(Float)
    serving_size = Column(String)  # e.g., "100g", "1 cup"
    serving_size_zh = Column(String, nullable=True)
    category = Column(String, nullable=True)  # e.g., "protein", "carbs", "vegetables"
