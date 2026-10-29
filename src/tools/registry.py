from src.tools.calculator import calculator
from src.tools.clock import current_time
from src.tools.company_docs import company_docs

ALL_TOOLS = {
    "calculator": calculator,
    "company_docs": company_docs,
    "current_time": current_time,
}


def select_tools(names: list[str] | None):
    picked = [ALL_TOOLS[name] for name in (names or []) if name in ALL_TOOLS]
    return picked or list(ALL_TOOLS.values())
