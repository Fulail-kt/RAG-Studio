import os

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

PDF_PATH = "data/company.pdf"

CHROMA_PATH = "vector_db/chroma"

COLLECTION_NAME = "company_documents"

EMBEDDING_MODEL = "gemini-embedding-001"

GEMINI_MODEL_NAME = "gemini-3.6-flash"

SMALL_MODEL_NAME = os.getenv("SMALL_MODEL_NAME", "gemini-3.5-flash-lite")
# Router uses the same free Gemini key. Override with DECISION_MODEL_NAME if you swap models.
DECISION_MODEL_NAME = os.getenv("DECISION_MODEL_NAME", GEMINI_MODEL_NAME)

USER_KB_COLLECTION = "user_pages"

SCRAPE_LOG_PATH = "data/scrape_log.sqlite"

APP_DB_PATH = "data/app.sqlite"

SCRAPE_MAX_AGE_DAYS = int(os.getenv("SCRAPE_MAX_AGE_DAYS", "7"))