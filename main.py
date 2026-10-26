"""
PLang Command-Line Interface & Interactive REPL (main.py)
=========================================================
Course: CMPSC 132 — Programming Languages (1st Semester, A.Y. 2025-2026)

Module Overview:
    Provides the command-line driver, script file executor, and interactive
    Read-Eval-Print Loop (REPL) for PLang. Designed with structured user prompts,
    clean visual formatting, symbol table inspection, and AST/Token visualization.

Libraries Utilized:
    - `os`, `sys` (Python Standard Library): File path resolution and exit status codes.
    - `json` (Python Standard Library): Language configuration loading (`config.json`).
    - `argparse` (Python Standard Library): Command-line flag and script argument parsing.
"""

import argparse
import json
import os
import sys

from lang import (
    Interpreter,
    Parser,
    PlangError,
    format_ast,
    format_error,
    tokenize,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG_PATH = os.path.join(BASE_DIR, "config.json")


class CLIRunner:
    """
    Coordinates configuration loading, interactive REPL execution, and script file
    processing for the PLang interpreter.

    Class Variables:
        PROMPT_SYMBOL (str): Interactive prompt prefix displayed before user input ('plang> ').
        REPL_COMMANDS (tuple[str, ...]): Built-in meta-commands recognized by the REPL session.

    Instance Attributes:
        config (dict): Loaded PLang configuration dictionary (keywords, prefixes, error templates).
        show_tokens (bool): Whether to display the lexical token stream before evaluation.
        show_ast (bool): Whether to display the Abstract Syntax Tree (AST) before evaluation.
        interpreter (Interpreter): Stateful tree-walking interpreter instance.
    """

    PROMPT_SYMBOL = "plang> "
    REPL_COMMANDS = ("help", "vars", "clear", "ast", "tokens", "exit", "quit")

    def __init__(self, config=None, show_tokens=False, show_ast=False):
        self.config = config or load_config()
        self.show_tokens = show_tokens
        self.show_ast = show_ast
        self.interpreter = Interpreter(self.config)

    def print_help(self):
        """Prints a formatted reference guide of PLang operators, statements, and REPL commands."""
        help_text = """
  +------------------------------------------------------------------------+
  |                    PLang Language Quick Reference                      |
  +------------------------------------------------------------------------+
  | 1. ARITHMETIC OPERATORS (Precedence: () -> Unary -> ^ -> * / // % -> + -)|
  |    Addition        :  a + b       or   a add b                         |
  |    Subtraction     :  a - b       or   a sub b                         |
  |    Multiplication  :  a * b       or   a mul b                         |
  |    True Division   :  a / b            (returns float, e.g. 7 / 2 = 3.5)|
  |    Integer Division:  a // b      or   a div b  (floor int, 7 // 2 = 3)|
  |    Modulo          :  a % b       or   a mod b                         |
  |    Exponentiation  :  a ^ b       or   a ** b   or   a pow b           |
  +------------------------------------------------------------------------+
  | 2. VARIABLES & STATEMENTS                                              |
  |    Declaration     :  let x = 10 + 5   or   x = 10 + 5                 |
  |    Compound Assign :  x += 5,  x -= 2,  x *= 3,  x /= 2                |
  |    Output          :  print x * 2      or   print(x * 2)               |
  |    Built-in Math   :  abs(x), sqrt(x), min(a, b), max(a, b), round(x)  |
  |    Constants       :  PI (3.14159...), E (2.71828...), ans (last value)|
  +------------------------------------------------------------------------+
  | 3. INTERACTIVE REPL COMMANDS                                           |
  |    vars            :  Display all defined variables and their types    |
  |    clear           :  Clear all variables from the environment         |
  |    ast <stmt>      :  Inspect the Abstract Syntax Tree for <stmt>      |
  |    tokens <stmt>   :  Inspect the lexical token stream for <stmt>      |
  |    help            :  Show this language reference table               |
  |    exit / quit     :  Terminate the interactive REPL session           |
  +------------------------------------------------------------------------+"""
        print(help_text)

    def _print_tokens_table(self, tokens):
        """Prints a formatted table of lexical tokens for educational inspection."""
        print("\n  [Lexical Token Stream]")
        print("  +----+--------------+----------------------+---------+---------+")
        print("  | #  | Token Type   | Lexeme Value         | Line    | Column  |")
        print("  +----+--------------+----------------------+---------+---------+")
        for idx, tok in enumerate(tokens, start=1):
            val_repr = "\\n" if tok.type == "NEWLINE" else tok.value
            print(f"  | {idx:<2} | {tok.type:<12} | {val_repr:<20} | {tok.line:<7} | {tok.column:<7} |")
        print("  +----+--------------+----------------------+---------+---------+")

    def _print_ast_tree(self, statements):
        """Prints the ASCII Abstract Syntax Tree for a list of parsed statements."""
        print("\n  [Abstract Syntax Tree (AST)]")
        print("  Program")
        for idx, stmt in enumerate(statements):
            is_last = idx == len(statements) - 1
            print(format_ast(stmt, indent="  ", is_last=is_last))
        print()

    def run_repl(self):
        """Starts the interactive Read-Eval-Print Loop (REPL) session."""
        banner = self.config.get(
            "banner",
            "======================================================================\n"
            "  PLang v2.0 — Arithmetic Programming Language Interpreter\n"
            "======================================================================"
        )
        print(banner)
        print("  Type 'help' for syntax reference, 'vars' for variables, or 'exit' to quit.\n")

        while True:
            try:
                line = input(self.PROMPT_SYMBOL)
                stripped = line.strip()

                if not stripped:
                    continue

                if stripped.lower() in ("exit", "quit"):
                    print("  Session terminated. Goodbye!")
                    break

                if stripped.lower() == "help":
                    self.print_help()
                    continue

                # Handle REPL inspection prefixes: `ast <code...>` or `tokens <code...>`
                inspect_ast_only = False
                inspect_tokens_only = False
                code_to_run = line

                if stripped.lower().startswith("ast ") and len(stripped) > 4:
                    inspect_ast_only = True
                    code_to_run = stripped[4:]
                elif stripped.lower().startswith("tokens ") and len(stripped) > 7:
                    inspect_tokens_only = True
                    code_to_run = stripped[7:]

                self.interpreter.set_source_code(code_to_run)
                tokens = tokenize(code_to_run, self.config)

                if len(tokens) <= 1:
                    continue

                if inspect_tokens_only or self.show_tokens:
                    self._print_tokens_table(tokens)
                    if inspect_tokens_only:
                        continue

                parser = Parser(tokens, self.config, source_code=code_to_run)
                stmt = parser.parse_statement()

                if parser.current_token().type not in ("EOF", "NEWLINE"):
                    parser._raise_trailing_token_error(parser.current_token())

                if inspect_ast_only or self.show_ast:
                    self._print_ast_tree([stmt])
                    if inspect_ast_only:
                        continue

                result = self.interpreter.evaluate_statement(stmt)
                if result is not None:
                    prefix = self.config.get("print_prefix", "[OUT] => ")
                    print(f"  {prefix}{result}")

            except (KeyboardInterrupt, EOFError):
                print("\n  Session terminated. Goodbye!")
                break
            except PlangError as err:
                print(format_error(err, self.config))
            except Exception as exc:
                print(f"[System Error]: {exc}")

    def run_file(self, file_path):
        """
        Reads, tokenizes, parses, and executes a PLang script file (`.plang` or `.gib`).

        Args:
            file_path (str): Path to the script file to execute.
        """
        if not os.path.exists(file_path):
            print(f"[File Error]: Script file '{file_path}' was not found.")
            sys.exit(1)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                source_code = f.read()
        except Exception as exc:
            print(f"[File Error]: Could not read '{file_path}': {exc}")
            sys.exit(1)

        try:
            self.interpreter.set_source_code(source_code)
            tokens = tokenize(source_code, self.config)

            if self.show_tokens:
                self._print_tokens_table(tokens)

            parser = Parser(tokens, self.config, source_code=source_code)
            statements = parser.parse_program()

            if self.show_ast:
                self._print_ast_tree(statements)

            for stmt in statements:
                self.interpreter.evaluate_statement(stmt)

        except PlangError as err:
            print(format_error(err, self.config))
            sys.exit(1)
        except Exception as exc:
            print(f"[System Error]: {exc}")
            sys.exit(1)


def load_config(config_path=None):
    """
    Loads the language configuration JSON file, or returns a safe default configuration
    dictionary if `config.json` is not present.

    Args:
        config_path (str | None): Optional path to a custom JSON configuration file.

    Returns:
        dict: Language configuration dictionary.
    """
    target_path = config_path or DEFAULT_CONFIG_PATH
    if os.path.exists(target_path):
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            print(f"[Config Error]: Failed to parse '{target_path}': {exc}")
            sys.exit(1)

    return {
        "name": "PLang",
        "version": "2.0.0",
        "description": "A Readable, Writable, and Reliable Arithmetic Programming Language.",
        "banner": (
            "======================================================================\n"
            "  PLang v2.0 — Arithmetic Programming Language Interpreter\n"
            "  Designed for Readability, Writability, and Reliability (CMPSC 132)\n"
            "======================================================================"
        ),
        "comment_prefix": "#",
        "print_prefix": "[OUT] => ",
    }


def main():
    """Command-line entry point for the PLang interpreter."""
    arg_parser = argparse.ArgumentParser(
        description="PLang v2.0 — A Readable, Writable, and Reliable Arithmetic Language Interpreter."
    )
    arg_parser.add_argument(
        "script",
        nargs="?",
        help="Path to a .plang script file to execute. Omit to launch the interactive REPL."
    )
    arg_parser.add_argument(
        "--ast",
        action="store_true",
        help="Display the Abstract Syntax Tree (AST) before executing statements."
    )
    arg_parser.add_argument(
        "--tokens",
        action="store_true",
        help="Display the lexical token stream table before parsing."
    )
    arg_parser.add_argument(
        "--config",
        help="Optional path to a custom config.json file."
    )

    args = arg_parser.parse_args()
    config = load_config(args.config)
    runner = CLIRunner(config=config, show_tokens=args.tokens, show_ast=args.ast)

    if args.script:
        runner.run_file(args.script)
    else:
        runner.run_repl()


if __name__ == "__main__":
    main()
