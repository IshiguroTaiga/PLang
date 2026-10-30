import React, { useState } from 'react';

function renderASTNode(node, depth = 0, idxKey = '0') {
  if (!node) return null;

  const indent = '  '.repeat(depth);

  if (node.type === 'NumberNode') {
    const dtype = Number.isInteger(node.value) ? 'int' : 'float';
    return (
      <div key={idxKey} className="text-slate-300 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="text-purple-300 font-semibold">NumberNode</span>({node.value} : {dtype})
      </div>
    );
  }

  if (node.type === 'VarNode') {
    return (
      <div key={idxKey} className="text-slate-300 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="text-purple-300 font-semibold">VarNode</span>('{node.name}')
      </div>
    );
  }

  if (node.type === 'AssignNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-slate-200 font-semibold">
          <span className="text-slate-600">{indent}└── </span>
          <span className="text-purple-400">AssignNode</span>('{node.name}' {node.op || '='})
        </div>
        {renderASTNode(node.expr, depth + 1, `${idxKey}-0`)}
      </div>
    );
  }

  if (node.type === 'PrintNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-slate-200 font-semibold">
          <span className="text-slate-600">{indent}└── </span>
          <span className="text-purple-400">PrintNode</span>
        </div>
        {renderASTNode(node.expr, depth + 1, `${idxKey}-0`)}
      </div>
    );
  }

  if (node.type === 'ClearNode') {
    return (
      <div key={idxKey} className="text-slate-300 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="text-purple-400 font-semibold">ClearNode</span>
      </div>
    );
  }

  if (node.type === 'VarsNode') {
    return (
      <div key={idxKey} className="text-slate-300 font-mono text-xs py-0.5">
        <span className="text-slate-600">{indent}└── </span>
        <span className="text-purple-400 font-semibold">VarsNode</span>
      </div>
    );
  }

  if (node.type === 'FuncCallNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-slate-200 font-semibold">
          <span className="text-slate-600">{indent}└── </span>
          <span className="text-purple-400">FuncCallNode</span>('{node.funcName}')
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
        <div className="text-slate-200 font-semibold">
          <span className="text-slate-600">{indent}└── </span>
          <span className="text-purple-400">BinOpNode</span>[{node.op.toUpperCase()}]
        </div>
        {renderASTNode(node.left, depth + 1, `${idxKey}-L`)}
        {renderASTNode(node.right, depth + 1, `${idxKey}-R`)}
      </div>
    );
  }

  if (node.type === 'UnaryOpNode') {
    return (
      <div key={idxKey} className="font-mono text-xs py-0.5">
        <div className="text-slate-200 font-semibold">
          <span className="text-slate-600">{indent}└── </span>
          <span className="text-purple-400">UnaryOpNode</span>[{node.op.toUpperCase()}]
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
  const [viewMode, setViewMode] = useState('ast');

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800/90 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D111A] border-b border-slate-800/80">
        <h3 className="font-mono text-xs font-medium text-slate-200">
          Parser AST & Lexer Tokens
        </h3>

        <div className="flex items-center space-x-1 bg-[#111622] p-0.5 rounded-md border border-slate-800">
          <button
            onClick={() => setViewMode('ast')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
              viewMode === 'ast'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AST ({astStatements ? astStatements.length : 0})
          </button>
          <button
            onClick={() => setViewMode('tokens')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
              viewMode === 'tokens'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tokens ({tokens ? tokens.length : 0})
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#0B0F17] p-4 overflow-y-auto">
        {viewMode === 'ast' ? (
          !astStatements || astStatements.length === 0 ? (
            <div className="text-slate-500 text-xs">
              Run a script to view its Abstract Syntax Tree (AST).
            </div>
          ) : (
            <div className="space-y-3">
              {astStatements.map((stmt, idx) => (
                <div key={idx} className="border-b border-slate-800/60 last:border-0 pb-2">
                  <div className="text-[11px] font-mono text-slate-500 mb-1">
                    Statement #{idx + 1} (Line {stmt.line})
                  </div>
                  {renderASTNode(stmt, 0, String(idx))}
                </div>
              ))}
            </div>
          )
        ) : !tokens || tokens.length === 0 ? (
          <div className="text-slate-500 text-xs">
            Run a script to inspect the lexical token stream.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="pb-2">Token Type</th>
                <th className="pb-2">Lexeme</th>
                <th className="pb-2 text-right">Line:Col</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tokens.map((tok, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-purple-300 font-semibold">{tok.type}</td>
                  <td className="py-1.5 text-slate-200">
                    {tok.type === 'NEWLINE' ? '\\n' : tok.value}
                  </td>
                  <td className="py-1.5 text-slate-500 text-right">
                    {tok.line}:{tok.column}
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
