/**
 * PLang Core Language Engine in JavaScript (interpreter.js)
 * =========================================================
 * Course: CMPSC 132 — Programming Languages (1st Semester, A.Y. 2025-2026)
 *
 * Implements the lexical analyzer (tokenizer), recursive-descent parser,
 * polymorphic Abstract Syntax Tree (AST) node classes, table-driven interpreter,
 * and diagnostic error formatter for the PLang Web IDE.
 *
 * Architectural Highlight (Zero `if-else` & Zero Nested `if` Design):
 *   1. Polymorphic AST & Exception Dispatch: Each `ASTNode` subclass implements
 *      `.evaluate()` and `.execute()`, and each `PlangError` subclass implements
 *      `.formatHeader()`.
 *   2. Dictionary Dispatch Tables: Token handlers, statement parsers, primary
 *      parsers, arithmetic operators, and built-in functions use O(1) object maps.
 *   3. Flat Guard Clauses: Validation checks immediately `return` or `throw`
 *      with zero `else` branches and zero nested `if` blocks.
 */

// ============================================================================
// 1. POLYMORPHIC EXCEPTION HIERARCHY
// ============================================================================

/**
 * Base exception class for all PLang compilation and runtime errors.
 *
 * Class Variables (Static Properties):
 *   @property {string} CATEGORY - Human-readable error category ('PLang Error').
 *   @property {string} DEFAULT_HINT - Default corrective hint for the user.
 *
 * Instance Properties:
 *   @property {string} message - Detailed description of the error condition.
 *   @property {number|null} line - 1-based source line number where the error occurred.
 *   @property {number|null} column - 1-based source column number where the error occurred.
 *   @property {string|null} sourceLine - Raw source line text for visual caret rendering.
 *   @property {string} hint - Actionable suggestion to resolve the error.
 */
export class PlangError extends Error {
  static CATEGORY = "PLang Error";
  static DEFAULT_HINT = "Review the syntax and operand types at the indicated position.";

  constructor(message, line = null, column = null, sourceLine = null, hint = null) {
    super(message);
    this.name = "PlangError";
    this.line = line;
    this.column = column;
    this.sourceLine = sourceLine;
    this.hint = hint || this.constructor.DEFAULT_HINT;
  }

  formatHeader(line, col) {
    return `[${this.constructor.CATEGORY}] Line ${line}, Col ${col}: ${this.message}`;
  }
}

/**
 * Exception raised by the lexical analyzer on unrecognized characters or malformed tokens.
 *
 * Class Variables (Static Properties):
 *   @property {string} CATEGORY - Error category label ('Lexical Error').
 *   @property {string} DEFAULT_HINT - Default hint explaining valid PLang tokens.
 *
 * Instance Properties:
 *   @property {string} char - The offending character or lexeme substring.
 *   @property {number} line - 1-based line number.
 *   @property {number} column - 1-based column number.
 */
export class LexerError extends PlangError {
  static CATEGORY = "Lexical Error";
  static DEFAULT_HINT =
    "Use valid numbers (e.g., 42, 3.14), identifiers starting with a letter/underscore, and supported operators (+, -, *, /, //, %, ^, =).";

  constructor(char, line, column, message = null, sourceLine = null, hint = null) {
    super(message || `Unexpected character '${char}'`, line, column, sourceLine, hint);
    this.name = "LexerError";
    this.char = char;
  }
}

/**
 * Exception raised by the recursive-descent parser when grammar rules are violated.
 *
 * Class Variables (Static Properties):
 *   @property {string} CATEGORY - Error category label ('Syntax Error').
 *   @property {string} DEFAULT_HINT - Default hint for grammatical format errors.
 */
export class ParseError extends PlangError {
  static CATEGORY = "Syntax Error";
  static DEFAULT_HINT =
    "Ensure every binary operator has a valid left and right operand, parentheses are balanced, and assignments follow 'let name = expression'.";

  constructor(message, line = null, column = null, sourceLine = null, hint = null) {
    super(message, line, column, sourceLine, hint);
    this.name = "ParseError";
  }
}

/**
 * Exception raised during AST evaluation when a runtime error occurs.
 *
 * Class Variables (Static Properties):
 *   @property {string} CATEGORY - Error category label ('Runtime Error').
 *   @property {string} DEFAULT_HINT - Default hint for runtime arithmetic errors.
 *   @property {Object<string, function>} HEADER_FORMATTERS - Dispatch table formatting runtime error headers.
 *
 * Instance Properties:
 *   @property {string|null} varName - Undefined variable identifier if applicable.
 *   @property {string|null} detail - Additional diagnostic context.
 */
