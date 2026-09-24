import hashlib
import hmac
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, Response

from .db import get_db

COOKIE_NAME = "split_session"
SESSION_DAYS = 7
ITERATIONS = 120_000


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, expected = stored.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), ITERATIONS)
    return hmac.compare_digest(digest.hex(), expected)


def create_session(conn: sqlite3.Connection, response: Response, user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    expires = utcnow() + timedelta(days=SESSION_DAYS)
    conn.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, iso(expires)),
    )
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        samesite="lax",
        secure=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
        path="/",
    )


def end_session(conn: sqlite3.Connection, request: Request, response: Response) -> None:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    response.delete_cookie(COOKIE_NAME, path="/")


def current_user(request: Request, conn: sqlite3.Connection = Depends(get_db)) -> sqlite3.Row:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")
    row = conn.execute(
        """
        SELECT u.id, u.username, u.name, u.email, u.title, u.role
        FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > ?
        """,
        (token, iso(utcnow())),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Session expired")
    return row


def require_admin(user: sqlite3.Row = Depends(current_user)) -> sqlite3.Row:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return user
