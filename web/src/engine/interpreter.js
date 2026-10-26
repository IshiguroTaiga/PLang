/**
 * PLang Core Language Engine in JavaScript (interpreter.js)
 * =========================================================
 * Course: CMPSC 132 — Programming Languages (1st Semester, A.Y. 2025-2026)
 *
 * Implements the lexical analyzer (tokenizer), recursive-descent parser,
 * Abstract Syntax Tree (AST) node classes, tree-walking interpreter, and
 * diagnostic error formatter for the PLang Web IDE.
 */

// ============================================================================
// 1. EXCEPTION HIERARCHY
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
 *
 * Instance Properties:
 *   @property {string|null} varName - Undefined variable identifier if applicable.
 *   @property {string|null} detail - Additional diagnostic context.
 */
export class InterpreterError extends PlangError {
  static CATEGORY = "Runtime Error";
  static DEFAULT_HINT = "Verify that all variables are defined before use and divisors are non-zero.";

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
// 3. ABSTRACT SYNTAX TREE (AST) NODES
// ============================================================================

/**
 * Base class for all PLang Abstract Syntax Tree (AST) nodes.
 *
 *Instance Properties:
 *   @property {number} line - 1-based source line number.
 *   @property {number} col - 1-based source column number.
 */
export class ASTNode {
  static NODE_CATEGORY = "Base";

  constructor(line, col) {
    this.line = line;
    this.col = col;
  }
}

export class NumberNode extends ASTNode {
  static NODE_CATEGORY = "Literal";

  constructor(value, line, col) {
    super(line, col);
    this.type = "NumberNode";
    this.value = value;
  }
}

export class VarNode extends ASTNode {
  static NODE_CATEGORY = "Identifier";

  constructor(name, line, col) {
    super(line, col);
    this.type = "VarNode";
    this.name = name;
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
}

export class PrintNode extends ASTNode {
  static NODE_CATEGORY = "PrintStatement";

  constructor(expr, line, col) {
    super(line, col);
    this.type = "PrintNode";
    this.expr = expr;
  }
}

export class ClearNode extends ASTNode {
  static NODE_CATEGORY = "ClearStatement";

  constructor(line, col) {
    super(line, col);
    this.type = "ClearNode";
  }
}

export class VarsNode extends ASTNode {
  static NODE_CATEGORY = "VarsStatement";

  constructor(line, col) {
    super(line, col);
    this.type = "VarsNode";
  }
}

// ============================================================================
// 4. LEXICAL ANALYZER (TOKENIZER)
// ============================================================================

const RESERVED_KEYWORDS = new Set([
  "let", "print", "clear", "vars",
  "add", "sub", "mul", "div", "mod", "pow"
]);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function tokenize(sourceCode, config = {}) {
  const commentPrefix = config?.comment_prefix || "#";
  const sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [""];

  const getSourceLine = (lineNum) =>
    lineNum >= 1 && lineNum <= sourceLines.length ? sourceLines[lineNum - 1] : "";

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
  const canonicalTypeMap = {
    ADD_KW: "ADD",
    SUB_KW: "SUB",
    MUL_KW: "MUL",
    IDIV_KW: "IDIV",
    MOD_KW: "MOD",
    POW_KW: "POW",
    POW_ALT: "POW"
  };

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

    const groups = match.groups || {};
    let rawType = null;
    let tokenValue = null;

    for (const [key, val] of Object.entries(groups)) {
      if (val !== undefined) {
        rawType = key;
        tokenValue = val;
        break;
      }
    }

    if (rawType === "MALFORMED_FLOAT") {
      throw new LexerError(
        tokenValue,
        line,
        col,
        `Malformed numeric literal '${tokenValue}' (multiple decimal points).`,
        currentLineText,
        "A floating-point number may contain at most one decimal point (e.g., 3.14)."
      );
    }

    if (rawType === "MALFORMED_IDENT") {
      throw new LexerError(
        tokenValue,
        line,
        col,
        `Invalid token '${tokenValue}' — identifiers cannot begin with a digit.`,
        currentLineText,
        `Rename the variable to start with a letter (e.g., 'var_${tokenValue}') or insert '*' for multiplication.`
      );
    }

    if (rawType === "NEWLINE") {
      tokens.push(new Token("NEWLINE", tokenValue, line, col));
      line += 1;
      lineStart = match.index + tokenValue.length;
    } else if (rawType !== "SKIP" && rawType !== "COMMENT") {
      const normType = canonicalTypeMap[rawType] || rawType;
      tokens.push(new Token(normType, tokenValue, line, col));
    }

    pos = match.index + match[0].length;
  }

