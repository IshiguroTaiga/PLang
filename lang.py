"""
PLang Core Language Engine (lang.py)
====================================
Course: CMPSC 132 — Programming Languages (1st Semester, A.Y. 2025-2026)

Module Overview:
    Implements the lexical analyzer (tokenizer), recursive-descent parser,
    Abstract Syntax Tree (AST) node hierarchy, tree-walking interpreter,
    AST visual formatter, and diagnostic error formatter for PLang.

Programming Language Evaluation Criteria (Sebesta):
    1. Readability:
       - Single unified, orthogonal syntax (no ambiguous character themes).
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
"""

import math
import re


# ============================================================================
# 1. EXCEPTION HIERARCHY
# ============================================================================

class PlangError(Exception):
    """
    Base exception class for all errors raised during PLang compilation or execution.

    Class Variables:
        CATEGORY (str): Human-readable error category label used in diagnostic headers.
        DEFAULT_HINT (str): Default corrective hint displayed when no specific hint is provided.

    Instance Attributes:
        message (str): Detailed description of the error condition.
        line (int | None): 1-based line number in the source code where the error occurred.
        column (int | None): 1-based column number in the source line where the error occurred.
        source_line (str | None): Raw text of the offending source code line for visual caret rendering.
        hint (str | None): Actionable suggestion helping the user fix the error.
    """

    CATEGORY = "PLang Error"
    DEFAULT_HINT = "Review the syntax and operand types at the indicated position."

    def __init__(self, message, line=None, column=None, source_line=None, hint=None):
        super().__init__(message)
        self.message = message
        self.line = line
        self.column = column
        self.source_line = source_line
        self.hint = hint or self.DEFAULT_HINT


class LexerError(PlangError):
    """
    Exception raised by the lexical analyzer when encountering illegal characters
    or malformed numeric/identifier tokens.

    Class Variables:
        CATEGORY (str): Error category label ('Lexical Error').
        DEFAULT_HINT (str): Default hint explaining valid PLang tokens and characters.

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

    def __init__(self, char, line, column, message=None, source_line=None, hint=None):
        msg = message or f"Unexpected character '{char}'"
        super().__init__(msg, line, column, source_line=source_line, hint=hint)
        self.char = char


class ParseError(PlangError):
    """
    Exception raised by the recursive-descent parser when token sequences violate
    PLang's formal EBNF grammar rules.

    Class Variables:
        CATEGORY (str): Error category label ('Syntax Error').
        DEFAULT_HINT (str): Default hint explaining proper statement and expression structure.

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


