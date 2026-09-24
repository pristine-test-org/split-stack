import os
import sqlite3
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'at_risk', 'on_hold', 'completed')),
    owner_id INTEGER REFERENCES users(id),
    due_date TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    assignee_id INTEGER REFERENCES users(id),
    due_date TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    verb TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    invited_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL
);
"""


def database_path() -> Path:
    raw = os.environ.get("DATABASE_PATH", "data/app.db")
    path = Path(raw)
    if not path.is_absolute():
        path = BACKEND_DIR / path
    return path


def connect() -> sqlite3.Connection:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    # Each request gets its own connection, but FastAPI may open and close it
    # on different threadpool threads.
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)


def get_db():
    conn = connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
