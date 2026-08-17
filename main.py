from fastapi import FastAPI,HTTPException
from database import get_db_connection

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