class InterpreterError(PlangError):
    """
    Exception raised during AST evaluation when a semantic or runtime error occurs
    (e.g., division by zero, undefined variable, domain error, or numeric overflow).

    Class Variables:
        CATEGORY (str): Error category label ('Runtime Error').
        DEFAULT_HINT (str): Default hint for runtime evaluation errors.

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
# 3. ABSTRACT SYNTAX TREE (AST) NODE HIERARCHY
# ============================================================================

class ASTNode:
    """
    Abstract base class for all nodes in the PLang Abstract Syntax Tree (AST).

    Class Variables:
        NODE_CATEGORY (str): High-level classification of the AST node ('Base').

    Instance Attributes:
        line (int): 1-based source line number associated with this syntactic construct.
        col (int): 1-based source column number associated with this syntactic construct.
    """

    NODE_CATEGORY = "Base"

    def __init__(self, line, col):
        self.line = line
        self.col = col


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


# ============================================================================
# 4. LEXICAL ANALYZER (TOKENIZER)
# ============================================================================

RESERVED_KEYWORDS = {
    "let", "print", "clear", "vars",
    "add", "sub", "mul", "div", "mod", "pow"
}


def tokenize(source_code, config=None):
    """
    Scans raw PLang source code and converts it into a sequence of `Token` objects.

    Enforces lexical reliability by trapping malformed numeric literals (such as `12.3.4`
    or `12abc`) and unrecognized symbols with exact line and column coordinates.

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
    source_lines = source_code.splitlines() if source_code else [""]

    def get_source_line(line_num):
        if 1 <= line_num <= len(source_lines):
            return source_lines[line_num - 1]
        return ""

    regex_parts = [
        # 1. Comments (from '#' to end of line)
        ("COMMENT", re.escape(comment_prefix) + r"[^\n]*"),

        # 2. Malformed number checks (e.g. 12.34.56 or 123abc) for high-reliability error reporting
        ("MALFORMED_FLOAT", r"\d+\.\d*\.\d*"),
        ("MALFORMED_IDENT", r"\d+[a-zA-Z_][a-zA-Z0-9_]*"),

        # 3. Multi-character symbolic operators (longest match first)
        ("ADD_ASSIGN", re.escape("+=")),
        ("SUB_ASSIGN", re.escape("-=")),
        ("MUL_ASSIGN", re.escape("*=")),
        ("DIV_ASSIGN", re.escape("/=")),
        ("IDIV", re.escape("//")),
        ("POW_ALT", re.escape("**")),

        # 4. Word-based hybrid keywords (boundary-aware)
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

        # 5. Single-character symbolic operators & punctuation
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

        # 6. Numeric literals (integers and decimals)
        ("NUMBER", r"\d+(?:\.\d+)?"),

        # 7. Valid identifiers
        ("IDENT", r"[a-zA-Z_][a-zA-Z0-9_]*"),

        # 8. Newlines and horizontal whitespace
        ("NEWLINE", r"\n"),
        ("SKIP", r"[ \t\r]+"),
    ]

    master_regex = re.compile("|".join(f"(?P<{name}>{pat})" for name, pat in regex_parts))

    # Normalize keyword alias token types into canonical operator token types
    canonical_type_map = {
        "ADD_KW": "ADD",
        "SUB_KW": "SUB",
        "MUL_KW": "MUL",
        "IDIV_KW": "IDIV",
        "MOD_KW": "MOD",
        "POW_KW": "POW",
        "POW_ALT": "POW",
    }

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

        if raw_type == "MALFORMED_FLOAT":
            raise LexerError(
                token_value,
                line,
                col,
                message=f"Malformed numeric literal '{token_value}' (multiple decimal points).",
                source_line=current_line_text,
                hint="A floating-point number may contain at most one decimal point (e.g., 3.14)."
            )

        if raw_type == "MALFORMED_IDENT":
            raise LexerError(
                token_value,
                line,
                col,
                message=f"Invalid token '{token_value}' — identifiers cannot begin with a digit.",
                source_line=current_line_text,
                hint=f"Rename the variable to start with a letter (e.g., 'var_{token_value}') or insert '*' for multiplication."
            )

        if raw_type == "NEWLINE":
            tokens.append(Token("NEWLINE", token_value, line, col))
            line += 1
            line_start = match.end()
        elif raw_type in ("SKIP", "COMMENT"):
            pass
        else:
            norm_type = canonical_type_map.get(raw_type, raw_type)
            tokens.append(Token(norm_type, token_value, line, col))

        pos = match.end()

    tokens.append(Token("EOF", "", line, pos - line_start + 1))
    return tokens


# ============================================================================
# 5. RECURSIVE-DESCENT PARSER
# ============================================================================

