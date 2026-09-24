# Crewboard

A small internal tool for Fieldline Studio: projects, tasks, the team, and an admin area.
Frontend and backend live side by side in one repo.

```
frontend/   Vite + React + TypeScript single-page app (React Router)
backend/    FastAPI + SQLite API, cookie sessions, serves the built SPA in production
Makefile    setup / seed / dev / build / start
docker-compose.yml   local dev with containers (api :8000, web :5173)
```

## Requirements

- Python 3.11+
- Node 20+ and npm

## Run it

```sh
make setup     # backend/.venv + pip install, npm ci in frontend/
make seed      # (re)creates backend/data/app.db with demo data
make dev       # API on http://localhost:8000, app on http://localhost:5173
```

In dev, Vite proxies `/api/*` to the API (set `API_URL` to point it elsewhere).

Or with Docker: `docker compose up`, then open http://localhost:5173.

### Production mode (one port)

The backend serves `frontend/dist` with an SPA fallback when it exists, so after a build the whole app runs on port 8000:

```sh
make build     # npm run build in frontend/
make seed
make start     # uvicorn app.main:app on http://localhost:8000
```

Without make:

```sh
cd frontend && npm ci && npm run build && cd ..
cd backend && pip install -r requirements.txt && python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Demo logins

`python seed.py` creates these accounts (demo data only):

| Username | Password    | Role   |
| -------- | ----------- | ------ |
| admin    | admin       | admin  |
| maya     | member123   | member |

## Roles

| Page             | admin | member |
| ---------------- | ----- | ------ |
| `/dashboard`     | yes   | yes    |
| `/projects`, `/projects/:id` | yes | yes |
| `/team`          | yes   | yes    |
| `/admin` (invites, audit log) | yes | no — shows "Admins only"; the API returns 403 |

`/login` is public; every other page sends you to `/login` when you're signed out.

## API

All under `/api`: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /dashboard`,
`GET /projects`, `GET /projects/{id}`, `GET /team`, `GET /admin/audit`, `GET /admin/invites`,
`POST /admin/invite` (admin endpoints are 403 for members). The session is an httpOnly cookie, `split_session`.

## Tests

```sh
make test      # pytest in backend/, typecheck in frontend/
```

Configuration is optional; see `.env.example`.
