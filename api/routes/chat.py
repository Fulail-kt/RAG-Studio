import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.auth.deps import current_user
from src.kb.agent import run_user_agent

router = APIRouter()


class ChatBody(BaseModel):
    question: str = Field(min_length=1)


@router.post("/chat")
def chat(body: ChatBody, user=Depends(current_user)):
    def generate():
        full_answer = ""
        for chunk in run_user_agent(user["user_id"], body.question):
            full_answer += chunk
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'content': full_answer})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
