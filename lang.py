"""
PLang Core Language Engine (lang.py)
====================================
Course: CMPSC 132 — Programming Languages (1st Semester, A.Y. 2025-2026)

Module Overview:
    Implements the lexical analyzer (tokenizer), recursive-descent parser,
    polymorphic Abstract Syntax Tree (AST) node hierarchy, table-driven
    interpreter, AST visual formatter, and diagnostic error formatter for PLang.

Architectural Highlight (Zero `if-else` & Zero Nested `if` Design):
    Instead of sprawling `if-elif-else` chains or nested `if` conditionals, PLang is
    architected using three foundational Programming Language implementation patterns:
    1. Polymorphic AST & Exception Dispatch (Object-Oriented Design):
       Each `ASTNode` subclass implements its own `.evaluate()`, `.execute()`, and
       `.format_tree()` methods, and each `PlangError` subclass formats its own header.
    2. Dictionary Dispatch Tables & Standard Library `operator` Module:
       Lexical token handlers, statement parsers, primary expression parsers, unary/binary
       operators, and built-in math functions are dispatched in O(1) time via dictionaries.
    3. Flat Guard Clauses:
       All validation checks use single-level guard clauses that immediately `return` or
       `raise`, completely eliminating `else`, `elif`, and nested `if` blocks.

Programming Language Evaluation Criteria (Sebesta):
    1. Readability:
       - Single unified, orthogonal syntax.
       - Supports explicit `let x = 10` declarations alongside concise `x = 10`.
       - Hybrid operator support: standard math symbols (`+`, `-`, `*`, `/`, `//`, `%`, `^`)
         paired with readable English keywords (`add`, `sub`, `mul`, `div`, `mod`, `pow`).
       - Clear statement keywords (`let`, `print`, `vars`, `clear`).
    2. Writability:
       - Zero boilerplate required for single-line or multi-line scripts.
       - Compound assignment operators (`+=`, `-=`, `*=`, `/=`).
       - Built-in mathematical functions (`abs`, `sqrt`, `min`, `max`, `round`, `int`, `float`).
       - Automatic `ans` variable storing the most recent expression evaluation.
    3. Reliability:
       - Strict operator precedence (`()` > Functions/Unary > `^` > `* / // %` > `+ -`).
       - Exact integer preservation for integer arithmetic (`int` vs `float`).
       - Comprehensive error trapping for malformed numbers, invalid identifiers,
         unmatched parentheses, missing operands, division/modulo by zero, negative
         square roots, undefined variables, and numeric overflow.
       - Visual caret (`^`) error diagnostics with line/column coordinates and hints.

Libraries Utilized:
    - `re` (Python Standard Library): Regular-expression lexical scanning.
    - `math` (Python Standard Library): Validated mathematical functions and constants.
    - `operator` (Python Standard Library): First-class arithmetic operator functions
      for table-driven evaluation without `if-else` chains.
"""

import math
import operator
import re


# ============================================================================
# 1. POLYMORPHIC EXCEPTION HIERARCHY
# ============================================================================

class PlangError(Exception):
    """
    Base exception class for all errors raised during PLang compilation or execution.

    Class Variables:
        CATEGORY (str): Human-readable error category label used in diagnostic headers.
        DEFAULT_HINT (str): Default corrective hint displayed when no specific hint is provided.
        TEMPLATE_KEY (str): Configuration lookup key for the error header format string.
        DEFAULT_TEMPLATE (str): Fallback format string when `config` is omitted.

    Instance Attributes:
        message (str): Detailed description of the error condition.
        line (int | None): 1-based line number in the source code where the error occurred.
        column (int | None): 1-based column number in the source line where the error occurred.
        source_line (str | None): Raw text of the offending source code line for visual caret rendering.
        hint (str | None): Actionable suggestion helping the user fix the error.
    """

    CATEGORY = "PLang Error"
    DEFAULT_HINT = "Review the syntax and operand types at the indicated position."
    TEMPLATE_KEY = "plang_error"
    DEFAULT_TEMPLATE = "[{category}] Line {line}, Col {col}: {message}"

    def __init__(self, message, line=None, column=None, source_line=None, hint=None):
        super().__init__(message)
        self.message = message
        self.line = line
        self.column = column
        self.source_line = source_line
        self.hint = hint or self.DEFAULT_HINT

    def format_header(self, errors_config, line, col):
        """
        Polymorphically formats the diagnostic header line for this error instance.

        Args:
            errors_config (dict): Error template dictionary from `config.json`.
            line (int): 1-based line number.
            col (int): 1-based column number.

        Returns:
            str: Formatted single-line diagnostic header.
        """
        template = errors_config.get(self.TEMPLATE_KEY, self.DEFAULT_TEMPLATE)
        return template.format(
            category=self.CATEGORY,
            message=self.message,
            line=line,
            col=col
        )


class LexerError(PlangError):
    """
    Exception raised by the lexical analyzer when encountering illegal characters
    or malformed numeric/identifier tokens.

    Class Variables:
        CATEGORY (str): Error category label ('Lexical Error').
        DEFAULT_HINT (str): Default hint explaining valid PLang tokens and characters.
        TEMPLATE_KEY (str): Configuration lookup key ('lexer_error').
        DEFAULT_TEMPLATE (str): Fallback format string for lexical errors.

    Instance Attributes:
        char (str): The offending character or malformed token substring.
        message (str): Detailed lexical error description.
        line (int): 1-based line number of the invalid token.
        column (int): 1-based column number of the invalid token.
        source_line (str | None): Raw source line where the lexical failure occurred.
        hint (str): Suggestion on how to correct the invalid token.
    """

    CATEGORY = "Lexical Error"
    DEFAULT_HINT = (
        "Use valid numbers (e.g., 42, 3.14), identifiers starting with a letter/underscore, "
        "and supported operators (+, -, *, /, //, %, ^, =)."
    )
    TEMPLATE_KEY = "lexer_error"
    DEFAULT_TEMPLATE = "[Lexical Error] Line {line}, Col {col}: {message}"

    def __init__(self, char, line, column, message=None, source_line=None, hint=None):
        msg = message or f"Unexpected character '{char}'"
        super().__init__(msg, line, column, source_line=source_line, hint=hint)
        self.char = char

    def format_header(self, errors_config, line, col):
        """Formats the lexical error header using the configured template."""
        template = errors_config.get(self.TEMPLATE_KEY, self.DEFAULT_TEMPLATE)
        return template.format(char=self.char, message=self.message, line=line, col=col)


class ParseError(PlangError):
    """
    Exception raised by the recursive-descent parser when token sequences violate
    PLang's formal EBNF grammar rules.

    Class Variables:
        CATEGORY (str): Error category label ('Syntax Error').
        DEFAULT_HINT (str): Default hint explaining proper statement and expression structure.
        TEMPLATE_KEY (str): Configuration lookup key ('parse_error').
        DEFAULT_TEMPLATE (str): Fallback format string for syntax errors.

    Instance Attributes:
        message (str): Description of the syntax/format violation.
        line (int | None): 1-based line number of the unexpected token.
        column (int | None): 1-based column number of the unexpected token.
        source_line (str | None): Raw source line containing the syntax error.
        hint (str): Specific guidance for fixing the grammatical structure.
    """

    CATEGORY = "Syntax Error"
    DEFAULT_HINT = (
        "Ensure every binary operator has a valid left and right operand, parentheses are balanced, "
        "and assignments follow 'let name = expression' or 'name = expression'."
    )
    TEMPLATE_KEY = "parse_error"
    DEFAULT_TEMPLATE = "[Syntax Error] Line {line}, Col {col}: {message}"


