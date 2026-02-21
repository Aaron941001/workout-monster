from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, date, timedelta
from typing import Optional
from pydantic import BaseModel
import json

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/ai", tags=["ai"])

# ---------- Schemas ----------

class SaveKeyRequest(BaseModel):
    api_key: str

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "zh"   # "zh" or "en"

# ---------- Context Builder ----------

def build_context(user: models.User, db: Session) -> str:
    """Assemble a rich context string from the user's recent data."""
    today = date.today()
    lines = []

    # --- User profile from settings ---
    s = user.settings or {}
    goal = s.get("goal", "unknown")
    tdee = s.get("tdee", "unknown")
    training_cal = s.get("calories_training", "unknown")
    rest_cal = s.get("calories_rest", "unknown")
    lines.append(f"User goal: {goal}")
    lines.append(f"TDEE: {tdee} kcal | Training day calories: {training_cal} | Rest day calories: {rest_cal}")

    # --- Body stats (last 14 days) ---
    stats = (
        db.query(models.UserStats)
        .filter(models.UserStats.user_id == user.id,
                models.UserStats.date >= today - timedelta(days=14))
        .order_by(models.UserStats.date)
        .all()
    )
    if stats:
        lines.append("\nBody stats (last 14 days):")
        for st in stats:
            parts = [f"  {st.date}: weight={st.weight_kg}kg"]
            if st.waist_cm:
                parts.append(f"waist={st.waist_cm}cm")
            if st.body_fat_pct:
                parts.append(f"body_fat={st.body_fat_pct}%")
            lines.append(" ".join(parts))

    # --- Nutrition (last 7 days) ---
    daily_logs = (
        db.query(models.DailyLog)
        .filter(models.DailyLog.user_id == user.id,
                models.DailyLog.date >= today - timedelta(days=7))
        .order_by(models.DailyLog.date)
        .all()
    )
    food_logs = (
        db.query(models.FoodLog)
        .filter(models.FoodLog.user_id == user.id,
                models.FoodLog.date >= today - timedelta(days=7))
        .order_by(models.FoodLog.date, models.FoodLog.time)
        .all()
    )
    if daily_logs:
        lines.append("\nNutrition (last 7 days):")
        for dl in daily_logs:
            lines.append(
                f"  {dl.date}: calories={dl.calories_actual}/{dl.calories_target} "
                f"protein={dl.protein_actual}/{dl.protein_target}g "
                f"carbs={dl.carbs_actual}/{dl.carbs_target}g "
                f"fats={dl.fats_actual}/{dl.fats_target}g "
                f"training_day={dl.training_day}"
            )
    if food_logs:
        lines.append("\nFood log entries (last 7 days):")
        for fl in food_logs:
            lines.append(f"  {fl.date} — {fl.name}: {fl.calories}kcal P={fl.protein}g C={fl.carbs}g F={fl.fats}g")

    # --- Training (last 5 sessions) ---
    workouts = (
        db.query(models.Workouts)
        .filter(models.Workouts.user_id == user.id)
        .order_by(desc(models.Workouts.start_time))
        .limit(5)
        .all()
    )
    if workouts:
        lines.append("\nRecent training sessions (last 5):")
        for w in workouts:
            date_str = w.start_time.date().isoformat() if w.start_time else "?"
            lines.append(f"  Session {date_str}:")
            for ws in w.sets:
                ex_name = ws.exercise.name if ws.exercise else "unknown"
                rpe_str = f" RPE={ws.rpe}" if ws.rpe else ""
                lines.append(f"    {ex_name}: {ws.weight_kg}kg x {ws.reps} reps{rpe_str}")

    return "\n".join(lines)


