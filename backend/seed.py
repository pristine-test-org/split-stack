"""Reset the database and fill it with demo data.

    python seed.py

Logins: admin / admin (admin) and maya / member123 (member).
"""

import secrets
from datetime import timedelta

from app.auth import hash_password, iso, utcnow
from app.db import SCHEMA, connect, database_path

# username, password (None = cannot sign in), name, title, role
USERS = [
    ("admin", "admin", "Priya Raman", "Operations lead", "admin"),
    ("maya", "member123", "Maya Okafor", "Product designer", "member"),
    ("daniel", None, "Daniel Brooks", "Frontend engineer", "member"),
    ("sofia", None, "Sofía Herrera", "Backend engineer", "member"),
    ("tom", None, "Tom Nakamura", "QA engineer", "member"),
    ("lena", None, "Lena Fischer", "Account manager", "admin"),
]

# name, client, description, status, owner username, due in days
PROJECTS = [
    ("Client portal redesign", "Harbor & Pine", "New dashboard, invoices and document pages for the client portal. Design is signed off; build is underway.", "active", "maya", 21),
    ("Billing service migration", "Internal", "Move invoicing off the legacy PHP service onto the new billing API before the old host is switched off.", "at_risk", "sofia", 9),
    ("Mobile onboarding flow", "Tidewater Health", "Five-step signup with ID check for the patient app. Copy is waiting on the client's legal review.", "active", "daniel", 35),
    ("Q4 customer survey", "Internal", "Quarterly NPS survey to all active clients, with a short write-up for the leadership meeting.", "planning", "lena", 48),
    ("Warehouse scanner app", "Northbeam Logistics", "Barcode scanning app for pickers. Paused until the client confirms which handheld devices they are buying.", "on_hold", "tom", 60),
    ("Support macro cleanup", "Internal", "Rewrote and merged the help-desk reply macros; retired 40 outdated ones.", "completed", "admin", -6),
]

# project index, title, status, priority, assignee username, due in days
TASKS = [
    (0, "Invoice list empty state", "done", "medium", "maya", -4),
    (0, "Document upload with drag and drop", "in_progress", "high", "daniel", 3),
    (0, "Dashboard KPI cards", "in_progress", "medium", "daniel", 6),
    (0, "Accessibility pass on forms", "todo", "medium", "maya", 12),
    (0, "Client sign-off demo", "todo", "high", "lena", 20),
    (1, "Map legacy invoice fields", "done", "high", "sofia", -10),
    (1, "Dual-write invoices for one week", "in_progress", "high", "sofia", 2),
    (1, "Reconcile October totals", "todo", "high", "admin", 5),
    (1, "Refund edge cases", "todo", "medium", "tom", 6),
    (1, "Switch off legacy cron jobs", "todo", "low", "sofia", 9),
    (1, "Regression suite for tax rounding", "in_progress", "medium", "tom", 4),
    (2, "Welcome screen illustrations", "done", "low", "maya", -8),
    (2, "ID check integration", "in_progress", "high", "daniel", 10),
    (2, "Consent copy from legal", "todo", "high", "lena", 7),
    (2, "Progress indicator component", "done", "medium", "daniel", -2),
    (2, "Test on small Android screens", "todo", "medium", "tom", 25),
    (3, "Draft survey questions", "in_progress", "medium", "lena", 14),
    (3, "Pick survey tool", "done", "low", "lena", -3),
    (3, "Client contact list export", "todo", "low", "admin", 21),
    (3, "Results summary template", "todo", "low", "maya", 40),
    (4, "Device shortlist from client", "todo", "high", "lena", 15),
    (4, "Scanner SDK spike", "done", "medium", "tom", -20),
    (4, "Offline sync design", "todo", "medium", "sofia", 30),
    (4, "Picker flow wireframes", "done", "medium", "maya", -18),
    (5, "Audit existing macros", "done", "medium", "admin", -30),
    (5, "Rewrite billing macros", "done", "medium", "admin", -21),
    (5, "Merge duplicate shipping replies", "done", "low", "tom", -15),
    (5, "Translate top 20 macros", "done", "low", "lena", -10),
    (5, "Retire outdated macros", "done", "low", "admin", -7),
    (5, "Share guide with support team", "done", "low", "admin", -6),
]