export class InterpreterError extends PlangError {
  static CATEGORY = "Runtime Error";
  static DEFAULT_HINT = "Verify that all variables are defined before use and divisors are non-zero.";
  static HEADER_FORMATTERS = {
    divide_by_zero: (err, line, col) =>
      `[Runtime Error] Line ${line}, Col ${col}: Division or modulo by zero is undefined.`,
    undefined_variable: (err, line, col) =>
      `[Runtime Error] Line ${line}, Col ${col}: Variable '${err.varName || "unknown"}' is not defined before use.`,
    negative_sqrt: (err, line, col) =>
      `[Runtime Error] Line ${line}, Col ${col}: Cannot compute real square root of negative number (${err.detail}).`,
    overflow_error: (err, line, col) =>
      `[Runtime Error] Line ${line}, Col ${col}: Numeric overflow — expression result exceeds safe computation limits.`,
    argument_error: (err, line, col) =>
      `[Runtime Error] Line ${line}, Col ${col}: ${err.detail || err.message}`,
    type_error: (err, line, col) =>
      `[Runtime Error] Line ${line}, Col ${col}: Invalid operand types for arithmetic operation.`
  };

  constructor(
    message,
    line = null,
    column = null,
    varName = null,
    detail = null,
    sourceLine = null,
    hint = null
  ) {
    super(message, line, column, sourceLine, hint);
    this.name = "InterpreterError";
    this.varName = varName;
    this.detail = detail;
  }

  formatHeader(line, col) {
    const formatter =
      InterpreterError.HEADER_FORMATTERS[this.message] ||
      InterpreterError.HEADER_FORMATTERS.type_error;
    return formatter(this, line, col);
  }
}

// ============================================================================
// 2. LEXICAL TOKEN CLASS
// ============================================================================

/**
 * Represents a single lexical token produced by `tokenize()`.
 *
 * Class Variables (Static Properties):
 *   @property {string[]} BINARY_OP_TYPES - Token types representing binary arithmetic operators.
 *   @property {string[]} ASSIGN_OP_TYPES - Token types representing assignment operators.
 *   @property {string[]} STATEMENT_KW_TYPES - Token types representing statement keywords.
 *
 * Instance Properties:
 *   @property {string} type - Categorical token type identifier.
 *   @property {string} value - Raw substring matched from source code.
 *   @property {number} line - 1-based line number.
 *   @property {number} column - 1-based column number.
 */
export class Token {
  static BINARY_OP_TYPES = ["ADD", "SUB", "MUL", "DIV", "IDIV", "MOD", "POW"];
  static ASSIGN_OP_TYPES = ["ASSIGN", "ADD_ASSIGN", "SUB_ASSIGN", "MUL_ASSIGN", "DIV_ASSIGN"];
  static STATEMENT_KW_TYPES = ["LET", "PRINT", "CLEAR", "VARS"];

  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}

// ============================================================================
// 3. POLYMORPHIC ABSTRACT SYNTAX TREE (AST) NODES
// ============================================================================

/**
 * Base class for all PLang Abstract Syntax Tree (AST) nodes.
 *
 * Class Variables (Static Properties):
 *   @property {string} NODE_CATEGORY - High-level classification of the AST node.
 *
 * Instance Properties:
 *   @property {number} line - 1-based source line number.
 *   @property {number} col - 1-based source column number.
 */
export class ASTNode {
  static NODE_CATEGORY = "Base";

  constructor(line, col) {
    this.line = line;
    this.col = col;
  }

  evaluate(interpreter) {
    throw new InterpreterError("Unknown AST node", this.line, this.col);
  }

  execute(interpreter) {
    const val = this.evaluate(interpreter);
    interpreter.variables.ans = val;
    return val;
  }
}

export class NumberNode extends ASTNode {
  static NODE_CATEGORY = "Literal";

  constructor(value, line, col) {
    super(line, col);
    this.type = "NumberNode";
    this.value = value;
  }

  evaluate() {
    return this.value;
  }
}

export class VarNode extends ASTNode {
  static NODE_CATEGORY = "Identifier";

  constructor(name, line, col) {
    super(line, col);
    this.type = "VarNode";
    this.name = name;
  }

  evaluate(interpreter) {
    return interpreter.resolveVariable(this.name, this.line, this.col);
  }
}

export class UnaryOpNode extends ASTNode {
  static NODE_CATEGORY = "UnaryOperation";

  constructor(op, expr, line, col) {
    super(line, col);
    this.type = "UnaryOpNode";
    this.op = op;
    this.expr = expr;
  }

  evaluate(interpreter) {
    return interpreter.applyUnaryOp(this.op, this.expr.evaluate(interpreter), this.line, this.col);
  }
}

export class BinOpNode extends ASTNode {
  static NODE_CATEGORY = "BinaryOperation";

  constructor(op, left, right, line, col) {
    super(line, col);
    this.type = "BinOpNode";
    this.op = op;
    this.left = left;
    this.right = right;
  }

