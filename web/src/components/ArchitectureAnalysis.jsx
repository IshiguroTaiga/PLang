import React from 'react';
import { CheckCircle2, Eye, Code, ShieldCheck, Layers, Award } from 'lucide-react';

export default function ArchitectureAnalysis() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title Hero */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center space-x-3 mb-4">
          <Award className="w-8 h-8 text-amber-400" />
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold px-2 py-1 bg-cyan-950/80 rounded border border-cyan-800/60">
            CMPSC 132 Language Evaluation Benchmark
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Programming Language Evaluation: Readability, Writability & Reliability
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          An architectural evaluation of <strong className="text-cyan-300 font-mono">PLang v2.0</strong> against Robert W. Sebesta's criteria for programming language design, demonstrating how eliminating character-based theme fragmentation in favor of a unified hybrid grammar achieves high reliability.
        </p>
      </div>

      {/* 3 Pillars Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Readability Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-cyan-500/30 p-6 shadow-xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Pillar 1
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">1. Readability</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The ease with which programs can be read and understood by a programmer.
            </p>
            <hr className="border-slate-800 my-4" />
            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Unified Orthogonality:</strong> Replaced multi-character roleplay dialects with a single, consistent grammar.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Explicit Declarations:</strong> Optional <code className="text-cyan-300">let x = 10</code> clearly distinguishes variable binding from comparison.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Hybrid Operator Clarity:</strong> Supports both symbolic (<code className="text-cyan-300">//</code>, <code className="text-cyan-300">%</code>) and English (<code className="text-purple-300">div</code>, <code className="text-purple-300">mod</code>) forms.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Writability Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-purple-500/30 p-6 shadow-xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/60">
                <Code className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Pillar 2
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">2. Writability</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The ease with which a language can be used to create programs for a chosen problem domain.
            </p>
            <hr className="border-slate-800 my-4" />
            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Concise Expressiveness:</strong> Compound assignments (<code className="text-purple-300">+=</code>, <code className="text-purple-300">-=</code>, <code className="text-purple-300">*=</code>, <code className="text-purple-300">/=</code>) reduce repetitive code.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Built-in Math Library:</strong> Direct support for <code className="text-amber-300">abs()</code>, <code className="text-amber-300">sqrt()</code>, <code className="text-amber-300">min()</code>, <code className="text-amber-300">max()</code>, and <code className="text-amber-300">round()</code>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Stateful REPL & <code className="text-cyan-300">ans</code>:</strong> Automatically stores the last result in <code className="text-cyan-300">ans</code> for rapid chaining.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Reliability Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-emerald-500/30 p-6 shadow-xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Pillar 3
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">3. Reliability</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Conformance to specifications under all conditions, directly reinforced by Readability and Writability.
            </p>
            <hr className="border-slate-800 my-4" />
            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Exact Integer Preservation:</strong> Integer operations (<code className="text-emerald-300">+</code>, <code className="text-emerald-300">-</code>, <code className="text-emerald-300">*</code>, <code className="text-emerald-300">//</code>, <code className="text-emerald-300">%</code>, <code className="text-emerald-300">^</code>) preserve exact integer types.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Visual Caret Diagnostics:</strong> Lexical, Syntax, and Runtime errors show line, column, <code className="text-rose-400">^</code> pointer, and hints.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Domain & Overflow Guards:</strong> Traps division by zero, negative square roots, and exponent overflow.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Architectural Pipeline */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-purple-400" />
          <span>Four-Stage Interpreter Architecture Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono text-center">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase text-cyan-400 font-bold">Stage 1</span>
            <div className="font-bold text-slate-200 text-sm">Source Input</div>
            <p className="text-[11px] text-slate-500 font-sans">CLI script (.plang), Interactive REPL, or Web IDE</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase text-purple-400 font-bold">Stage 2</span>
            <div className="font-bold text-slate-200 text-sm">Lexical Scanner</div>
            <p className="text-[11px] text-slate-500 font-sans">Regex tokenizer with malformed literal & symbol traps</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase text-emerald-400 font-bold">Stage 3</span>
            <div className="font-bold text-slate-200 text-sm">Recursive Parser</div>
            <p className="text-[11px] text-slate-500 font-sans">Builds precedence-correct AST & validates statement format</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase text-amber-400 font-bold">Stage 4</span>
            <div className="font-bold text-slate-200 text-sm">AST Evaluator</div>
            <p className="text-[11px] text-slate-500 font-sans">Tree-walk interpreter with symbol table & runtime guards</p>
          </div>
        </div>
      </div>
    </div>
  );
}
