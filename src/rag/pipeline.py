from src.retrieval.retriever import get_retriever
from src.llm.gemini import get_llm


def ask_question(question):
    # get retriever
    retriever = get_retriever()

    # find the docs
    docs = retriever.invoke(question)

    # build context

    context = "\n\n".join(doc.page_content for doc in docs)

    # get llm

    llm = get_llm()

    # create prompt

    # 5. Create prompt
    prompt = f"""
             You are a helpful assistant.
             
             Answer the question using only the provided context.
             
             If the answer is not available in the context,
             say "I don't have this information."

             Rules:
- Give the answer directly.
- Do not say "Based on the provided context".
- Do not mention "the context".
- Do not explain where the information came from.
- Do not add unnecessary introductions.
- If the answer is not available in the context, say:
  "I don't know based on the provided information."
             
             Context:
             {context}
             
             Question:
             {question}
             
             Answer:
             """
             
    # # 6. Get answer
    # response = llm.invoke(prompt)
    # return response.content

    # 6. Stream answer
      # 6. Stream response
    for chunk in llm.stream(prompt):

        content = chunk.content

        if isinstance(content, list):

            for item in content:

                if isinstance(item, dict):

                    text = item.get("text")

                    if text:
                        yield text

        elif isinstance(content, str):

            if content:
                yield content