AUDIT = [
    # hours ago, actor, action, target, ip
    (2, "admin", "user.login", "admin", "10.0.4.21"),
    (5, "maya", "user.login", "maya", "10.0.4.37"),
    (26, "admin", "invite.sent", "jordan.lee@fieldline.example", "10.0.4.21"),
    (30, "lena", "project.created", "Q4 customer survey", "10.0.5.12"),
    (49, "admin", "role.changed", "lena: member → admin", "10.0.4.21"),
    (52, "sofia", "user.login", "sofia", "10.0.4.52"),
    (75, "admin", "project.archived", "Spring campaign site", "10.0.4.21"),
    (98, "lena", "invite.sent", "alex.kim@fieldline.example", "10.0.5.12"),
    (120, "admin", "settings.updated", "Session length: 7 days", "10.0.4.21"),
    (140, "tom", "user.login", "tom", "10.0.4.66"),
    (166, "admin", "user.deactivated", "chris.m@fieldline.example", "10.0.4.21"),
    (190, "admin", "export.downloaded", "Projects CSV", "10.0.4.21"),
]

INVITES = [
    ("jordan.lee@fieldline.example", "member", "admin", 26),
    ("alex.kim@fieldline.example", "member", "lena", 98),
]


def seed() -> None:
    path = database_path()
    if path.exists():
        path.unlink()
    now = utcnow()
    with connect() as conn:
        conn.executescript(SCHEMA)
        ids = {}
        for i, (username, password, name, title, role) in enumerate(USERS):
            cur = conn.execute(
                "INSERT INTO users (username, password_hash, name, email, title, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    username,
                    hash_password(password or secrets.token_urlsafe(24)),
                    name,
                    f"{username if username != 'admin' else 'priya'}@fieldline.example",
                    title,
                    role,
                    iso(now - timedelta(days=400 - i * 45)),
                ),
            )
            ids[username] = cur.lastrowid

        project_ids = []
        for name, client, description, status, owner, due in PROJECTS:
            cur = conn.execute(
                "INSERT INTO projects (name, client, description, status, owner_id, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (name, client, description, status, ids[owner], (now + timedelta(days=due)).date().isoformat(), iso(now - timedelta(days=60))),
            )
            project_ids.append(cur.lastrowid)

        hours = 1
        for n, (p, title, status, priority, assignee, due) in enumerate(TASKS):
            updated = now - timedelta(hours=hours)
            conn.execute(
                "INSERT INTO tasks (project_id, title, status, priority, assignee_id, due_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (project_ids[p], title, status, priority, ids[assignee], (now + timedelta(days=due)).date().isoformat(), iso(updated)),
            )
            if n % 2 == 0 or status == "in_progress":
                verb = {"done": "completed", "in_progress": "started", "todo": "created"}[status]
                conn.execute(
                    "INSERT INTO activity (actor_id, project_id, verb, subject, created_at) VALUES (?, ?, ?, ?, ?)",
                    (ids[assignee], project_ids[p], verb, title, iso(updated)),
                )
            hours += 5

        for hours_ago, actor, action, target, ip in AUDIT:
            conn.execute(
                "INSERT INTO audit_log (actor_id, action, target, ip, created_at) VALUES (?, ?, ?, ?, ?)",
                (ids[actor], action, target, ip, iso(now - timedelta(hours=hours_ago))),
            )

        for email, role, by, hours_ago in INVITES:
            conn.execute(
                "INSERT INTO invites (email, role, invited_by, created_at) VALUES (?, ?, ?, ?)",
                (email, role, ids[by], iso(now - timedelta(hours=hours_ago))),
            )
    print(f"Seeded {path}: {len(USERS)} users, {len(PROJECTS)} projects, {len(TASKS)} tasks")


if __name__ == "__main__":
    seed()
