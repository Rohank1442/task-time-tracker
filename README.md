# TaskPulse - Full-Stack Task & Time Tracking App

TaskPulse is a production-quality, responsive, and secure full-stack application built for managing tasks, tracking real-time productivity with live session timers, viewing daily summary analytics, and enhancing natural-language task inputs using AI.

---

## Live Demo & Test Credentials

- **Live Demo:** https://task-time-tracker-five.vercel.app/

- **Backend API:** https://task-time-tracker-1.onrender.com/

- **Swagger API Docs:** https://task-time-tracker-1.onrender.com/docs

- **Demo Account Credentials:**
  - **Email:** `demo@example.com`
  - **Password:** `demopassword123`

  *(Or click "Use Demo Account (Instant Login)" on the login screen.)*

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

### Deployment

- **Frontend**: Vercel
- **Backend**: Render

---

## Architecture & Project Structure

```text
suntek-assignment/

├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, tasks, timer, summary, ai)
│   │   ├── core/         # Config, security, database session setup
│   │   ├── models/       # SQLAlchemy ORM models (User, Task, TimeLog)
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Business logic & time formatting helpers
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Automated pytest suite
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