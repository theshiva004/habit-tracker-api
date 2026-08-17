# 🎯 Habit Tracker REST API

A lightweight, secure, and production-ready backend service for tracking habits, logging daily completions, and monitoring real-time user consistency. Built using **FastAPI**, **PostgreSQL**, **psycopg2**, and **PyJWT**.

---

## ⚡ Features

* **Authentication & Security**: User registration and login powered by OAuth2 Password Flow, JWT access tokens, and `bcrypt` password hashing.
* **Habit Management (CRUD)**: Full support to create, view, update, and delete habits.
* **Database-Level Integrity**: Enforces unique habit names per user via SQL `UNIQUE` constraints and API-level pre-checks.
* **Daily Completion Tracking**: Log habit completions with single-completion enforcement per day and an option to undo (`DELETE`).
* **Live Daily Dashboard**: Optimized `/habits/today` endpoint utilizing SQL `EXISTS` subqueries to fetch all active habits with real-time `completed_today` boolean flags.
* **SQL Injection Prevention**: Parameterized direct SQL queries with `psycopg2` and `RealDictCursor`.

---

## 🛠️ Tech Stack

* **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
* **Database**: [PostgreSQL](https://www.postgresql.org/)
* **Database Driver**: `psycopg2-binary` (using `RealDictCursor`)
* **Security & Auth**: `PyJWT`, `passlib` (bcrypt)
* **Data Validation**: `Pydantic` v2
* **Environment Configuration**: `python-dotenv`

---

## 📂 Project Structure

```text
habit-tracker-api/
│── database.py      # PostgreSQL connection setup & configuration
│── main.py          # FastAPI routes, error handling, & business logic
│── schemas.py       # Pydantic data models & response serialization
│── security.py      # Password hashing, JWT token creation, & auth dependencies
│── .env             # Environment variables (git-ignored)
|── README.md        # Project documentation
└──requirements.txt  # Project requirements
```

---

## 🗄️ Database Schema Setup

Execute the following SQL script in your PostgreSQL database to initialize the required tables and constraints:

```sql
-- users table
CREATE TABLE users(
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) UNIQUE NOT NULL,
	pass_hash VARCHAR(255) NOT NULL,
	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
--habits table
CREATE TABLE habits(
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name VARCHAR(100) NOT NULL,
	description TEXT,
	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
--completion log table	
);

CREATE TABLE completion(
	id BIGSERIAL PRIMARY KEY,
	habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
	completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/habit-tracker-api.git
cd habit-tracker-api
```

### 2. Set Up Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install fastapi uvicorn psycopg2-binary pyjwt passlib[bcrypt] python-dotenv pydantic[email]
```

### 4. Configure Environment Variables
Create a `.env` file in the project root directory:

```env
DB_HOST=localhost
DB_NAME=habit_tracker
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_PORT=5432
SECRET_KEY=your_super_secret_jwt_key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Run the Application
```bash
uvicorn main:app --reload
```

The server will be live at `[http://127.0.0.1:8000](http://127.0.0.1:8000)`.

---

## 📌 API Reference

Interactive API docs are automatically generated and accessible via:
* **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Summary of Endpoints

| Category | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/register` | Register a new user | No |
| **Auth** | `POST` | `/login` | Authenticate and retrieve JWT token | No |
| **Dashboard** | `GET` | `/habits/today` | Fetch all user habits with `completed_today` flag | Yes |
| **Habits** | `GET` | `/habits` | Retrieve all habits for current user | Yes |
| **Habits** | `POST` | `/habits` | Create a new habit | Yes |
| **Habits** | `PUT` | `/habits/{id}` | Update habit name or description | Yes |
| **Habits** | `DELETE` | `/habits/{id}` | Delete a habit and its history | Yes |
| **Tracking** | `POST` | `/habits/{id}/complete` | Mark habit as completed for today | Yes |
| **Tracking** | `DELETE` | `/habits/{id}/complete` | Undo today's completion log | Yes |
| **Tracking** | `GET` | `/habits/{id}/completions` | Retrieve full completion history | Yes |

---

## 📝 Sample API Payload

### `GET /habits/today` Response
```json
[
  {
    "id": 1,
    "user_id": 2,
    "name": "Play Golf",
    "description": "Golf at 4 PM",
    "created_at": "2026-08-17T22:09:31.589695+05:30",
    "completed_today": true
  },
  {
    "id": 2,
    "user_id": 2,
    "name": "Read 10 Pages",
    "description": "Read tech blogs or fiction",
    "created_at": "2026-08-18T09:15:00.000000+05:30",
    "completed_today": false
  }
]
```