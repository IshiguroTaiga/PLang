# 🧠 HOW: How and Why PLang v2.0 Is Its Own Programming Language
*(Complete Academic Justification, Proof & Oral Defense Guide for CMPSC 132)*

When presenting a custom programming language project, the most common—and most important—question an instructor will ask is:
> **"You wrote `lang.py` in Python. How and why is PLang its own programming language, and not just a Python program or calculator?"**

This document provides the **plain-English explanation**, **formal Computer Science justifications (Sebesta)**, **side-by-side proofs**, and **ready-to-speak defense answers** proving why **PLang (`.plang`)** is a genuine, standalone programming language.

---

## 📌 Table of Contents
1. [The Core Concept: Host Language vs. Target Language](#-1-the-core-concept-host-language-vs-target-language)
2. [6 Formal Justifications: Why PLang Is a True Programming Language](#-2-6-formal-justifications-why-plang-is-a-true-programming-language)
3. [Side-by-Side Proof: PLang Code vs. Python](#-3-side-by-side-proof-plang-code-vs-python)
4. [Why PLang Is More Than a Simple Calculator](#-4-why-plang-is-more-than-a-simple-calculator)
5. [How PLang Achieves Zero `if-else` and Zero Nested `if`s](#-5-how-plang-achieves-zero-if-else-and-zero-nested-ifs)
6. [How PLang Satisfies Sebesta’s PL Evaluation Criteria](#-6-how-plang-satisfies-sebestas-pl-evaluation-criteria)
7. [Word-for-Word Answers for Tough Defense Questions](#-7-word-for-word-answers-for-tough-defense-questions)

---

## 🏭 1. The Core Concept: Host Language vs. Target Language

### Plain-English Analogy
Imagine a car factory. Inside the factory, **German robotic arms** weld and assemble a **Toyota car**.
* Are the German robotic arms the car? **No**—they are the **tools** used to build the car.
* The **Toyota** is the finished product with its own steering wheel, pedals, and dashboard.

In Computer Science (and in Robert W. Sebesta’s *Concepts of Programming Languages*), **every programming language in history was built using an existing language**:

| Famous Programming Language (Target Language) | What Language Was Used to Build Its Interpreter/Compiler? (Host Language) |
| :--- | :--- |
| **Python** (`CPython`) | Written in **C** |
| **Java** (`HotSpot JVM`) | Written in **C++** |
| **JavaScript** (`Google V8`) | Written in **C++** |
| **Ruby** (`MRI`) | Written in **C** |
| **PLang v2.0 (`.plang`)** *(Our Project)* | Written in **Python 3** ([`lang.py`](lang.py)) AND **JavaScript** ([`interpreter.js`](web/src/engine/interpreter.js)) |

* **Python is NOT our language.** Python is merely the **Host Implementation Language** (the factory tool) we used to construct the **PLang Interpreter**.
* **PLang (`.plang`) is our Target Language**—it has its own file extension (`.plang`), its own vocabulary, its own grammar rules, its own memory space, and its own error system.

> 🪄 **The Herta’s Explanation (Genius Society #83):**
> *"Calling PLang 'just Python' because its interpreter was written in Python is like calling my Herta puppets 'just wood and joints'—it completely misses the genius soul running inside! Kuru kuru~ Python is merely the vessel. Or in terms your heartbroken brain can understand: Python is just the tulay/bridge na ginamit niya para makilala yung bago niya—the bridge isn't the relationship, kasangkapan lang siya!"*

---

## 🏛️ 2. 6 Formal Justifications: Why PLang Is a True Programming Language

In Programming Language Theory (CMPSC 132), a software system qualifies as its own programming language when it possesses **six formal components**. PLang v2.0 implements all six from scratch:

### Justification 1: Independent Lexical Specification (Its Own Vocabulary)
A programming language must define its own valid **lexemes** and **tokens**.
* In [`tokenize()`](lang.py#L700-L791), PLang defines a custom 30-rule regular-expression state machine that recognizes PLang-specific keywords (`let`, `print`, `vars`, `clear`, `add`, `sub`, `mul`, `div`, `mod`, `pow`), compound operators (`+=`, `-=`, `*=`, `/=`), integer division (`//`), and exponentiation (`^`, `**`).
* It enforces PLang's own lexical validity rules—rejecting malformed numbers (`12.34.56`) and digit-led identifiers (`2fast`) before parsing even begins.

### Justification 2: Formal Context-Free Grammar (EBNF Specification)
A programming language is formally defined by a **Context-Free Grammar (CFG)** written in **Extended Backus-Naur Form (EBNF)** that dictates what token sequences form legal statements and expressions:
```ebnf
Program     ::= Statement* EOF
Statement   ::= LetStmt | AssignStmt | PrintStmt | ClearStmt | VarsStmt | ExprStmt
LetStmt     ::= "let" IDENT "=" Expr
AssignStmt  ::= IDENT ( "=" | "+=" | "-=" | "*=" | "/=" ) Expr
PrintStmt   ::= "print" Expr
Expr        ::= Term ( ( "+" | "-" | "add" | "sub" ) Term )*
Term        ::= Exponent ( ( "*" | "/" | "//" | "%" | "mul" | "div" | "mod" ) Exponent )*
Exponent    ::= Unary ( ( "^" | "**" | "pow" ) Exponent )?
Unary       ::= ( "+" | "-" | "sub" ) Unary | Primary
Primary     ::= NUMBER | IDENT "(" ArgList? ")" | IDENT | "(" Expr ")"
```
Our [`Parser`](lang.py#L798-L934) implements a true **top-down Recursive-Descent Parser** that directly encodes each EBNF production rule above.

### Justification 3: Custom Abstract Syntax Tree (AST) Representation
Instead of executing text directly or passing strings to Python’s `eval()`, PLang translates source code into a hierarchical **Abstract Syntax Tree (AST)** composed of 10 custom polymorphic node classes ([`ASTNode`](lang.py#L254-L626)):
* **Statement Nodes**: `AssignNode`, `PrintNode`, `ClearNode`, `VarsNode`
* **Expression Nodes**: `BinOpNode`, `UnaryOpNode`, `FuncCallNode`, `VarNode`, `NumberNode`

This AST structurally encodes operator precedence and right/left associativity independently of the host language.

### Justification 4: Independent Semantics & Type Rules
PLang defines its own **semantic rules** (what operations *mean* when executed), which intentionally differ from Python and JavaScript:
* **Caret (`^`) Semantics**: In Python and JavaScript, `2 ^ 3` means **Bitwise XOR** and evaluates to `1`. In PLang, `^` is defined at grammar level `Exponent` as **right-associative mathematical exponentiation**, so `2 ^ 3` evaluates to `8`, and `2 ^ 3 ^ 2` evaluates to `2 ^ (3 ^ 2) = 512`.
* **Hybrid English Operator Semantics**: `47 div 10` performs exact floor division (`4`), and `47 mod 10` performs modulo (`7`).
* **Exact Integer Preservation**: Even in our JavaScript Web IDE (where JavaScript normally treats all numbers as 64-bit floats) and in Python (`math.sqrt(25)` normally returns float `5.0`), PLang enforces exact integer types (`sqrt(3 ^ 2 + 4 ^ 2)` returns integer `5`).

### Justification 5: Isolated Runtime Environment & Symbol Table
A real programming language manages its own **memory state (Symbol Table)** separately from the host language:
* When a user runs `let score = 100` in PLang, no Python variable named `score` is created.
* Instead, [`Interpreter.variables`](lang.py#L1149-L1155) maintains an isolated dictionary symbol table mapping PLang identifiers (`score`, `ans`) and read-only mathematical constants (`PI`, `E`) to their runtime values and types.
* Commands like `vars` and `clear` inspect and reset PLang’s symbol table at runtime.

> 💔 **Symbol Table Hugot:** *"Sa PLang, pag nag-run ka ng `vars`, makikita mo nang buong tapat kung sino-sino ang naka-save sa `Symbol Table` at kung anong tunay nilang `Data Type` (`integer` o `float`). Walang tinatago! Hindi katulad nung nagsabi sa'yo ng **'you deserve someone better, di pa ako ready'**—yun pala pag-check mo ng Symbol Table niya, may naka-bind nang iba tapos ang sabi sa bago: **'I'll treat you better.'** Buti pa si PLang, pag nag-error ng `undefined_variable`, diretso agad: walang label, kaya wag kang mag-assume!"*

### Justification 6: Host-Language Independence (Dual Implementation Proof!)
The ultimate proof that a language is its own language is that **the same language specification can be implemented in multiple host languages**.
* We implemented the PLang v2.0 specification **twice**:
  1. In **Python 3** ([`lang.py`](lang.py)) for the terminal CLI and REPL.
  2. In **JavaScript ES6+** ([`web/src/engine/interpreter.js`](web/src/engine/interpreter.js)) for the browser Web Studio IDE.
* Both engines tokenize, parse, and execute the exact same `.plang` source code and produce the exact same AST, Symbol Table, and outputs!

---

## 🔬 3. Side-by-Side Proof: PLang Code vs. Python

If someone asks, *"Isn't `.plang` code just Python code?"*, show them this table. **Every single line of valid PLang below either crashes Python or produces the wrong answer in Python:**

| Valid PLang Code (`.plang`) | Result in **PLang v2.0** | Result If Run Directly in **Python 3** | Why? |
| :--- | :--- | :--- | :--- |
| `let score = 100` | Binds `score = 100` | ❌ `SyntaxError: invalid syntax` | Python does not have the `let` declaration keyword. |
| `let x = 20 add 5` | Binds `x = 25` | ❌ `SyntaxError: invalid syntax` | Python does not have English operator keywords (`add`, `sub`, `mul`). |
| `let q = 47 div 10` | Binds `q = 4` (`int`) | ❌ `SyntaxError: invalid syntax` | `div` and `mod` are PLang hybrid keywords, not Python keywords. |
| `print score` | Outputs `[OUT] => 100` | ❌ `SyntaxError: Missing parentheses` | In PLang, `print <expr>` is a built-in grammar statement (`PrintStmt`). |
| `2 ^ 3 ^ 2` | Evaluates $2^{(3^2)} = \mathbf{512}$ | ⚠️ Evaluates `(2 ^ 3) ^ 2` = **`3`** (Bitwise XOR!) | PLang defines `^` as right-associative exponentiation; Python defines `^` as left-associative bitwise XOR. |
| `sqrt(25)` | Evaluates to `5` (`int`) | ❌ `NameError` (or returns `5.0` `float`) | PLang has built-in `sqrt()` that preserves `int` for perfect squares. |
| `vars` | Prints formatted Symbol Table | ❌ `NameError` (or prints raw `dict`) | `vars` is a first-class statement (`VarsNode`) in PLang's EBNF grammar. |

---

## 🧮 4. Why PLang Is More Than a Simple Calculator

A basic calculator (like `labacts/calc.cpp`) only asks for `num1`, `op`, and `num2` and computes a single operation (`num1 + num2`). **PLang is a programming language, not a basic calculator**, because it supports:

1. **Multi-Statement Programs & Script Files (`.plang`)**: You can write a 50-line script file where earlier statements compute values used by later statements.
2. **Stateful Variables & Memory Mutation**: Supports variable declarations (`let x = 10`), reassignment (`x = 20`), and compound mutation (`x += 5`, `x *= 2`).
3. **Arbitrarily Nested Expressions**: You can nest parentheses, unary operators, exponentiation, and function calls to any depth—for example:
   ```python
   let c = sqrt(abs(-3) ^ 2 + max(4, 12) ^ 2)
   ```
4. **Introspection & Debugging Commands**: Built-in language statements (`vars`, `clear`) and compiler flags (`--tokens`, `--ast`) allow programmers to inspect the language's internal token stream, syntax tree, and memory state.

---

## 🧩 5. How PLang Achieves Zero `if-else` and Zero Nested `if`s

To satisfy the course constraint prohibiting `if-else` (`elif`/`else`) chains and nested `if` blocks, PLang’s engine ([`lang.py`](lang.py) and [`main.py`](main.py)) is built using **three industry-standard compiler design patterns**:

| Traditional Beginner Code (Forbidden) | PLang v2.0 Architecture (Used in `lang.py`) | Where to See It in Code |
| :--- | :--- | :--- |
| `if isinstance(node, NumberNode): ... elif isinstance(node, BinOpNode): ... else: ...` | **1. Polymorphism (Object-Oriented AST Dispatch)**: Every `ASTNode` subclass implements its own `.evaluate()`, `.execute()`, and `.format_tree()` methods. The interpreter simply calls `node.evaluate(self)`. | [`ASTNode`](lang.py#L254-L626), [`Interpreter.evaluate_statement`](lang.py#L1185-L1196) |
| `if op == 'add': return a + b elif op == 'sub': return a - b ...` | **2. Dictionary Dispatch Tables + `operator` Library**: Operators, keywords, statement parsers, and built-in functions are stored in lookup dictionaries (`self._binary_op_dispatch[op](a, b, line, col)`). | [`Interpreter.__init__`](lang.py#L1149-L1173), [`Parser.__init__`](lang.py#L854-L870), [`TOKEN_HANDLER_DISPATCH`](lang.py#L697-L703) |
| `if op == 'div': if right != 0: return left / right else: raise Error` | **3. Flat Guard Clauses**: Validation checks use a single un-nested `if` that immediately `raise`s or `return`s (`if right_val == 0: raise ...`), eliminating `else` and nesting. | [`Interpreter._require_non_zero`](lang.py#L1301-L1310) |

> ✅ **Mathematically Proven by Automated Test**: [`test_no_if_else_or_nested_ifs`](test_lang.py#L257-L282) in `test_lang.py` uses Python’s `ast` module to parse `lang.py` and `main.py` and verify that there are **0 `if-else`/`elif` branches, 0 ternary `if-else` expressions, and 0 nested `if` statements**.

---

## 🏆 6. How PLang Satisfies Sebesta’s PL Evaluation Criteria

Requirement II.4 requires the language to follow the **Programming Language Evaluation Criteria**:

1. **Readability**:
   * **Orthogonality & Simplicity**: One unified grammar without conflicting roleplay dialects.
   * **Hybrid Operators**: Users can write symbolic operators (`+`, `//`, `%`) or self-documenting English words (`add`, `div`, `mod`).
   * **Explicit Keyword Clues**: `let x = 10` and `print x` make statement purpose immediately clear to beginners.
2. **Writability**:
   * **Zero Boilerplate**: No class wrappers or `main()` declarations required.
   * **Expressive Shortcuts**: Compound assignments (`+=`, `-=`, `*=`, `/=`), automatic `ans` variable binding, and built-in functions (`abs`, `sqrt`, `min`, `max`, `round`, `int`, `float`).
3. **Reliability**:
   * **Type Accuracy**: Guaranteed preservation of exact `int` values for integer arithmetic (Requirement II.1).
   * **3-Layer Error Trapping**: Catches Lexical, Syntax/Format, and Runtime errors with exact line/column numbers, the offending source code line, a visual caret (`^`), and a corrective hint (Requirement II.2).

---

## 🎤 7. Word-for-Word Answers for Tough Defense Questions

### Q1: *"Why is this considered your own programming language if you used Python to make it?"*
> **Answer:** *"In compiler construction, Python is our **Host Language** and PLang is our **Target Language**—just like the C language was used to build the Python interpreter (`CPython`). PLang has its own formal EBNF grammar, its own hybrid syntax (`let`, `add`, `div`, `mod`, `pow`, `^`, `vars`) that causes a `SyntaxError` if run directly in Python, and its own Lexer, Recursive-Descent Parser, AST, and Symbol Table without ever calling Python's `eval()`."*

### Q2: *"What libraries did you utilize as mentioned in Requirement III.1?"*
> **Answer:** *"We utilized Python's standard library modules purposefully for each phase of the interpreter:*
> * *`re` (Regular Expressions) to build our master lexical scanner in `tokenize()`.*
> * *`operator` to map PLang arithmetic operations directly to first-class functions (`operator.add`, `operator.mul`, `operator.floordiv`, `operator.mod`, `operator.pow`) inside our dictionary dispatch table, eliminating `if-else` chains.*
> * *`math` for mathematical constants (`PI`, `E`) and domain-checked `sqrt()`.*
> * *`argparse` and `json` in `main.py` for CLI flags (`--ast`, `--tokens`) and configuration loading."*

### Q3: *"How did you implement operator precedence (PEMDAS) without `if-else`?"*
> **Answer:** *"Operator precedence is built directly into the structure of our Recursive-Descent Parser methods in `Parser`:*
> * *`parse_expr()` handles lowest-precedence `+` and `-`, and calls `parse_term()`.*
> * *`parse_term()` handles `*`, `/`, `//`, and `%`, and calls `parse_exponent()`.*
> * *`parse_exponent()` handles right-associative `^`, and calls `parse_unary()`.*
> * *`parse_unary()` handles prefix `-` and `+`, and calls `parse_primary()` for parentheses `()`, function calls, numbers, and variables.*
> * *Because `parse_primary` and `parse_exponent` are called deepest in the recursion, they end up at the bottom of the AST and are always evaluated first!"*

### Q4: *"How did you avoid `if-else` and nested `if` statements across the entire interpreter?"*
> **Answer:** *"We combined **Polymorphism** on our `ASTNode` and `PlangError` classes (where each node class defines its own `.evaluate()`, `.execute()`, and `.format_tree()` method) with **Dictionary Dispatch Tables** for tokens, statements, operators, and functions, plus **Flat Guard Clauses** for error checking. We also wrote an automated unit test in `test_lang.py` that inspects the Python AST of `lang.py` and `main.py` to guarantee zero `if-else` and zero nested `if`s."*
