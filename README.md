# 💪 Workout Monster

A bilingual (English / 繁體中文) fitness tracking mobile app built with React Native (Expo) and a FastAPI backend. Designed for lifters who want to track training, nutrition, and body composition in one place.

---

## Features

### 🏋️ Training
- Browse and activate training plans (default + custom)
- Active workout session: log sets with weight, reps, and optional RPE
- Rest timer with countdown
- Training history per exercise — max weight trend chart + per-session set breakdown
- Back button with confirmation to prevent accidental exits

### 🥗 Nutrition
- Daily calorie & macro tracking (protein / carbs / fats)
- Food search (OpenFoodFacts database) + manual log entry
- Nutrition history: 7 / 30 / 60-day chart with target line overlay
- Per-day log viewer with delete support

### 👤 Profile & Body Composition
- Onboarding flow (goal, activity level, body stats)
- Body weight logging + trend chart
- BMI and TDEE calculation
- Training/rest day calorie targets

### 🌐 i18n
- Full English / Traditional Chinese support
- Language toggle from login screen
- All UI strings localized

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo Router) |
| Charts | react-native-gifted-charts |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (prod) / SQLite (local) |
| ORM | SQLAlchemy |
| Auth | JWT (email/password) |
| Deployment | Render.com |

---

## Project Structure

```
workout_monster/
├── backend/
│   ├── main.py              # FastAPI app entrypoint
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # DB connection
│   ├── routers/
│   │   ├── auth.py          # Login / signup / JWT
│   │   ├── training.py      # Plans, sessions, sets, history
│   │   ├── nutrition.py     # Food logs, daily targets
│   │   └── user.py          # Profile, body composition
│   └── seed_exercises.py    # Exercise seed data
│
└── frontend/
    ├── app/
    │   ├── login.js
    │   ├── signup.js
    │   └── dashboard/
    │       ├── index.js             # Home dashboard
    │       ├── training/
    │       │   ├── index.js         # Plan list
    │       │   ├── plan/[id].js     # Plan detail (tap exercise → history)
    │       │   ├── [id].js          # Active workout
    │       │   └── exercise_history/[exercise_id].js
    │       ├── nutrition/
    │       │   ├── index.js         # Today's macros
    │       │   └── history.js       # Multi-day chart + log viewer
    │       └── profile.js
    ├── utils/
    │   ├── api.js           # Axios instance
    │   ├── i18n.js          # Translations (en / zh)
    │   └── workoutStore.js  # In-memory exercise hand-off store
    └── components/
        └── nutrition/FoodSearchModal.js
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Expo Go app on your phone (or iOS Simulator)

### Backend

```bash
cd workout_monster
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Start with auto-reload
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` to open the iOS Simulator.

> **Note:** Update `API_BASE_URL` in `frontend/utils/api.js` to your local machine's IP address (not `localhost`) so the phone can reach the backend.

---

## Environment Variables

### Backend (`backend/database.py`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (defaults to SQLite locally) |
| `SECRET_KEY` | JWT signing secret |

### Frontend (`frontend/utils/api.js`)
| Variable | Description |
|---|---|
| `API_BASE_URL` | Backend base URL (e.g. `http://192.168.x.x:8000`) |

---

## Deployment

The backend is deployed on **Render.com** using `render.yaml`. Any push to `main` triggers a redeploy.

---

## License

MIT