class Parser:
    """
    Recursive-descent parser that transforms a stream of lexical `Token` objects
    into a validated Abstract Syntax Tree (AST) obeying mathematical operator precedence.

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

    def __init__(self, tokens, config=None, source_code=""):
        self.tokens = tokens
        self.pos = 0
        self.config = config or {}
        self.source_lines = source_code.splitlines() if source_code else []

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

    def consume(self, expected_type, custom_message=None, hint=None):
        """
        Consumes and returns the current token if its type matches `expected_type`,
        or raises a `ParseError` with source context.
        """
        token = self.current_token()
        if token.type == expected_type:
            self.pos += 1
            return token

        shown = token.value if token.type != "EOF" else "end of input"
        msg = custom_message or f"Expected '{expected_type}', but found '{shown}'."
        raise ParseError(
            msg,
            token.line,
            token.column,
            source_line=self._get_line_text(token.line),
            hint=hint
        )

    def parse_program(self):
        """
        Parses a complete multi-statement PLang program until `EOF`.

        Returns:
            list[ASTNode]: Ordered list of statement AST nodes.
        """
        statements = []
        while self.current_token().type == "NEWLINE":
            self.consume("NEWLINE")

        while self.current_token().type != "EOF":
            stmt = self.parse_statement()
            statements.append(stmt)

            curr = self.current_token()
            if curr.type == "NEWLINE":
                self.consume("NEWLINE")
            elif curr.type != "EOF":
                self._raise_trailing_token_error(curr)

            while self.current_token().type == "NEWLINE":
                self.consume("NEWLINE")

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

    def parse_statement(self):
        """
        Parses a single top-level PLang statement (`let`, assignment, `print`, `clear`, `vars`, or expression).
        """
        token = self.current_token()

        # 1. Explicit variable declaration: `let x = expr`
        if token.type == "LET":
            let_tok = self.consume("LET")
            ident_tok = self.current_token()
            if ident_tok.type != "IDENT":
                shown = ident_tok.value if ident_tok.type != "EOF" else "end of line"
                if ident_tok.value in RESERVED_KEYWORDS:
                    raise ParseError(
                        f"Cannot use reserved keyword '{ident_tok.value}' as a variable name.",
                        ident_tok.line,
                        ident_tok.column,
                        source_line=self._get_line_text(ident_tok.line),
                        hint="Choose a descriptive variable name that is not a reserved language keyword."
                    )
                raise ParseError(
                    f"Expected a variable name after 'let', but got '{shown}'.",
                    ident_tok.line,
                    ident_tok.column,
                    source_line=self._get_line_text(ident_tok.line),
                    hint="Syntax for variable declaration is: let <variable_name> = <expression>"
                )
            self.consume("IDENT")
            if self.current_token().type != "ASSIGN":
                bad = self.current_token()
                shown = bad.value if bad.type != "EOF" else "end of line"
                raise ParseError(
                    f"Expected '=' after variable '{ident_tok.value}' in 'let' declaration, got '{shown}'.",
                    bad.line,
                    bad.column,
                    source_line=self._get_line_text(bad.line),
                    hint=f"Write: let {ident_tok.value} = <expression>"
                )
            self.consume("ASSIGN")
            expr = self.parse_expr()
            return AssignNode(ident_tok.value, expr, let_tok.line, let_tok.column, op="=")

        # 2. Output statement: `print <expr>`
        if token.type == "PRINT":
            self.consume("PRINT")
            if self.current_token().type in ("NEWLINE", "EOF"):
                raise ParseError(
                    "Missing expression after 'print' statement.",
                    token.line,
                    token.column,
                    source_line=self._get_line_text(token.line),
                    hint="Provide a value or expression to print, e.g., 'print 10 + 5' or 'print x'."
                )
            expr = self.parse_expr()
            return PrintNode(expr, token.line, token.column)

        # 3. Environment reset statement: `clear`
        if token.type == "CLEAR":
            self.consume("CLEAR")
            return ClearNode(token.line, token.column)

        # 4. Symbol table inspection statement: `vars`
        if token.type == "VARS":
            self.consume("VARS")
            return VarsNode(token.line, token.column)

        # 5. Concise or compound variable assignment: `x = expr`, `x += expr`, etc.
        if token.type == "IDENT" and self.peek_token().type in self.COMPOUND_OP_MAP:
            name = token.value
            self.consume("IDENT")
            op_tok = self.current_token()
            self.consume(op_tok.type)
            op_symbol = self.COMPOUND_OP_MAP[op_tok.type]
            expr = self.parse_expr()
            return AssignNode(name, expr, token.line, token.column, op=op_symbol)

        # 6. Guard against assigning to reserved keyword without `let` (e.g., `print = 5`)
        if token.type in Token.STATEMENT_KW_TYPES and self.peek_token().type in self.COMPOUND_OP_MAP:
            raise ParseError(
                f"Cannot assign to reserved keyword '{token.value}'.",
                token.line,
                token.column,
                source_line=self._get_line_text(token.line),
                hint="Choose a non-reserved identifier name for your variable."
            )

        # 7. Default: Arithmetic expression statement
        expr = self.parse_expr()

        # Check if user wrote an invalid assignment like `10 = x` or `(a + b) = 5`
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
        """
        Parses additive expressions (`+`, `-`, `add`, `sub`) with left-associativity.
        """
        node = self.parse_term()
        while self.current_token().type in self.ADDITIVE_OPS:
            op_token = self.current_token()
            self.consume(op_token.type)
            right = self.parse_term()
            node = BinOpNode(op_token.type.lower(), node, right, op_token.line, op_token.column)
        return node

    def parse_term(self):
        """
        Parses multiplicative expressions (`*`, `/`, `//`, `%`, `mul`, `div`, `mod`) with left-associativity.
        """
        node = self.parse_exponent()
        while self.current_token().type in self.MULTIPLICATIVE_OPS:
            op_token = self.current_token()
            self.consume(op_token.type)
            right = self.parse_exponent()
            node = BinOpNode(op_token.type.lower(), node, right, op_token.line, op_token.column)
        return node

    def parse_exponent(self):
        """
        Parses exponentiation expressions (`^`, `**`, `pow`) with standard right-associativity.
        """
        node = self.parse_unary()
        if self.current_token().type == "POW":
            op_token = self.current_token()
            self.consume("POW")
            right = self.parse_exponent()
            node = BinOpNode("pow", node, right, op_token.line, op_token.column)
        return node

    def parse_unary(self):
        """
        Parses unary prefix operators (`-x`, `+x`) before primary factors.
        Wait: Note that in standard math, `-2 ^ 2` or `2 ^ -3`: having `parse_exponent` call `parse_unary`
        allows `2 ^ -3` to work seamlessly (`2 ^ (-3) = 0.125`)!
        """
        token = self.current_token()
        if token.type == "SUB":
            op_token = self.consume("SUB")
            operand = self.parse_unary()
            return UnaryOpNode("sub", operand, op_token.line, op_token.column)
        if token.type == "ADD":
            op_token = self.consume("ADD")
            operand = self.parse_unary()
            return UnaryOpNode("add", operand, op_token.line, op_token.column)
        return self.parse_primary()

    def parse_primary(self):
        """
        Parses primary arithmetic units: numeric literals, function calls, variable identifiers,
        and parenthesized sub-expressions.
        """
        token = self.current_token()

        if token.type == "NUMBER":
            self.consume("NUMBER")
            val = float(token.value) if "." in token.value else int(token.value)
            return NumberNode(val, token.line, token.column)

        if token.type == "IDENT":
            ident_tok = self.consume("IDENT")
            # Check for function call `func(arg1, arg2, ...)`
            if self.current_token().type == "LPAREN":
                self.consume("LPAREN")
                args = []
                if self.current_token().type != "RPAREN":
                    args.append(self.parse_expr())
                    while self.current_token().type == "COMMA":
                        self.consume("COMMA")
                        args.append(self.parse_expr())
                self.consume(
                    "RPAREN",
                    custom_message=f"Unclosed '(' in call to function '{ident_tok.value}()' — expected ')'.",
                    hint=f"Add a closing ')' to complete the '{ident_tok.value}(...)' function call."
                )
                return FuncCallNode(ident_tok.value, args, ident_tok.line, ident_tok.column)

            return VarNode(ident_tok.value, ident_tok.line, ident_tok.column)

        if token.type == "LPAREN":
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
            if self.current_token().type != "RPAREN":
                curr = self.current_token()
                raise ParseError(
                    f"Unclosed parenthesis '(' opened at line {open_tok.line}, col {open_tok.column} — expected ')'.",
                    curr.line,
                    curr.column,
                    source_line=self._get_line_text(curr.line),
                    hint="Add a matching closing parenthesis ')' at the end of the grouped sub-expression."
                )
            self.consume("RPAREN")
            return expr

        # Diagnostic messages for common format errors
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
# 6. TREE-WALK INTERPRETER
# ============================================================================

class Interpreter:
    """
    Tree-walking interpreter that evaluates PLang AST nodes, maintains the
    runtime variable symbol table, enforces integer/float precision, and traps
    runtime arithmetic errors.

    Class Variables:
        BUILT_IN_CONSTANTS (dict[str, float]): Read-only mathematical constants pre-loaded in scope.
        MAX_EXPONENT_MAGNITUDE (int): Maximum safe exponent magnitude to prevent CPU/memory hangs.

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

    def __init__(self, config=None, source_code=""):
        self.variables = {}
        self.config = config or {}
        self.source_lines = source_code.splitlines() if source_code else []
        self.history = []

    def set_source_code(self, source_code):
        """Updates the stored source code lines for accurate error reporting in REPL or file runs."""
        self.source_lines = source_code.splitlines() if source_code else []

    def _get_line_text(self, line_num):
        """Retrieves the 1-based source line string if available."""
        if 1 <= line_num <= len(self.source_lines):
            return self.source_lines[line_num - 1]
        return None

    def evaluate_statement(self, stmt):
        """
        Executes a single top-level AST statement node.

        Args:
            stmt (ASTNode): Parsed statement node (`PrintNode`, `ClearNode`, `VarsNode`, `AssignNode`, or expression).

        Returns:
            int | float | None: The evaluated numeric value for standalone expressions, or `None` for command statements.
        """
        if isinstance(stmt, PrintNode):
            val = self.evaluate_expr(stmt.expr)
            self.variables["ans"] = val
            prefix = self.config.get("print_prefix", "[OUT] => ")
            print(f"{prefix}{val}")
            self.history.append({"type": "print", "value": val})
            return None

        if isinstance(stmt, ClearNode):
            self.variables.clear()
            self.history.append({"type": "clear"})
            return None

        if isinstance(stmt, VarsNode):
            self._print_symbol_table()
            self.history.append({"type": "vars"})
            return None

        if isinstance(stmt, AssignNode):
            if stmt.name in self.BUILT_IN_CONSTANTS:
                raise InterpreterError(
                    "argument_error",
                    stmt.line,
                    stmt.col,
                    detail=f"Cannot reassign built-in mathematical constant '{stmt.name}'.",
                    source_line=self._get_line_text(stmt.line),
                    hint=f"'{stmt.name}' is a constant ({self.BUILT_IN_CONSTANTS[stmt.name]}). Choose a different variable name."
                )

            rhs_val = self.evaluate_expr(stmt.expr)

            if stmt.op == "=":
                final_val = rhs_val
            else:
                if stmt.name not in self.variables:
                    raise InterpreterError(
                        "undefined_variable",
                        stmt.line,
                        stmt.col,
                        var_name=stmt.name,
                        source_line=self._get_line_text(stmt.line),
                        hint=f"Initialize '{stmt.name}' with 'let {stmt.name} = ...' before using '{stmt.op}'."
                    )
                current_val = self.variables[stmt.name]
                op_map = {"+=": "add", "-=": "sub", "*=": "mul", "/=": "div"}
                final_val = self._apply_binary_op(
                    op_map[stmt.op], current_val, rhs_val, stmt.line, stmt.col
                )

            self.variables[stmt.name] = final_val
            self.variables["ans"] = final_val
            self.history.append({"type": "assign", "name": stmt.name, "value": final_val})
            return None

        # Standalone expression statement
        val = self.evaluate_expr(stmt)
        self.variables["ans"] = val
        self.history.append({"type": "expr", "value": val})
        return val

    def _print_symbol_table(self):
        """Prints a formatted table of all variables currently bound in the interpreter environment."""
        if not self.variables:
            print("  [Symbol Table] Environment is empty (no variables defined).")
            return

        print("  +----------------------+------------+----------------------+")
        print("  | Variable Identifier  | Data Type  | Current Value        |")
        print("  +----------------------+------------+----------------------+")
        for name, val in self.variables.items():
            dtype = "integer" if isinstance(val, int) else "float"
            print(f"  | {name:<20} | {dtype:<10} | {str(val):<20} |")
        print("  +----------------------+------------+----------------------+")

    def evaluate_expr(self, node):
        """
        Recursively evaluates an expression AST node and returns its numeric result (`int` or `float`).
        """
        if isinstance(node, NumberNode):
            return node.value

        if isinstance(node, VarNode):
            if node.name in self.variables:
                return self.variables[node.name]
            if node.name in self.BUILT_IN_CONSTANTS:
                return self.BUILT_IN_CONSTANTS[node.name]
            raise InterpreterError(
                "undefined_variable",
                node.line,
                node.col,
                var_name=node.name,
                source_line=self._get_line_text(node.line),
                hint=f"Define '{node.name}' first using: let {node.name} = <value>"
            )

        if isinstance(node, UnaryOpNode):
            val = self.evaluate_expr(node.expr)
            if node.op == "sub":
                return -val
            if node.op == "add":
                return +val
            raise InterpreterError(
                f"Unknown unary operator: {node.op}",
                node.line,
                node.col,
                source_line=self._get_line_text(node.line)
            )

        if isinstance(node, FuncCallNode):
            return self._evaluate_function(node)

        if isinstance(node, BinOpNode):
            left_val = self.evaluate_expr(node.left)
            right_val = self.evaluate_expr(node.right)
            return self._apply_binary_op(node.op, left_val, right_val, node.line, node.col)

        raise InterpreterError(f"Unknown AST node: {type(node).__name__}", 0, 0)

    def _evaluate_function(self, node):
        """Evaluates built-in mathematical functions (`abs`, `sqrt`, `min`, `max`, `round`, `int`, `float`)."""
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

        eval_args = [self.evaluate_expr(arg) for arg in node.args]

        if fname in ("abs", "sqrt", "round", "int", "float"):
            if len(eval_args) != 1:
                raise InterpreterError(
                    "argument_error",
                    node.line,
                    node.col,
                    detail=f"Function '{fname}()' expects exactly 1 argument, but got {len(eval_args)}.",
                    source_line=self._get_line_text(node.line),
                    hint=f"Call '{fname}(x)' with a single numeric expression."
                )
            arg = eval_args[0]
            if fname == "abs":
                return abs(arg)
            if fname == "round":
                return int(round(arg))
            if fname == "int":
                return int(arg)
            if fname == "float":
                return float(arg)
            if fname == "sqrt":
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
                return int(res) if res.is_integer() and isinstance(arg, int) else res

        if fname in ("min", "max"):
            if len(eval_args) < 2:
                raise InterpreterError(
                    "argument_error",
                    node.line,
                    node.col,
                    detail=f"Function '{fname}()' requires at least 2 arguments, got {len(eval_args)}.",
                    source_line=self._get_line_text(node.line),
                    hint=f"Call '{fname}(a, b)' with two or more comma-separated arguments."
                )
            return min(eval_args) if fname == "min" else max(eval_args)

        raise InterpreterError("type_error", node.line, node.col)

    def _apply_binary_op(self, op, left_val, right_val, line, col):
        """Applies a validated binary arithmetic operator to `left_val` and `right_val`."""
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

        if op == "add":
            return left_val + right_val
        if op == "sub":
            return left_val - right_val
        if op == "mul":
            return left_val * right_val

        if op == "div":
            if right_val == 0:
                raise InterpreterError(
                    "divide_by_zero",
                    line,
                    col,
                    source_line=self._get_line_text(line),
                    hint="Division by zero is undefined. Ensure the divisor expression evaluates to a non-zero number."
                )
            return left_val / right_val

        if op == "idiv":
            if right_val == 0:
                raise InterpreterError(
                    "divide_by_zero",
                    line,
                    col,
                    source_line=self._get_line_text(line),
                    hint="Integer division by zero is undefined. Ensure the divisor is non-zero."
                )
            res = left_val // right_val
            return int(res) if isinstance(left_val, int) and isinstance(right_val, int) else res

        if op == "mod":
            if right_val == 0:
                raise InterpreterError(
                    "divide_by_zero",
                    line,
                    col,
                    source_line=self._get_line_text(line),
                    hint="Modulo by zero is undefined. Ensure the right-hand operand of '%' is non-zero."
                )
            return left_val % right_val

        if op == "pow":
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
                res = left_val ** right_val
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
            except ZeroDivisionError:
                raise InterpreterError(
                    "divide_by_zero",
                    line,
                    col,
                    source_line=self._get_line_text(line)
                )
            except OverflowError:
                raise InterpreterError(
                    "overflow_error",
                    line,
                    col,
                    source_line=self._get_line_text(line)
                )

        raise InterpreterError(f"Unknown binary operator: {op}", line, col)


