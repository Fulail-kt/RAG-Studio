from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.auth.store import DuplicateEmail, login_user, register_user

router = APIRouter()


class AuthBody(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=7, max_length=72)


@router.post("/register")
def register(body: AuthBody):
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="email is invalid")
    try:
        return register_user(email, body.password)
    except DuplicateEmail:
        raise HTTPException(status_code=409, detail="email already registered")


@router.post("/login")
def login(body: AuthBody):
    email = body.email.strip().lower()
    result = login_user(email, body.password)
    if result is None:
        raise HTTPException(status_code=401, detail="email or password is wrong")
    return result
