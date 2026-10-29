from src.auth.store import get_agent
from src.kb.ingest import sync_prompt_page
from src.kb.pages import search_user
from src.kb.source import pick_page
from src.llm.gemini import get_llm, text_from_content


def run_user_agent(user_id: str, question: str):
    agent = get_agent(user_id)
    if agent is None:
        yield "No agent for this user."
        return

    system_prompt = agent["system_prompt"]
    try:
        pick = pick_page(system_prompt, question)
    except Exception as exc:
        yield f"Could not read the system prompt: {exc}"
        return

    try:
        if pick.needs_page:
            context = sync_prompt_page(user_id, pick.topic, pick.url)
        else:
            docs = search_user(user_id, question)
            context = "\n\n".join(doc.page_content for doc in docs)
    except Exception as exc:
        yield f"Knowledge base failed: {exc}"
        return

    prompt = f"""
{system_prompt}

Use the system instructions above.
Use the knowledge base context for facts.
If a fact is missing from the context, say you don't have that information.

Knowledge base:
{context or "(none)"}

Question:
{question}
"""
    for chunk in get_llm().stream(prompt):
        text = text_from_content(chunk.content)
        if text:
            yield text