class InterpreterError(PlangError):
    """
    Exception raised during AST evaluation when a semantic or runtime error occurs
    (e.g., division by zero, undefined variable, domain error, or numeric overflow).

    Class Variables:
        CATEGORY (str): Error category label ('Runtime Error').
        DEFAULT_HINT (str): Default hint for runtime evaluation errors.
        RUNTIME_TEMPLATES (dict[str, str]): Table mapping internal runtime error keys
            to their default diagnostic message templates.

    Instance Attributes:
        message (str): Internal error key (e.g., 'divide_by_zero') or descriptive message.
        line (int | None): 1-based line number of the AST node that failed evaluation.
        column (int | None): 1-based column number of the AST node that failed evaluation.
        var_name (str | None): Identifier name associated with an undefined variable error.
        detail (str | None): Extra context (such as offending numeric value or argument count).
        source_line (str | None): Raw source line where the runtime error originated.
        hint (str): Actionable hint for resolving the runtime issue.
    """

    CATEGORY = "Runtime Error"
    DEFAULT_HINT = "Verify that all variables are defined before use and divisors are non-zero."
    RUNTIME_TEMPLATES = {
        "divide_by_zero": "[Runtime Error] Line {line}, Col {col}: Division or modulo by zero is undefined.",
        "undefined_variable": "[Runtime Error] Line {line}, Col {col}: Variable '{name}' is not defined before use.",
        "negative_sqrt": "[Runtime Error] Line {line}, Col {col}: Cannot compute real square root of negative number ({value}).",
        "overflow_error": "[Runtime Error] Line {line}, Col {col}: Numeric overflow — expression result exceeds safe computation limits.",
        "argument_error": "[Runtime Error] Line {line}, Col {col}: {message}",
        "type_error": "[Runtime Error] Line {line}, Col {col}: Invalid operand types for arithmetic operation.",
    }

    def __init__(
        self,
        message,
        line=None,
        column=None,
        var_name=None,
        detail=None,
        source_line=None,
        hint=None
    ):
        super().__init__(message, line, column, source_line=source_line, hint=hint)
        self.var_name = var_name
        self.detail = detail

    def format_header(self, errors_config, line, col):
        """
        Formats the runtime error header via table lookup in `RUNTIME_TEMPLATES`
        without `if-elif-else` branching.
        """
        err_key = (self.message in self.RUNTIME_TEMPLATES and self.message) or "type_error"
        default_tmpl = self.RUNTIME_TEMPLATES[err_key]
        template = errors_config.get(err_key, default_tmpl)
        return template.format(
            line=line,
            col=col,
            name=self.var_name,
            value=self.detail or "negative",
            message=self.detail or self.message
        )


# ============================================================================
# 2. LEXICAL TOKEN CLASS
# ============================================================================

class Token:
    """
    Represents a single lexical unit (lexeme) produced by the PLang tokenizer.

    Class Variables:
        BINARY_OP_TYPES (tuple[str, ...]): Token types representing binary arithmetic operators.
        ASSIGN_OP_TYPES (tuple[str, ...]): Token types representing variable assignment operators.
        STATEMENT_KW_TYPES (tuple[str, ...]): Token types representing top-level statement keywords.

    Instance Attributes:
        type (str): Categorical token identifier (e.g., 'NUMBER', 'IDENT', 'ADD', 'LET').
        value (str): Exact string lexeme matched from the source code.
        line (int): 1-based line number where the token starts.
        column (int): 1-based column number where the token starts.
    """

    BINARY_OP_TYPES = ("ADD", "SUB", "MUL", "DIV", "IDIV", "MOD", "POW")
    ASSIGN_OP_TYPES = ("ASSIGN", "ADD_ASSIGN", "SUB_ASSIGN", "MUL_ASSIGN", "DIV_ASSIGN")
    STATEMENT_KW_TYPES = ("LET", "PRINT", "CLEAR", "VARS")

    def __init__(self, type_, value, line, column):
        self.type = type_
        self.value = value
        self.line = line
        self.column = column

    def __repr__(self):
        return f"Token({self.type}, {repr(self.value)}, line={self.line}, col={self.column})"


# ============================================================================
# 3. POLYMORPHIC ABSTRACT SYNTAX TREE (AST) NODE HIERARCHY
# ============================================================================

class ASTNode:
    """
    Abstract base class for all nodes in the PLang Abstract Syntax Tree (AST).

    Implements polymorphic `.evaluate()`, `.execute()`, and `.format_tree()` methods
    so the interpreter and AST visualizer operate via object-oriented dispatch
    rather than `if-elif-else` type-checking chains.

    Class Variables:
        NODE_CATEGORY (str): High-level classification of the AST node ('Base').
        BRANCH_GLYPHS (dict[bool, str]): Maps `is_last` boolean to ASCII tree branch connectors.
        INDENT_GLYPHS (dict[bool, str]): Maps `is_last` boolean to child indentation prefixes.
        TYPE_NAMES (dict[type, str]): Maps Python numeric types to AST display labels.

    Instance Attributes:
        line (int): 1-based source line number associated with this syntactic construct.
        col (int): 1-based source column number associated with this syntactic construct.
    """

    NODE_CATEGORY = "Base"
    BRANCH_GLYPHS = {True: "└── ", False: "├── "}
    INDENT_GLYPHS = {True: "    ", False: "│   "}
    TYPE_NAMES = {int: "int", float: "float"}

    def __init__(self, line, col):
        self.line = line
        self.col = col

    def _branch_prefix(self, indent, is_last):
        """Returns `(line_prefix, child_indent)` for ASCII tree rendering via table lookup."""
        return (
            f"{indent}{self.BRANCH_GLYPHS[bool(is_last)]}",
            f"{indent}{self.INDENT_GLYPHS[bool(is_last)]}"
        )

    def evaluate(self, interpreter):
        """Polymorphically evaluates this expression node using `interpreter`."""
        raise InterpreterError(f"Unknown AST node: {type(self).__name__}", self.line, self.col)

    def execute(self, interpreter):
        """
        Polymorphically executes this node as a top-level program statement.
        By default, evaluates the expression, binds `ans`, and returns the value.
        Statement subclasses (`PrintNode`, `AssignNode`, `ClearNode`, `VarsNode`) override this.
        """
        val = self.evaluate(interpreter)
        interpreter.variables["ans"] = val
        interpreter.history.append({"type": "expr", "value": val})
        return val

    def format_tree(self, indent="", is_last=True):
        """Polymorphically renders this AST node as an ASCII tree string."""
        prefix, _ = self._branch_prefix(indent, is_last)
        return f"{prefix}{type(self).__name__}"


class NumberNode(ASTNode):
    """
    AST leaf node representing an integer or floating-point numeric literal.

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('Literal').

    Instance Attributes:
        value (int | float): Parsed numeric value (exact `int` for integers, `float` for decimals).
        line (int): 1-based line number of the literal token.
        col (int): 1-based column number of the literal token.
    """

    NODE_CATEGORY = "Literal"

    def __init__(self, value, line, col):
        super().__init__(line, col)
        self.value = value

    def evaluate(self, interpreter):
        """Returns the literal numeric value directly."""
        return self.value

    def format_tree(self, indent="", is_last=True):
        """Formats the numeric literal and its exact data type (`int` or `float`)."""
        prefix, _ = self._branch_prefix(indent, is_last)
        dtype = self.TYPE_NAMES.get(type(self.value), "float")
        return f"{prefix}NumberNode({self.value} : {dtype})"