  tokens.push(new Token("EOF", "", line, pos - lineStart + 1));
  return tokens;
}

// ============================================================================
// 5. RECURSIVE-DESCENT PARSER
// ============================================================================

export class Parser {
  static COMPOUND_OP_MAP = {
    ASSIGN: "=",
    ADD_ASSIGN: "+=",
    SUB_ASSIGN: "-=",
    MUL_ASSIGN: "*=",
    DIV_ASSIGN: "/="
  };

  constructor(tokens, config = {}, sourceCode = "") {
    this.tokens = tokens;
    this.pos = 0;
    this.config = config;
    this.sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [];
  }

  getLineText(lineNum) {
    if (lineNum >= 1 && lineNum <= this.sourceLines.length) {
      return this.sourceLines[lineNum - 1];
    }
    return null;
  }

  currentToken() {
    return this.tokens[this.pos] || this.tokens[this.tokens.length - 1];
  }

  peekToken(offset = 1) {
    const idx = this.pos + offset;
    if (idx < this.tokens.length) {
      return this.tokens[idx];
    }
    return this.tokens[this.tokens.length - 1];
  }

  consume(expectedType, customMessage = null, hint = null) {
    const token = this.currentToken();
    if (token.type === expectedType) {
      this.pos += 1;
      return token;
    }
    const shown = token.type !== "EOF" ? token.value : "end of input";
    throw new ParseError(
      customMessage || `Expected '${expectedType}', but found '${shown}'.`,
      token.line,
      token.column,
      this.getLineText(token.line),
      hint
    );
  }

