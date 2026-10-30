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
      { type: 'banner', text: `Loaded example: ${newPreset.name}` }
    ]);
  };

  const handleRunCode = (sourceOverride = null) => {
    const sourceToRun = typeof sourceOverride === 'string' ? sourceOverride : code;
    const rawLines = sourceToRun.split(/\r?\n/);
    const collectedTokens = [];
    const collectedStmts = [];
    const newLogs = [...logs];
    const interpreter = new Interpreter(PLANG_CONFIG, variables, sourceToRun);
    let executedAny = false;
    let hadError = false;

    for (let idx = 0; idx < rawLines.length; idx += 1) {
      const lineNum = idx + 1;
      const rawLine = rawLines[idx];
      const paddedSource = '\n'.repeat(lineNum - 1) + rawLine;

      try {
        const lineToks = tokenize(paddedSource, PLANG_CONFIG);
        const nonNewlineToks = lineToks.filter((t) => t.type !== 'NEWLINE');
        if (nonNewlineToks.length <= 1) {
          continue;
        }

        executedAny = true;
        collectedTokens.push(...nonNewlineToks.filter((t) => t.type !== 'EOF'));

        const parser = new Parser(lineToks, PLANG_CONFIG, paddedSource);
        parser.skipNewlines();
        const stmt = parser.parseStatement();
        if (!['EOF', 'NEWLINE'].includes(parser.currentToken().type)) {
          parser.raiseTrailingTokenError(parser.currentToken());
        }
        collectedStmts.push(stmt);

        interpreter.sourceLines = paddedSource.split(/\r?\n/);
        const prevOutCount = interpreter.outputs.length;
        const res = interpreter.evaluateStatement(stmt);
        for (let o = prevOutCount; o < interpreter.outputs.length; o += 1) {
          newLogs.push({
            type: interpreter.outputs[o].type,
            text: interpreter.outputs[o].text
          });
        }
        if (res !== null && res !== undefined) {
          newLogs.push({
            type: 'print',
            text: `${PLANG_CONFIG.print_prefix}${res}`
          });
        }
      } catch (err) {
        hadError = true;
        const formatted = formatError(err, PLANG_CONFIG);
        newLogs.push({ type: 'error', text: formatted });
      }
    }

    if (!executedAny && !hadError) {
      return;
    }

    setTokens(collectedTokens);
    setAstStatements(collectedStmts);
    setVariables({ ...interpreter.variables });

    if (
      executedAny &&
      !hadError &&
      interpreter.outputs.length === 0 &&
      newLogs.length === logs.length
    ) {
      newLogs.push({
        type: 'print',
        text: `${PLANG_CONFIG.print_prefix}Statements executed — variables updated`
      });
    }

    setLogs(newLogs);
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
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePreset={activePreset}
        onSelectPreset={handlePresetChange}
      />

      <main className="flex-1">
        {activeTab === 'ide' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[520px]">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[300px]">
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

      <footer className="border-t border-slate-900 bg-[#0B0F17] py-3 text-center text-xs text-slate-500 font-mono">
        <p>PLang v2.0 • CMPSC 132 Programming Languages</p>
      </footer>
    </div>
  );
}
