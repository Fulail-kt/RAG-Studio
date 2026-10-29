from datetime import datetime, timezone

from src.config import SCRAPE_MAX_AGE_DAYS
from src.kb.fetch import fetch_public_page
from src.kb.pages import delete_page, list_pages, replace_page, stored_page_text
from src.kb.scrape_log import delete_scrape, get_scrape, is_fresh, list_scrapes, upsert_scrape


def _now():
    return datetime.now(timezone.utc).isoformat()


def list_kb(user_id: str):
    pages = {item["source"]: item for item in list_pages(user_id)}
    for row in list_scrapes(user_id):
        item = pages.setdefault(
            row["url"],
            {
                "topic": row["topic"],
                "source": row["url"],
                "scraped_at": row["scraped_at"],
                "chunks": 0,
                "texts": [],
            },
        )
        item["topic"] = row["topic"] or item["topic"]
        item["scraped_at"] = row["scraped_at"] or item["scraped_at"]
    return list(pages.values())


def add_kb(user_id: str, topic: str, url: str = "", text: str = ""):
    topic = topic.strip()
    url = url.strip()
    text = text.strip()
    if not topic:
        raise ValueError("topic is required")
    scraped_at = _now()
    if url:
        text = fetch_public_page(url)
        replace_page(user_id, topic, url, text, scraped_at)
        upsert_scrape(user_id, topic, url, scraped_at)
        return {"topic": topic, "source": url, "chars": len(text)}
    if text:
        source = f"text://{topic}"
        replace_page(user_id, topic, source, text, scraped_at)
        return {"topic": topic, "source": source, "chars": len(text)}
    raise ValueError("url or text is required")


def delete_kb(user_id: str, source: str):
    delete_page(user_id, source)
    if source.startswith("http"):
        delete_scrape(user_id, source)


def sync_prompt_page(user_id: str, topic: str, url: str) -> str:
    row = get_scrape(user_id, url)
    if row and is_fresh(row["scraped_at"], SCRAPE_MAX_AGE_DAYS):
        stored = stored_page_text(user_id, url)
        if stored:
            return stored

    text = fetch_public_page(url)
    scraped_at = _now()
    replace_page(user_id, topic, url, text, scraped_at)
    upsert_scrape(user_id, topic, url, scraped_at)
    return text


def refresh_stale(user_id: str):
    for row in list_scrapes(user_id):
        if is_fresh(row["scraped_at"], SCRAPE_MAX_AGE_DAYS):
            continue
        text = fetch_public_page(row["url"])
        scraped_at = _now()
        replace_page(user_id, row["topic"], row["url"], text, scraped_at)
        upsert_scrape(user_id, row["topic"], row["url"], scraped_at)
