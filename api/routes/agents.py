from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.auth.deps import current_user
from src.auth.store import get_agent, save_agent

router = APIRouter()


class AgentBody(BaseModel):
    system_prompt: str = Field(min_length=1)
    name: str = "agent"


@router.get("/agents")
def read_agent(user=Depends(current_user)):
    agent = get_agent(user["user_id"])
    if agent is None:
        return {"agent": None}
    return {
        "agent": {
            "agent_id": agent["id"],
            "user_id": agent["user_id"],
            "name": agent["name"],
            "system_prompt": agent["system_prompt"],
        }
    }


@router.post("/agents")
def create_agent(body: AgentBody, user=Depends(current_user)):
    agent = save_agent(user["user_id"], body.system_prompt.strip(), body.name.strip() or "agent")
    return {
        "agent_id": agent["id"],
        "user_id": agent["user_id"],
        "name": agent["name"],
    }
