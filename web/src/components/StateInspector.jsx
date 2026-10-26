import React from 'react';
import { Cpu, Trash2, Hash } from 'lucide-react';

export default function StateInspector({ variables, onResetState, activeTheme }) {
  const entries = Object.entries(variables);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs font-semibold text-slate-200">
            Environment State Monitor
          </h3>
        </div>

        <button
          onClick={onResetState}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 text-[11px] border border-slate-700 transition"
          title={`Reset memory (${activeTheme.keywords.clear})`}
        >
          <Trash2 className="w-3 h-3" />
          <span>{activeTheme.keywords.clear}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-slate-600 text-xs italic text-center py-6">
            No variables bound in environment.
            <br />
            Assign variables using <code className="text-cyan-400 font-mono">var {activeTheme.keywords.assign} expr</code>.
          </div>
        ) : (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Identifier</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {entries.map(([name, val]) => (
                  <tr key={name} className="hover:bg-slate-900/60 transition">
                    <td className="py-2 px-3 text-purple-300 font-bold flex items-center space-x-1">
                      <Hash className="w-3 h-3 text-purple-500" />
                      <span>{name}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {Number.isInteger(val) ? 'integer' : 'float'}
                    </td>
                    <td className="py-2 px-3 text-amber-400 font-bold text-right">
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
