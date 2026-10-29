from src.vectorstore.chroma import get_vectorstore


def get_retriever():
    vectorstore = get_vectorstore()

    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 2}
    )

    return retriever