from src.agent.agent import run_agent
from src.llm.small_model import ask_small_model
from src.rag.pipeline import ask_question
from src.router.decision import decide_route
from src.tools.calculator import calculate


def run(question: str):
    try:
        decision = decide_route(question)
    except Exception as exc:
        yield f"Router failed: {exc}"
        return

    if decision.route == "casual":
        yield from ask_small_model(question)
        return

    if decision.route == "math":
        try:
            yield calculate(question, decision.expression)
        except Exception as exc:
            yield f"Could not calculate: {exc}"
        return

    if decision.route == "rag":
        yield from ask_question(question)
        return

    if decision.route == "agent":
        yield from run_agent(question, decision.tools)
        return

    yield from ask_question(question)
