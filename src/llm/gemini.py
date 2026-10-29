from langchain_google_genai import ChatGoogleGenerativeAI
from src.config import DECISION_MODEL_NAME, GEMINI_API_KEY, GEMINI_MODEL_NAME


def _llm(model: str, temperature: float):
    kwargs: dict = {"model": model, "temperature": temperature}
    if GEMINI_API_KEY:
        kwargs["google_api_key"] = GEMINI_API_KEY
    return ChatGoogleGenerativeAI(**kwargs)


def get_llm() -> ChatGoogleGenerativeAI:
    return _llm(GEMINI_MODEL_NAME, 0.7)


def get_decision_llm() -> ChatGoogleGenerativeAI:
    return _llm(DECISION_MODEL_NAME, 0)


def text_from_content(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if text:
                    parts.append(text)
            elif isinstance(item, str) and item:
                parts.append(item)
        return "".join(parts)
    return ""
