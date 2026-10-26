import React, { useState } from 'react';
import Navbar from './components/Navbar';
import EditorPane from './components/EditorPane';
import ConsolePane from './components/ConsolePane';
import ASTVisualizer from './components/ASTVisualizer';
import StateInspector from './components/StateInspector';
import Handbook from './components/Handbook';
import ArchitectureAnalysis from './components/ArchitectureAnalysis';

import { PLANG_CONFIG, PRESET_PROGRAMS } from './data/themes';
import { tokenize, Parser, Interpreter, formatError } from './engine/interpreter';

export default function App() {
  const [activeTab, setActiveTab] = useState('ide');
  const [activePreset, setActivePreset] = useState(PRESET_PROGRAMS.integer_arithmetic);
  const [code, setCode] = useState(PRESET_PROGRAMS.integer_arithmetic.sampleCode);

  const [logs, setLogs] = useState([]);
  const [variables, setVariables] = useState({});
  const [astStatements, setAstStatements] = useState([]);
  const [tokens, setTokens] = useState([]);

  const handlePresetChange = (newPreset) => {
    setActivePreset(newPreset);
    setCode(newPreset.sampleCode || '');
    setLogs((prev) => [
      ...prev,
      { type: 'banner', text: `[Loaded Example: ${newPreset.name}]` }
    ]);
  };

  const handleRunCode = (sourceOverride = null) => {
    const sourceToRun = typeof sourceOverride === 'string' ? sourceOverride : code;
    try {
      const toks = tokenize(sourceToRun, PLANG_CONFIG);
      setTokens(toks);

      if (toks.length <= 1) {
        return;
      }

      const parser = new Parser(toks, PLANG_CONFIG, sourceToRun);
      const stmts = parser.parseProgram();
      setAstStatements(stmts);

      const interpreter = new Interpreter(PLANG_CONFIG, variables, sourceToRun);
      for (const stmt of stmts) {
        const res = interpreter.evaluateStatement(stmt);
        if (res !== null && res !== undefined) {
          interpreter.outputs.push({
            type: 'print',
            text: `${PLANG_CONFIG.print_prefix}${res}`,
            value: res
          });
        }
      }

      setVariables(interpreter.variables);

      const newLogs = [...logs];
      for (const out of interpreter.outputs) {
        newLogs.push({ type: out.type, text: out.text });
      }
      if (interpreter.outputs.length === 0) {
        newLogs.push({
          type: 'print',
          text: `${PLANG_CONFIG.print_prefix}[Statements executed — variables updated]`
        });
      }
      setLogs(newLogs);
    } catch (err) {
      const formatted = formatError(err, PLANG_CONFIG);
      setLogs((prev) => [...prev, { type: 'error', text: formatted }]);
    }
  };

  const handleExecuteSingleLine = (line) => {
    try {
      const toks = tokenize(line, PLANG_CONFIG);
      if (toks.length <= 1) return;
      setTokens(toks);

      const parser = new Parser(toks, PLANG_CONFIG, line);
      const stmt = parser.parseStatement();
      if (!['EOF', 'NEWLINE'].includes(parser.currentToken().type)) {
        parser.raiseTrailingTokenError(parser.currentToken());
      }
      setAstStatements([stmt]);

      const interpreter = new Interpreter(PLANG_CONFIG, variables, line);
      const res = interpreter.evaluateStatement(stmt);

      setVariables(interpreter.variables);

      const newLogs = [...logs, { type: 'input', text: line }];
      for (const out of interpreter.outputs) {
        newLogs.push({ type: out.type, text: out.text });
      }
      if (res !== null && res !== undefined) {
        newLogs.push({ type: 'print', text: `${PLANG_CONFIG.print_prefix}${res}` });
      }
      setLogs(newLogs);
    } catch (err) {
      const formatted = formatError(err, PLANG_CONFIG);
      setLogs((prev) => [
        ...prev,
        { type: 'input', text: line },
        { type: 'error', text: formatted }
      ]);
    }
  };

  const handleRunCodeInIDE = (sampleCode, presetObj = null) => {
    if (presetObj) setActivePreset(presetObj);
    setCode(sampleCode);
    setActiveTab('ide');
    setTimeout(() => {
      handleRunCode(sampleCode);
    }, 80);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePreset={activePreset}
        onSelectPreset={handlePresetChange}
      />

      <main className="flex-1">
        {activeTab === 'ide' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[580px]">
              <div className="lg:col-span-7 h-full">
                <EditorPane
                  code={code}
                  setCode={setCode}
                  onRun={() => handleRunCode()}
                  activeTheme={PLANG_CONFIG}
                  activePreset={activePreset}
                  onLoadSample={() => setCode(activePreset.sampleCode)}
                />
              </div>

              <div className="lg:col-span-5 h-full">
                <ConsolePane
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                  activeTheme={PLANG_CONFIG}
                  onExecuteSingleLine={handleExecuteSingleLine}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[320px]">
              <div className="lg:col-span-7 h-full">
                <ASTVisualizer astStatements={astStatements} tokens={tokens} />
              </div>

              <div className="lg:col-span-5 h-full">
                <StateInspector
                  variables={variables}
                  onResetState={() => setVariables({})}
                  activeTheme={PLANG_CONFIG}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'handbook' && (
          <Handbook onRunCodeInIDE={handleRunCodeInIDE} />
        )}

        {activeTab === 'analysis' && <ArchitectureAnalysis />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        <p>PLang v2.0 Arithmetic Language Studio • CMPSC 132 Final Project (Readability, Writability & Reliability)</p>
      </footer>
    </div>
  );
}
