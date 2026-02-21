from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import models, schemas, database
from backend import auth as auth_logic
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import httpx

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth_logic.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        display_name=user.display_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=auth_logic.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_logic.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_logic.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth_logic.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_logic.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from pydantic import BaseModel

class GoogleAuthRequest(BaseModel):
    id_token: str  # This is the access_token from expo-auth-session Google provider

@router.post("/google", response_model=schemas.Token)
async def google_login(payload: GoogleAuthRequest, db: Session = Depends(database.get_db)):
    """Exchange Google access token for app JWT"""
    # Verify with Google's userinfo endpoint
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {payload.id_token}"}
        )
    
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    google_user = resp.json()
    email = google_user.get("email")
    name = google_user.get("name") or email.split("@")[0]
    
    if not email:
        raise HTTPException(status_code=400, detail="Could not get email from Google")
    
    # Find or create user
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            password_hash="GOOGLE_AUTH",  # No password for Google users
            display_name=name,
            settings={}
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token_expires = timedelta(minutes=auth_logic.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_logic.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