  evaluate(interpreter) {
    const leftVal = this.left.evaluate(interpreter);
    const rightVal = this.right.evaluate(interpreter);
    return interpreter.applyBinaryOp(this.op, leftVal, rightVal, this.line, this.col);
  }
}

export class FuncCallNode extends ASTNode {
  static NODE_CATEGORY = "FunctionCall";
  static SUPPORTED_FUNCTIONS = ["abs", "sqrt", "min", "max", "round", "int", "float"];

  constructor(funcName, args, line, col) {
    super(line, col);
    this.type = "FuncCallNode";
    this.funcName = funcName;
    this.args = args;
  }

  evaluate(interpreter) {
    return interpreter.evaluateFunction(this);
  }
}

export class AssignNode extends ASTNode {
  static NODE_CATEGORY = "AssignmentStatement";

  constructor(name, expr, line, col, op = "=") {
    super(line, col);
    this.type = "AssignNode";
    this.name = name;
    this.expr = expr;
    this.op = op;
  }

  execute(interpreter) {
    return interpreter.executeAssignment(this);
  }
}

export class PrintNode extends ASTNode {
  static NODE_CATEGORY = "PrintStatement";

  constructor(expr, line, col) {
    super(line, col);
    this.type = "PrintNode";
    this.expr = expr;
  }

  execute(interpreter) {
    const val = this.expr.evaluate(interpreter);
    interpreter.variables.ans = val;
    const prefix = interpreter.config?.print_prefix || "[OUT] => ";
    interpreter.outputs.push({ type: "print", text: `${prefix}${val}`, value: val });
    return null;
  }
}

export class ClearNode extends ASTNode {
  static NODE_CATEGORY = "ClearStatement";

  constructor(line, col) {
    super(line, col);
    this.type = "ClearNode";
  }

  execute(interpreter) {
    interpreter.variables = {};
    interpreter.outputs.push({ type: "clear", text: "[Symbol Table Cleared — Environment Reset]" });
    return null;
  }
}

export class VarsNode extends ASTNode {
  static NODE_CATEGORY = "VarsStatement";

  constructor(line, col) {
    super(line, col);
    this.type = "VarsNode";
  }

  execute(interpreter) {
    interpreter.recordVarsSnapshot();
    return null;
  }
}

// ============================================================================
// 4. TABLE-DRIVEN LEXICAL ANALYZER (TOKENIZER)
// ============================================================================

const RESERVED_KEYWORDS = new Set([
  "let", "print", "clear", "vars",
  "add", "sub", "mul", "div", "mod", "pow"
]);

