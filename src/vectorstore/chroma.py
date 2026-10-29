from langchain_chroma import Chroma
from src.config import CHROMA_PATH, COLLECTION_NAME
from src.ingestion.embeddings import get_embeddings


def create_vectorstore(chunks):
    embeddings = get_embeddings()

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_PATH,
        collection_name=COLLECTION_NAME,
    )
    
    return vectorstore


def get_vectorstore():
    embeddings = get_embeddings()

    vectorstore = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=CHROMA_PATH,
    )

    return vectorstore