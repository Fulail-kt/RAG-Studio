from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RAG API",
    description="RAG application API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from api.routes.agents import router as agents_router
from api.routes.auth import router as auth_router
from api.routes.chat import router as chat_router
from api.routes.kb import router as kb_router

app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(kb_router)

@app.get("/health")

def health():
    return {
        "status": "ok"
    }