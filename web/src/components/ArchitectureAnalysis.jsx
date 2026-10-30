import React from 'react';

export default function ArchitectureAnalysis() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#111622] rounded-xl border border-slate-800/90 p-6">
        <span className="text-[11px] font-mono text-purple-300 px-2 py-0.5 bg-purple-950/70 rounded border border-purple-800/50">
          CMPSC 132 Language Evaluation
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-3">
          Readability, Writability & Reliability
        </h1>
        <p className="text-sm text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
          How <strong className="text-purple-300 font-mono">PLang v2.0</strong> satisfies Robert W. Sebesta's programming language evaluation criteria and implements a zero <code className="text-purple-300 font-mono">if-else</code> / zero nested <code className="text-purple-300 font-mono">if</code> interpreter architecture.
        </p>
      </div>

      {/* 3 Pillars Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111622] rounded-xl border border-slate-800/90 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">1. Readability</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/50">
              Pillar 1
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The ease with which programs can be read and understood by a programmer.
          </p>
          <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
            <li>• <strong>Unified Grammar:</strong> One consistent syntax without conflicting dialects.</li>
            <li>• <strong>Explicit Declarations:</strong> Optional <code className="text-purple-300">let x = 10</code> clearly marks variable binding.</li>
            <li>• <strong>Hybrid Operators:</strong> Supports both symbolic (<code className="text-purple-300">//</code>, <code className="text-purple-300">%</code>) and English (<code className="text-purple-300">div</code>, <code className="text-purple-300">mod</code>) keywords.</li>
          </ul>
        </div>

        <div className="bg-[#111622] rounded-xl border border-slate-800/90 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">2. Writability</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/50">
              Pillar 2
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The ease with which a language can be used to create programs for a chosen domain.
          </p>
          <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
            <li>• <strong>Concise Updates:</strong> Compound assignments (<code className="text-purple-300">+=</code>, <code className="text-purple-300">-=</code>, <code className="text-purple-300">*=</code>, <code className="text-purple-300">/=</code>) reduce repetitive code.</li>
            <li>• <strong>Built-in Math Functions:</strong> Direct support for <code className="text-purple-300">abs()</code>, <code className="text-purple-300">sqrt()</code>, <code className="text-purple-300">min()</code>, <code className="text-purple-300">max()</code>, and <code className="text-purple-300">round()</code>.</li>
            <li>• <strong>Stateful <code className="text-purple-300">ans</code> Tracking:</strong> Automatically stores the last result in <code className="text-purple-300">ans</code>.</li>
          </ul>
        </div>

        <div className="bg-[#111622] rounded-xl border border-slate-800/90 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">3. Reliability</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/50">
              Pillar 3
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Conformance to specifications under all conditions, reinforced by Readability and Writability.
          </p>
          <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
            <li>• <strong>Exact Integer Preservation:</strong> Integer operations preserve exact integer types.</li>
            <li>• <strong>Caret Diagnostics:</strong> Errors show line, column, <code className="text-rose-400">^</code> pointer, and corrective hints.</li>
            <li>• <strong>Domain & Overflow Guards:</strong> Safely traps division by zero, negative square roots, and overflow.</li>
          </ul>
        </div>
      </div>

      {/* 4-Stage Pipeline */}
      <div className="bg-[#111622] rounded-xl border border-slate-800/90 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
          4-Stage Interpreter Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold">Stage 1</span>
            <div className="font-semibold text-slate-200">Source Input</div>
            <p className="text-slate-400 text-[11px]">CLI script (.plang), Interactive REPL, or Web IDE</p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold">Stage 2</span>
            <div className="font-semibold text-slate-200">Lexical Scanner</div>
            <p className="text-slate-400 text-[11px]">Regex tokenizer with malformed literal and symbol traps</p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold">Stage 3</span>
            <div className="font-semibold text-slate-200">Recursive Parser</div>
            <p className="text-slate-400 text-[11px]">Builds precedence-correct AST and validates statement format</p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold">Stage 4</span>
            <div className="font-semibold text-slate-200">Polymorphic Evaluator</div>
            <p className="text-slate-400 text-[11px]">Polymorphic AST + Dictionary Dispatch Tables</p>
          </div>
        </div>
      </div>

      {/* Zero If-Else & Zero Nested-If Architectural Highlight */}
      <div className="bg-[#111622] rounded-xl border border-slate-800/90 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
          Implementation Architecture: Zero if-else & Zero Nested if Design
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1.5">
            <div className="font-semibold text-purple-300">1. Polymorphic AST Dispatch</div>
            <p className="text-slate-400 leading-relaxed">
              Every <code className="text-slate-200">ASTNode</code> subclass implements its own <code className="text-purple-300">.evaluate()</code>, <code className="text-purple-300">.execute()</code>, and <code className="text-purple-300">.format_tree()</code> methods, eliminating <code className="text-rose-300">if-elif-else</code> type checks.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1.5">
            <div className="font-semibold text-purple-300">2. Dictionary Dispatch + operator Library</div>
            <p className="text-slate-400 leading-relaxed">
              Token handlers, statement parsers, built-in functions, and binary operators (<code className="text-purple-300">operator.add</code>, <code className="text-purple-300">operator.mul</code>, etc.) dispatch in O(1) via lookup tables.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1.5">
            <div className="font-semibold text-purple-300">3. Flat Guard Clauses</div>
            <p className="text-slate-400 leading-relaxed">
              All validation checks use single-level guard clauses that immediately <code className="text-slate-200">return</code> or <code className="text-slate-200">raise</code>, verified by automated AST inspection tests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
