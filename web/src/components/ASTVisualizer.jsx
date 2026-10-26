import React from 'react';
import { Layers, Binary, ChevronRight } from 'lucide-react';

function renderASTNode(node, depth = 0, idxKey = '0') {
  if (!node) return null;

  const indent = '  '.repeat(depth);

  if (node.type === 'NumberNode') {
    const dtype = Number.isInteger(node.value) ? 'int' : 'float';
    return (
      <div key={idxKey} className="text-cyan-300 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="font-bold text-amber-400">NumberNode</span>({node.value} : {dtype})
      </div>
    );
  }

  if (node.type === 'VarNode') {
    return (
      <div key={idxKey} className="text-purple-300 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="font-bold text-purple-400">VarNode</span>('{node.name}')
      </div>
    );
  }

  if (node.type === 'AssignNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-emerald-400 font-bold">
          <span className="text-slate-600">{indent}└── </span>
          <span>AssignNode</span>('{node.name}' {node.op || '='})
        </div>
        {renderASTNode(node.expr, depth + 1, `${idxKey}-0`)}
      </div>
    );
  }

  if (node.type === 'PrintNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-cyan-400 font-bold">
          <span className="text-slate-600">{indent}└── </span>
          <span>PrintNode</span>
        </div>
        {renderASTNode(node.expr, depth + 1, `${idxKey}-0`)}
      </div>
    );
  }

  if (node.type === 'ClearNode') {
    return (
      <div key={idxKey} className="text-rose-400 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="font-bold">ClearNode</span> (Reset Environment)
      </div>
    );
  }

  if (node.type === 'VarsNode') {
    return (
      <div key={idxKey} className="text-teal-400 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="font-bold">VarsNode</span> (Inspect Symbol Table)
      </div>
    );
  }

  if (node.type === 'FuncCallNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-pink-400 font-bold">
          <span className="text-slate-600">{indent}└── </span>
          <span>FuncCallNode</span>('{node.funcName}')
        </div>
        {(node.args || []).map((arg, i) =>
          renderASTNode(arg, depth + 1, `${idxKey}-${i}`)
        )}
      </div>
    );
  }

  if (node.type === 'BinOpNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-indigo-300 font-bold">
          <span className="text-slate-600">{indent}└── </span>
          <span>BinOpNode</span>[{node.op.toUpperCase()}]
        </div>
        {renderASTNode(node.left, depth + 1, `${idxKey}-L`)}
        {renderASTNode(node.right, depth + 1, `${idxKey}-R`)}
      </div>
    );
  }

  if (node.type === 'UnaryOpNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-amber-300 font-bold">
          <span className="text-slate-600">{indent}└── </span>
          <span>UnaryOpNode</span>[{node.op.toUpperCase()}]
        </div>
        {renderASTNode(node.expr, depth + 1, `${idxKey}-U`)}
      </div>
    );
  }

  return (
    <div key={idxKey} className="text-slate-400 font-mono text-xs">
      <span className="text-slate-600">{indent}└── </span>
      <span>{node.type || 'ASTNode'}</span>
    </div>
  );
}

export default function ASTVisualizer({ astStatements, tokens }) {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-3">
        <Layers className="w-4 h-4 text-purple-400" />
        <h3 className="font-mono text-xs font-semibold text-slate-200">
          AST & Lexical Token Inspector
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
            <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
            <span>Abstract Syntax Tree (AST)</span>
          </div>

          {!astStatements || astStatements.length === 0 ? (
            <div className="text-slate-600 text-xs italic">No AST generated yet. Run a script to inspect nodes.</div>
          ) : (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              {astStatements.map((stmt, idx) => (
                <div key={idx} className="border-b border-slate-900/80 last:border-0 pb-1">
                  <div className="text-[10px] font-mono text-slate-500 font-bold">
                    Statement #{idx + 1} (Line {stmt.line})
                  </div>
                  {renderASTNode(stmt, 0, String(idx))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
            <Binary className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lexer Tokens ({tokens ? tokens.length : 0})</span>
          </div>

          {!tokens || tokens.length === 0 ? (
            <div className="text-slate-600 text-xs italic">No tokens available.</div>
          ) : (
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="pb-1 px-1">Type</th>
                    <th className="pb-1 px-1">Lexeme</th>
                    <th className="pb-1 px-1 text-right">Line:Col</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {tokens.map((tok, i) => (
                    <tr key={i} className="hover:bg-slate-900/60">
                      <td className="py-1 px-1 text-cyan-400 font-bold">{tok.type}</td>
                      <td className="py-1 px-1 text-amber-300">
                        {tok.type === 'NEWLINE' ? '\\n' : tok.value}
                      </td>
                      <td className="py-1 px-1 text-slate-500 text-right">
                        {tok.line}:{tok.column}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