class VarNode(ASTNode):
    """
    AST leaf node representing a variable identifier reference.

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('Identifier').

    Instance Attributes:
        name (str): Identifier name to be resolved in the interpreter symbol table.
        line (int): 1-based line number of the identifier.
        col (int): 1-based column number of the identifier.
    """

    NODE_CATEGORY = "Identifier"

    def __init__(self, name, line, col):
        super().__init__(line, col)
        self.name = name

    def evaluate(self, interpreter):
        """Resolves `self.name` in the interpreter symbol table or built-in constants."""
        return interpreter.resolve_variable(self.name, self.line, self.col)

    def format_tree(self, indent="", is_last=True):
        """Formats the variable identifier leaf node."""
        prefix, _ = self._branch_prefix(indent, is_last)
        return f"{prefix}VarNode('{self.name}')"


class UnaryOpNode(ASTNode):
    """
    AST node representing a prefix unary arithmetic operation (`+expr` or `-expr`).

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('UnaryOperation').
        VALID_OPS (tuple[str, ...]): Supported unary operator codes ('add', 'sub').

    Instance Attributes:
        op (str): Normalized unary operator identifier ('add' or 'sub').
        expr (ASTNode): Child AST expression node to which the unary operator applies.
        line (int): 1-based line number of the unary operator token.
        col (int): 1-based column number of the unary operator token.
    """

    NODE_CATEGORY = "UnaryOperation"
    VALID_OPS = ("add", "sub")

    def __init__(self, op, expr, line, col):
        super().__init__(line, col)
        self.op = op
        self.expr = expr

    def evaluate(self, interpreter):
        """Evaluates the operand and applies the unary operator via table lookup."""
        return interpreter.apply_unary_op(self.op, self.expr.evaluate(interpreter), self.line, self.col)

    def format_tree(self, indent="", is_last=True):
        """Formats the unary operation and its child operand expression."""
        prefix, child_indent = self._branch_prefix(indent, is_last)
        return "\n".join([
            f"{prefix}UnaryOpNode({self.op.upper()})",
            self.expr.format_tree(child_indent, True)
        ])


class BinOpNode(ASTNode):
    """
    AST node representing an infix binary arithmetic operation.

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('BinaryOperation').
        OP_SYMBOLS (dict[str, str]): Mapping of internal operator names to display symbols.

    Instance Attributes:
        op (str): Normalized operator code ('add', 'sub', 'mul', 'div', 'idiv', 'mod', 'pow').
        left (ASTNode): Left-hand operand AST subtree.
        right (ASTNode): Right-hand operand AST subtree.
        line (int): 1-based line number of the binary operator token.
        col (int): 1-based column number of the binary operator token.
    """

    NODE_CATEGORY = "BinaryOperation"
    OP_SYMBOLS = {
        "add": "+",
        "sub": "-",
        "mul": "*",
        "div": "/",
        "idiv": "//",
        "mod": "%",
        "pow": "^"
    }

    def __init__(self, op, left, right, line, col):
        super().__init__(line, col)
        self.op = op
        self.left = left
        self.right = right

    def evaluate(self, interpreter):
        """Evaluates both child operands and dispatches the binary operator."""
        left_val = self.left.evaluate(interpreter)
        right_val = self.right.evaluate(interpreter)
        return interpreter._apply_binary_op(self.op, left_val, right_val, self.line, self.col)

    def format_tree(self, indent="", is_last=True):
        """Formats the binary operator node and its left and right subtrees."""
        prefix, child_indent = self._branch_prefix(indent, is_last)
        sym = self.OP_SYMBOLS.get(self.op, self.op)
        return "\n".join([
            f"{prefix}BinOpNode({self.op.upper()} '{sym}')",
            self.left.format_tree(child_indent, False),
            self.right.format_tree(child_indent, True)
        ])


class FuncCallNode(ASTNode):
    """
    AST node representing an invocation of a built-in mathematical function
    such as `abs(x)`, `sqrt(x)`, `min(a, b)`, `max(a, b)`, `round(x)`, `int(x)`, or `float(x)`.

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('FunctionCall').
        SUPPORTED_FUNCTIONS (tuple[str, ...]): Names of built-in functions recognized by PLang.

    Instance Attributes:
        func_name (str): Name of the built-in function being invoked.
        args (list[ASTNode]): Ordered list of argument expression AST nodes.
        line (int): 1-based line number of the function call.
        col (int): 1-based column number of the function call.
    """

    NODE_CATEGORY = "FunctionCall"
    SUPPORTED_FUNCTIONS = ("abs", "sqrt", "min", "max", "round", "int", "float")

    def __init__(self, func_name, args, line, col):
        super().__init__(line, col)
        self.func_name = func_name
        self.args = args

    def evaluate(self, interpreter):
        """Delegates function evaluation to the interpreter's function dispatch table."""
        return interpreter._evaluate_function(self)

    def format_tree(self, indent="", is_last=True):
        """Formats the function call node and all argument subtrees."""
        prefix, child_indent = self._branch_prefix(indent, is_last)
        lines = [f"{prefix}FuncCallNode('{self.func_name}')"]
        for idx, arg in enumerate(self.args):
            lines.append(arg.format_tree(child_indent, idx == len(self.args) - 1))
        return "\n".join(lines)


class AssignNode(ASTNode):
    """
    AST statement node representing a variable binding or compound assignment
    (e.g., `let x = 10`, `x = 10`, `x += 5`).

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('AssignmentStatement').

    Instance Attributes:
        name (str): Target variable identifier to bind or update in the symbol table.
        expr (ASTNode): Right-hand expression AST node whose evaluated value will be bound.
        op (str): Assignment mode ('=', '+=', '-=', '*=', '/=').
        line (int): 1-based line number of the assignment statement.
        col (int): 1-based column number of the assignment statement.
    """

    NODE_CATEGORY = "AssignmentStatement"

    def __init__(self, name, expr, line, col, op="="):
        super().__init__(line, col)
        self.name = name
        self.expr = expr
        self.op = op

    def execute(self, interpreter):
        """Executes the assignment statement against the interpreter symbol table."""
        return interpreter.execute_assignment(self)

    def format_tree(self, indent="", is_last=True):
        """Formats the assignment statement node and its right-hand expression."""
        prefix, child_indent = self._branch_prefix(indent, is_last)
        return "\n".join([
            f"{prefix}AssignNode('{self.name}' {self.op})",
            self.expr.format_tree(child_indent, True)
        ])


class PrintNode(ASTNode):
    """
    AST statement node representing an explicit output instruction (`print <expr>`).

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('PrintStatement').

    Instance Attributes:
        expr (ASTNode): Expression AST node whose evaluated result will be printed.
        line (int): 1-based line number of the `print` keyword.
        col (int): 1-based column number of the `print` keyword.
    """

    NODE_CATEGORY = "PrintStatement"

    def __init__(self, expr, line, col):
        super().__init__(line, col)
        self.expr = expr

    def execute(self, interpreter):
        """Evaluates `self.expr`, prints the formatted result, and records history."""
        val = self.expr.evaluate(interpreter)
        interpreter.variables["ans"] = val
        prefix = interpreter.config.get("print_prefix", "[OUT] => ")
        print(f"{prefix}{val}")
        interpreter.history.append({"type": "print", "value": val})
        return None

    def format_tree(self, indent="", is_last=True):
        """Formats the print statement node and its child expression."""
        prefix, child_indent = self._branch_prefix(indent, is_last)
        return "\n".join([
            f"{prefix}PrintNode",
            self.expr.format_tree(child_indent, True)
        ])


