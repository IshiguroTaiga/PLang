import React from 'react';
import { Play, RotateCcw, FileText, Sparkles, Code2 } from 'lucide-react';

export default function EditorPane({ code, setCode, onRun, activePreset, onLoadSample }) {
  const lines = code.split('\n');

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="font-mono text-xs text-slate-400 font-semibold flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>main.plang</span>
          </span>
          {activePreset && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              {activePreset.badge}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onLoadSample}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Reset to selected preset script"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Preset</span>
          </button>

          <button
            onClick={() => setCode('')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            title="Clear Editor"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRun}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/30 transition transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run Script</span>
          </button>
        </div>
      </div>

      {/* Unified Syntax Reference Bar */}
      <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-800/80 overflow-x-auto flex items-center space-x-2 text-[11px] font-mono">
        <span className="text-slate-400 font-sans font-medium uppercase tracking-wider text-[10px] shrink-0">
          Syntax:
        </span>
        <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 shrink-0">
          let x = 10
        </span>
        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 shrink-0">
          + - * / // % ^
        </span>
        <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 shrink-0">
          add sub mul div mod pow
        </span>
        <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 shrink-0">
          abs() sqrt() min() max()
        </span>
        <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 shrink-0">
          print / vars / clear
        </span>
      </div>

      {/* Editor Content Area */}
      <div className="relative flex-1 flex bg-slate-950 font-mono text-sm overflow-hidden">
        <div className="w-12 bg-slate-950 text-slate-600 py-3 pr-2 text-right select-none border-r border-slate-800/60 text-xs shrink-0">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="# Enter your PLang code here...\nlet x = 10 + 5\nprint x"
          spellCheck="false"
          className="w-full h-full bg-transparent text-slate-100 p-3 leading-6 resize-none focus:outline-none font-mono caret-cyan-400 selection:bg-cyan-900/60"
        />
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span>Lines: {lines.length}</span>
          <span className="mx-2">•</span>
          <span>Chars: {code.length}</span>
        </div>
        <div className="flex items-center space-x-1 text-cyan-400">
          <Code2 className="w-3.5 h-3.5" />
          <span>PLang v2.0 Recursive-Descent Parser Ready</span>
        </div>
      </div>
    </div>
  );
}
