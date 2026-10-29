from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from src.llm.gemini import get_llm, text_from_content
from src.tools.registry import select_tools

_SYSTEM = (
    "Answer the user. Call a tool when it has the fact or the math. "
    "After tool results arrive, answer in plain text. "
    "Do not mention tool names."
)


def run_agent(question: str, tool_names: list[str] | None = None):
    tools = select_tools(tool_names)
    tool_map = {tool.name: tool for tool in tools}
    llm = get_llm().bind_tools(tools)
    messages = [
        SystemMessage(content=_SYSTEM),
        HumanMessage(content=question),
    ]

    for _ in range(4):
        response = llm.invoke(messages)
        calls = getattr(response, "tool_calls", None) or []
        if not calls:
            text = text_from_content(response.content)
            yield text or "I don't have an answer."
            return

        messages.append(response)
        for call in calls:
            tool = tool_map.get(call["name"])
            if tool is None:
                result = f"Unknown tool: {call['name']}"
            else:
                try:
                    result = tool.invoke(call.get("args") or {})
                except Exception as exc:
                    result = f"Tool error: {exc}"
            messages.append(
                ToolMessage(content=str(result), tool_call_id=call["id"])
            )

    final = get_llm().invoke(
        messages + [HumanMessage(content="Answer the question now in plain text.")]
    )
    yield text_from_content(final.content) or "I don't have an answer."
