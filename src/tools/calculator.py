import ast
import operator
import re

from langchain_core.tools import tool

_BIN_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}

_UNARY_OPS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}

_EXPR_RE = re.compile(r"(\d[\d\s+\-*/%.()]*)")


def eval_math(expression: str):
    tree = ast.parse(expression.strip(), mode="eval")
    return _eval(tree)


def _eval(node):
    if isinstance(node, ast.Expression):
        return _eval(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPS:
        return _UNARY_OPS[type(node.op)](_eval(node.operand))
    if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
        left = _eval(node.left)
        right = _eval(node.right)
        if isinstance(node.op, ast.Pow) and abs(right) > 20:
            raise ValueError("exponent too big")
        result = _BIN_OPS[type(node.op)](left, right)
        if len(str(result)) > 200:
            raise ValueError("result too big")
        return result
    raise ValueError("only numbers and + - * / // % ** ()")


def extract_expression(question: str) -> str:
    match = _EXPR_RE.search(question or "")
    if not match or not any(op in match.group(1) for op in "+-*/%"):
        raise ValueError("no math expression")
    return match.group(1)


@tool
def calculator(expression: str) -> str:
    """Evaluate a math expression. expression uses numbers and + - * / // % ** and parentheses only."""
    try:
        return str(eval_math(expression))
    except Exception as exc:
        return f"Could not calculate: {exc}"


def calculate(question: str, expression: str = "") -> str:
    expr = (expression or "").strip()
    if not expr:
        expr = extract_expression(question)
    return calculator.invoke({"expression": expr})
