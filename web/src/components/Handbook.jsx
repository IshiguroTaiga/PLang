import React, { useState } from 'react';
import { BookOpen, Search, Code, CheckCircle, ShieldCheck, Eye, Terminal, Play, Sparkles, Layers, ChevronRight } from 'lucide-react';
import { PRESET_PROGRAMS } from '../data/themes';

export default function Handbook({ onRunCodeInIDE }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const syntaxMatrix = [
    { op: 'Variable Declaration', sym: 'let x = 10', kw: 'x = 10', prec: 'Statement', desc: 'Binds evaluated expression to variable identifier in symbol table' },
    { op: 'Compound Assignment', sym: '+=, -=, *=, /=', kw: '—', prec: 'Statement', desc: 'Updates existing variable in place (Writability enhancement)' },
    { op: 'Addition', sym: 'a + b', kw: 'a add b', prec: 'Level 4 (Left)', desc: 'Adds two numeric operands (preserves integer type)' },
    { op: 'Subtraction', sym: 'a - b', kw: 'a sub b', prec: 'Level 4 (Left)', desc: 'Subtracts right operand from left operand' },
    { op: 'Multiplication', sym: 'a * b', kw: 'a mul b', prec: 'Level 3 (Left)', desc: 'Multiplies two numeric operands' },
    { op: 'True Division', sym: 'a / b', kw: '—', prec: 'Level 3 (Left)', desc: 'Floating-point division (traps division by zero)' },
    { op: 'Integer Floor Division', sym: 'a // b', kw: 'a div b', prec: 'Level 3 (Left)', desc: 'Exact integer quotient floor division (traps zero divisor)' },
    { op: 'Modulo (Remainder)', sym: 'a % b', kw: 'a mod b', prec: 'Level 3 (Left)', desc: 'Remainder of integer or floating-point division' },
    { op: 'Exponentiation', sym: 'a ^ b  or  a ** b', kw: 'a pow b', prec: 'Level 2 (Right)', desc: 'Right-associative power operation with overflow guard' },
    { op: 'Unary Sign', sym: '-x  or  +x', kw: 'sub x', prec: 'Level 1 (Prefix)', desc: 'Unary negation or identity prefix' },
    { op: 'Built-in Functions', sym: 'abs(x), sqrt(x), round(x)', kw: 'min(a,b), max(a,b)', prec: 'Level 0 (Primary)', desc: 'Validated mathematical functions with domain checking' },
    { op: 'Output Statement', sym: 'print(expr)', kw: 'print expr', prec: 'Statement', desc: 'Displays evaluated result prefixed with [OUT] =>' },
    { op: 'Environment Control', sym: 'vars', kw: 'clear', prec: 'Statement', desc: 'Inspects active symbol table or resets memory state' },
  ];

  const filteredSyntax = syntaxMatrix.filter(row =>
    row.op.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.sym.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.kw.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sticky top-24 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-200 text-sm">Specification Contents</h3>
          </div>

          <nav className="space-y-1 text-xs">
            {[
              { id: 'overview', label: '1. Language Design Vision' },
              { id: 'syntax', label: '2. Hybrid Syntax & Precedence' },
              { id: 'pillars', label: '3. PL Evaluation Criteria' },
              { id: 'ebnf', label: '4. Formal EBNF Grammar' },
              { id: 'demos', label: '5. Example Programs' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                  activeSection === item.id
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-8">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operators, keywords, functions, or grammar rules..."
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-4 py-3 border border-slate-800 focus:outline-none focus:border-purple-500 shadow-xl"
          />
        </div>

        {/* Section 1: Overview */}
        {(activeSection === 'overview' || searchQuery) && (
          <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-xl font-bold text-slate-100">PLang v2.0 Architectural Philosophy</h2>
                <p className="text-xs text-slate-400">Unified Hybrid Arithmetic Language for CMPSC 132</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              <strong className="text-cyan-400 font-mono">PLang v2.0</strong> is a clean, unified arithmetic programming language engineered around Robert W. Sebesta's core evaluation criteria: <strong>Readability</strong>, <strong>Writability</strong>, and <strong>Reliability</strong>. Rather than fragmenting syntax across conflicting roleplay themes (which harms orthogonality and readability), PLang provides a single deterministic hybrid syntax combining standard mathematical symbols with self-documenting English keywords.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-cyan-400 font-bold text-sm">1. Readability</div>
                <p className="text-xs text-slate-400 mt-1">Explicit <code className="text-cyan-300">let</code> bindings, natural infix order, and optional English keywords (<code className="text-purple-300">add</code>, <code className="text-purple-300">div</code>, <code className="text-purple-300">mod</code>).</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-purple-400 font-bold text-sm">2. Writability</div>
                <p className="text-xs text-slate-400 mt-1">Zero boilerplate, compound assignments (<code className="text-purple-300">+=</code>, <code className="text-purple-300">*=</code>), built-in math functions, and automatic <code className="text-amber-300">ans</code> tracking.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-emerald-400 font-bold text-sm">3. Reliability</div>
                <p className="text-xs text-slate-400 mt-1">Exact integer preservation, strict operator precedence, and visual caret (<code className="text-rose-400">^</code>) error diagnostics.</p>
              </div>
            </div>
          </section>
        )}

        {/* Section 2: Syntax Table */}
        {(activeSection === 'syntax' || searchQuery) && (
          <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-slate-100">Unified Hybrid Syntax & Precedence Table</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">PLang v2.0 Specification</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3">Construct / Operation</th>
                    <th className="py-3 px-3 text-cyan-400">Symbolic Form</th>
                    <th className="py-3 px-3 text-purple-400">Keyword Form</th>
                    <th className="py-3 px-3 text-emerald-400">Precedence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSyntax.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                        {row.op}
                        <div className="text-[11px] text-slate-500 font-normal">{row.desc}</div>
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 font-bold">{row.sym}</td>
                      <td className="py-2.5 px-3 text-purple-300 font-bold">{row.kw}</td>
                      <td className="py-2.5 px-3 text-emerald-300">{row.prec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 3: Pillars */}
        {(activeSection === 'pillars' || searchQuery) && (
          <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>How Readability & Writability Achieve Reliability</span>
              </h2>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-base">
                <Eye className="w-5 h-5" />
                <span>1. Readability (Simplicity & Orthogonality)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By eliminating arbitrary character-based slang and standardizing on a single hybrid grammar, any programmer can immediately read a PLang script without consulting a translation table. Explicit <code className="text-cyan-300">let</code> declarations and English operators (<code className="text-purple-300">div</code>, <code className="text-purple-300">mod</code>) make integer division vs. floating-point division unmistakable.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-base">
                <Code className="w-5 h-5" />
                <span>2. Writability (Conciseness & Expressiveness)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Programmers can write expressions directly without class/function boilerplate. Compound assignments (<code className="text-purple-300">+=</code>, <code className="text-purple-300">-=</code>, <code className="text-purple-300">*=</code>), built-in math functions (<code className="text-amber-300">sqrt</code>, <code className="text-amber-300">abs</code>, <code className="text-amber-300">min</code>, <code className="text-amber-300">max</code>), and the automatic <code className="text-cyan-300">ans</code> variable streamline interactive problem-solving.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>3. Reliability (Predictable Semantics & Error Trapping)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Because syntax is readable and writable, programmers make fewer mistakes. When format or runtime errors do occur—such as malformed numbers (<code className="text-rose-300">12.3.4</code>), missing operands (<code className="text-rose-300">10 + * 5</code>), unbalanced parentheses, undefined variables, or division by zero—PLang traps the error cleanly and displays the exact line, column, visual caret pointer (<code className="text-rose-400">^</code>), and corrective hint.
              </p>
            </div>
          </section>
        )}

        {/* Section 4: EBNF */}
        {(activeSection === 'ebnf' || searchQuery) && (
          <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-100">Formal EBNF Grammar Specification</h2>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
              <pre>{`Program     ::= Statement* EOF
Statement   ::= LetStmt | AssignStmt | PrintStmt | ClearStmt | VarsStmt | ExprStmt
LetStmt     ::= "let" IDENT "=" Expr
AssignStmt  ::= IDENT ( "=" | "+=" | "-=" | "*=" | "/=" ) Expr
PrintStmt   ::= "print" Expr
ClearStmt   ::= "clear"
VarsStmt    ::= "vars"
ExprStmt    ::= Expr

Expr        ::= Term ( ( "+" | "-" | "add" | "sub" ) Term )*
Term        ::= Exponent ( ( "*" | "/" | "//" | "%" | "mul" | "div" | "mod" ) Exponent )*
Exponent    ::= Unary ( ( "^" | "**" | "pow" ) Exponent )?     (* Right-Associative *)
Unary       ::= ( "+" | "-" | "sub" ) Unary | Primary
Primary     ::= NUMBER
              | IDENT "(" ( Expr ( "," Expr )* )? ")"
              | IDENT
              | "(" Expr ")"`}</pre>
            </div>
          </section>
        )}

        {/* Section 5: Demos */}
        {(activeSection === 'demos' || searchQuery) && (
          <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-slate-100">Curated Example Programs</h2>
              </div>
              <span className="text-xs text-slate-400">Click to load & execute in Web IDE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(PRESET_PROGRAMS).map((preset) => (
                <div key={preset.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-200">{preset.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
                    <div className="mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
                      <pre>{preset.sampleCode}</pre>
                    </div>
                  </div>

                  <button
                    onClick={() => onRunCodeInIDE(preset.sampleCode, preset)}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold font-mono border border-slate-700 flex items-center justify-center space-x-2 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-cyan-400" />
                    <span>Load & Run in IDE</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
