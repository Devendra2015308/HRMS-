# HRMS Lite

Lightweight HRMS that lets an admin manage employees and attendance. Built with **Django + MongoDB** on the backend and **React + Vite** on the frontend. Deploy targets: **Railway** (API) and **Vercel** (web).

## Features
- Employee CRUD: create, list, delete with server-side validation (unique ID/email, valid email)
- Attendance: mark present/absent per day, view history with optional date filters
- Dashboard: aggregate counts for employees, present/absent/total attendance
- Clean, responsive UI with loading/empty/error states

## Tech Stack
- Backend: Django REST Framework, Djongo (MongoDB), CORS middleware, Gunicorn
- Frontend: React 19, Vite, vanilla fetch API
- Database: MongoDB
- Deployment: Vercel (frontend), Railway (backend)

## Project Structure
```
backend/   # Django project (config, hrms app, requirements, Procfile)
frontend/  # React app (Vite)
```

## Local Setup
### Prerequisites
- Python 3.10 or 3.11 (Django 3.2 + djongo is not compatible with 3.12/3.13)
- MongoDB running locally or accessible URI
- Node.js 18+ (v22 works) and npm

### Backend
```bash
cd backend
py -3.11 -m venv .venv    # use 3.11 on Windows
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # update secrets and Mongo URI
python manage.py migrate  # creates collections/indexes
python manage.py runserver 0.0.0.0:8000
```
Environment keys (see `.env.example`):
- `SECRET_KEY` – Django secret
- `DEBUG` – `true|false`
- `MONGO_NAME` – database name
- `MONGO_URI` – connection string
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` – comma-separated lists

### Frontend
```bash
cd frontend
cp .env.example .env      # set VITE_API_BASE_URL, e.g. http://localhost:8000/api
npm install
npm run dev -- --host
```

## API Overview
- `GET /health/` – health check
- `GET/POST /api/employees/` – list/create employees
- `DELETE /api/employees/{employee_id}/` – delete employee
- `GET/POST /api/employees/{employee_id}/attendance/` – list (with `from`, `to` query params) or add attendance
- `GET /api/dashboard/` – totals summary

Validation highlights:
- Employee ID and email must be unique; email must be valid
- Attendance unique per employee+date; status must be `present` or `absent`

## Deployment Notes
### Railway (Backend)
- Set environment variables from `.env.example`
- Use the included `Procfile` (`web: gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}`)
- Ensure MongoDB connection string is reachable from Railway

### Vercel (Frontend)
- Set `VITE_API_BASE_URL` environment variable to the deployed Railway API (e.g., `https://your-railway-app.up.railway.app/api`)
- Build command: `npm run build`
- Output directory: `dist`

## Testing
- Minimal smoke test: `python manage.py test` (backend)
- Frontend: `npm run lint` and `npm run build`

## Assumptions & Notes
- Single admin user (no auth) per assignment scope
- MongoDB indexes/unique constraints rely on migrations being run once
- If deploying on Python 3.12+, validate djongo compatibility; Python 3.10/3.11 recommended
