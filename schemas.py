from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email : EmailStr
    password :str

class UserResponse(BaseModel):
    id:int
    email: EmailStr

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token:str
    token_type:str

class Userlogin(BaseModel):
    email: EmailStr
    password:str

class HabitCreate(BaseModel):
    name:str
    description: Optional[str] = None

class HabitResponse(BaseModel):
    id : int
    user_id : int
    name:str
    description: Optional[str]=None
    created_at: datetime