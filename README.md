# TaskPulse - Full-Stack Task & Time Tracking App

TaskPulse is a production-quality, responsive, and secure full-stack application built for managing tasks, tracking real-time productivity with live session timers, viewing daily summary analytics, and enhancing natural-language task inputs using AI.

---

## Live Demo & Test Credentials

- **Live Demo Link**: `TODO_ADD_DEPLOYED_URL`
- **Swagger API Docs**: `http://localhost:8000/docs`
- **Demo Account Credentials**:
  - **Email**: `demo@example.com`
  - **Password**: `demopassword123`
  *(Or click "Use Demo Account (Instant Login)" on the login screen).*

---

## Features

- 🔐 **Secure Authentication**: JWT token-based authentication with bcrypt password hashing and automatic session restoration.
- 🛡️ **IDOR Data Isolation**: Resource-level authorization guarantees users can only view, edit, or track time on their own tasks.
- 📋 **Task Management**: Create, edit, search, filter, and delete tasks across `PENDING`, `IN_PROGRESS`, and `COMPLETED` statuses.
- ⏱️ **Real-Time Time Tracking**: Start/stop timer on any task with live ticking `HH:MM:SS` display.
- 🚫 **Single Active Timer Rule**: Prevents starting multiple concurrent timers (returns `409 Conflict` if another timer is running).
- 🔄 **Timer Accuracy & Persistence**: State is reconstructed from `started_at` timestamps on page refreshes or tab closes.
- 📊 **Daily Productivity Summaries**: Visual dashboard metrics showing total tracked time today, finished tasks, in-progress items, and Recharts productivity charts.
- 🪄 **AI Task Enhancement**: Optional natural language processing via Google Gemini API / OpenAI API converts quick prompts (e.g. *"follow up with designer"*) into structured titles and descriptions.

---

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS & Lucide React icons
- **State Management**: React Context (`AuthContext` & `TimerContext`)
- **HTTP Client**: Axios with interceptors
- **Visualizations**: Recharts

### Backend
- **Framework**: Python 3.11 with FastAPI & Pydantic V2
- **Database ORM**: SQLAlchemy (SQLite)
- **Security**: PyJWT, Passlib with Bcrypt, HTTPBearer
- **Testing**: Pytest & HTTPX
- **API Documentation**: OpenAPI / Swagger

---

## Architecture & Project Structure

