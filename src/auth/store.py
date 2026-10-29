import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt

from src.config import APP_DB_PATH


class DuplicateEmail(Exception):
    pass


def _connect():
    path = Path(APP_DB_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            system_prompt TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    return conn


def _now():
    return datetime.now(timezone.utc).isoformat()


def register_user(email: str, password: str):
    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    try:
        with _connect() as conn:
            conn.execute(
                "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (user_id, email, password_hash, _now()),
            )
    except sqlite3.IntegrityError as exc:
        raise DuplicateEmail(email) from exc
    return {"user_id": user_id, "email": email}


def login_user(email: str, password: str):
    with _connect() as conn:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()
    if row is None or not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        return None
    token = uuid.uuid4().hex + uuid.uuid4().hex
    with _connect() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, row["id"], _now()),
        )
    return {"token": token, "user_id": row["id"]}


def user_from_token(token: str):
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT users.id, users.email
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()
    if row is None:
        return None
    return {"user_id": row["id"], "email": row["email"]}


def save_agent(user_id: str, system_prompt: str, name: str):
    existing = get_agent(user_id)
    agent_id = existing["id"] if existing else str(uuid.uuid4())
    created_at = existing["created_at"] if existing else _now()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO agents (id, user_id, name, system_prompt, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                name = excluded.name,
                system_prompt = excluded.system_prompt
            """,
            (agent_id, user_id, name, system_prompt, created_at),
        )
    return get_agent(user_id)


def get_agent(user_id: str):
    with _connect() as conn:
        row = conn.execute(
            "SELECT id, user_id, name, system_prompt, created_at FROM agents WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    if row is None:
        return None
    return dict(row)


