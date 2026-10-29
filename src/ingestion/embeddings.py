from langchain_google_genai import GoogleGenerativeAIEmbeddings

from src.config import EMBEDDING_MODEL

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)