from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.auth.deps import current_user
from src.kb.ingest import add_kb, list_kb

router = APIRouter()


class KbBody(BaseModel):
    topic: str = Field(min_length=1, max_length=64)
    url: str = ""
    text: str = ""


@router.get("/kb")
def get_kb(user=Depends(current_user)):
    return {"user_id": user["user_id"], "items": list_kb(user["user_id"])}


@router.post("/kb")
def create_kb(body: KbBody, user=Depends(current_user)):
    try:
        saved = add_kb(user["user_id"], body.topic, body.url, body.text)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"user_id": user["user_id"], **saved}