const CANONICAL_TYPE_MAP = {
  ADD_KW: "ADD",
  SUB_KW: "SUB",
  MUL_KW: "MUL",
  IDIV_KW: "IDIV",
  MOD_KW: "MOD",
  POW_KW: "POW",
  POW_ALT: "POW"
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TOKEN_HANDLERS = {
  MALFORMED_FLOAT: (val, line, col, lineText) => {
    throw new LexerError(
      val,
      line,
      col,
      `Malformed numeric literal '${val}' (multiple decimal points).`,
      lineText,
      "A floating-point number may contain at most one decimal point (e.g., 3.14)."
    );
  },
  MALFORMED_IDENT: (val, line, col, lineText) => {
    throw new LexerError(
      val,
      line,
      col,
      `Invalid token '${val}' — identifiers cannot begin with a digit.`,
      lineText,
      `Rename the variable to start with a letter (e.g., 'var_${val}') or insert '*' for multiplication.`
    );
  },
  NEWLINE: (val, line, col, _lineText, matchEnd, tokens) => {
    tokens.push(new Token("NEWLINE", val, line, col));
    return { line: line + 1, lineStart: matchEnd };
  },
  SKIP: (_val, line, _col, _lineText, _matchEnd, _tokens, lineStart) => ({ line, lineStart }),
  COMMENT: (_val, line, _col, _lineText, _matchEnd, _tokens, lineStart) => ({ line, lineStart })
};

function createStandardTokenHandler(rawType) {
  const normType = CANONICAL_TYPE_MAP[rawType] || rawType;
  return (val, line, col, _lineText, _matchEnd, tokens, lineStart) => {
    tokens.push(new Token(normType, val, line, col));
    return { line, lineStart };
  };
}

export function tokenize(sourceCode, config = {}) {
  const commentPrefix = config?.comment_prefix || "#";
  const sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [""];
  const getSourceLine = (lineNum) => sourceLines[lineNum - 1] || "";

  const regexParts = [
    `(?<COMMENT>${escapeRegex(commentPrefix)}[^\\n]*)`,
    `(?<MALFORMED_FLOAT>\\d+\\.\\d*\\.\\d*)`,
    `(?<MALFORMED_IDENT>\\d+[a-zA-Z_][a-zA-Z0-9_]*)`,
    `(?<ADD_ASSIGN>${escapeRegex("+=")})`,
    `(?<SUB_ASSIGN>${escapeRegex("-=")})`,
    `(?<MUL_ASSIGN>${escapeRegex("*=")})`,
    `(?<DIV_ASSIGN>${escapeRegex("/=")})`,
    `(?<IDIV>${escapeRegex("//")})`,
    `(?<POW_ALT>${escapeRegex("**")})`,
    `(?<LET>\\blet\\b)`,
    `(?<PRINT>\\bprint\\b)`,
    `(?<CLEAR>\\bclear\\b)`,
    `(?<VARS>\\bvars\\b)`,
    `(?<ADD_KW>\\badd\\b)`,
    `(?<SUB_KW>\\bsub\\b)`,
    `(?<MUL_KW>\\bmul\\b)`,
    `(?<IDIV_KW>\\bdiv\\b)`,
    `(?<MOD_KW>\\bmod\\b)`,
    `(?<POW_KW>\\bpow\\b)`,
    `(?<ADD>${escapeRegex("+")})`,
    `(?<SUB>${escapeRegex("-")})`,
    `(?<MUL>${escapeRegex("*")})`,
    `(?<DIV>${escapeRegex("/")})`,
    `(?<MOD>${escapeRegex("%")})`,
    `(?<POW>${escapeRegex("^")})`,
    `(?<ASSIGN>${escapeRegex("=")})`,
    `(?<LPAREN>${escapeRegex("(")})`,
    `(?<RPAREN>${escapeRegex(")")})`,
    `(?<COMMA>${escapeRegex(",")})`,
    `(?<NUMBER>\\d+(?:\\.\\d+)?)`,
    `(?<IDENT>[a-zA-Z_][a-zA-Z0-9_]*)`,
    `(?<NEWLINE>\\n)`,
    `(?<SKIP>[ \\t\\r]+)`
  ];

  const masterRegex = new RegExp(regexParts.join("|"), "g");
  const tokens = [];
  let line = 1;
  let lineStart = 0;
  let pos = 0;

  while (pos < sourceCode.length) {
    masterRegex.lastIndex = pos;
    const match = masterRegex.exec(sourceCode);
    const col = pos - lineStart + 1;
    const currentLineText = getSourceLine(line);

    if (!match || match.index !== pos) {
      const badChar = sourceCode[pos];
      throw new LexerError(
        badChar,
        line,
        col,
        `Unrecognized character '${badChar}' in input.`,
        currentLineText,
        "Remove the invalid symbol. Supported operators are +, -, *, /, //, %, ^, and =."
      );
    }

    const matchedEntry = Object.entries(match.groups || {}).find(([, v]) => v !== undefined);
    const [rawType, tokenValue] = matchedEntry;
    const matchEnd = match.index + match[0].length;
    const handler = TOKEN_HANDLERS[rawType] || createStandardTokenHandler(rawType);
    const nextState = handler(
      tokenValue,
      line,
      col,
      currentLineText,
      matchEnd,
      tokens,
      lineStart
    );
    line = nextState.line;
    lineStart = nextState.lineStart;
    pos = matchEnd;
  }

  tokens.push(new Token("EOF", "", line, pos - lineStart + 1));
  return tokens;
}

// ============================================================================
// 5. TABLE-DRIVEN RECURSIVE-DESCENT PARSER
// ============================================================================

export class Parser {
  static COMPOUND_OP_MAP = {
    ASSIGN: "=",
    ADD_ASSIGN: "+=",
    SUB_ASSIGN: "-=",
    MUL_ASSIGN: "*=",
    DIV_ASSIGN: "/="
  };
  static UNARY_OP_MAP = {
    SUB: "sub",
    ADD: "add"
  };

  constructor(tokens, config = {}, sourceCode = "") {
    this.tokens = tokens;
    this.pos = 0;
    this.config = config;
    this.sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [];
    this.statementDispatch = {
      LET: () => this.parseLetStatement(),
      PRINT: () => this.parsePrintStatement(),
      CLEAR: () => this.parseClearStatement(),
      VARS: () => this.parseVarsStatement()
    };
    this.primaryDispatch = {
      NUMBER: () => this.parseNumberPrimary(),
      IDENT: () => this.parseIdentPrimary(),
      LPAREN: () => this.parseGroupedPrimary()
    };
  }

  getLineText(lineNum) {
    return this.sourceLines[lineNum - 1] || null;
  }

  currentToken() {
    return this.tokens[this.pos] || this.tokens[this.tokens.length - 1];
  }

  peekToken(offset = 1) {
    return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1];
  }

  displayTokenValue(token, eofLabel = "end of input") {
    if (token.type === "EOF") return eofLabel;
    return token.value;
  }

  consume(expectedType, customMessage = null, hint = null) {
    const token = this.currentToken();
    if (token.type === expectedType) {
      this.pos += 1;
      return token;
    }
    const shown = this.displayTokenValue(token, "end of input");
    throw new ParseError(
      customMessage || `Expected '${expectedType}', but found '{shown}'.`.replace("{shown}", shown),
      token.line,
      token.column,
      this.getLineText(token.line),
      hint
    );
  }

  skipNewlines() {
    while (this.currentToken().type === "NEWLINE") {
      this.consume("NEWLINE");
    }
  }

  verifyStatementBoundary() {
    const curr = this.currentToken();
    if (!["NEWLINE", "EOF"].includes(curr.type)) {
      this.raiseTrailingTokenError(curr);
    }
    this.skipNewlines();
  }

  parseProgram() {
    const statements = [];
    this.skipNewlines();

    while (this.currentToken().type !== "EOF") {
      statements.push(this.parseStatement());
      this.verifyStatementBoundary();
    }

    return statements;
  }

  raiseTrailingTokenError(token) {
    if (token.type === "RPAREN") {
      throw new ParseError(
        "Unmatched closing parenthesis ')' without a matching opening '('.",
        token.line,
        token.column,
        this.getLineText(token.line),
        "Remove the extra ')' or add a matching '(' earlier in the expression."
      );
    }
    if (Token.ASSIGN_OP_TYPES.includes(token.type)) {
      throw new ParseError(
        `Invalid assignment target before '${token.value}'. Left side of assignment must be a single variable name.`,
        token.line,
        token.column,
        this.getLineText(token.line),
        "Use 'let variable_name = expression' or 'variable_name = expression'."
      );
    }
    if (["NUMBER", "IDENT", "LPAREN"].includes(token.type)) {
      throw new ParseError(
        `Missing arithmetic operator before '${token.value}'.`,
        token.line,
        token.column,
        this.getLineText(token.line),
        `Insert an operator (such as +, -, *, /) before '${token.value}'.`
      );
    }
    throw new ParseError(
      `Unexpected token '${token.value}' after complete statement.`,
      token.line,
      token.column,
      this.getLineText(token.line)
    );
  }

  validateLetTarget(identTok) {
    if (identTok.type === "IDENT") return;
    if (RESERVED_KEYWORDS.has(identTok.value)) {
      throw new ParseError(
        `Cannot use reserved keyword '${identTok.value}' as a variable name.`,
        identTok.line,
        identTok.column,
        this.getLineText(identTok.line),
        "Choose a descriptive variable name that is not a reserved language keyword."
      );
    }
    const shown = this.displayTokenValue(identTok, "end of line");
    throw new ParseError(
      `Expected a variable name after 'let', but got '${shown}'.`,
      identTok.line,
      identTok.column,
      this.getLineText(identTok.line),
      "Syntax for variable declaration is: let <variable_name> = <expression>"
    );
  }

  parseLetStatement() {
    const letTok = this.consume("LET");
    const identTok = this.currentToken();
    this.validateLetTarget(identTok);
    this.consume("IDENT");

    const bad = this.currentToken();
    const shown = this.displayTokenValue(bad, "end of line");
    this.consume(
      "ASSIGN",
      `Expected '=' after variable '${identTok.value}' in 'let' declaration, got '${shown}'.`,
      `Write: let ${identTok.value} = <expression>`
    );
    const expr = this.parseExpr();
    return new AssignNode(identTok.value, expr, letTok.line, letTok.column, "=");
  }

  parsePrintStatement() {
    const token = this.consume("PRINT");
    if (["NEWLINE", "EOF"].includes(this.currentToken().type)) {
      throw new ParseError(
        "Missing expression after 'print' statement.",
        token.line,
        token.column,
        this.getLineText(token.line),
        "Provide a value or expression to print, e.g., 'print 10 + 5' or 'print x'."
      );
    }
    return new PrintNode(this.parseExpr(), token.line, token.column);
  }

  parseClearStatement() {
    const token = this.consume("CLEAR");
    return new ClearNode(token.line, token.column);
  }

  parseVarsStatement() {
    const token = this.consume("VARS");
    return new VarsNode(token.line, token.column);
  }

  parseAssignmentStatement() {
    const identTok = this.consume("IDENT");
    const opTok = this.consume(this.currentToken().type);
    const opSymbol = Parser.COMPOUND_OP_MAP[opTok.type];
    const expr = this.parseExpr();
    return new AssignNode(identTok.value, expr, identTok.line, identTok.column, opSymbol);
  }

  parseStatement() {
    const token = this.currentToken();

    if (this.statementDispatch[token.type]) {
      return this.statementDispatch[token.type]();
    }

    if (token.type === "IDENT" && Parser.COMPOUND_OP_MAP[this.peekToken().type]) {
      return this.parseAssignmentStatement();
    }

    if (Token.STATEMENT_KW_TYPES.includes(token.type) && Parser.COMPOUND_OP_MAP[this.peekToken().type]) {
      throw new ParseError(
        `Cannot assign to reserved keyword '${token.value}'.`,
        token.line,
        token.column,
        this.getLineText(token.line),
        "Choose a non-reserved identifier name for your variable."
      );
    }

    const expr = this.parseExpr();
    if (Parser.COMPOUND_OP_MAP[this.currentToken().type]) {
      const bad = this.currentToken();
      throw new ParseError(
        `Invalid assignment target before '${bad.value}'. Cannot assign a value to a literal or expression.`,
        bad.line,
        bad.column,
        this.getLineText(bad.line),
        "Place a single variable identifier on the left side of '=' (e.g., 'let x = 10')."
      );
    }
    return expr;
  }

  parseExpr() {
    let node = this.parseTerm();
    while (["ADD", "SUB"].includes(this.currentToken().type)) {
      const opToken = this.consume(this.currentToken().type);
      const right = this.parseTerm();
      node = new BinOpNode(opToken.type.toLowerCase(), node, right, opToken.line, opToken.column);
    }
    return node;
  }

  parseTerm() {
    let node = this.parseExponent();
    while (["MUL", "DIV", "IDIV", "MOD"].includes(this.currentToken().type)) {
      const opToken = this.consume(this.currentToken().type);
      const right = this.parseExponent();
      node = new BinOpNode(opToken.type.toLowerCase(), node, right, opToken.line, opToken.column);
    }
    return node;
  }

  parseExponent() {
    const node = this.parseUnary();
    if (this.currentToken().type === "POW") {
      const opToken = this.consume("POW");
      const right = this.parseExponent();
      return new BinOpNode("pow", node, right, opToken.line, opToken.column);
    }
    return node;
  }

  parseUnary() {
    const token = this.currentToken();
    if (Parser.UNARY_OP_MAP[token.type]) {
      const opToken = this.consume(token.type);
      return new UnaryOpNode(
        Parser.UNARY_OP_MAP[token.type],
        this.parseUnary(),
        opToken.line,
        opToken.column
      );
    }
    return this.parsePrimary();
  }

  parseNumberPrimary() {
    const token = this.consume("NUMBER");
    const val = Number(token.value);
    return new NumberNode(val, token.line, token.column);
  }

  parseArgumentList() {
    if (this.currentToken().type === "RPAREN") return [];
    const args = [this.parseExpr()];
    while (this.currentToken().type === "COMMA") {
      this.consume("COMMA");
      args.push(this.parseExpr());
    }
    return args;
  }

  parseFunctionCall(identTok) {
    this.consume("LPAREN");
    const args = this.parseArgumentList();
    this.consume(
      "RPAREN",
      `Unclosed '(' in call to function '${identTok.value}()' — expected ')'.`,
      `Add a closing ')' to complete the '${identTok.value}(...)' function call.`
    );
    return new FuncCallNode(identTok.value, args, identTok.line, identTok.column);
  }

  parseIdentPrimary() {
    const identTok = this.consume("IDENT");
    if (this.currentToken().type === "LPAREN") {
      return this.parseFunctionCall(identTok);
    }
    return new VarNode(identTok.value, identTok.line, identTok.column);
  }

  parseGroupedPrimary() {
    const openTok = this.consume("LPAREN");
    if (this.currentToken().type === "RPAREN") {
      throw new ParseError(
        "Empty parentheses '()' do not contain an expression.",
        openTok.line,
        openTok.column,
        this.getLineText(openTok.line),
        "Place a valid arithmetic expression inside the parentheses, e.g., '(10 + 5)'."
      );
    }
    const expr = this.parseExpr();
    this.consume(
      "RPAREN",
      `Unclosed parenthesis '(' opened at line ${openTok.line}, col ${openTok.column} — expected ')'.`,
      "Add a matching closing parenthesis ')' at the end of the grouped sub-expression."
    );
    return expr;
  }

  parsePrimary() {
    const token = this.currentToken();

    if (this.primaryDispatch[token.type]) {
      return this.primaryDispatch[token.type]();
    }

    if (["NEWLINE", "EOF"].includes(token.type)) {
      throw new ParseError(
        "Incomplete expression — expected a number, variable, or '(' before end of line.",
        token.line,
        token.column,
        this.getLineText(token.line),
        "Complete the expression by supplying the missing right-hand operand."
      );
    }

    if (Token.BINARY_OP_TYPES.includes(token.type)) {
      throw new ParseError(
        `Unexpected operator '${token.value}' — missing operand before '${token.value}'.`,
        token.line,
        token.column,
        this.getLineText(token.line),
        `Binary operator '${token.value}' requires a value on both its left and right sides.`
      );
    }

    if (token.type === "RPAREN") {
      throw new ParseError(
        "Unexpected closing parenthesis ')' with no matching opening '('.",
        token.line,
        token.column,
        this.getLineText(token.line),
        "Check your parentheses balance and remove the extra ')'."
      );
    }

    throw new ParseError(
      `Unexpected token '${token.value}' in arithmetic expression.`,
      token.line,
      token.column,
      this.getLineText(token.line)
    );
  }
}