class ClearNode(ASTNode):
    """
    AST statement node representing an environment reset command (`clear`).

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('ClearStatement').

    Instance Attributes:
        line (int): 1-based line number of the `clear` command.
        col (int): 1-based column number of the `clear` command.
    """

    NODE_CATEGORY = "ClearStatement"

    def __init__(self, line, col):
        super().__init__(line, col)

    def execute(self, interpreter):
        """Clears all variables in the interpreter environment."""
        interpreter.variables.clear()
        interpreter.history.append({"type": "clear"})
        return None

    def format_tree(self, indent="", is_last=True):
        """Formats the clear command node."""
        prefix, _ = self._branch_prefix(indent, is_last)
        return f"{prefix}ClearNode()"


class VarsNode(ASTNode):
    """
    AST statement node representing a symbol table inspection command (`vars`).

    Class Variables:
        NODE_CATEGORY (str): Classification of the node ('VarsStatement').

    Instance Attributes:
        line (int): 1-based line number of the `vars` command.
        col (int): 1-based column number of the `vars` command.
    """

    NODE_CATEGORY = "VarsStatement"

    def __init__(self, line, col):
        super().__init__(line, col)

    def execute(self, interpreter):
        """Prints the formatted symbol table of active variables."""
        interpreter._print_symbol_table()
        interpreter.history.append({"type": "vars"})
        return None

    def format_tree(self, indent="", is_last=True):
        """Formats the vars command node."""
        prefix, _ = self._branch_prefix(indent, is_last)
        return f"{prefix}VarsNode()"


# ============================================================================
# 4. TABLE-DRIVEN LEXICAL ANALYZER (TOKENIZER)
# ============================================================================

RESERVED_KEYWORDS = {
    "let", "print", "clear", "vars",
    "add", "sub", "mul", "div", "mod", "pow"
}

CANONICAL_TOKEN_MAP = {
    "ADD_KW": "ADD",
    "SUB_KW": "SUB",
    "MUL_KW": "MUL",
    "IDIV_KW": "IDIV",
    "MOD_KW": "MOD",
    "POW_KW": "POW",
    "POW_ALT": "POW",
}


def _raise_malformed_float(token_value, line, col, current_line_text, match_end, tokens, line_start):
    """Raises a `LexerError` for floating-point numbers containing multiple decimal points."""
    raise LexerError(
        token_value,
        line,
        col,
        message=f"Malformed numeric literal '{token_value}' (multiple decimal points).",
        source_line=current_line_text,
        hint="A floating-point number may contain at most one decimal point (e.g., 3.14)."
    )


def _raise_malformed_ident(token_value, line, col, current_line_text, match_end, tokens, line_start):
    """Raises a `LexerError` when an identifier starts with a numeric digit."""
    raise LexerError(
        token_value,
        line,
        col,
        message=f"Invalid token '{token_value}' — identifiers cannot begin with a digit.",
        source_line=current_line_text,
        hint=f"Rename the variable to start with a letter (e.g., 'var_{token_value}') or insert '*' for multiplication."
    )


def _handle_newline_token(raw_type):
    """Returns a handler that records a `NEWLINE` token and advances the line counter."""
    def _handler(token_value, line, col, current_line_text, match_end, tokens, line_start):
        tokens.append(Token("NEWLINE", token_value, line, col))
        return line + 1, match_end
    return _handler


def _handle_ignored_token(raw_type):
    """Returns a handler that skips whitespace and comments without emitting a token."""
    def _handler(token_value, line, col, current_line_text, match_end, tokens, line_start):
        return line, line_start
    return _handler


def _handle_standard_token(raw_type):
    """Returns a handler that normalizes `raw_type` and appends a `Token` to `tokens`."""
    norm_type = CANONICAL_TOKEN_MAP.get(raw_type, raw_type)

    def _handler(token_value, line, col, current_line_text, match_end, tokens, line_start):
        tokens.append(Token(norm_type, token_value, line, col))
        return line, line_start
    return _handler


TOKEN_HANDLER_DISPATCH = {
    "MALFORMED_FLOAT": _raise_malformed_float,
    "MALFORMED_IDENT": _raise_malformed_ident,
    "NEWLINE": _handle_newline_token("NEWLINE"),
    "SKIP": _handle_ignored_token("SKIP"),
    "COMMENT": _handle_ignored_token("COMMENT"),
}


def tokenize(source_code, config=None):
    """
    Scans raw PLang source code and converts it into a sequence of `Token` objects
    using a regular-expression state machine and a dictionary dispatch table.

    Args:
        source_code (str): Raw PLang program or single-line REPL input.
        config (dict | None): Optional language configuration dictionary.

    Returns:
        list[Token]: Ordered list of lexical tokens terminated by an `EOF` token.

    Raises:
        LexerError: If an illegal character or malformed number/identifier is encountered.
    """
    config = config or {}
    comment_prefix = config.get("comment_prefix", "#")
    source_lines = source_code.splitlines() or [""]

    def get_source_line(line_num):
        if 1 <= line_num <= len(source_lines):
            return source_lines[line_num - 1]
        return ""

    regex_parts = [
        ("COMMENT", re.escape(comment_prefix) + r"[^\n]*"),
        ("MALFORMED_FLOAT", r"\d+\.\d*\.\d*"),
        ("MALFORMED_IDENT", r"\d+[a-zA-Z_][a-zA-Z0-9_]*"),
        ("ADD_ASSIGN", re.escape("+=")),
        ("SUB_ASSIGN", re.escape("-=")),
        ("MUL_ASSIGN", re.escape("*=")),
        ("DIV_ASSIGN", re.escape("/=")),
        ("IDIV", re.escape("//")),
        ("POW_ALT", re.escape("**")),
        ("LET", r"\blet\b"),
        ("PRINT", r"\bprint\b"),
        ("CLEAR", r"\bclear\b"),
        ("VARS", r"\bvars\b"),
        ("ADD_KW", r"\badd\b"),
        ("SUB_KW", r"\bsub\b"),
        ("MUL_KW", r"\bmul\b"),
        ("IDIV_KW", r"\bdiv\b"),
        ("MOD_KW", r"\bmod\b"),
        ("POW_KW", r"\bpow\b"),
        ("ADD", re.escape("+")),
        ("SUB", re.escape("-")),
        ("MUL", re.escape("*")),
        ("DIV", re.escape("/")),
        ("MOD", re.escape("%")),
        ("POW", re.escape("^")),
        ("ASSIGN", re.escape("=")),
        ("LPAREN", re.escape("(")),
        ("RPAREN", re.escape(")")),
        ("COMMA", re.escape(",")),
        ("NUMBER", r"\d+(?:\.\d+)?"),
        ("IDENT", r"[a-zA-Z_][a-zA-Z0-9_]*"),
        ("NEWLINE", r"\n"),
        ("SKIP", r"[ \t\r]+"),
    ]

    master_regex = re.compile("|".join(f"(?P<{name}>{pat})" for name, pat in regex_parts))

    tokens = []
    line = 1
    line_start = 0
    pos = 0

    while pos < len(source_code):
        match = master_regex.match(source_code, pos)
        col = pos - line_start + 1
        current_line_text = get_source_line(line)

        if not match:
            bad_char = source_code[pos]
            raise LexerError(
                bad_char,
                line,
                col,
                message=f"Unrecognized character '{bad_char}' in input.",
                source_line=current_line_text,
                hint="Remove the invalid symbol. Supported operators are +, -, *, /, //, %, ^, and =."
            )

        raw_type = match.lastgroup
        token_value = match.group(raw_type)
        handler = TOKEN_HANDLER_DISPATCH.get(raw_type) or _handle_standard_token(raw_type)
        line, line_start = handler(
            token_value, line, col, current_line_text, match.end(), tokens, line_start
        )
        pos = match.end()

    tokens.append(Token("EOF", "", line, pos - line_start + 1))
    return tokens


