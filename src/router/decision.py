from typing import Literal

from pydantic import BaseModel, Field

from src.llm.gemini import get_decision_llm

ToolName = Literal["calculator", "company_docs", "current_time"]
RouteName = Literal["casual", "math", "rag", "agent"]


class RouteDecision(BaseModel):
    route: RouteName
    tools: list[ToolName] = Field(default_factory=list)
    expression: str = ""


_PROMPT = """
Route the user question.

casual: greetings, small talk, general chat. tools empty. expression empty.
math: arithmetic only. tools ["calculator"]. expression is the formula only, like 12*(3+4).
rag: facts that may live in the company PDF. tools empty. expression empty.
agent: needs two jobs at once, or the current time, or company facts plus math.
  tools is a subset of calculator, company_docs, current_time.

If the question might be about company documents, use rag.
"""


def decide_route(question: str) -> RouteDecision:
    llm = get_decision_llm().with_structured_output(RouteDecision)
    decision = llm.invoke(f"{_PROMPT}\n\nQuestion:\n{question}")
    if isinstance(decision, RouteDecision):
        return decision
    return RouteDecision.model_validate(decision)
