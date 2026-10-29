from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.auth.store import user_from_token

_bearer = HTTPBearer()


def current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer)):
    user = user_from_token(creds.credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
