import React from 'react';

export default function EditorPane({ code, setCode, onRun, activePreset, onLoadSample }) {
  const lines = code.split('\n');

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800/90 overflow-hidden flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D111A] border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <span className="font-mono text-xs text-slate-200 font-medium">
            main.plang
          </span>
          {activePreset && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
              {activePreset.name}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onLoadSample}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
            title="Reset code to the selected example"
          >
            Reset
          </button>

          <button
            onClick={() => setCode('')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition"
            title="Clear editor"
          >
            Clear
          </button>

          <button
            onClick={onRun}
            className="px-4 py-1 rounded-md text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
          >
            Run Script
          </button>
        </div>
      </div>

      {/* Simple Syntax Reference Bar */}
      <div className="bg-[#0D111A]/60 px-4 py-1.5 border-b border-slate-800/60 overflow-x-auto flex items-center space-x-2 text-[11px] font-mono text-slate-400">
        <span className="text-slate-500 font-sans text-[11px] shrink-0">Quick syntax:</span>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          let x = 10
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          + - * / // % ^
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-slate-800 shrink-0">
          add sub mul div mod pow
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          abs() sqrt() min() max()
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          print / vars / clear
        </span>
      </div>

      {/* Editor Content Area */}
      <div className="relative flex-1 flex bg-[#0B0F17] font-mono text-sm overflow-hidden">
        <div className="w-11 bg-[#0B0F17] text-slate-600 py-3 pr-2.5 text-right select-none border-r border-slate-800/60 text-xs shrink-0">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="# Write your PLang code here...\nlet x = 10 + 5\nprint x"
          spellCheck="false"
          className="w-full h-full bg-transparent text-slate-100 p-3 leading-6 resize-none focus:outline-none font-mono caret-purple-400 selection:bg-purple-900/50"
        />
      </div>

      {/* Footer Info */}
      <div className="px-4 py-1.5 bg-[#0D111A] border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <div>
          <span>{lines.length} lines</span>
          <span className="mx-2">•</span>
          <span>{code.length} chars</span>
        </div>
        <span className="text-slate-400">PLang v2.0</span>
      </div>
    </div>
  );
}
