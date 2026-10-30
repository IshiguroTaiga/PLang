import React, { useState, useRef, useEffect } from 'react';

export default function ConsolePane({ logs, onClearLogs, onExecuteSingleLine }) {
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
    <div className="bg-[#111622] rounded-xl border border-slate-800/90 overflow-hidden flex flex-col h-full">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D111A] border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-medium text-slate-200">
            Console Output & REPL
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            Ready
          </span>
        </div>

        <button
          onClick={onClearLogs}
          className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700/80 transition"
        >
          Clear
        </button>
      </div>

      {/* Terminal Content Stream */}
      <div className="flex-1 bg-[#0B0F17] font-mono text-xs p-4 overflow-y-auto space-y-2">
        {logs.length === 0 ? (
          <div className="text-slate-500 py-6 text-xs font-sans">
            Click <strong className="text-slate-300">Run Script</strong> to execute the editor code, or type a single line in the <code className="text-purple-300 font-mono">plang&gt;</code> prompt below.
          </div>
        ) : (
          logs.map((log, index) => {
            if (log.type === 'banner') {
              return (
                <div key={index} className="text-purple-300/90 text-[11px] border-b border-slate-800/80 pb-1 pt-1">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'input') {
              return (
                <div key={index} className="flex items-center space-x-2 text-slate-200 pt-1">
                  <span className="text-purple-400 font-semibold">plang&gt;</span>
                  <span>{log.text}</span>
                </div>
              );
            }
            if (log.type === 'print') {
              return (
                <div key={index} className="px-3 py-1.5 rounded-md bg-emerald-950/25 border border-emerald-800/40 text-emerald-300 whitespace-pre-wrap">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'error') {
              return (
                <div key={index} className="p-3 rounded-md bg-rose-950/30 border border-rose-800/50 text-rose-200 overflow-x-auto">
                  <pre className="whitespace-pre font-mono text-[11px] leading-relaxed">
                    {log.text}
                  </pre>
                </div>
              );
            }
            if (log.type === 'clear') {
              return (
                <div key={index} className="text-slate-400 text-[11px]">
                  {log.text}
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
      <form onSubmit={handleSubmit} className="p-2.5 bg-[#0D111A] border-t border-slate-800/80 flex items-center space-x-2">
        <span className="font-mono text-purple-400 font-semibold pl-2 text-xs">plang&gt;</span>
        <input
          type="text"
          value={inputLine}
          onChange={(e) => setInputLine(e.target.value)}
          placeholder="Type an expression (e.g. let x = 10 + 5, print x, vars)..."
          className="flex-1 bg-[#0B0F17] text-slate-100 text-xs font-mono rounded-md px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}
