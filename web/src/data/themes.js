/**
 * PLang Web IDE Configuration & Preset Script Library (themes.js)
 * ===============================================================
 * Course: CMPSC 132 — Programming Languages (1st Semester, A.Y. 2025-2026)
 *
 * Provides the unified PLang v2.0 language configuration and curated
 * educational sample programs demonstrating Readability, Writability,
 * and Reliability.
 */

export const PLANG_CONFIG = {
  id: "plang-standard",
  name: "PLang v2.0 (Unified)",
  avatar: "∑",
  tagline: "Readable, Writable & Reliable Arithmetic Language",
  description:
    "Unified hybrid syntax combining universal mathematical operators (+, -, *, /, //, %, ^) with clear English keywords (let, add, sub, mul, div, mod, pow, print, vars, clear).",
  banner: "PLang v2.0 Interactive Compiler & Runtime Environment — Ready.",
  comment_prefix: "#",
  print_prefix: "[OUT] => ",
  accentColor: "#06b6d4",
  keywords: {
    let: "let",
    assign: "=",
    add: "+",
    sub: "-",
    mul: "*",
    div: "/",
    idiv: "//",
    mod: "%",
    pow: "^",
    print: "print",
    vars: "vars",
    clear: "clear"
  }
};

export const PRESET_PROGRAMS = {
  integer_arithmetic: {
    id: "integer_arithmetic",
    name: "1. Integer Arithmetic & Precedence",
    badge: "Requirement II.1",
    description:
      "Demonstrates exact integer computation, operator precedence (^ > * // % > + -), and parenthesized grouping.",
    sampleCode: `# 1. Explicit integer declarations (Readability)
let base_score = 100
let bonus = 25
let penalty = 15

# 2. Integer addition & subtraction
let net_score = base_score + bonus - penalty
print net_score

# 3. Operator precedence: 2 ^ 3 = 8 -> 3 * 8 = 24 -> 10 + 24 = 34
let precedence_check = 10 + 3 * 2 ^ 3
print precedence_check

# 4. Parentheses overriding precedence: 13 * 8 = 104
let grouped_check = (10 + 3) * 2 ^ 3
print grouped_check

# 5. Integer floor division (//) and modulo (%)
let total_items = 47
let full_boxes = total_items // 10
let remaining = total_items % 10
print full_boxes
print remaining`
  },

  hybrid_syntax: {
    id: "hybrid_syntax",
    name: "2. Hybrid Readable Keywords",
    badge: "Readability",
    description:
      "Demonstrates natural English operator keywords (add, sub, mul, div, mod, pow) alongside symbolic syntax.",
    sampleCode: `# Hybrid English keywords for self-documenting formulas
let units = 20 add 5
let unit_price = 12 mul 3
let subtotal = units mul unit_price
print subtotal

# Integer floor division ('div') and remainder ('mod')
let packets = subtotal div 100
let leftover = subtotal mod 100
print packets
print leftover

# Exponentiation ('pow') and subtraction ('sub')
let capacity = 2 pow 8 sub 56
print capacity`
  },

  writability_functions: {
    id: "writability_functions",
    name: "3. Functions & Compound Assignment",
    badge: "Writability",
    description:
      "Demonstrates compound assignments (+=, -=, *=), built-in math functions (abs, sqrt, min, max, round), and symbol table inspection.",
    sampleCode: `# Concise compound variable updates
counter = 10
counter += 5
counter *= 4
counter -= 10
print counter

# Built-in mathematical functions
let distance = abs(-42)
let hypotenuse = sqrt(3 ^ 2 + 4 ^ 2)
let lowest = min(15, 8, 23, 4, 16)
let highest = max(15, 8, 23, 4, 16)

print distance
print hypotenuse
print lowest
print highest

# Display active symbol table
vars`
  },

  error_diagnostics: {
    id: "error_diagnostics",
    name: "4. Error Handling & Diagnostics",
    badge: "Reliability",
    description:
      "Demonstrates how PLang traps incorrect syntax formats or division by zero with exact line, column, and visual caret pointer.",
    sampleCode: `# Try uncommenting any of the lines below to test PLang's error diagnostics:

let valid_calc = 50 // 5
print valid_calc

# Case A: Division by zero (Runtime Error)
print 100 / (10 - 10)

# Case B: Incorrect format / missing operand (Syntax Error)
# let broken = 25 + * 5`
  }
};

// Backwards-compatible export alias
export const PRESET_THEMES = PRESET_PROGRAMS;