# ============================================================================
# 7. AST VISUALIZER & DIAGNOSTIC ERROR FORMATTER
# ============================================================================

def format_ast(node, indent="", is_last=True):
    """
    Renders an AST node or statement tree as a clean ASCII hierarchy for
    educational inspection and debugging (`--ast` flag or `ast` REPL command).

    Args:
        node (ASTNode): Root AST node to format.
        indent (str): Current indentation prefix string.
        is_last (bool): Whether `node` is the last child of its parent node.

    Returns:
        str: Multi-line ASCII tree representation of the AST.
    """
    branch = "└── " if is_last else "├── "
    child_indent = indent + ("    " if is_last else "│   ")

    if isinstance(node, NumberNode):
        dtype = "int" if isinstance(node.value, int) else "float"
        return f"{indent}{branch}NumberNode({node.value} : {dtype})"

    if isinstance(node, VarNode):
        return f"{indent}{branch}VarNode('{node.name}')"

    if isinstance(node, ClearNode):
        return f"{indent}{branch}ClearNode()"

    if isinstance(node, VarsNode):
        return f"{indent}{branch}VarsNode()"

    if isinstance(node, UnaryOpNode):
        lines = [f"{indent}{branch}UnaryOpNode({node.op.upper()})"]
        lines.append(format_ast(node.expr, child_indent, True))
        return "\n".join(lines)

    if isinstance(node, BinOpNode):
        sym = BinOpNode.OP_SYMBOLS.get(node.op, node.op)
        lines = [f"{indent}{branch}BinOpNode({node.op.upper()} '{sym}')"]
        lines.append(format_ast(node.left, child_indent, False))
        lines.append(format_ast(node.right, child_indent, True))
        return "\n".join(lines)

    if isinstance(node, FuncCallNode):
        lines = [f"{indent}{branch}FuncCallNode('{node.func_name}')"]
        for i, arg in enumerate(node.args):
            lines.append(format_ast(arg, child_indent, i == len(node.args) - 1))
        return "\n".join(lines)

    if isinstance(node, AssignNode):
        lines = [f"{indent}{branch}AssignNode('{node.name}' {node.op})"]
        lines.append(format_ast(node.expr, child_indent, True))
        return "\n".join(lines)

    if isinstance(node, PrintNode):
        lines = [f"{indent}{branch}PrintNode"]
        lines.append(format_ast(node.expr, child_indent, True))
        return "\n".join(lines)

    return f"{indent}{branch}{type(node).__name__}"


