import React from 'react';

export default function StateInspector({ variables, onResetState }) {
  const entries = Object.entries(variables);

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800/90 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D111A] border-b border-slate-800/80">
        <h3 className="font-mono text-xs font-medium text-slate-200">
          Environment State (Symbol Table)
        </h3>

        <button
          onClick={onResetState}
          className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700/80 transition"
          title="Clear all saved variables"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 bg-[#0B0F17] p-4 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-slate-500 text-xs">
            No variables defined yet. Use <code className="text-purple-300 font-mono">let x = 10</code> to store values.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-slate-500 border-b border-slate-800">
              <tr>
                <th className="pb-2">Identifier</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {entries.map(([name, val]) => (
                <tr key={name}>
                  <td className="py-2 text-purple-300 font-semibold">{name}</td>
                  <td className="py-2 text-slate-400">
                    {Number.isInteger(val) ? 'integer' : 'float'}
                  </td>
                  <td className="py-2 text-slate-100 font-semibold text-right">
                    {val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