// ============================================================================
// 6. TABLE-DRIVEN INTERPRETER
// ============================================================================

export class Interpreter {
  static BUILT_IN_CONSTANTS = {
    PI: Math.PI,
    E: Math.E
  };
  static MAX_EXPONENT_MAGNITUDE = 10000;
  static UNARY_FUNCTIONS = {
    add: (v) => +v,
    sub: (v) => -v
  };
  static COMPOUND_BINARY_OP_MAP = {
    "+=": "add",
    "-=": "sub",
    "*=": "mul",
    "/=": "div"
  };

  constructor(config = {}, initialVars = {}, sourceCode = "") {
    this.variables = { ...initialVars };
    this.config = config;
    this.outputs = [];
    this.sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [];
    this.binaryOpDispatch = {
      add: (a, b) => a + b,
      sub: (a, b) => a - b,
      mul: (a, b) => a * b,
      div: (a, b, line, col) => this.opTrueDiv(a, b, line, col),
      idiv: (a, b, line, col) => this.opFloorDiv(a, b, line, col),
      mod: (a, b, line, col) => this.opModulo(a, b, line, col),
      pow: (a, b, line, col) => this.opPower(a, b, line, col)
    };
    this.singleArgFuncs = {
      abs: (x) => Math.abs(x),
      round: (x) => Math.round(x),
      int: (x) => Math.trunc(x),
      float: (x) => Number(x),
      sqrt: (x, node) => this.evalSqrt(x, node)
    };
    this.variadicFuncs = {
      min: (args) => Math.min(...args),
      max: (args) => Math.max(...args)
    };
  }