```
suntek-assignment/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, tasks, timer, summary, ai)
│   │   ├── core/         # Config, security, database session setup
│   │   ├── models/       # SQLAlchemy ORM models (User, Task, TimeLog)
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Business logic & time formatting helpers
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Automated pytest suite (auth, tasks, timer, summary)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, ActiveTimerBanner, TaskCard, TaskModal, etc.
│   │   ├── context/      # AuthContext & TimerContext
│   │   ├── pages/        # LoginPage, SignupPage, DashboardPage, TaskDetailPage
│   │   ├── services/     # Axios API integrations
│   │   ├── types/        # TypeScript interfaces
│   │   ├── App.tsx       # Routing & ProtectedRoute logic
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## Database Design

### 1. `users`
| Field | Type | Attributes |
|---|---|---|
| `id` | Integer | Primary Key, Indexed |
| `email` | String | Unique, Indexed, Non-null |
| `password_hash` | String | Non-null |
| `created_at` | DateTime | UTC Timestamp |
| `updated_at` | DateTime | UTC Timestamp |

### 2. `tasks`
| Field | Type | Attributes |
|---|---|---|
| `id` | Integer | Primary Key, Indexed |
| `user_id` | Integer | Foreign Key (`users.id`), Indexed |
| `title` | String | Non-null |
| `description` | Text | Nullable |
| `status` | Enum | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `created_at` | DateTime | UTC Timestamp |
| `updated_at` | DateTime | UTC Timestamp |
| `completed_at` | DateTime | Nullable |

### 3. `time_logs`
| Field | Type | Attributes |
|---|---|---|
| `id` | Integer | Primary Key, Indexed |
| `task_id` | Integer | Foreign Key (`tasks.id`), Indexed |
| `user_id` | Integer | Foreign Key (`users.id`), Indexed |
| `started_at` | DateTime | Non-null UTC Timestamp |
| `ended_at` | DateTime | Nullable (null while timer is active) |
| `duration_seconds` | Integer | Nullable (calculated upon timer stop) |
| `created_at` | DateTime | UTC Timestamp |

---

## Timer Architecture & Real-Time Accuracy

1. **Server as Source of Truth**:
   The frontend **never sends accumulated seconds** to the backend. When a timer starts, the backend creates a `TimeLog` with `started_at = UTC timestamp` and `ended_at = null`.
2. **Page Refresh Resilience**:
   Upon load or navigation, the frontend queries `GET /api/timer/active`. If an active log exists, elapsed time is reconstructed dynamically using:
   $$\text{elapsed} = \text{now}() - \text{started\_at}$$
   The UI ticker increments local state every second without mutating the server database.
3. **Timer Stop Calculation**:
   When the user clicks **STOP**, `POST /api/tasks/{id}/timer/stop` records `ended_at` and calculates:
   $$\text{duration\_seconds} = \max(0, \text{ended\_at} - \text{started\_at})$$
4. **Single Active Timer Rule**:
   If a user tries starting a timer while another task is active, the backend returns `409 Conflict`:
   ```json
   {
     "detail": "Another task ('Task Title') is currently being tracked. Stop it before starting a new timer."
   }
   ```

---

## API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user | No |
| `POST` | `/api/auth/login` | Login user & return JWT token | No |
| `POST` | `/api/auth/logout` | Client logout acknowledgement | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `POST` | `/api/tasks` | Create a new task | Yes |
| `GET` | `/api/tasks` | Get all user tasks (optional `status` filter) | Yes |
| `GET` | `/api/tasks/{id}` | Get task details (IDOR protected) | Yes |
| `PUT` | `/api/tasks/{id}` | Update task details / status | Yes |
| `PATCH` | `/api/tasks/{id}/status` | Quick status update | Yes |
| `DELETE` | `/api/tasks/{id}` | Delete task & associated logs | Yes |
| `POST` | `/api/tasks/{id}/timer/start` | Start tracking session | Yes |
| `POST` | `/api/tasks/{id}/timer/stop` | Stop active tracking session | Yes |
| `GET` | `/api/timer/active` | Get running timer session | Yes |
| `GET` | `/api/time-logs` | Get all user time logs | Yes |
| `GET` | `/api/tasks/{id}/time-logs` | Get session history for a task | Yes |
| `GET` | `/api/dashboard/daily-summary` | Get today's productivity analytics | Yes |
| `POST` | `/api/tasks/enhance` | AI natural language task prompt enhancement | Yes |

---

## Local Development Setup

### 1. Backend Setup
Open terminal 1 in project root:
```powershell
# 1. Activate Python virtual environment
.\backend\venv\Scripts\Activate.ps1

# 2. Run backend server
.\backend\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```
*(Backend API will run at `http://localhost:8000` and Swagger docs at `http://localhost:8000/docs`)*

### 2. Frontend Setup
Open terminal 2 in project root:
```powershell
cd frontend
npm run dev
```
*(Frontend UI will run at `http://localhost:5173`)*

### 3. Run Backend Automated Tests
```powershell
$env:PYTHONPATH="backend"; .\backend\venv\Scripts\python -m pytest backend/tests
```

---

## Automated Test Results

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
collected 11 items

backend\tests\test_auth.py .....                                         [ 45%]
backend\tests\test_summary.py .                                          [ 54%]
backend\tests\test_tasks.py ...                                          [ 81%]
backend\tests\test_timer.py ..                                           [100%]

======================== 11 passed in 3.07s ========================
```
