from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import models, schemas, database, auth
from datetime import datetime, timezone, timedelta

router = APIRouter(
    prefix="/user",
    tags=["user"]
)

# TDEE Calculation Logic (Mifflin-St Jeor)
def calculate_tdee(age, gender, height, weight, activity_level):
    # BMR
    if gender.lower() == 'male':
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
        
    # Activity Multiplier
    multipliers = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extra_active': 1.9
    }
    
    return bmr * multipliers.get(activity_level, 1.2)

@router.put("/onboarding", response_model=schemas.User)
def onboarding(data: schemas.UserOnboarding, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    tdee = calculate_tdee(data.age, data.gender, data.height_cm, data.weight_kg, data.activity_level)
    
    # Create User Stats entry
    new_stats = models.UserStats(
        user_id=current_user.id,
        weight_kg=data.weight_kg,
        tdee_current=tdee,
        date=datetime.now(timezone.utc)
    )
    db.add(new_stats)
    
    # Update User Settings with basics if needed
    current_user.settings = {
        "age": data.age,
        "gender": data.gender,
        "height": data.height_cm,
        "activity_level": data.activity_level,
        "goal": data.goal
    }
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.post("/stats", response_model=schemas.UserStats)
def log_stats(stats: schemas.UserStatsBase, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    # Calculate new TDEE based on new weight if needed (simplified for now)
    new_stats = models.UserStats(
        user_id=current_user.id,
        weight_kg=stats.weight_kg,
        waist_cm=stats.waist_cm,
        body_fat_pct=stats.body_fat_pct,
        tdee_current=stats.tdee_current or 2500, # Fallback
        date=datetime.now(timezone.utc)
    )
    db.add(new_stats)
    db.commit()
    db.refresh(new_stats)
    return new_stats

@router.get("/trends")
def get_trends(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    # Get last 14 days of stats
    two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=14)
    stats = db.query(models.UserStats).filter(
        models.UserStats.user_id == current_user.id,
        models.UserStats.date >= two_weeks_ago
    ).order_by(models.UserStats.date).all()
    
    if not stats:
        return {"current_avg": 0, "previous_avg": 0, "trend": "neutral", "message": "Not enough data"}
    
    # Simple Moving Average Logic
    # In production, use pandas or more robust SQL
    weights = [s.weight_kg for s in stats]
    current_avg = sum(weights[-7:]) / len(weights[-7:]) if len(weights) >= 1 else weights[0]
    
    previous_weights = weights[:-7]
    previous_avg = sum(previous_weights) / len(previous_weights) if len(previous_weights) > 0 else current_avg
    
    diff_pct = (current_avg - previous_avg) / previous_avg if previous_avg > 0 else 0
    
    trend = "maintenance"
    message = "Maintaining weight."
    
    today = datetime.now(timezone.utc).date()
    # Check if user goal is CUT
    goal = current_user.settings.get("goal", "maintain")
    
    if goal == "cut" and diff_pct > -0.002: # Less than 0.2% drop, effectively stalled or gained
        trend = "stalled"
        message = "Weight loss stalled. Check sleep & protein. Consider a Refeed day."
    elif diff_pct < -0.005:
        trend = "losing"
        message = "Good pace! Losing fat."
    elif diff_pct > 0.005:
        trend = "gaining"
        message = "Weight trending up."
        
    return {
        "current_avg": round(current_avg, 2),
        "previous_avg": round(previous_avg, 2),
        "diff_pct": round(diff_pct * 100, 2),
        "trend": trend,
        "message": message,
        "history": [{"date": s.date, "weight": s.weight_kg} for s in stats]
    }

@router.get("/history", response_model=list[schemas.UserStats])
def get_history(limit: int = 30, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    stats = db.query(models.UserStats).filter(
        models.UserStats.user_id == current_user.id
    ).order_by(models.UserStats.date.desc()).limit(limit).all()
    return stats

from uuid import UUID

@router.delete("/history/{log_id}")
def delete_history_log(log_id: UUID, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    # 1. Check if log exists and belongs to user
    log = db.query(models.UserStats).filter(
        models.UserStats.id == log_id,
        models.UserStats.user_id == current_user.id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
        
    # 2. Delete
    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}
