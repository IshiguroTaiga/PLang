import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Send, AlertOctagon, CheckCircle, Info } from 'lucide-react';

export default function ConsolePane({ logs, onClearLogs, activeTheme, onExecuteSingleLine }) {
  const [inputLine, setInputLine] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputLine.trim()) return;
    onExecuteSingleLine(inputLine);
    setInputLine('');
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">
            PLang Runtime Output & Interactive REPL
          </span>
        </div>

        <button
          onClick={onClearLogs}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition"
          title="Clear Console"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Terminal Content Stream */}
      <div className="flex-1 bg-slate-950 font-mono text-xs p-4 overflow-y-auto space-y-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-start space-x-3">
          <span className="text-xl font-bold text-cyan-400 select-none">{activeTheme.avatar}</span>
          <div>
            <div className="font-bold text-slate-200 flex items-center space-x-2">
              <span>{activeTheme.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                Ready
              </span>
            </div>
            <p className="text-slate-400 mt-0.5 text-[11px]">{activeTheme.banner}</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-8 italic font-sans">
            Click "Run Script" or enter a statement in the REPL prompt below.
          </div>
        ) : (
          logs.map((log, index) => {
            if (log.type === 'banner') {
              return (
                <div key={index} className="text-cyan-400/80 font-semibold border-b border-slate-800 pb-1">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'input') {
              return (
                <div key={index} className="flex items-center space-x-2 text-cyan-400 font-bold">
                  <span className="text-slate-500">plang&gt;</span>
                  <span>{log.text}</span>
                </div>
              );
            }
            if (log.type === 'print') {
              return (
                <div key={index} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 font-semibold flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap">{log.text}</span>
                </div>
              );
            }
            if (log.type === 'error') {
              return (
                <div key={index} className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start space-x-2.5 shadow-lg">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="w-full overflow-x-auto">
                    <div className="font-bold text-rose-300 text-xs">
                      PLang Diagnostic Error
                    </div>
                    <pre className="mt-1 whitespace-pre font-mono text-[11px] leading-relaxed text-rose-100">
                      {log.text}
                    </pre>
                  </div>
                </div>
              );
            }
            if (log.type === 'clear') {
              return (
                <div key={index} className="text-amber-400 italic text-[11px] flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>{log.text}</span>
                </div>
              );
            }
            return (
              <div key={index} className="text-slate-300">
                {log.text}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* REPL Direct Prompt Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
        <span className="font-mono text-cyan-400 font-bold pl-2 text-xs">plang&gt;</span>
        <input
          type="text"
          value={inputLine}
          onChange={(e) => setInputLine(e.target.value)}
          placeholder="Type statement (e.g. let x = 10 + 5, print x, sqrt(81), vars, clear)..."
          className="flex-1 bg-slate-900 text-slate-100 text-xs font-mono rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
