from datetime import datetime
from typing import Optional
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