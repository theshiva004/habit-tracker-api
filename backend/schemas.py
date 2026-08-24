from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

# Habit Schemas
class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None

class HabitResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Completion Schemas
class HabitCompletionResponse(BaseModel):
    id: int
    habit_id: int
    completed_at: datetime

    class Config:
        from_attributes = True
class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class HabitTodayResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    completed_today: bool
    current_streak: int
    completed_days_last_30: int
    tracked_days_last_30: int
    completion_rate_last_30: float

    class Config:
        from_attributes = True

class DailyCompletionStat(BaseModel):
    date: date
    completed_habits: int

class UserStatsResponse(BaseModel):
    history: List[DailyCompletionStat]