# ============================================================================
# 5. TABLE-DRIVEN RECURSIVE-DESCENT PARSER
# ============================================================================

class Parser:
    """
    Recursive-descent parser that transforms a stream of lexical `Token` objects
    into a validated Abstract Syntax Tree (AST) obeying mathematical operator precedence.

    Uses dictionary dispatch tables (`_statement_dispatch` and `_primary_dispatch`)
    and flat guard clauses so that grammatical analysis requires zero `if-else`
    chains and zero nested `if` blocks.

    Formal EBNF Grammar:
        Program     ::= Statement* EOF
        Statement   ::= LetStmt | AssignStmt | PrintStmt | ClearStmt | VarsStmt | ExprStmt
        LetStmt     ::= "let" IDENT "=" Expr
        AssignStmt  ::= IDENT ( "=" | "+=" | "-=" | "*=" | "/=" ) Expr
        PrintStmt   ::= "print" Expr
        ClearStmt   ::= "clear"
        VarsStmt    ::= "vars"
        ExprStmt    ::= Expr
        Expr        ::= Term ( ( "+" | "-" | "add" | "sub" ) Term )*
        Term        ::= Exponent ( ( "*" | "/" | "//" | "%" | "mul" | "div" | "mod" ) Exponent )*
        Exponent    ::= Unary ( ( "^" | "**" | "pow" ) Exponent )?
        Unary       ::= ( "+" | "-" | "sub" ) Unary | Primary
        Primary     ::= NUMBER | IDENT "(" ArgList? ")" | IDENT | "(" Expr ")"

    Class Variables:
        COMPOUND_OP_MAP (dict[str, str]): Maps compound assignment token types to operator symbols.
        ADDITIVE_OPS (tuple[str, ...]): Token types handled at the additive precedence level.
        MULTIPLICATIVE_OPS (tuple[str, ...]): Token types handled at the multiplicative precedence level.
        UNARY_OP_MAP (dict[str, str]): Maps unary prefix token types to normalized unary op codes.
        NUMBER_CONVERTERS (dict[bool, type]): Maps decimal point presence (`True`/`False`) to `float`/`int`.

    Instance Attributes:
        tokens (list[Token]): Complete list of tokens produced by `tokenize()`.
        pos (int): Zero-based index of the current lookahead token in `self.tokens`.
        config (dict): Active language configuration dictionary.
        source_lines (list[str]): Source code split by line for diagnostic error context.
    """

    COMPOUND_OP_MAP = {
        "ASSIGN": "=",
        "ADD_ASSIGN": "+=",
        "SUB_ASSIGN": "-=",
        "MUL_ASSIGN": "*=",
        "DIV_ASSIGN": "/=",
    }
    ADDITIVE_OPS = ("ADD", "SUB")
    MULTIPLICATIVE_OPS = ("MUL", "DIV", "IDIV", "MOD")
    UNARY_OP_MAP = {"SUB": "sub", "ADD": "add"}
    NUMBER_CONVERTERS = {True: float, False: int}

    def __init__(self, tokens, config=None, source_code=""):
        self.tokens = tokens
        self.pos = 0
        self.config = config or {}
        self.source_lines = (source_code and source_code.splitlines()) or []
        self._statement_dispatch = {
            "LET": self._parse_let_statement,
            "PRINT": self._parse_print_statement,
            "CLEAR": self._parse_clear_statement,
            "VARS": self._parse_vars_statement,
        }
        self._primary_dispatch = {
            "NUMBER": self._parse_number_primary,
            "IDENT": self._parse_ident_primary,
            "LPAREN": self._parse_grouped_primary,
        }

    def _get_line_text(self, line_num):
        """Returns the raw source line string for 1-based `line_num` if available."""
        if 1 <= line_num <= len(self.source_lines):
            return self.source_lines[line_num - 1]
        return None

    def current_token(self):
        """Returns the token at the current cursor position without consuming it."""
        return self.tokens[self.pos]

    def peek_token(self, offset=1):
        """Returns the token at `self.pos + offset`, or the final `EOF` token if out of bounds."""
        idx = self.pos + offset
        if idx < len(self.tokens):
            return self.tokens[idx]
        return self.tokens[-1]

    def _display_token_value(self, token, eof_label="end of input"):
        """Returns a human-readable representation of `token` for error diagnostics."""
        if token.type == "EOF":
            return eof_label
        return token.value

    def consume(self, expected_type, custom_message=None, hint=None):
        """
        Consumes and returns the current token if its type matches `expected_type`,
        or raises a `ParseError` with source context.
        """
        token = self.current_token()
        if token.type == expected_type:
            self.pos += 1
            return token

        shown = self._display_token_value(token, "end of input")
        msg = custom_message or f"Expected '{expected_type}', but found '{shown}'."
        raise ParseError(
            msg,
            token.line,
            token.column,
            source_line=self._get_line_text(token.line),
            hint=hint
        )

    def _skip_newlines(self):
        """Consumes any consecutive `NEWLINE` tokens at the current cursor position."""
        while self.current_token().type == "NEWLINE":
            self.consume("NEWLINE")

    def _verify_statement_boundary(self):
        """Ensures a statement ends cleanly with a `NEWLINE` or `EOF`."""
        curr = self.current_token()
        if curr.type not in ("NEWLINE", "EOF"):
            self._raise_trailing_token_error(curr)
        self._skip_newlines()

    def parse_program(self):
        """
        Parses a complete multi-statement PLang program until `EOF`.

        Returns:
            list[ASTNode]: Ordered list of statement AST nodes.
        """
        statements = []
        self._skip_newlines()

        while self.current_token().type != "EOF":
            statements.append(self.parse_statement())
            self._verify_statement_boundary()

        return statements

    def _raise_trailing_token_error(self, token):
        """Raises a specific, helpful `ParseError` when unexpected trailing tokens appear."""
        if token.type == "RPAREN":
            raise ParseError(
                "Unmatched closing parenthesis ')' without a matching opening '('.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint="Remove the extra ')' or add a matching '(' earlier in the expression."
            )
        if token.type in Token.ASSIGN_OP_TYPES:
            raise ParseError(
                f"Invalid assignment target before '{token.value}'. Left side of assignment must be a single variable name.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint="Use 'let variable_name = expression' or 'variable_name = expression'."
            )
        if token.type in ("NUMBER", "IDENT", "LPAREN"):
            raise ParseError(
                f"Missing arithmetic operator before '{token.value}'.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint=f"Insert an operator (such as +, -, *, /) before '{token.value}'."
            )
        raise ParseError(
            f"Unexpected token '{token.value}' after complete statement.",
            token.line,
            token.column,
            source_line=self._get_line_text(token.line)
        )

    def _validate_let_target(self, ident_tok):
        """Validates that the token following `let` is a non-reserved identifier."""
        if ident_tok.type == "IDENT":
            return
        if ident_tok.value in RESERVED_KEYWORDS:
            raise ParseError(
                f"Cannot use reserved keyword '{ident_tok.value}' as a variable name.",
                ident_tok.line,
                ident_tok.column,
                source_line=self._get_line_text(ident_tok.line),
                hint="Choose a descriptive variable name that is not a reserved language keyword."
            )
        shown = self._display_token_value(ident_tok, "end of line")
        raise ParseError(
            f"Expected a variable name after 'let', but got '{shown}'.",
            ident_tok.line,
            ident_tok.column,
            source_line=self._get_line_text(ident_tok.line),
            hint="Syntax for variable declaration is: let <variable_name> = <expression>"
        )

    def _parse_let_statement(self):
        """Parses an explicit variable declaration (`let <ident> = <expr>`)."""
        let_tok = self.consume("LET")
        ident_tok = self.current_token()
        self._validate_let_target(ident_tok)
        self.consume("IDENT")

        bad = self.current_token()
        shown = self._display_token_value(bad, "end of line")
        self.consume(
            "ASSIGN",
            custom_message=f"Expected '=' after variable '{ident_tok.value}' in 'let' declaration, got '{shown}'.",
            hint=f"Write: let {ident_tok.value} = <expression>"
        )
        expr = self.parse_expr()
        return AssignNode(ident_tok.value, expr, let_tok.line, let_tok.column, op="=")

    def _parse_print_statement(self):
        """Parses an explicit output instruction (`print <expr>`)."""
        token = self.consume("PRINT")
        if self.current_token().type in ("NEWLINE", "EOF"):
            raise ParseError(
                "Missing expression after 'print' statement.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint="Provide a value or expression to print, e.g., 'print 10 + 5' or 'print x'."
            )
        return PrintNode(self.parse_expr(), token.line, token.column)

    def _parse_clear_statement(self):
        """Parses an environment reset instruction (`clear`)."""
        token = self.consume("CLEAR")
        return ClearNode(token.line, token.column)

    def _parse_vars_statement(self):
        """Parses a symbol table inspection instruction (`vars`)."""
        token = self.consume("VARS")
        return VarsNode(token.line, token.column)

    def _parse_assignment_statement(self):
        """Parses a concise or compound variable assignment (`x = expr`, `x += expr`)."""
        ident_tok = self.consume("IDENT")
        op_tok = self.consume(self.current_token().type)
        op_symbol = self.COMPOUND_OP_MAP[op_tok.type]
        expr = self.parse_expr()
        return AssignNode(ident_tok.value, expr, ident_tok.line, ident_tok.column, op=op_symbol)

    def parse_statement(self):
        """
        Dispatches and parses a single top-level PLang statement without `if-else`
        or nested `if` blocks.
        """
        token = self.current_token()

        if token.type in self._statement_dispatch:
            return self._statement_dispatch[token.type]()

        if token.type == "IDENT" and self.peek_token().type in self.COMPOUND_OP_MAP:
            return self._parse_assignment_statement()

        if token.type in Token.STATEMENT_KW_TYPES and self.peek_token().type in self.COMPOUND_OP_MAP:
            raise ParseError(
                f"Cannot assign to reserved keyword '{token.value}'.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint="Choose a non-reserved identifier name for your variable."
            )

        expr = self.parse_expr()
        if self.current_token().type in self.COMPOUND_OP_MAP:
            bad = self.current_token()
            raise ParseError(
                f"Invalid assignment target before '{bad.value}'. Cannot assign a value to a literal or expression.",
                bad.line,
                bad.column,
                source_line=self._get_line_text(bad.line),
                hint="Place a single variable identifier on the left side of '=' (e.g., 'x = 10')."
            )
        return expr

    def parse_expr(self):
        """Parses additive expressions (`+`, `-`, `add`, `sub`) with left-associativity."""
        node = self.parse_term()
        while self.current_token().type in self.ADDITIVE_OPS:
            op_token = self.consume(self.current_token().type)
            right = self.parse_term()
            node = BinOpNode(op_token.type.lower(), node, right, op_token.line, op_token.column)
        return node

    def parse_term(self):
        """Parses multiplicative expressions (`*`, `/`, `//`, `%`, `mul`, `div`, `mod`) with left-associativity."""
        node = self.parse_exponent()
        while self.current_token().type in self.MULTIPLICATIVE_OPS:
            op_token = self.consume(self.current_token().type)
            right = self.parse_exponent()
            node = BinOpNode(op_token.type.lower(), node, right, op_token.line, op_token.column)
        return node

    def parse_exponent(self):
        """Parses exponentiation expressions (`^`, `**`, `pow`) with standard right-associativity."""
        node = self.parse_unary()
        if self.current_token().type == "POW":
            op_token = self.consume("POW")
            right = self.parse_exponent()
            return BinOpNode("pow", node, right, op_token.line, op_token.column)
        return node

    def parse_unary(self):
        """Parses unary prefix operators (`-x`, `+x`) via `UNARY_OP_MAP` lookup."""
        token = self.current_token()
        if token.type in self.UNARY_OP_MAP:
            op_token = self.consume(token.type)
            return UnaryOpNode(
                self.UNARY_OP_MAP[token.type],
                self.parse_unary(),
                op_token.line,
                op_token.column
            )
        return self.parse_primary()

    def _parse_number_primary(self):
        """Parses an integer or floating-point numeric literal into a `NumberNode`."""
        token = self.consume("NUMBER")
        converter = self.NUMBER_CONVERTERS["." in token.value]
        return NumberNode(converter(token.value), token.line, token.column)

    def _parse_argument_list(self):
        """Parses zero or more comma-separated argument expressions inside a function call."""
        if self.current_token().type == "RPAREN":
            return []
        args = [self.parse_expr()]
        while self.current_token().type == "COMMA":
            self.consume("COMMA")
            args.append(self.parse_expr())
        return args

    def _parse_function_call(self, ident_tok):
        """Parses a function call `ident(arg1, arg2, ...)` after the identifier token."""
        self.consume("LPAREN")
        args = self._parse_argument_list()
        self.consume(
            "RPAREN",
            custom_message=f"Unclosed '(' in call to function '{ident_tok.value}()' — expected ')'.",
            hint=f"Add a closing ')' to complete the '{ident_tok.value}(...)' function call."
        )
        return FuncCallNode(ident_tok.value, args, ident_tok.line, ident_tok.column)

    def _parse_ident_primary(self):
        """Parses an identifier reference (`VarNode`) or built-in function call (`FuncCallNode`)."""
        ident_tok = self.consume("IDENT")
        if self.current_token().type == "LPAREN":
            return self._parse_function_call(ident_tok)
        return VarNode(ident_tok.value, ident_tok.line, ident_tok.column)

    def _parse_grouped_primary(self):
        """Parses a parenthesized sub-expression `( <expr> )` with balanced delimiter checks."""
        open_tok = self.consume("LPAREN")
        if self.current_token().type == "RPAREN":
            raise ParseError(
                "Empty parentheses '()' do not contain an expression.",
                open_tok.line,
                open_tok.column,
                source_line=self._get_line_text(open_tok.line),
                hint="Place a valid arithmetic expression inside the parentheses, e.g., '(10 + 5)'."
            )
        expr = self.parse_expr()
        curr = self.current_token()
        self.consume(
            "RPAREN",
            custom_message=f"Unclosed parenthesis '(' opened at line {open_tok.line}, col {open_tok.column} — expected ')'.",
            hint="Add a matching closing parenthesis ')' at the end of the grouped sub-expression."
        )
        return expr

    def parse_primary(self):
        """
        Dispatches primary arithmetic units (`NUMBER`, `IDENT`, `LPAREN`) via
        `self._primary_dispatch` and traps malformed expression tokens.
        """
        token = self.current_token()

        if token.type in self._primary_dispatch:
            return self._primary_dispatch[token.type]()

        if token.type in ("NEWLINE", "EOF"):
            raise ParseError(
                "Incomplete expression — expected a number, variable, or '(' before end of line.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint="Complete the expression by supplying the missing right-hand operand."
            )

        if token.type in Token.BINARY_OP_TYPES:
            raise ParseError(
                f"Unexpected operator '{token.value}' — missing operand before '{token.value}'.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint=f"Binary operator '{token.value}' requires a value on both its left and right sides."
            )

        if token.type == "RPAREN":
            raise ParseError(
                "Unexpected closing parenthesis ')' with no matching opening '('.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint="Check your parentheses balance and remove the extra ')'."
            )

        raise ParseError(
            f"Unexpected token '{token.value}' in arithmetic expression.",
            token.line,
            token.column,
            source_line=self._get_line_text(token.line)
        )


