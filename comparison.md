# ⚖️ PLang vs. Traditional Programming Languages — Comparison Matrix

This document provides a **side-by-side comparison matrix** between **PLang v2.0 (`.plang`)** inputs and how the exact same operations are written in **C++**, **Java**, and **Python 3**, demonstrating how PLang optimizes **Readability**, **Writability**, and **Reliability**.

---

## 📊 1. Master Syntax & Input Comparison Matrix

| Feature / Task | **PLang v2.0 Input (`.plang`)** | **C++ (`calc.cpp` style)** | **Java** | **Python 3** | **Why PLang Wins (PL Criteria)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Variable Declaration** | `let x = 10`<br>*(or `x = 10`)* | `int x = 10;` | `int x = 10;` | `x = 10` | **Readability**: Optional `let` makes new bindings explicit without requiring static type keywords or semicolons. |
| **2. Addition** | `10 + 5`<br>*(or `10 add 5`)* | `10 + 5;` | `10 + 5;` | `10 + 5` | **Readability**: Supports both universal `+` symbol and self-documenting English `add` keyword. |
| **3. Subtraction** | `20 - 8`<br>*(or `20 sub 8`)* | `20 - 8;` | `20 - 8;` | `20 - 8` | **Readability**: English `sub` keyword prevents confusion between subtraction (`-`) and negative signs (`-x`). |
| **4. Multiplication** | `6 * 7`<br>*(or `6 mul 7`)* | `6 * 7;` | `6 * 7;` | `6 * 7` | **Readability**: `6 mul 7` reads naturally like spoken arithmetic. |
| **5. True (Decimal) Division** | `7 / 2` $\rightarrow$ `3.5` | `(double)7 / 2;` | `(double)7 / 2;` | `7 / 2` | **Reliability**: Automatically yields `3.5` without silent integer truncation bugs (`7 / 2 == 3` in C++/Java!). |
| **6. Integer Floor Division** | `47 // 10`<br>*(or `47 div 10`)* $\rightarrow$ `4` | `47 / 10;` | `47 / 10;` | `47 // 10` | **Readability & Reliability**: Explicitly separates integer division (`//` or `div`) from decimal division (`/`). |
| **7. Modulo (Remainder)** | `47 % 10`<br>*(or `47 mod 10`)* $\rightarrow$ `7` | `47 % 10;` | `47 % 10;` | `47 % 10` | **Readability**: Beginners often mistake `%` for percentage; `47 mod 10` makes remainder math unmistakable. |
| **8. Exponentiation (Power)** | `2 ^ 3`<br>*(or `2 pow 3`, `2 ** 3`)* $\rightarrow$ `8` | `#include <cmath>`<br>`pow(2, 3);` | `Math.pow(2, 3);` | `2 ** 3`<br>*(`2 ^ 3` is XOR = `1`!)* | **Writability & Reliability**: In C++/Java/Python, `^` is bitwise XOR (`2 ^ 3 == 1`). In PLang, `^` means real math power! |
| **9. Printing Output** | `print x`<br>*(or `print(x)`)* | `std::cout << x << std::endl;` | `System.out.println(x);` | `print(x)` | **Writability**: Clean statement keyword (`print x`) with zero stream operators (`<<`) or class prefixes. |
| **10. Square Root (`int`-safe)** | `sqrt(25)` $\rightarrow$ `5` (`int`) | `#include <cmath>`<br>`sqrt(25);` (`5.0`) | `Math.sqrt(25);` (`5.0`) | `import math`<br>`math.sqrt(25)` (`5.0`) | **Writability & Reliability**: Built-in without imports, and preserves exact `int` type (`5`) for perfect squares. |
| **11. Absolute / Min / Max** | `abs(-9)`<br>`min(4, 8, 2)`<br>`max(4, 8, 2)` | `std::abs(-9);`<br>`std::min({4,8,2});` | `Math.abs(-9);`<br>`Math.min(4, 8);` | `abs(-9)`<br>`min(4, 8, 2)` | **Writability**: Built directly into the language grammar with variadic argument support. |
| **12. Inspect All Variables** | `vars` | *(Not built-in — requires manual `cout` for every variable)* | *(Not built-in — requires debugger or manual prints)* | `print(globals())` *(dumps messy internal dict)* | **Readability**: Single `vars` command prints a clean table of every variable’s name, data type, and value. |
| **13. Reset Memory State** | `clear` | *(Not built-in)* | *(Not built-in)* | `globals().clear()` *(breaks runtime)* | **Writability**: Resets the Symbol Table in one word (`clear`). |
| **14. Last Evaluated Result** | `ans` | *(Must manually store in a temp variable)* | *(Must manually store in a temp variable)* | `_` *(only in interactive shell, not scripts)* | **Writability**: Every expression automatically updates `ans` in both scripts and REPL. |