def build_system_prompt(context: str, language: str) -> str:
    if language == "zh":
        lang_instruction = "請用繁體中文回覆，語氣親切、專業，像一位健身教練朋友。"
        off_topic = "如果用戶問的不是健身、營養、身體組成或健康相關問題，請禮貌地說你只能回答健身相關問題。"
        log_instruction = (
            "如果用戶說他記錄了某些事情（例如：今天吃了什麼、量了體重、腰圍等），"
            "請在回覆結尾加入一個 JSON 區塊，格式如下 (不加到回覆文字中):\n"
            "```log_action\n{\"type\": \"food_log\", \"name\": \"食物名稱\", \"calories\": 數字, \"protein\": 數字, \"carbs\": 數字, \"fats\": 數字}\n```\n"
            "或\n"
            "```log_action\n{\"type\": \"body_stat\", \"weight_kg\": 數字, \"waist_cm\": 數字或null}\n```\n"
            "如果無法確定精確數字，就用合理估算。如果用戶沒有提到要記錄任何數據，就不要加 log_action 區塊。"
        )
    else:
        lang_instruction = "Reply in English, with a friendly and professional tone like a fitness coach friend."
        off_topic = "If the user asks about anything unrelated to fitness, nutrition, body composition, or health, politely decline and say you only answer fitness-related questions."
        log_instruction = (
            "If the user mentions logging something (e.g. what they ate, their weight, waist measurement), "
            "append a JSON block at the very end of your reply (not visible in text):\n"
            "```log_action\n{\"type\": \"food_log\", \"name\": \"food name\", \"calories\": number, \"protein\": number, \"carbs\": number, \"fats\": number}\n```\n"
            "or\n"
            "```log_action\n{\"type\": \"body_stat\", \"weight_kg\": number, \"waist_cm\": number or null}\n```\n"
            "Use reasonable estimates if exact values aren't given. Omit the log_action block if the user isn't logging data."
        )

    return f"""You are ROBO, an AI fitness coach assistant inside the Workout Monster fitness app.
{lang_instruction}
{off_topic}

Here is the user's recent health & fitness data:
{context}

{log_instruction}

Keep replies concise (3-5 sentences max for simple questions, bullet points for advice).
"""


# ---------- Endpoints ----------

@router.post("/key")
def save_api_key(
    body: SaveKeyRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    settings = dict(current_user.settings or {})
    settings["gemini_api_key"] = body.api_key
    current_user.settings = settings
    db.commit()
    return {"message": "API key saved"}


@router.get("/key")
def check_api_key(
    current_user: models.User = Depends(auth.get_current_user),
):
    has_key = bool((current_user.settings or {}).get("gemini_api_key"))
    return {"has_key": has_key}


@router.post("/chat")
def chat(
    body: ChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    api_key = (current_user.settings or {}).get("gemini_api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="Gemini API key not set. Please add it in Profile settings.")

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        context = build_context(current_user, db)
        system_prompt = build_system_prompt(context, body.language)

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt,
        )
        response = model.generate_content(body.message)
        full_text = response.text

        # Parse optional log_action block
        log_action = None
        if "```log_action" in full_text:
            try:
                start = full_text.index("```log_action") + len("```log_action")
                end = full_text.index("```", start)
                json_str = full_text[start:end].strip()
                log_action = json.loads(json_str)
                # Strip log_action block from visible reply
                full_text = full_text[:full_text.index("```log_action")].strip()
            except Exception:
                pass

        # Execute log_action if present
        logged = None
        if log_action:
            ltype = log_action.get("type")
            today = date.today()
            if ltype == "food_log":
                fl = models.FoodLog(
                    user_id=current_user.id,
                    name=log_action.get("name", "AI logged food"),
                    calories=int(log_action.get("calories", 0)),
                    protein=int(log_action.get("protein", 0)),
                    carbs=int(log_action.get("carbs", 0)),
                    fats=int(log_action.get("fats", 0)),
                    date=today,
                    time=datetime.utcnow()
                )
                db.add(fl)
                # Update DailyLog totals
                dl = db.query(models.DailyLog).filter(
                    models.DailyLog.user_id == current_user.id,
                    models.DailyLog.date == today
                ).first()
                if dl:
                    dl.calories_actual = (dl.calories_actual or 0) + fl.calories
                    dl.protein_actual = (dl.protein_actual or 0) + fl.protein
                    dl.carbs_actual = (dl.carbs_actual or 0) + fl.carbs
                    dl.fats_actual = (dl.fats_actual or 0) + fl.fats
                db.commit()
                logged = "food_log"
            elif ltype == "body_stat":
                st = db.query(models.UserStats).filter(
                    models.UserStats.user_id == current_user.id,
                    models.UserStats.date == today
                ).first()
                if not st:
                    # Get current TDEE estimate
                    settings = current_user.settings or {}
                    tdee = float(settings.get("tdee", 2000))
                    st = models.UserStats(
                        user_id=current_user.id,
                        date=today,
                        tdee_current=tdee
                    )
                    db.add(st)
                if log_action.get("weight_kg") is not None:
                    st.weight_kg = float(log_action["weight_kg"])
                if log_action.get("waist_cm") is not None:
                    st.waist_cm = float(log_action["waist_cm"])
                db.commit()
                logged = "body_stat"

        return {
            "reply": full_text,
            "logged": logged
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "API_KEY_INVALID" in error_msg or "invalid" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Invalid Gemini API key. Please check your key in Profile settings.")
        raise HTTPException(status_code=500, detail=f"AI error: {error_msg}")
