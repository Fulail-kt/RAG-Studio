from datetime import datetime

from langchain_core.tools import tool


@tool
def current_time() -> str:
    """Return today's date and the current local time."""
    return datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
