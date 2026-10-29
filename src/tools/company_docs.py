from langchain_core.tools import tool

from src.retrieval.retriever import get_retriever


@tool
def company_docs(question: str) -> str:
    """Search the company PDF for policies, products, people, or other stored facts."""
    try:
        docs = get_retriever().invoke(question)
    except Exception as exc:
        return f"Document search failed: {exc}"
    if not docs:
        return "No matching company documents."
    text = "\n\n".join(doc.page_content for doc in docs)
    return text[:4000]
