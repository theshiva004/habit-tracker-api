from typing import List
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

from database import get_db_connection
from schemas import (
    UserCreate, 
    UserResponse, 
    Token, 
    HabitResponse, 
    HabitCreate,
    HabitCompletionResponse
)
from security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    get_current_user
)

app = FastAPI(title="Habit Tracker API")

@app.get("/")
def root():
    return {"status": "active", "message": "Habit Tracker API is live!"}

@app.get("/db-check")
def db_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT current_database(), current_user;")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return {
            "status": "connected",
            "database": result["current_database"],
            "user": result["current_user"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check existing user
    cursor.execute("SELECT id FROM users WHERE email = %s;", (user.email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Insert new user
    hashed_pwd = hash_password(user.password)
    cursor.execute(
        "INSERT INTO users (email, pass_hash) VALUES (%s, %s) RETURNING id, email;",
        (user.email, hashed_pwd)
    )
    new_user = cursor.fetchone()

    conn.commit()
    cursor.close()
    conn.close()

    return new_user

@app.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, pass_hash FROM users WHERE email = %s;", (form_data.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not verify_password(form_data.password, user["pass_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(data={"sub": str(user["id"])})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def read_current_user(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/habits", response_model=HabitResponse)
def create_habit(habit: HabitCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Check if a habit with this name already exists for the current user
    cursor.execute(
        "SELECT id FROM habits WHERE user_id = %s AND LOWER(name) = LOWER(%s);",
        (current_user["id"], habit.name.strip())
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Habit '{habit.name}' already exists."
        )

    # 2. Create the habit
    cursor.execute(
        """
        INSERT INTO habits (user_id, name, description) 
        VALUES (%s, %s, %s) 
        RETURNING id, user_id, name, description, created_at;
        """, 
        (current_user["id"], habit.name.strip(), habit.description)
    )
    new_habit = cursor.fetchone()

    conn.commit()
    cursor.close()
    conn.close()

    return new_habit

@app.get("/habits", response_model=List[HabitResponse])
def get_user_habits(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, user_id, name, description, created_at FROM habits WHERE user_id = %s;",
        (current_user["id"],)
    )
    habits = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return habits

@app.post("/habits/{habit_id}/complete", response_model = HabitCompletionResponse)
def log_habit_competion(habit_id:int, current_user:dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM habits WHERE id = %s AND user_id = %s;",(habit_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail= "Habit not found or unauthorized")

    cursor.execute("INSERT INTO completion (habit_id) VALUES (%s) RETURNING id, habit_id, completed_at;", (habit_id,))
    new_completion = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return new_completion

@app.get("/habits/{habit_id}/completions", response_model=List[HabitCompletionResponse])
def get_habit_completions(habit_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check ownership
    cursor.execute("SELECT id FROM habits WHERE id = %s AND user_id = %s;", (habit_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Habit not found or unauthorized")

    cursor.execute(
        "SELECT id, habit_id, completed_at FROM completion WHERE habit_id = %s ORDER BY completed_at DESC;",
        (habit_id,)
    )
    completions = cursor.fetchall()
    cursor.close()
    conn.close()

    return completions