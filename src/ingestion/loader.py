from langchain_pymupdf4llm import PyMuPDF4LLMLoader
from src.config import PDF_PATH

def load_pdf():
    loader = PyMuPDF4LLMLoader(PDF_PATH)
    documents = loader.load()
    return documents