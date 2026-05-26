# TaskFlow — Smart Task Manager

A MERN stack application with priority-based task scoring.

## Project Structure

```
taskflow/
├── backend/        # Node.js + Express + MongoDB
└── frontend/       # React + Vite
```

---

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your MONGO_URI
npm run dev            # starts on :5000
```

### Environment Variables (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `FRONTEND_URL` | CORS allowed origin | `*` |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/bfhl/tasks` | Create task |
| GET | `/bfhl/tasks` | List all tasks (sorted by priorityScore DESC) |
| PATCH | `/bfhl/tasks/:id` | Update task |
| DELETE | `/bfhl/tasks/:id` | Delete task |
| GET | `/bfhl/tasks/stats` | Aggregated analytics (Bonus) |

**Query filters for GET /bfhl/tasks:**
- `?status=pending` or `?status=completed`
- `?minImportance=3`
- Combinable: `?status=pending&minImportance=3`

### Priority Score Formula

```
priorityScore = (importance × 10) + (100 / max(daysUntilDue, 1))
```
- Computed at read time, never stored
- Completed tasks always return `0`
- Rounded to 2 decimal places

---

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev            # starts on :5173
```

### Environment Variables (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:5000` |

---

## Deployment

### Backend → Render / Railway / Fly.io

1. Push `backend/` to GitHub
2. Create new Web Service, connect repo
3. Set env vars: `MONGO_URI` (MongoDB Atlas), `FRONTEND_URL` (your Vercel URL)
4. Start command: `node server.js`

### Frontend → Vercel / Netlify

1. Push `frontend/` to GitHub
2. Import to Vercel, set framework to **Vite**
3. Set env var: `VITE_API_URL` = your deployed backend URL
4. Deploy

---

## Features

- ✅ Full CRUD (Create, Read, Update, Delete)
- ✅ Server-side priority score computation
- ✅ Sorted by priority descending
- ✅ Status + minImportance filters (combinable)
- ✅ Mark as complete (score becomes 0)
- ✅ Delete with confirmation step
- ✅ Client + server validation
- ✅ Loading / empty / error states
- ✅ High priority tasks visually highlighted (score ≥ 50)
- ✅ Bonus: `/bfhl/tasks/stats` via MongoDB aggregation pipeline
- ✅ Bonus: Stats dashboard on frontend

## Assumptions

- `dueDate` validation (must be future) only enforced on **creation**, not on PATCH
- `priorityScore` for overdue pending tasks uses `max(daysUntilDue, 1)` = 1, giving a high urgency score rather than negative
- Stats endpoint uses `$facet` aggregation — no in-memory JS computation