# ============================================================================
# 6. TABLE-DRIVEN INTERPRETER (WITH PYTHON `operator` LIBRARY)
# ============================================================================

class Interpreter:
    """
    Polymorphic, table-driven interpreter that evaluates PLang AST nodes,
    maintains the runtime variable symbol table, enforces integer/float precision,
    and traps runtime arithmetic errors without `if-else` or nested `if` blocks.

    Class Variables:
        BUILT_IN_CONSTANTS (dict[str, float]): Read-only mathematical constants pre-loaded in scope.
        MAX_EXPONENT_MAGNITUDE (int): Maximum safe exponent magnitude to prevent CPU/memory hangs.
        UNARY_FUNCTIONS (dict[str, callable]): Maps unary operator codes to `operator.pos`/`operator.neg`.
        COMPOUND_BINARY_OP_MAP (dict[str, str]): Maps compound assignment symbols to binary op codes.
        TYPE_LABELS (dict[type, str]): Maps Python numeric types to symbol table display strings.

    Instance Attributes:
        variables (dict[str, int | float]): Symbol table mapping variable identifiers to numeric values.
        config (dict): Active language configuration dictionary.
        source_lines (list[str]): Raw source lines used to attach context to `InterpreterError` instances.
        history (list[dict]): Chronological execution trace of statements evaluated during the session.
    """

    BUILT_IN_CONSTANTS = {
        "PI": math.pi,
        "E": math.e,
    }
    MAX_EXPONENT_MAGNITUDE = 10000
    UNARY_FUNCTIONS = {
        "add": operator.pos,
        "sub": operator.neg,
    }
    COMPOUND_BINARY_OP_MAP = {
        "+=": "add",
        "-=": "sub",
        "*=": "mul",
        "/=": "div",
    }
    TYPE_LABELS = {
        int: "integer",
        float: "float",
    }

    def __init__(self, config=None, source_code=""):
        self.variables = {}
        self.config = config or {}
        self.source_lines = (source_code and source_code.splitlines()) or []
        self.history = []
        self._binary_op_dispatch = {
            "add": lambda a, b, ln, col: operator.add(a, b),
            "sub": lambda a, b, ln, col: operator.sub(a, b),
            "mul": lambda a, b, ln, col: operator.mul(a, b),
            "div": self._op_true_div,
            "idiv": self._op_floor_div,
            "mod": self._op_modulo,
            "pow": self._op_power,
        }
        self._single_arg_funcs = {
            "abs": lambda x, node: abs(x),
            "round": lambda x, node: int(round(x)),
            "int": lambda x, node: int(x),
            "float": lambda x, node: float(x),
            "sqrt": self._eval_sqrt,
        }
        self._variadic_funcs = {
            "min": min,
            "max": max,
        }

    def set_source_code(self, source_code):
        """Updates the stored source code lines for accurate error reporting in REPL or file runs."""
        self.source_lines = (source_code and source_code.splitlines()) or []

    def _get_line_text(self, line_num):
        """Retrieves the 1-based source line string if available."""
        if 1 <= line_num <= len(self.source_lines):
            return self.source_lines[line_num - 1]
        return None

    def evaluate_statement(self, stmt):
        """
        Polymorphically executes a single top-level AST statement node by delegating
        to `stmt.execute(self)`.
        """
        return stmt.execute(self)

    def evaluate_expr(self, node):
        """
        Polymorphically evaluates an expression AST node by delegating to `node.evaluate(self)`.
        """
        return node.evaluate(self)

    def resolve_variable(self, name, line, col):
        """Resolves an identifier from `self.variables` or `BUILT_IN_CONSTANTS`."""
        if name in self.variables:
            return self.variables[name]
        if name in self.BUILT_IN_CONSTANTS:
            return self.BUILT_IN_CONSTANTS[name]
        raise InterpreterError(
            "undefined_variable",
            line,
            col,
            var_name=name,
            source_line=self._get_line_text(line),
            hint=f"Define '{name}' first using: let {name} = <value>"
        )

    def apply_unary_op(self, op, val, line, col):
        """Applies a unary arithmetic operator via `UNARY_FUNCTIONS` table lookup."""
        if op not in self.UNARY_FUNCTIONS:
            raise InterpreterError(
                f"Unknown unary operator: {op}",
                line,
                col,
                source_line=self._get_line_text(line)
            )
        return self.UNARY_FUNCTIONS[op](val)

    def _compute_assigned_value(self, stmt, rhs_val):
        """Computes the new value for a simple (`=`) or compound (`+=`, `-=`, etc.) assignment."""
        if stmt.op == "=":
            return rhs_val
        if stmt.name not in self.variables:
            raise InterpreterError(
                "undefined_variable",
                stmt.line,
                stmt.col,
                var_name=stmt.name,
                source_line=self._get_line_text(stmt.line),
                hint=f"Initialize '{stmt.name}' with 'let {stmt.name} = ...' before using '{stmt.op}'."
            )
        mapped_op = self.COMPOUND_BINARY_OP_MAP[stmt.op]
        return self._apply_binary_op(mapped_op, self.variables[stmt.name], rhs_val, stmt.line, stmt.col)

    def execute_assignment(self, stmt):
        """Executes an `AssignNode` statement and updates the symbol table."""
        if stmt.name in self.BUILT_IN_CONSTANTS:
            raise InterpreterError(
                "argument_error",
                stmt.line,
                stmt.col,
                detail=f"Cannot reassign built-in mathematical constant '{stmt.name}'.",
                source_line=self._get_line_text(stmt.line),
                hint=f"'{stmt.name}' is a constant ({self.BUILT_IN_CONSTANTS[stmt.name]}). Choose a different variable name."
            )

        rhs_val = stmt.expr.evaluate(self)
        final_val = self._compute_assigned_value(stmt, rhs_val)
        self.variables[stmt.name] = final_val
        self.variables["ans"] = final_val
        self.history.append({"type": "assign", "name": stmt.name, "value": final_val})
        return None

    def _print_symbol_table(self):
        """Prints a formatted table of all variables currently bound in the interpreter environment."""
        if not self.variables:
            print("  [Symbol Table] Environment is empty (no variables defined).")
            return

        print("  +----------------------+------------+----------------------+")
        print("  | Variable Identifier  | Data Type  | Current Value        |")
        print("  +----------------------+------------+----------------------+")
        for name, val in self.variables.items():
            dtype = self.TYPE_LABELS.get(type(val), "float")
            print(f"  | {name:<20} | {dtype:<10} | {str(val):<20} |")
        print("  +----------------------+------------+----------------------+")

    def _eval_sqrt(self, arg, node):
        """Evaluates `sqrt(arg)`, preserving exact `int` types for perfect integer squares."""
        if arg < 0:
            raise InterpreterError(
                "negative_sqrt",
                node.line,
                node.col,
                detail=str(arg),
                source_line=self._get_line_text(node.line),
                hint="Pass a non-negative number (>= 0) to sqrt()."
            )
        res = math.sqrt(arg)
        if res.is_integer() and isinstance(arg, int):
            return int(res)
        return res

    def _eval_single_arg_function(self, fname, eval_args, node):
        """Validates arity == 1 and dispatches a single-argument built-in function."""
        if len(eval_args) != 1:
            raise InterpreterError(
                "argument_error",
                node.line,
                node.col,
                detail=f"Function '{fname}()' expects exactly 1 argument, but got {len(eval_args)}.",
                source_line=self._get_line_text(node.line),
                hint=f"Call '{fname}(x)' with a single numeric expression."
            )
        return self._single_arg_funcs[fname](eval_args[0], node)

    def _eval_variadic_function(self, fname, eval_args, node):
        """Validates arity >= 2 and dispatches a variadic built-in function (`min` or `max`)."""
        if len(eval_args) < 2:
            raise InterpreterError(
                "argument_error",
                node.line,
                node.col,
                detail=f"Function '{fname}()' requires at least 2 arguments, got {len(eval_args)}.",
                source_line=self._get_line_text(node.line),
                hint=f"Call '{fname}(a, b)' with two or more comma-separated arguments."
            )
        return self._variadic_funcs[fname](eval_args)

    def _evaluate_function(self, node):
        """Dispatches built-in mathematical functions using `_single_arg_funcs` and `_variadic_funcs`."""
        fname = node.func_name
        if fname not in FuncCallNode.SUPPORTED_FUNCTIONS:
            raise InterpreterError(
                "argument_error",
                node.line,
                node.col,
                detail=f"Unknown function '{fname}()'. Supported functions: {', '.join(FuncCallNode.SUPPORTED_FUNCTIONS)}.",
                source_line=self._get_line_text(node.line),
                hint=f"Use one of the built-in functions: {', '.join(FuncCallNode.SUPPORTED_FUNCTIONS)}."
            )

        eval_args = [arg.evaluate(self) for arg in node.args]
        if fname in self._single_arg_funcs:
            return self._eval_single_arg_function(fname, eval_args, node)
        return self._eval_variadic_function(fname, eval_args, node)

    def _require_non_zero(self, right_val, line, col, hint):
        """Guard helper that raises `divide_by_zero` when `right_val == 0`."""
        if right_val == 0:
            raise InterpreterError(
                "divide_by_zero",
                line,
                col,
                source_line=self._get_line_text(line),
                hint=hint
            )

    def _op_true_div(self, left_val, right_val, line, col):
        """Performs true division (`a / b`) using `operator.truediv`."""
        self._require_non_zero(
            right_val,
            line,
            col,
            "Division by zero is undefined. Ensure the divisor expression evaluates to a non-zero number."
        )
        return operator.truediv(left_val, right_val)

    def _op_floor_div(self, left_val, right_val, line, col):
        """Performs integer floor division (`a // b`) using `operator.floordiv`."""
        self._require_non_zero(
            right_val,
            line,
            col,
            "Integer division by zero is undefined. Ensure the divisor is non-zero."
        )
        res = operator.floordiv(left_val, right_val)
        if isinstance(left_val, int) and isinstance(right_val, int):
            return int(res)
        return res

    def _op_modulo(self, left_val, right_val, line, col):
        """Performs modulo remainder (`a % b`) using `operator.mod`."""
        self._require_non_zero(
            right_val,
            line,
            col,
            "Modulo by zero is undefined. Ensure the right-hand operand of '%' is non-zero."
        )
        return operator.mod(left_val, right_val)

    def _op_power(self, left_val, right_val, line, col):
        """Performs exponentiation (`a ^ b`) using `operator.pow` with overflow and domain guards."""
        if left_val == 0 and right_val < 0:
            raise InterpreterError(
                "divide_by_zero",
                line,
                col,
                source_line=self._get_line_text(line),
                hint="Zero cannot be raised to a negative power because it implies division by zero."
            )
        if abs(right_val) > self.MAX_EXPONENT_MAGNITUDE and abs(left_val) > 1:
            raise InterpreterError(
                "overflow_error",
                line,
                col,
                source_line=self._get_line_text(line),
                hint=f"Keep exponent magnitude <= {self.MAX_EXPONENT_MAGNITUDE} to avoid numeric overflow."
            )
        try:
            res = operator.pow(left_val, right_val)
        except ZeroDivisionError:
            raise InterpreterError("divide_by_zero", line, col, source_line=self._get_line_text(line))
        except OverflowError:
            raise InterpreterError("overflow_error", line, col, source_line=self._get_line_text(line))

        if isinstance(res, complex):
            raise InterpreterError(
                "negative_sqrt",
                line,
                col,
                detail=f"{left_val} ^ {right_val}",
                source_line=self._get_line_text(line),
                hint="Fractional exponent of a negative base yields a complex number."
            )
        return res

    def _apply_binary_op(self, op, left_val, right_val, line, col):
        """
        Validates numeric operand types and dispatches `op` via `self._binary_op_dispatch`.
        """
        if (
            not isinstance(left_val, (int, float))
            or not isinstance(right_val, (int, float))
            or isinstance(left_val, bool)
            or isinstance(right_val, bool)
        ):
            raise InterpreterError(
                "type_error",
                line,
                col,
                source_line=self._get_line_text(line)
            )

        if op not in self._binary_op_dispatch:
            raise InterpreterError(f"Unknown binary operator: {op}", line, col)

        return self._binary_op_dispatch[op](left_val, right_val, line, col)


