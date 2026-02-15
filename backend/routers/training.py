from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend import models, schemas, database, auth
from datetime import datetime, timezone
from uuid import uuid4, UUID
from typing import Optional

router = APIRouter(
    prefix="/training",
    tags=["training"]
)

# Seed Exercises (Simple hardcoded list for MVP)
DEFAULT_EXERCISES = [
    {"name": "Squat", "type": "compound", "primary_muscle": "legs"},
    {"name": "Bench Press", "type": "compound", "primary_muscle": "chest"},
    {"name": "Deadlift", "type": "compound", "primary_muscle": "back"},
    {"name": "Overhead Press", "type": "compound", "primary_muscle": "shoulders"},
    {"name": "Pull Up", "type": "compound", "primary_muscle": "back"},
    {"name": "Dumbbell Row", "type": "isolation", "primary_muscle": "back"},
]

from ..seed_exercises import exercises_data

@router.post("/seed_exercises_extended")
def seed_exercises_extended(db: Session = Depends(database.get_db)):
    count = 0
    for ex in exercises_data:
        # Check if exists by name (case insensitive for safety)
        exists = db.query(models.Exercises).filter(
            models.Exercises.name.ilike(ex["name"])
        ).first()
        
        if not exists:
            new_ex = models.Exercises(
                name=ex["name"],
                name_zh=ex.get("name_zh"),
                type=ex["type"],
                primary_muscle=ex["primary_muscle"],
                equipment=ex.get("equipment")
            )
            db.add(new_ex)
            count += 1
        elif not exists.name_zh and ex.get("name_zh"):
            # Update existing with Chinese name if missing
            exists.name_zh = ex.get("name_zh")
            count += 1

    db.commit()
    return {"message": f"Seeded {count} new or updated exercises"}

