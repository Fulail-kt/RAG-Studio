from src.llm.gemini import get_llm, text_from_content


def ask_small_model(question: str):
    llm = get_llm()
    prompt = (
        "You are a helpful assistant. Answer in plain text. "
        "Keep it short.\n\n"
        f"{question}"
    )
    for chunk in llm.stream(prompt):
        text = text_from_content(chunk.content)
        if text:
            yield text