  getLineText(lineNum) {
    return this.sourceLines[lineNum - 1] || null;
  }

  evaluateStatement(stmt) {
    return stmt.execute(this);
  }

  evaluateExpr(node) {
    return node.evaluate(this);
  }

  recordVarsSnapshot() {
    const entries = Object.entries(this.variables);
    if (entries.length === 0) {
      this.outputs.push({ type: "clear", text: "[Symbol Table] Environment is empty." });
      return;
    }
    const typeLabels = { true: "int", false: "float" };
    const summary = entries
      .map(([k, v]) => `${k} (${typeLabels[Number.isInteger(v)]}) = ${v}`)
      .join("  |  ");
    this.outputs.push({ type: "print", text: `[Symbol Table] ${summary}` });
  }

  resolveVariable(name, line, col) {
    if (name in this.variables) return this.variables[name];
    if (name in Interpreter.BUILT_IN_CONSTANTS) return Interpreter.BUILT_IN_CONSTANTS[name];
    throw new InterpreterError(
      "undefined_variable",
      line,
      col,
      name,
      null,
      this.getLineText(line),
      `Define '${name}' first using: let ${name} = <value>`
    );
  }

  applyUnaryOp(op, val, line, col) {
    if (!Interpreter.UNARY_FUNCTIONS[op]) {
      throw new InterpreterError(`Unknown unary operator: ${op}`, line, col);
    }
    return Interpreter.UNARY_FUNCTIONS[op](val);
  }