  parseProgram() {
    const statements = [];
    while (this.currentToken().type === "NEWLINE") {
      this.consume("NEWLINE");
    }

    while (this.currentToken().type !== "EOF") {
      const stmt = this.parseStatement();
      statements.push(stmt);

      const curr = this.currentToken();
      if (curr.type === "NEWLINE") {
        this.consume("NEWLINE");
      } else if (curr.type !== "EOF") {
        this.raiseTrailingTokenError(curr);
      }

      while (this.currentToken().type === "NEWLINE") {
        this.consume("NEWLINE");
      }
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

  parseStatement() {
    const token = this.currentToken();

    if (token.type === "LET") {
      const letTok = this.consume("LET");
      const identTok = this.currentToken();
      if (identTok.type !== "IDENT") {
        const shown = identTok.type !== "EOF" ? identTok.value : "end of line";
        if (RESERVED_KEYWORDS.has(identTok.value)) {
          throw new ParseError(
            `Cannot use reserved keyword '${identTok.value}' as a variable name.`,
            identTok.line,
            identTok.column,
            this.getLineText(identTok.line),
            "Choose a descriptive variable name that is not a reserved language keyword."
          );
        }
        throw new ParseError(
          `Expected a variable name after 'let', but got '${shown}'.`,
          identTok.line,
          identTok.column,
          this.getLineText(identTok.line),
          "Syntax for variable declaration is: let <variable_name> = <expression>"
        );
      }
      this.consume("IDENT");
      if (this.currentToken().type !== "ASSIGN") {
        const bad = this.currentToken();
        const shown = bad.type !== "EOF" ? bad.value : "end of line";
        throw new ParseError(
          `Expected '=' after variable '${identTok.value}' in 'let' declaration, got '${shown}'.`,
          bad.line,
          bad.column,
          this.getLineText(bad.line),
          `Write: let ${identTok.value} = <expression>`
        );
      }
      this.consume("ASSIGN");
      const expr = this.parseExpr();
      return new AssignNode(identTok.value, expr, letTok.line, letTok.column, "=");
    }

    if (token.type === "PRINT") {
      this.consume("PRINT");
      if (["NEWLINE", "EOF"].includes(this.currentToken().type)) {
        throw new ParseError(
          "Missing expression after 'print' statement.",
          token.line,
          token.column,
          this.getLineText(token.line),
          "Provide a value or expression to print, e.g., 'print 10 + 5' or 'print x'."
        );
      }
      const expr = this.parseExpr();
      return new PrintNode(expr, token.line, token.column);
    }

    if (token.type === "CLEAR") {
      this.consume("CLEAR");
      return new ClearNode(token.line, token.column);
    }

    if (token.type === "VARS") {
      this.consume("VARS");
      return new VarsNode(token.line, token.column);
    }

    if (token.type === "IDENT" && Parser.COMPOUND_OP_MAP[this.peekToken().type]) {
      const name = token.value;
      this.consume("IDENT");
      const opTok = this.currentToken();
      this.consume(opTok.type);
      const opSymbol = Parser.COMPOUND_OP_MAP[opTok.type];
      const expr = this.parseExpr();
      return new AssignNode(name, expr, token.line, token.column, opSymbol);
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
      const opToken = this.currentToken();
      this.consume(opToken.type);
      const right = this.parseTerm();
      node = new BinOpNode(opToken.type.toLowerCase(), node, right, opToken.line, opToken.column);
    }
    return node;
  }

  parseTerm() {
    let node = this.parseExponent();
    while (["MUL", "DIV", "IDIV", "MOD"].includes(this.currentToken().type)) {
      const opToken = this.currentToken();
      this.consume(opToken.type);
      const right = this.parseExponent();
      node = new BinOpNode(opToken.type.toLowerCase(), node, right, opToken.line, opToken.column);
    }
    return node;
  }

  parseExponent() {
    let node = this.parseUnary();
    if (this.currentToken().type === "POW") {
      const opToken = this.currentToken();
      this.consume("POW");
      const right = this.parseExponent();
      node = new BinOpNode("pow", node, right, opToken.line, opToken.column);
    }
    return node;
  }

  parseUnary() {
    const token = this.currentToken();
    if (token.type === "SUB") {
      const opToken = this.consume("SUB");
      const operand = this.parseUnary();
      return new UnaryOpNode("sub", operand, opToken.line, opToken.column);
    }
    if (token.type === "ADD") {
      const opToken = this.consume("ADD");
      const operand = this.parseUnary();
      return new UnaryOpNode("add", operand, opToken.line, opToken.column);
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.currentToken();

    if (token.type === "NUMBER") {
      this.consume("NUMBER");
      const val = token.value.includes(".")
        ? parseFloat(token.value)
        : parseInt(token.value, 10);
      return new NumberNode(val, token.line, token.column);
    }

    if (token.type === "IDENT") {
      const identTok = this.consume("IDENT");
      if (this.currentToken().type === "LPAREN") {
        this.consume("LPAREN");
        const args = [];
        if (this.currentToken().type !== "RPAREN") {
          args.push(this.parseExpr());
          while (this.currentToken().type === "COMMA") {
            this.consume("COMMA");
            args.push(this.parseExpr());
          }
        }
        this.consume(
          "RPAREN",
          `Unclosed '(' in call to function '${identTok.value}()' — expected ')'.`,
          `Add a closing ')' to complete the '${identTok.value}(...)' function call.`
        );
        return new FuncCallNode(identTok.value, args, identTok.line, identTok.column);
      }
      return new VarNode(identTok.value, identTok.line, identTok.column);
    }

    if (token.type === "LPAREN") {
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
      if (this.currentToken().type !== "RPAREN") {
        const curr = this.currentToken();
        throw new ParseError(
          `Unclosed parenthesis '(' opened at line ${openTok.line}, col ${openTok.column} — expected ')'.`,
          curr.line,
          curr.column,
          this.getLineText(curr.line),
          "Add a matching closing parenthesis ')' at the end of the grouped sub-expression."
        );
      }
      this.consume("RPAREN");
      return expr;
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
// 6. TREE-WALK INTERPRETER
// ============================================================================

export class Interpreter {
  static BUILT_IN_CONSTANTS = {
    PI: Math.PI,
    E: Math.E
  };
  static MAX_EXPONENT_MAGNITUDE = 10000;

  constructor(config = {}, initialVars = {}, sourceCode = "") {
    this.variables = { ...initialVars };
    this.config = config;
    this.outputs = [];
    this.sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [];
  }

  getLineText(lineNum) {
    if (lineNum >= 1 && lineNum <= this.sourceLines.length) {
      return this.sourceLines[lineNum - 1];
    }
    return null;
  }

  evaluateStatement(stmt) {
    if (stmt instanceof PrintNode) {
      const val = this.evaluateExpr(stmt.expr);
      this.variables.ans = val;
      const prefix = this.config?.print_prefix || "[OUT] => ";
      this.outputs.push({ type: "print", text: `${prefix}${val}`, value: val });
      return null;
    }

    if (stmt instanceof ClearNode) {
      this.variables = {};
      this.outputs.push({ type: "clear", text: "[Symbol Table Cleared — Environment Reset]" });
      return null;
    }

    if (stmt instanceof VarsNode) {
      const entries = Object.entries(this.variables);
      if (entries.length === 0) {
        this.outputs.push({ type: "clear", text: "[Symbol Table] Environment is empty." });
      } else {
        const summary = entries
          .map(([k, v]) => `${k} (${Number.isInteger(v) ? "int" : "float"}) = ${v}`)
          .join("  |  ");
        this.outputs.push({ type: "print", text: `[Symbol Table] ${summary}` });
      }
      return null;
    }

    if (stmt instanceof AssignNode) {
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

      const rhsVal = this.evaluateExpr(stmt.expr);
      let finalVal = rhsVal;

      if (stmt.op !== "=") {
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
        const opMap = { "+=": "add", "-=": "sub", "*=": "mul", "/=": "div" };
        finalVal = this.applyBinaryOp(
          opMap[stmt.op],
          this.variables[stmt.name],
          rhsVal,
          stmt.line,
          stmt.col
        );
      }

      this.variables[stmt.name] = finalVal;
      this.variables.ans = finalVal;
      return null;
    }

    const val = this.evaluateExpr(stmt);
    this.variables.ans = val;
    return val;
  }

  evaluateExpr(node) {
    if (node instanceof NumberNode) {
      return node.value;
    }

    if (node instanceof VarNode) {
      if (node.name in this.variables) {
        return this.variables[node.name];
      }
      if (node.name in Interpreter.BUILT_IN_CONSTANTS) {
        return Interpreter.BUILT_IN_CONSTANTS[node.name];
      }
      throw new InterpreterError(
        "undefined_variable",
        node.line,
        node.col,
        node.name,
        null,
        this.getLineText(node.line),
        `Define '${node.name}' first using: let ${node.name} = <value>`
      );
    }

    if (node instanceof UnaryOpNode) {
      const val = this.evaluateExpr(node.expr);
      if (node.op === "sub") return -val;
      if (node.op === "add") return +val;
      throw new InterpreterError(`Unknown unary operator: ${node.op}`, node.line, node.col);
    }

    if (node instanceof FuncCallNode) {
      return this.evaluateFunction(node);
    }

    if (node instanceof BinOpNode) {
      const leftVal = this.evaluateExpr(node.left);
      const rightVal = this.evaluateExpr(node.right);
      return this.applyBinaryOp(node.op, leftVal, rightVal, node.line, node.col);
    }

    throw new InterpreterError("Unknown AST node", 0, 0);
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

    const evalArgs = node.args.map((arg) => this.evaluateExpr(arg));

    if (["abs", "sqrt", "round", "int", "float"].includes(fname)) {
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
      const arg = evalArgs[0];
      if (fname === "abs") return Math.abs(arg);
      if (fname === "round") return Math.round(arg);
      if (fname === "int") return Math.trunc(arg);
      if (fname === "float") return Number(arg);
      if (fname === "sqrt") {
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
    }

    if (["min", "max"].includes(fname)) {
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
      return fname === "min" ? Math.min(...evalArgs) : Math.max(...evalArgs);
    }

    throw new InterpreterError("type_error", node.line, node.col);
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

    if (op === "add") return leftVal + rightVal;
    if (op === "sub") return leftVal - rightVal;
    if (op === "mul") return leftVal * rightVal;

    if (op === "div") {
      if (rightVal === 0) {
        throw new InterpreterError(
          "divide_by_zero",
          line,
          col,
          null,
          null,
          this.getLineText(line),
          "Division by zero is undefined. Ensure the divisor is non-zero."
        );
      }
      return leftVal / rightVal;
    }

    if (op === "idiv") {
      if (rightVal === 0) {
        throw new InterpreterError(
          "divide_by_zero",
          line,
          col,
          null,
          null,
          this.getLineText(line),
          "Integer division by zero is undefined. Ensure the divisor is non-zero."
        );
      }
      return Math.floor(leftVal / rightVal);
    }

    if (op === "mod") {
      if (rightVal === 0) {
        throw new InterpreterError(
          "divide_by_zero",
          line,
          col,
          null,
          null,
          this.getLineText(line),
          "Modulo by zero is undefined. Ensure the right-hand operand of '%' is non-zero."
        );
      }
      return ((leftVal % rightVal) + rightVal) % rightVal;
    }

    if (op === "pow") {
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

    throw new InterpreterError(`Unknown binary operator: ${op}`, line, col);
  }
}

// ============================================================================
// 7. DIAGNOSTIC ERROR FORMATTER
// ============================================================================

export function formatError(error) {
  const line = error.line ?? 1;
  const col = error.column ?? 1;
  let header = "";

  if (error instanceof LexerError) {
    header = `[Lexical Error] Line ${line}, Col ${col}: ${error.message}`;
  } else if (error instanceof ParseError) {
    header = `[Syntax Error] Line ${line}, Col ${col}: ${error.message}`;
  } else if (error instanceof InterpreterError) {
    const key = error.message;
    if (key === "divide_by_zero") {
      header = `[Runtime Error] Line ${line}, Col ${col}: Division or modulo by zero is undefined.`;
    } else if (key === "undefined_variable") {
      header = `[Runtime Error] Line ${line}, Col ${col}: Variable '${error.varName || "unknown"}' is not defined before use.`;
    } else if (key === "negative_sqrt") {
      header = `[Runtime Error] Line ${line}, Col ${col}: Cannot compute real square root of negative number (${error.detail}).`;
    } else if (key === "overflow_error") {
      header = `[Runtime Error] Line ${line}, Col ${col}: Numeric overflow — expression result exceeds safe computation limits.`;
    } else if (key === "argument_error") {
      header = `[Runtime Error] Line ${line}, Col ${col}: ${error.detail || error.message}`;
    } else {
      header = `[Runtime Error] Line ${line}, Col ${col}: Invalid operand types for arithmetic operation.`;
    }
  } else {
    return error.message || String(error);
  }

  const lines = [header];
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