@router.get("/plan")
def get_training_plan(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # 1. Ensure exercises exist (Auto-seed if empty for MVP)
    if db.query(models.Exercises).count() == 0:
        seed_exercises_extended(db)

    # 2. Get all exercises to map names to IDs
    all_exercises = db.query(models.Exercises).all()
    ex_map = {ex.name: {"id": str(ex.id), "name": ex.name} for ex in all_exercises}

    # 3. Construct Plan with IDs
    # Note: efficient way would be relational DB, but for MVP hardcoding structure with DB IDs
    def get_ex(name):
        return ex_map.get(name, {"id": None, "name": name})

    return {
        "days": [
            {"id": "upper_a", "name": "Upper Body A", "exercises": [get_ex("Bench Press"), get_ex("Dumbbell Row"), get_ex("Overhead Press")]},
            {"id": "lower_a", "name": "Lower Body A", "exercises": [get_ex("Squat"), get_ex("Deadlift"), get_ex("Leg Curl")]}, # Replaced Calf Raise with more standard
            {"id": "upper_b", "name": "Upper Body B", "exercises": [get_ex("Pull Up"), get_ex("Bench Press"), get_ex("Dumbbell Row")]}, # Reusing for simplicity
            {"id": "lower_b", "name": "Lower Body B", "exercises": [get_ex("Deadlift"), get_ex("Squat"), get_ex("Plank")]}
        ]
    }

@router.post("/session/start", response_model=schemas.Workout) # Need schemas.Workout
def start_session(plan_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Create a workout session
    new_workout = models.Workouts(
        user_id=current_user.id,
        notes=f"Started {plan_id}",
        start_time=datetime.now(timezone.utc)
    )
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)
    return new_workout

@router.post("/set", response_model=schemas.WorkoutSetResponse) # Need schemas
def log_set(set_data: schemas.WorkoutSetCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # 1. Log the set
    new_set = models.WorkoutSets(
        workout_id=set_data.workout_id,
        exercise_id=set_data.exercise_id,
        set_order=set_data.set_order,
        weight_kg=set_data.weight_kg,
        reps=set_data.reps,
        rpe=set_data.rpe
    )
    db.add(new_set)
    db.commit()
    
    # 2. Check Logic for Next Set/Session
    # Logic: If RPE <= 8.5 AND Reps >= Target (Assuming target is 8 for MVP)
    # Ideally we need history check here.
    
    suggestion = "Maintain weight"
    if set_data.rpe <= 8.5 and set_data.reps >= 8:
        suggestion = "Consider +2.5kg next set/session"
    
    return {"set": new_set, "suggestion": suggestion}

@router.post("/session/finish")
def finish_session(workout_id: UUID, db: Session = Depends(database.get_db)):
    workout = db.query(models.Workouts).filter(models.Workouts.id == workout_id).first()
    if workout:
        workout.end_time = datetime.now(timezone.utc)
        db.commit()
    return {"message": "Workout finished"}

@router.get("/exercises")
def get_exercises(q: Optional[str] = None, limit: int = 50, db: Session = Depends(database.get_db)):
    query = db.query(models.Exercises)
    if q:
        # Simple case-insensitive search
        search = f"%{q}%"
        query = query.filter(
            (models.Exercises.name.ilike(search)) | 
            (models.Exercises.name_zh.ilike(search))
        )
    return query.limit(limit).all()

# Training Plan Management Endpoints
@router.post("/plans")
def create_training_plan(
    name: str,
    description: str = "",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Create a new training plan"""
    new_plan = models.TrainingPlan(
        user_id=current_user.id,
        name=name,
        description=description,
        is_active=False
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.get("/plans")
def get_user_plans(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all training plans for the current user"""
    plans = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.user_id == current_user.id
    ).all()
    return plans

@router.get("/plans/{plan_id}")
def get_plan_details(
    plan_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get detailed plan with exercises grouped by day"""
    from uuid import UUID
    plan_uuid = UUID(plan_id)
    
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_uuid,
        models.TrainingPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Group exercises by day
    days = {}
    for pe in plan.exercises:
        if pe.day_name not in days:
            days[pe.day_name] = []
        days[pe.day_name].append({
            "id": str(pe.id),
            "exercise_id": str(pe.exercise_id),
            "name": pe.exercise.name,
            "name_zh": pe.exercise.name_zh,
            "sets": pe.sets,
            "reps_min": pe.reps_min,
            "reps_max": pe.reps_max,
            "order": pe.order
        })
    
    return {
        "id": str(plan.id),
        "name": plan.name,
        "description": plan.description,
        "is_active": plan.is_active,
        "days": days
    }

@router.post("/plans/{plan_id}/activate")
def activate_plan(
    plan_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Set a plan as active (deactivates others)"""
    from uuid import UUID
    plan_uuid = UUID(plan_id)
    
    # Deactivate all user's plans
    db.query(models.TrainingPlan).filter(
        models.TrainingPlan.user_id == current_user.id
    ).update({"is_active": False})
    
    # Activate the selected plan
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_uuid,
        models.TrainingPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan.is_active = True
    db.commit()
    
    return {"message": "Plan activated"}

@router.post("/plans/{plan_id}/exercises")
def add_exercise_to_plan(
    plan_id: str,
    exercise_id: str,
    day_name: str,
    sets: int = 3,
    reps_min: int = 8,
    reps_max: int = 12,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Add an exercise to a training plan"""
    from uuid import UUID
    
    # Convert string UUIDs to UUID objects
    plan_uuid = UUID(plan_id)
    exercise_uuid = UUID(exercise_id)
    
    # Verify plan ownership
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_uuid,
        models.TrainingPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get max order for this day
    max_order = db.query(func.max(models.PlanExercise.order)).filter(
        models.PlanExercise.plan_id == plan_uuid,
        models.PlanExercise.day_name == day_name
    ).scalar() or 0
    
    new_exercise = models.PlanExercise(
        plan_id=plan_uuid,
        exercise_id=exercise_uuid,
        day_name=day_name,
        sets=sets,
        reps_min=reps_min,
        reps_max=reps_max,
        order=max_order + 1
    )
    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)
    return new_exercise

@router.delete("/plans/{plan_id}/exercises/{exercise_id}")
def remove_exercise_from_plan(
    plan_id: str,
    exercise_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Remove an exercise from a plan"""
    from uuid import UUID
    plan_uuid = UUID(plan_id)
    exercise_uuid = UUID(exercise_id)
    
    # Verify plan ownership
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_uuid,
        models.TrainingPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Delete the exercise
    db.query(models.PlanExercise).filter(
        models.PlanExercise.id == exercise_uuid,
        models.PlanExercise.plan_id == plan_uuid
    ).delete()
    
    db.commit()
    return {"message": "Exercise removed"}

@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Delete a training plan"""
    from uuid import UUID
    plan_uuid = UUID(plan_id)
    
    plan = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.id == plan_uuid,
        models.TrainingPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}