  computeAssignedValue(stmt, rhsVal) {
    if (stmt.op === "=") return rhsVal;
    if (!(stmt.name in this.variables)) {
      throw new InterpreterError(
        "undefined_variable",
        stmt.line,
        stmt.col,
        stmt.name,
        null,
        this.getLineText(stmt.line),
        `Initialize '${stmt.name}' with 'let ${stmt.name} = ...' before using '${stmt.op}'.`
      );
    }
    const mappedOp = Interpreter.COMPOUND_BINARY_OP_MAP[stmt.op];
    return this.applyBinaryOp(mappedOp, this.variables[stmt.name], rhsVal, stmt.line, stmt.col);
  }

  executeAssignment(stmt) {
    if (stmt.name in Interpreter.BUILT_IN_CONSTANTS) {
      throw new InterpreterError(
        "argument_error",
        stmt.line,
        stmt.col,
        null,
        `Cannot reassign built-in mathematical constant '${stmt.name}'.`,
        this.getLineText(stmt.line),
        `'${stmt.name}' is a constant. Choose a different variable name.`
      );
    }

    const rhsVal = stmt.expr.evaluate(this);
    const finalVal = this.computeAssignedValue(stmt, rhsVal);
    this.variables[stmt.name] = finalVal;
    this.variables.ans = finalVal;
    return null;
  }

  evalSqrt(arg, node) {
    if (arg < 0) {
      throw new InterpreterError(
        "negative_sqrt",
        node.line,
        node.col,
        null,
        String(arg),
        this.getLineText(node.line),
        "Pass a non-negative number (>= 0) to sqrt()."
      );
    }
    return Math.sqrt(arg);
  }

