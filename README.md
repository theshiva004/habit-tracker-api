# Ritual Habit Tracker

A full-stack habit tracker built with FastAPI, PostgreSQL, and React/Vite. Track daily habits, see live streaks and 30-day completion metrics, and review progress in a calendar-style profile history.

## Features

- JWT authentication with registration and login
- Create, edit, delete, complete, and undo habits
- Live daily dashboard with completion progress
- Per-habit metrics calculated directly in PostgreSQL:
  - Current consecutive-day streak ending today
  - Completed and tracked days in the last 30 days
  - 30-day completion rate
- Profile statistics for the most recent 30 days, including zero-completion days
- Calendar progress view ordered from today backward, with completion-intensity levels

## Tech stack

- Backend: FastAPI, Pydantic, psycopg2, PyJWT
- Database: PostgreSQL
- Frontend: React, Vite, Lucide icons

## Project structure

```text
HABIT_TRACKER/
├── backend/
│   ├── database.py       # PostgreSQL connection configuration
│   ├── main.py           # API routes and SQL queries
│   ├── schemas.py        # Request and response models
│   └── security.py       # Password hashing and JWT authentication
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # React application
│   │   └── styles.css    # Application styles
│   └── package.json
├── requirements.txt
└── .env                  # Local configuration; not committed
```

## Database setup

Create a PostgreSQL database, then run the following schema.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    pass_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE habits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE completion (
    id BIGSERIAL PRIMARY KEY,
    habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX completion_habit_completed_at_idx
    ON completion (habit_id, completed_at);
```

## Local setup

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_NAME=habit_tracker
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
SECRET_KEY=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Install and run the backend:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

In a second terminal, run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The FastAPI documentation is available at `http://127.0.0.1:8000/docs`.

## API overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/register` | Create an account |
| POST | `/login` | Get a bearer access token |
| GET | `/users/me` | Get the authenticated user |
| GET | `/users/me/stats` | Get daily completion history for the last 30 days |
| GET | `/habits/today` | Get today's habits and database-calculated metrics |
| POST | `/habits` | Create a habit |
| PUT | `/habits/{habit_id}` | Update a habit |
| DELETE | `/habits/{habit_id}` | Delete a habit and its completions |
| POST | `/habits/{habit_id}/complete` | Mark a habit complete today |
| DELETE | `/habits/{habit_id}/complete` | Undo today's completion |
| GET | `/habits/{habit_id}/completions` | Get one habit's completion history |

All endpoints except `/register` and `/login` require:

```http
Authorization: Bearer <access_token>
```

## Metrics responses

`GET /habits/today` includes the following fields for every habit:

```json
{
  "id": 1,
  "name": "Read 10 pages",
  "completed_today": true,
  "current_streak": 5,
  "completed_days_last_30": 18,
  "tracked_days_last_30": 30,
  "completion_rate_last_30": 60.0
}
```

`GET /users/me/stats` returns all 30 days in chronological order. The frontend reverses that result so the profile calendar begins with today.

```json
{
  "history": [
    { "date": "2026-07-26", "completed_habits": 0 },
    { "date": "2026-07-27", "completed_habits": 3 }
  ]
}
```
