import React from 'react';
import { Code2, BookOpen, Terminal, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PRESET_PROGRAMS } from '../data/themes';

export default function Navbar({ activeTab, setActiveTab, activePreset, onSelectPreset }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative px-3 py-1.5 bg-slate-900 rounded-lg flex items-center space-x-2 border border-slate-800">
                <Code2 className="w-6 h-6 text-cyan-400" />
                <span className="font-mono font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  PLang
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  v2.0
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 pl-3 border-l border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Readable • Writable • Reliable</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('ide')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'ide'
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">Web IDE & REPL</span>
            </button>

            <button
              onClick={() => setActiveTab('handbook')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'handbook'
                  ? 'bg-slate-800 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Language Specification</span>
            </button>

            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'analysis'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">PL Evaluation (3 Pillars)</span>
            </button>
          </nav>

          {/* Preset Program Selector */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={activePreset?.id || 'integer_arithmetic'}
                onChange={(e) => onSelectPreset(PRESET_PROGRAMS[e.target.value])}
                className="bg-slate-900 text-slate-200 text-xs sm:text-sm font-mono rounded-lg px-3 py-1.5 pr-8 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer shadow-inner"
              >
                {Object.values(PRESET_PROGRAMS).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
