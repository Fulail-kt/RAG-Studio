import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from src.config import SCRAPE_LOG_PATH


def _connect():
    path = Path(SCRAPE_LOG_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS scrape_log (
            user_id TEXT NOT NULL,
            topic TEXT NOT NULL,
            url TEXT NOT NULL,
            scraped_at TEXT NOT NULL,
            PRIMARY KEY (user_id, url)
        )
        """
    )
    return conn


def list_scrapes(user_id: str):
    with _connect() as conn:
        rows = conn.execute(
            "SELECT user_id, topic, url, scraped_at FROM scrape_log WHERE user_id = ?",
            (user_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_scrape(user_id: str, url: str):
    with _connect() as conn:
        row = conn.execute(
            "SELECT user_id, topic, url, scraped_at FROM scrape_log WHERE user_id = ? AND url = ?",
            (user_id, url),
        ).fetchone()
    if row is None:
        return None
    return dict(row)


def upsert_scrape(user_id: str, topic: str, url: str, scraped_at: str):
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO scrape_log (user_id, topic, url, scraped_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, url) DO UPDATE SET
                topic = excluded.topic,
                scraped_at = excluded.scraped_at
            """,
            (user_id, topic, url, scraped_at),
        )


def is_fresh(scraped_at: str, max_age_days: int) -> bool:
    stamp = datetime.fromisoformat(scraped_at)
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - stamp
    return age <= timedelta(days=max_age_days)
