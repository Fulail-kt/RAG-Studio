from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from src.auth.deps import current_user
from src.auth.store import get_user_secrets, set_user_secrets

router = APIRouter()


class SecretsBody(BaseModel):
    gemini_api_key: Optional[str] = None
    decision_model: Optional[str] = None
    small_model: Optional[str] = None


@router.get("/secrets")
def read_secrets(user=Depends(current_user)):
    secrets = get_user_secrets(user["user_id"]) or {}
    key = secrets.get("gemini_api_key") or ""
    return {
        "has_api_key": bool(key),
        "api_key_preview": f"...{key[-6:]}" if len(key) > 6 else ("set" if key else ""),
        "decision_model": secrets.get("decision_model") or "",
        "small_model": secrets.get("small_model") or "",
    }


@router.put("/secrets")
def write_secrets(body: SecretsBody, user=Depends(current_user)):
    set_user_secrets(
        user["user_id"],
        gemini_api_key=body.gemini_api_key,
        decision_model=body.decision_model,
        small_model=body.small_model,
    )
    return {"ok": True}
