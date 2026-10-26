"""
PLang Automated Test Suite (test_lang.py)
=========================================
Course: CMPSC 132 — Programming Languages (1st Semester, A.Y. 2025-2026)

Module Overview:
    Comprehensive unit and integration test suite validating PLang against
    the project requirements:
      1. Integer & floating-point arithmetic computation and precedence.
      2. Hybrid syntax (Readability & Writability).
      3. Error handling for incorrect formats (Lexical, Syntax, and Runtime errors).
      4. Correct output formatting, AST visualization, and symbol table state.

Libraries Utilized:
    - `pytest`: Automated test runner and assertion framework.
"""

import pytest
from lang import (
    Interpreter,
    InterpreterError,
    LexerError,
    Parser,
    ParseError,
    format_ast,
    format_error,
    tokenize,
)
from main import load_config


def run_code(code, config=None, capsys=None):
    """
    Helper function that tokenizes, parses, and evaluates a PLang source string,
    returning `(last_evaluated_value, captured_stdout, interpreter)`.
    """
    cfg = config or load_config()
    tokens = tokenize(code, cfg)
    parser = Parser(tokens, cfg, source_code=code)
    statements = parser.parse_program()
    interpreter = Interpreter(cfg, source_code=code)

    last_val = None
    for stmt in statements:
        last_val = interpreter.evaluate_statement(stmt)

    captured = capsys.readouterr().out if capsys else ""
    return last_val, captured, interpreter


def test_integer_arithmetic_and_precedence():
    """Verifies Requirement II.1: Integer arithmetic operations and operator precedence."""
    # Addition, subtraction, multiplication return exact Python int
    val, _, _ = run_code("2 + 3 * 4")
    assert val == 14
    assert isinstance(val, int)

    # Parentheses override precedence
    val, _, _ = run_code("(2 + 3) * 4")
    assert val == 20
    assert isinstance(val, int)

    # Right-associative exponentiation: 2 ^ (3 ^ 2) = 2 ^ 9 = 512
    val, _, _ = run_code("2 ^ 3 ^ 2")
    assert val == 512
    assert isinstance(val, int)

    # Integer floor division (//) and modulo (%)
    val, _, _ = run_code("47 // 10")
    assert val == 4
    assert isinstance(val, int)

    val, _, _ = run_code("47 % 10")
    assert val == 7
    assert isinstance(val, int)

    # True division (/) returns float
    val, _, _ = run_code("7 / 2")
    assert val == 3.5
    assert isinstance(val, float)

    # Unary negation and unary plus
    val, _, _ = run_code("-5 + +10")
    assert val == 5
    assert isinstance(val, int)


def test_hybrid_english_keywords(capsys):
    """Verifies Readability: Hybrid English operator and statement keywords."""
    code = """
    let a = 20 add 5
    let b = a mul 2
    let c = b sub 10
    let d = c div 3
    let e = c mod 3
    let f = 2 pow 5
    print d
    print e
    print f
    """
    _, out, interp = run_code(code, capsys=capsys)
    assert interp.variables["a"] == 25
    assert interp.variables["b"] == 50
    assert interp.variables["c"] == 40
    assert interp.variables["d"] == 13
    assert interp.variables["e"] == 1
    assert interp.variables["f"] == 32
    assert "[OUT] => 13" in out
    assert "[OUT] => 1" in out
    assert "[OUT] => 32" in out


def test_writability_features(capsys):
    """Verifies Writability: Compound assignments, built-in functions, `ans`, `vars`, and `clear`."""
    code = """
    x = 10
    x += 5
    x *= 2
    x -= 6
    print x
    let root = sqrt(3 ^ 2 + 4 ^ 2)
    let mag = abs(-99)
    let small = min(10, 4, 25)
    let large = max(10, 4, 25)
    print root
    print mag
    print small
    print large
    vars
    """
    _, out, interp = run_code(code, capsys=capsys)
    assert interp.variables["x"] == 24
    assert interp.variables["root"] == 5
    assert isinstance(interp.variables["root"], int)
    assert interp.variables["mag"] == 99
    assert interp.variables["small"] == 4
    assert interp.variables["large"] == 25
    assert interp.variables["ans"] == 25
    assert "Variable Identifier" in out

    # Test clear command
    _, _, interp2 = run_code("let x = 42\nclear")
    assert len(interp2.variables) == 0


