# 🌱 GrowthOS — Personal Academic Productivity System

A full-stack web app to manage your learning journey with tasks, timers, calendar, analytics, and more.

## Tech Stack
- **Frontend**: React 18 + Vite + Chart.js
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt

## Quick Start

```bash
# 1. Install all dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
npm install

# 2. Create your environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials

# 3. Create the database
psql -U postgres -c "CREATE DATABASE growthos;"

# 4. Run migrations (creates all tables)
cd backend && npm run db:migrate && cd ..

# 5. Start the app
npm run dev
# → Backend: http://localhost:5000
# → Frontend: http://localhost:5173
```

## Features
- ✅ Infinite nested tasks (task → subtask → sub-subtask…)
- ⏱ Per-task timers + Pomodoro
- 📅 Dynamic calendar with month navigation + custom events
- 🗺 Learning roadmap (Goal → Month → Week → Day)
- 📊 Analytics charts (hours, subjects, completion rate)
- 📝 Notes with search and pin
- 🔄 Spaced repetition revision system
- 💡 Smart insights from your data
- 🔐 Email/password auth with JWT

## Deployment
See `GrowthOS_Deployment_Guide.html` for full step-by-step instructions for:
- Render.com (free)
- Railway
- VPS / Ubuntu Server
