import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .auth import create_session, current_user, end_session, iso, require_admin, utcnow, verify_password
from .db import BACKEND_DIR, get_db, init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Crewboard API", lifespan=lifespan)


class LoginBody(BaseModel):
    username: str
    password: str


class InviteBody(BaseModel):
    email: str
    role: str = "member"


def user_json(row: sqlite3.Row) -> dict:
    return {k: row[k] for k in ("id", "username", "name", "email", "title", "role")}


def audit(conn: sqlite3.Connection, actor_id: int, action: str, target: str, request: Request) -> None:
    ip = request.client.host if request.client else ""
    conn.execute(
        "INSERT INTO audit_log (actor_id, action, target, ip, created_at) VALUES (?, ?, ?, ?, ?)",
        (actor_id, action, target, ip, iso(utcnow())),
    )


# --- auth -------------------------------------------------------------------


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/auth/login")
def login(body: LoginBody, request: Request, response: Response, conn: sqlite3.Connection = Depends(get_db)):
    row = conn.execute("SELECT * FROM users WHERE username = ?", (body.username.strip().lower(),)).fetchone()
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Wrong username or password")
    create_session(conn, response, row["id"])
    audit(conn, row["id"], "user.login", row["username"], request)
    return user_json(row)


@app.post("/api/auth/logout")
def logout(request: Request, response: Response, conn: sqlite3.Connection = Depends(get_db)):
    end_session(conn, request, response)
    return {"ok": True}


@app.get("/api/auth/me")
def me(user: sqlite3.Row = Depends(current_user)):
    return user_json(user)


# --- app data ---------------------------------------------------------------


PROJECT_SELECT = """
SELECT p.id, p.name, p.client, p.description, p.status, p.due_date, p.created_at,
       u.id AS owner_id, u.name AS owner_name,
       COUNT(t.id) AS task_count,
       COALESCE(SUM(t.status = 'done'), 0) AS done_count
FROM projects p
LEFT JOIN users u ON u.id = p.owner_id
LEFT JOIN tasks t ON t.project_id = p.id
"""


@app.get("/api/dashboard")
def dashboard(user: sqlite3.Row = Depends(current_user), conn: sqlite3.Connection = Depends(get_db)):
    counts = conn.execute(
        """
        SELECT
          (SELECT COUNT(*) FROM projects WHERE status IN ('planning', 'active', 'at_risk')) AS active_projects,
          (SELECT COUNT(*) FROM projects WHERE status = 'at_risk') AS at_risk_projects,
          (SELECT COUNT(*) FROM tasks WHERE status != 'done') AS open_tasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'done') AS done_tasks,
          (SELECT COUNT(*) FROM users) AS members
        """
    ).fetchone()
    activity = conn.execute(
        """
        SELECT a.id, a.verb, a.subject, a.created_at, u.name AS actor_name, p.id AS project_id, p.name AS project_name
        FROM activity a
        LEFT JOIN users u ON u.id = a.actor_id
        LEFT JOIN projects p ON p.id = a.project_id
        ORDER BY a.created_at DESC LIMIT 10
        """
    ).fetchall()
    my_tasks = conn.execute(
        """
        SELECT t.id, t.title, t.status, t.priority, t.due_date, p.id AS project_id, p.name AS project_name
        FROM tasks t JOIN projects p ON p.id = t.project_id
        WHERE t.assignee_id = ? AND t.status != 'done'
        ORDER BY t.due_date LIMIT 6
        """,
        (user["id"],),
    ).fetchall()
    return {
        "counts": dict(counts),
        "recent_activity": [dict(r) for r in activity],
        "my_tasks": [dict(r) for r in my_tasks],
    }


@app.get("/api/projects")
def projects(_user: sqlite3.Row = Depends(current_user), conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute(PROJECT_SELECT + " GROUP BY p.id ORDER BY p.due_date").fetchall()
    return [dict(r) for r in rows]


@app.get("/api/projects/{project_id}")
def project_detail(project_id: int, _user: sqlite3.Row = Depends(current_user), conn: sqlite3.Connection = Depends(get_db)):
    row = conn.execute(PROJECT_SELECT + " WHERE p.id = ? GROUP BY p.id", (project_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    tasks = conn.execute(
        """
        SELECT t.id, t.title, t.status, t.priority, t.due_date, t.updated_at, u.name AS assignee_name
        FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
        WHERE t.project_id = ?
        ORDER BY CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 ELSE 2 END, t.due_date
        """,
        (project_id,),
    ).fetchall()
    return {**dict(row), "tasks": [dict(t) for t in tasks]}


@app.get("/api/team")
def team(_user: sqlite3.Row = Depends(current_user), conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute(
        """
        SELECT u.id, u.name, u.email, u.title, u.role, u.created_at,
               COUNT(t.id) AS open_tasks
        FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id AND t.status != 'done'
        GROUP BY u.id ORDER BY u.name
        """
    ).fetchall()
    return [dict(r) for r in rows]


# --- admin ------------------------------------------------------------------


@app.get("/api/admin/audit")
def admin_audit(_admin: sqlite3.Row = Depends(require_admin), conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute(
        """
        SELECT a.id, a.action, a.target, a.ip, a.created_at, u.name AS actor_name
        FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
        ORDER BY a.created_at DESC, a.id DESC LIMIT 50
        """
    ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/admin/invites")
def admin_invites(_admin: sqlite3.Row = Depends(require_admin), conn: sqlite3.Connection = Depends(get_db)):
    rows = conn.execute(
        """
        SELECT i.id, i.email, i.role, i.created_at, u.name AS invited_by_name
        FROM invites i LEFT JOIN users u ON u.id = i.invited_by
        ORDER BY i.created_at DESC
        """
    ).fetchall()
    return [dict(r) for r in rows]


@app.post("/api/admin/invite", status_code=201)
def admin_invite(
    body: InviteBody,
    request: Request,
    admin: sqlite3.Row = Depends(require_admin),
    conn: sqlite3.Connection = Depends(get_db),
):
    email = body.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    if body.role not in ("admin", "member"):
        raise HTTPException(status_code=422, detail="Role must be admin or member")
    taken = conn.execute(
        "SELECT 1 FROM users WHERE email = ? UNION SELECT 1 FROM invites WHERE email = ?", (email, email)
    ).fetchone()
    if taken:
        raise HTTPException(status_code=409, detail="That person is already invited or on the team")
    now = iso(utcnow())
    cur = conn.execute(
        "INSERT INTO invites (email, role, invited_by, created_at) VALUES (?, ?, ?, ?)",
        (email, body.role, admin["id"], now),
    )
    audit(conn, admin["id"], "invite.sent", email, request)
    return {"id": cur.lastrowid, "email": email, "role": body.role, "created_at": now, "invited_by_name": admin["name"]}


# --- built frontend (production) -------------------------------------------

DIST = Path(os.environ.get("FRONTEND_DIST", BACKEND_DIR.parent / "frontend" / "dist")).resolve()

if (DIST / "index.html").is_file():
    if (DIST / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (DIST / full_path).resolve()
        if full_path and candidate.is_file() and DIST in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")