def test_lexical_errors():
    """Verifies Requirement II.2: Lexical error trapping for invalid characters and malformed numbers."""
    # Unrecognized character
    with pytest.raises(LexerError) as exc_info:
        run_code("10 @ 5")
    formatted = format_error(exc_info.value)
    assert "[Lexical Error]" in formatted
    assert "^" in formatted

    # Malformed float with multiple decimal points
    with pytest.raises(LexerError) as exc_info:
        run_code("let x = 12.34.56")
    assert "multiple decimal points" in exc_info.value.message

    # Identifier starting with a digit
    with pytest.raises(LexerError) as exc_info:
        run_code("let 2fast = 10")
    assert "cannot begin with a digit" in exc_info.value.message


def test_syntax_and_format_errors():
    """Verifies Requirement II.2: Syntax/format error trapping for malformed statements."""
    # Missing right-hand operand
    with pytest.raises(ParseError) as exc_info:
        run_code("10 +")
    assert "Incomplete expression" in format_error(exc_info.value)

    # Consecutive binary operators
    with pytest.raises(ParseError) as exc_info:
        run_code("10 * / 5")
    assert "Unexpected operator '/'" in format_error(exc_info.value)

    # Missing operator between numbers
    with pytest.raises(ParseError) as exc_info:
        run_code("10 20")
    assert "Missing arithmetic operator" in format_error(exc_info.value)

    # Unclosed opening parenthesis
    with pytest.raises(ParseError) as exc_info:
        run_code("(10 + 5 * 2")
    assert "Unclosed parenthesis" in format_error(exc_info.value)

    # Unmatched closing parenthesis
    with pytest.raises(ParseError) as exc_info:
        run_code("10 + 5)")
    assert "Unmatched closing parenthesis" in format_error(exc_info.value)

    # Empty parentheses
    with pytest.raises(ParseError) as exc_info:
        run_code("10 + ()")
    assert "Empty parentheses" in format_error(exc_info.value)

    # Invalid assignment target (literal on left side)
    with pytest.raises(ParseError) as exc_info:
        run_code("10 = 5")
    assert "Invalid assignment target" in format_error(exc_info.value)

    # Assigning to a reserved keyword
    with pytest.raises(ParseError) as exc_info:
        run_code("let print = 10")
    assert "reserved keyword" in format_error(exc_info.value)


def test_runtime_errors():
    """Verifies Reliability: Trapping division by zero, undefined variables, domain errors, and overflow."""
    # True division by zero
    with pytest.raises(InterpreterError) as exc_info:
        run_code("10 / (5 - 5)")
    assert exc_info.value.message == "divide_by_zero"
    assert "Division or modulo by zero" in format_error(exc_info.value)

    # Integer division by zero
    with pytest.raises(InterpreterError) as exc_info:
        run_code("10 div 0")
    assert exc_info.value.message == "divide_by_zero"

    # Modulo by zero
    with pytest.raises(InterpreterError) as exc_info:
        run_code("10 % 0")
    assert exc_info.value.message == "divide_by_zero"

    # Undefined variable
    with pytest.raises(InterpreterError) as exc_info:
        run_code("print missing_var + 1")
    assert exc_info.value.message == "undefined_variable"
    assert "missing_var" in format_error(exc_info.value)

    # Negative square root domain error
    with pytest.raises(InterpreterError) as exc_info:
        run_code("sqrt(-16)")
    assert exc_info.value.message == "negative_sqrt"

    # Exponent overflow guard
    with pytest.raises(InterpreterError) as exc_info:
        run_code("2 ^ 50000")
    assert exc_info.value.message == "overflow_error"


def test_ast_formatter():
    """Verifies AST ASCII tree formatting for presentation and inspection."""
    tokens = tokenize("let x = 2 + 3 * 4")
    parser = Parser(tokens)
    stmts = parser.parse_program()
    tree_str = format_ast(stmts[0])
    assert "AssignNode('x' =)" in tree_str
    assert "BinOpNode(ADD '+')" in tree_str
    assert "BinOpNode(MUL '*')" in tree_str
