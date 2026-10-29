from pydantic import BaseModel
from urllib.parse import urlparse

from src.llm.gemini import get_decision_llm


class PagePick(BaseModel):
    needs_page: bool = False
    topic: str = ""
    url: str = ""


_PROMPT = """
Read the system prompt. It may name a page for a kind of question.
Example: if the user asks about FAQ, use https://example.com/faq.

If this question matches one of those rules, set needs_page true.
topic is a short label such as faq.
url must be copied from the system prompt.
If no rule matches, set needs_page false and leave topic and url empty.
Do not invent a URL.
"""


def url_from_prompt(url: str, system_prompt: str) -> str:
    cleaned = (url or "").strip()
    parsed = urlparse(cleaned)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("system prompt has no public URL for this question")
    bare = cleaned.split("://", 1)[-1]
    if cleaned not in system_prompt and bare not in system_prompt:
        raise ValueError("URL is not in the system prompt")
    return cleaned


def pick_page(system_prompt: str, question: str) -> PagePick:
    llm = get_decision_llm().with_structured_output(PagePick)
    decision = llm.invoke(
        f"{_PROMPT}\n\nSystem prompt:\n{system_prompt}\n\nQuestion:\n{question}"
    )
    if not isinstance(decision, PagePick):
        decision = PagePick.model_validate(decision)
    if not decision.needs_page:
        return PagePick(needs_page=False)
    return PagePick(
        needs_page=True,
        topic=(decision.topic or "page").strip()[:64],
        url=url_from_prompt(decision.url, system_prompt),
    )
