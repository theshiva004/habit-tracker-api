from fastapi import FastAPI,HTTPException, status
from database import get_db_connection
from schemas import UserCreate, UserResponse
from security import hash_password

app = FastAPI(title = "Habit Tracker API")

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
        return{
            "status": "conncted",
            "database": result["current_database"],
            "user": result["current_user"]
        }
    except Exception as e:
        raise HTTPException(status_code = 500,detail = str(e))

@app.post("/register",response_model = UserResponse, status_code = status.HTTP_201_created)
def register_user(user:UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    #check existing user
    cursor.execute("SELECT id FROM users WHERE email = %s;",(user.email,))

    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detai = "Email already registered"
        )
    #new user
    hashed_pwd = hash_password(user.password)
    cursor.execute("INSERT INTO users (email, pass_hash) VALUES (%s,%s) RETURNING id ,email;",(user.email, hashed_pwd))
    new_user = cursor.fetchone()

    conn.commit()
    cursor.close()
    conn.close()

    return new_user;