  evalSingleArgFunction(fname, evalArgs, node) {
    if (evalArgs.length !== 1) {
      throw new InterpreterError(
        "argument_error",
        node.line,
        node.col,
        null,
        `Function '${fname}()' expects 1 argument, but got ${evalArgs.length}.`,
        this.getLineText(node.line)
      );
    }
    return this.singleArgFuncs[fname](evalArgs[0], node);
  }

  evalVariadicFunction(fname, evalArgs, node) {
    if (evalArgs.length < 2) {
      throw new InterpreterError(
        "argument_error",
        node.line,
        node.col,
        null,
        `Function '${fname}()' requires at least 2 arguments, got ${evalArgs.length}.`,
        this.getLineText(node.line)
      );
    }
    return this.variadicFuncs[fname](evalArgs);
  }

  evaluateFunction(node) {
    const fname = node.funcName;
    if (!FuncCallNode.SUPPORTED_FUNCTIONS.includes(fname)) {
      throw new InterpreterError(
        "argument_error",
        node.line,
        node.col,
        null,
        `Unknown function '${fname}()'. Supported: ${FuncCallNode.SUPPORTED_FUNCTIONS.join(", ")}.`,
        this.getLineText(node.line)
      );
    }

    const evalArgs = node.args.map((arg) => arg.evaluate(this));
    if (this.singleArgFuncs[fname]) {
      return this.evalSingleArgFunction(fname, evalArgs, node);
    }
    return this.evalVariadicFunction(fname, evalArgs, node);
  }

  requireNonZero(rightVal, line, col, hint) {
    if (rightVal === 0) {
      throw new InterpreterError(
        "divide_by_zero",
        line,
        col,
        null,
        null,
        this.getLineText(line),
        hint
      );
    }
  }

  opTrueDiv(leftVal, rightVal, line, col) {
    this.requireNonZero(
      rightVal,
      line,
      col,
      "Division by zero is undefined. Ensure the divisor is non-zero."
    );
    return leftVal / rightVal;
  }

  opFloorDiv(leftVal, rightVal, line, col) {
    this.requireNonZero(
      rightVal,
      line,
      col,
      "Integer division by zero is undefined. Ensure the divisor is non-zero."
    );
    return Math.floor(leftVal / rightVal);
  }

  opModulo(leftVal, rightVal, line, col) {
    this.requireNonZero(
      rightVal,
      line,
      col,
      "Modulo by zero is undefined. Ensure the right-hand operand of '%' is non-zero."
    );
    return ((leftVal % rightVal) + rightVal) % rightVal;
  }

  opPower(leftVal, rightVal, line, col) {
    if (leftVal === 0 && rightVal < 0) {
      throw new InterpreterError(
        "divide_by_zero",
        line,
        col,
        null,
        null,
        this.getLineText(line),
        "Zero cannot be raised to a negative power."
      );
    }
    if (Math.abs(rightVal) > Interpreter.MAX_EXPONENT_MAGNITUDE && Math.abs(leftVal) > 1) {
      throw new InterpreterError(
        "overflow_error",
        line,
        col,
        null,
        null,
        this.getLineText(line),
        `Keep exponent magnitude <= ${Interpreter.MAX_EXPONENT_MAGNITUDE}.`
      );
    }
    const res = Math.pow(leftVal, rightVal);
    if (!Number.isFinite(res)) {
      throw new InterpreterError("overflow_error", line, col, null, null, this.getLineText(line));
    }
    return res;
  }

  applyBinaryOp(op, leftVal, rightVal, line, col) {
    if (
      typeof leftVal !== "number" ||
      typeof rightVal !== "number" ||
      Number.isNaN(leftVal) ||
      Number.isNaN(rightVal)
    ) {
      throw new InterpreterError("type_error", line, col, null, null, this.getLineText(line));
    }

    if (!this.binaryOpDispatch[op]) {
      throw new InterpreterError(`Unknown binary operator: ${op}`, line, col);
    }

    return this.binaryOpDispatch[op](leftVal, rightVal, line, col);
  }
}

// ============================================================================
// 7. DIAGNOSTIC ERROR FORMATTER
// ============================================================================

export function formatError(error) {
  if (!(error instanceof PlangError)) {
    return error?.message || String(error);
  }

  const line = error.line ?? 1;
  const col = error.column ?? 1;
  const lines = [error.formatHeader(line, col)];

  if (error.sourceLine && error.sourceLine.trim() !== "") {
    const linePrefix = `  ${line} | `;
    const caretOffset = Math.max(0, col - 1);
    const caretLine = " ".repeat(linePrefix.length + caretOffset) + "^";
    lines.push(`${linePrefix}${error.sourceLine}`);
    lines.push(caretLine);
  }
  if (error.hint) {
    lines.push(`  Hint: ${error.hint}`);
  }
  return lines.join("\n");
}