> 🪄 
> *"Look at Row 8 (`2 ^ 3`). In C++, Java, and Python, typing `2 ^ 3` gives you `1` because they use `^` for bitwise XOR. How unintuitive for arithmetic! In PLang, `2 ^ 3` actually means $2^3 = 8$. Kasi sa PLang, kung ano yung sinabi, yun talaga yung ibig sabihin hindi katulad nung nagsabi sa'yo ng **'you deserve someone better'** pero ang totoong meaning pala sa compiler niya ay **'I'll treat you better sa bago nya.'**"*

---

## 💻 2. Side-by-Side Full Program Comparisons

### Scenario A: Computing a Student's Grade Average & Remainder
*Task: Add three quiz scores (`88`, `92`, `96`), compute the whole-number average, and print it.*

| Language | Full Source Code Required | Lines of Code / Boilerplate |
| :--- | :--- | :--- |
| **PLang v2.0 (`.plang`)** | ```python
let total = 88 add 92 add 96
let avg = total div 3
print avg
``` | **3 lines** (Zero boilerplate, reads like English) |
| **C++** | ```cpp
#include <iostream>
using namespace std;

int main() {
    int total = 88 + 92 + 96;
    int avg = total / 3;
    cout << "[OUT] => " << avg << endl;
    return 0;
}
``` | **9 lines** (Requires `#include`, `main()`, type declarations, semicolons) |
| **Java** | ```java
public class Main {
    public static void main(String[] args) {
        int total = 88 + 92 + 96;
        int avg = total / 3;
        System.out.println("[OUT] => " + avg);
    }
}
``` | **7 lines** (Requires class wrapper, `public static void main`, `System.out.println`) |
| **Python 3** | ```python
total = 88 + 92 + 96
avg = total // 3
print("[OUT] =>", avg)
``` | **3 lines** (Symbolic only—no `let`, `add`, or `div` keywords) |

---

### Scenario B: Right-Triangle Hypotenuse ($\sqrt{3^2 + 4^2}$) & Memory Inspection
*Task: Compute $\sqrt{3^2 + 4^2}$ as an exact integer and display all variables and their types.*

| Language | Full Source Code Required | Output / Behavior |
| :--- | :--- | :--- |
| **PLang v2.0 (`.plang`)** | ```python
let a = 3
let b = 4
let c = sqrt(a ^ 2 + b ^ 2)
print c
vars
``` | Outputs `[OUT] => 5` (exact `integer`) and prints the formatted Symbol Table of `a`, `b`, `c`, and `ans`. |
| **Python 3** | ```python
import math
a = 3
b = 4
c = int(math.sqrt(a ** 2 + b ** 2))
print("[OUT] =>", c)
for name, val in [("a", a), ("b", b), ("c", c)]:
    print(name, type(val).__name__, val)
``` | Requires `import math`, `**` instead of `^`, manual `int()` conversion, and a manual loop to print variable types. |

---

### Scenario C: What Happens on Incorrect Format or Division by Zero?

| Error Input | **How Standard Languages React** | **How PLang v2.0 Reacts** |
| :--- | :--- | :--- |
| **Missing Operand (`10 + * 5`)** | **Python**: `SyntaxError: invalid syntax` (no explanation or hint on why `*` failed).<br>**C++**: Compiler error dump (`expected primary-expression before '*' token`). | ```text
[Syntax Error] Line 1, Col 6: Unexpected operator '*' — missing operand before '*'.
  1 | 10 + * 5
           ^
  Hint: Binary operator '*' requires a value on both its left and right sides.
``` |
| **Bad Identifier (`let 2fast = 10`)** | **Python**: `SyntaxError: invalid decimal literal` (confusing message for beginners). | ```text
[Lexical Error] Line 1, Col 5: Invalid token '2fast' — identifiers cannot begin with a digit.
  1 | let 2fast = 10
          ^
  Hint: Rename the variable to start with a letter (e.g., 'var_2fast') or insert '*' for multiplication.
``` |
| **Division by Zero (`100 / (5 - 5)`)** | **C++**: Undefined behavior / crash (`Floating point exception (core dumped)`).<br>**Python**: Raw stack traceback (`ZeroDivisionError: division by zero`). | ```text
[Runtime Error] Line 1, Col 5: Division or modulo by zero is undefined.
  1 | 100 / (5 - 5)
          ^
  Hint: Division by zero is undefined. Ensure the divisor expression evaluates to a non-zero number.
``` |

> 💔 **Final Hugot Comparison:**
> *"Sa **C++**, pag nag-divide by zero ka, bigla na lang mag-ca-crash (`core dumped`) nang walang paliwanag—parang siya na bigla na lang nanlamig at nang-iwan sa ere. Sa **PLang**, kahit magkamali ka, hinding-hindi ka niya i-ca-crash: ituturo pa niya kung saang `Line` at `Col` may mali at bibigyan ka pa ng `Hint` kung paano ayusin. Choose PLang—mas maayos pa mag-handle ng error kaysa sa ex mo."*
