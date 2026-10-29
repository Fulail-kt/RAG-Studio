from langchain_chroma import Chroma
from langchain_core.documents import Document

from src.config import CHROMA_PATH, USER_KB_COLLECTION
from src.ingestion.embeddings import get_embeddings
from src.ingestion.splitter import split_documents


def get_user_vectorstore():
    return Chroma(
        collection_name=USER_KB_COLLECTION,
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_PATH,
    )


def _page_filter(user_id: str, url: str):
    return {"$and": [{"user_id": user_id}, {"url": url}]}


def replace_page(user_id: str, topic: str, url: str, text: str, scraped_at: str):
    store = get_user_vectorstore()
    filt = _page_filter(user_id, url)
    try:
        store.delete(where=filt)
    except Exception:
        pass
    document = Document(
        page_content=text,
        metadata={
            "user_id": user_id,
            "topic": topic,
            "url": url,
            "scraped_at": scraped_at,
        },
    )
    chunks = split_documents([document])
    store.add_documents(chunks)


def list_pages(user_id: str):
    store = get_user_vectorstore()
    try:
        found = store.get(where={"user_id": user_id}, include=["metadatas", "documents"])
    except Exception:
        return []
    grouped = {}
    metas = found.get("metadatas") or []
    docs = found.get("documents") or []
    for meta, doc in zip(metas, docs):
        if not meta:
            continue
        source = meta.get("url") or ""
        item = grouped.setdefault(
            source,
            {
                "topic": meta.get("topic") or "",
                "source": source,
                "scraped_at": meta.get("scraped_at") or "",
                "chunks": 0,
                "texts": [],
            },
        )
        if doc:
            item["texts"].append(doc)
        item["chunks"] = len(item["texts"])
        if meta.get("topic"):
            item["topic"] = meta["topic"]
        if meta.get("scraped_at"):
            item["scraped_at"] = meta["scraped_at"]
    return list(grouped.values())


def search_user(user_id: str, question: str, k: int = 4):
    store = get_user_vectorstore()
    return store.similarity_search(
        question,
        k=k,
        filter={"user_id": user_id},
    )


def stored_page_text(user_id: str, url: str) -> str:
    store = get_user_vectorstore()
    try:
        found = store.get(where=_page_filter(user_id, url))
    except Exception:
        return ""
    parts = [doc for doc in (found.get("documents") or []) if doc]
    return "\n\n".join(parts)[:15000]


def search_page(user_id: str, url: str, question: str, k: int = 4):
    store = get_user_vectorstore()
    return store.similarity_search(
        question,
        k=k,
        filter=_page_filter(user_id, url),
    )