def format_error(error, config=None):
    """
    Formats any `PlangError` into a clear, readable diagnostic report complete
    with line/column coordinates, source line snippet, visual caret (`^`) pointer,
    and corrective hint.

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

    line = error.line if error.line is not None else 1
    col = error.column if error.column is not None else 1

    if isinstance(error, LexerError):
        template = errors_config.get(
            "lexer_error",
            "[Lexical Error] Line {line}, Col {col}: {message}"
        )
        header = template.format(char=error.char, message=error.message, line=line, col=col)

    elif isinstance(error, ParseError):
        template = errors_config.get(
            "parse_error",
            "[Syntax Error] Line {line}, Col {col}: {message}"
        )
        header = template.format(message=error.message, line=line, col=col)

    elif isinstance(error, InterpreterError):
        err_key = error.message
        if err_key == "divide_by_zero":
            template = errors_config.get(
                "divide_by_zero",
                "[Runtime Error] Line {line}, Col {col}: Division or modulo by zero is undefined."
            )
            header = template.format(line=line, col=col)
        elif err_key == "undefined_variable":
            template = errors_config.get(
                "undefined_variable",
                "[Runtime Error] Line {line}, Col {col}: Variable '{name}' is not defined before use."
            )
            header = template.format(name=error.var_name, line=line, col=col)
        elif err_key == "negative_sqrt":
            template = errors_config.get(
                "negative_sqrt",
                "[Runtime Error] Line {line}, Col {col}: Cannot compute real square root of negative number ({value})."
            )
            header = template.format(value=error.detail or "negative", line=line, col=col)
        elif err_key == "overflow_error":
            template = errors_config.get(
                "overflow_error",
                "[Runtime Error] Line {line}, Col {col}: Numeric overflow — expression result exceeds safe computation limits."
            )
            header = template.format(line=line, col=col)
        elif err_key == "argument_error":
            template = errors_config.get(
                "argument_error",
                "[Runtime Error] Line {line}, Col {col}: {message}"
            )
            header = template.format(message=error.detail or error.message, line=line, col=col)
        else:
            template = errors_config.get(
                "type_error",
                "[Runtime Error] Line {line}, Col {col}: Invalid operand types for arithmetic operation."
            )
            header = template.format(line=line, col=col)
    else:
        header = f"[{error.CATEGORY}] Line {line}, Col {col}: {error.message}"

    output_lines = [header]

    # Attach visual source line and caret pointer (`^`) if source line is available
    if error.source_line is not None and error.source_line.strip() != "":
        line_label = f"  {line} | "
        caret_offset = max(0, col - 1)
        caret_line = " " * len(line_label) + (" " * caret_offset) + "^"
        output_lines.append(f"{line_label}{error.source_line}")
        output_lines.append(caret_line)

    if error.hint:
        output_lines.append(f"  Hint: {error.hint}")

    return "\n".join(output_lines)
