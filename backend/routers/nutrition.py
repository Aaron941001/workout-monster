from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth, database
from ..auth import get_current_user
import datetime
from sqlalchemy import func

router = APIRouter(
    prefix="/nutrition",
    tags=["nutrition"]
)

@router.post("/log", response_model=schemas.FoodLogResponse)
def log_food(entry: schemas.FoodLogCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # 1. Create Food Log
    new_log = models.FoodLog(
        user_id=current_user.id,
        name=entry.name,
        calories=entry.calories,
        protein=entry.protein,
        carbs=entry.carbs,
        fats=entry.fats,
        date=datetime.datetime.utcnow().date(),
        time=datetime.datetime.utcnow()
    )
    db.add(new_log)
    
    # 2. Update Daily Log (Aggregates)
    today = datetime.datetime.utcnow().date()
    daily = db.query(models.DailyLog).filter(
        models.DailyLog.user_id == current_user.id, 
        models.DailyLog.date == today
    ).first()
    
    if not daily:
        daily = models.DailyLog(
            user_id=current_user.id,
            date=today,
            calories_actual=0,
            protein_actual=0,
            carbs_actual=0,
            fats_actual=0
        )
        db.add(daily)
    
    daily.calories_actual += entry.calories
    daily.protein_actual += entry.protein
    daily.carbs_actual += entry.carbs
    daily.fats_actual += entry.fats
    
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/day")
def get_daily_nutrition(date: datetime.date = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if not date:
        date = datetime.datetime.utcnow().date()
        
    # 1. Get Targets (Reuse logic or call internal function)
    # Copied logic for MVP simplicity (should extract to service)
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).order_by(models.UserStats.date.desc()).first()
    
    targets = {"calories": 2000, "protein": 150, "carbs": 200, "fat": 60}
    if stats:
        tdee = stats.tdee_current
        goal = current_user.settings.get("goal", "maintain")
        if goal == "cut": target = tdee - 500
        elif goal == "bulk": target = tdee + 300
        else: target = tdee
        
        # Check workout
        workout = db.query(models.Workouts).filter(models.Workouts.user_id == current_user.id, func.date(models.Workouts.start_time) == date).first()
        if workout: target += 200
        else: target -= 200
        
        protein = stats.weight_kg * 2.2
        fats = stats.weight_kg * 0.8
        carbs = (target - (protein * 4 + fats * 9)) / 4
        
        targets = {
            "calories": int(target),
            "protein": int(protein),
            "carbs": int(carbs),
            "fats": int(fats)
        }

    # 2. Get Actuals
    daily = db.query(models.DailyLog).filter(
        models.DailyLog.user_id == current_user.id, 
        models.DailyLog.date == date
    ).first()
    
    actuals = {
        "calories": daily.calories_actual if daily else 0,
        "protein": daily.protein_actual if daily else 0,
        "carbs": daily.carbs_actual if daily else 0,
        "fats": daily.fats_actual if daily else 0
    }
    
    # 3. Get Logs
    logs = db.query(models.FoodLog).filter(
        models.FoodLog.user_id == current_user.id,
        models.FoodLog.date == date
    ).order_by(models.FoodLog.time.desc()).all()
    
    return {
        "date": date,
        "targets": targets,
        "actuals": actuals,
        "logs": logs
    }

# Food Database Endpoints
from ..seed_foods import foods_data
from typing import Optional

@router.post("/seed_foods")
def seed_foods(db: Session = Depends(database.get_db)):
    """Seed the food database with common items"""
    count = 0
    for food in foods_data:
        # Check if exists by name
        exists = db.query(models.FoodItem).filter(
            models.FoodItem.name.ilike(food["name"])
        ).first()
        
        if not exists:
            new_food = models.FoodItem(
                name=food["name"],
                name_zh=food.get("name_zh"),
                calories=food["calories"],
                protein_g=food["protein_g"],
                carbs_g=food["carbs_g"],
                fat_g=food["fat_g"],
                serving_size=food["serving_size"],
                serving_size_zh=food.get("serving_size_zh"),
                category=food.get("category")
            )
            db.add(new_food)
            count += 1
        elif not exists.name_zh and food.get("name_zh"):
            # Update existing with Chinese name if missing
            exists.name_zh = food.get("name_zh")
            exists.serving_size_zh = food.get("serving_size_zh")
            count += 1
    
    db.commit()
    return {"message": f"Seeded {count} new or updated food items"}

@router.get("/foods")
def search_foods(q: Optional[str] = None, category: Optional[str] = None, limit: int = 50, db: Session = Depends(database.get_db)):
    """Search food database"""
    query = db.query(models.FoodItem)
    
    if q:
        # Search in both English and Chinese names
        search = f"%{q}%"
        query = query.filter(
            (models.FoodItem.name.ilike(search)) | 
            (models.FoodItem.name_zh.ilike(search))
        )
    
    if category:
        query = query.filter(models.FoodItem.category == category)
    
    return query.limit(limit).all()

@router.get("/foods/{food_id}")
def get_food(food_id: str, db: Session = Depends(database.get_db)):
    """Get specific food item"""
    food = db.query(models.FoodItem).filter(models.FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food

from uuid import UUID

@router.post("/log_from_food", response_model=schemas.FoodLogResponse)
def log_from_food(
    food_id: str,
    servings: float,
    meal_name: str = "Meal",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Log food using food database - auto-calculates macros"""
    # Get food item
    try:
        food_uuid = UUID(food_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid food ID format")
        
    food = db.query(models.FoodItem).filter(models.FoodItem.id == food_uuid).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    
    # Calculate macros based on servings
    calories = int(food.calories * servings)
    protein = int(food.protein_g * servings)
    carbs = int(food.carbs_g * servings)
    fats = int(food.fat_g * servings)
    
    # Create food log
    new_log = models.FoodLog(
        user_id=current_user.id,
        name=f"{meal_name}: {food.name}",
        calories=calories,
        protein=protein,
        carbs=carbs,
        fats=fats,
        date=datetime.datetime.utcnow().date(),
        time=datetime.datetime.utcnow()
    )
    db.add(new_log)
    
    # Update daily log
    today = datetime.datetime.utcnow().date()
    daily = db.query(models.DailyLog).filter(
        models.DailyLog.user_id == current_user.id,
        models.DailyLog.date == today
    ).first()
    
    if not daily:
        daily = models.DailyLog(
            user_id=current_user.id,
            date=today,
            calories_actual=0,
            protein_actual=0,
            carbs_actual=0,
            fats_actual=0
        )
        db.add(daily)
    
    daily.calories_actual += calories
    daily.protein_actual += protein
    daily.carbs_actual += carbs
    daily.fats_actual += fats
    
    db.commit()
    db.refresh(new_log)
    return new_log