# ============================================================================
# 7. AST VISUALIZER & DIAGNOSTIC ERROR FORMATTER
# ============================================================================

def format_ast(node, indent="", is_last=True):
    """
    Renders an AST node or statement tree as a clean ASCII hierarchy by delegating
    polymorphically to `node.format_tree(indent, is_last)`.

    Args:
        node (ASTNode): Root AST node to format.
        indent (str): Current indentation prefix string.
        is_last (bool): Whether `node` is the last child of its parent node.

    Returns:
        str: Multi-line ASCII tree representation of the AST.
    """
    return node.format_tree(indent=indent, is_last=is_last)


def format_error(error, config=None):
    """
    Formats any `PlangError` into a clear, readable diagnostic report complete
    with line/column coordinates, source line snippet, visual caret (`^`) pointer,
    and corrective hint using polymorphic `error.format_header()`.

    Args:
        error (Exception): The exception caught during lexing, parsing, or evaluation.
        config (dict | None): Optional language configuration dictionary.

    Returns:
        str: Formatted diagnostic string ready for console output.
    """
    config = config or {}
    errors_config = config.get("errors", {})

    if not isinstance(error, PlangError):
        return f"[System Error]: {error}"

    line = error.line or 1
    col = error.column or 1
    output_lines = [error.format_header(errors_config, line, col)]

    if error.source_line is not None and error.source_line.strip() != "":
        line_label = f"  {line} | "
        caret_offset = max(0, col - 1)
        caret_line = " " * len(line_label) + (" " * caret_offset) + "^"
        output_lines.append(f"{line_label}{error.source_line}")
        output_lines.append(caret_line)

    if error.hint:
        output_lines.append(f"  Hint: {error.hint}")

    return "\n".join(output_lines)
