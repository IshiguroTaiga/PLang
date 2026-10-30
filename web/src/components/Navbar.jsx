import React from 'react';
import { PRESET_PROGRAMS } from '../data/themes';

export default function Navbar({ activeTab, setActiveTab, activePreset, onSelectPreset }) {
  return (
    <header className="sticky top-0 z-50 bg-[#0B0F17]/95 backdrop-blur border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-lg tracking-tight text-white">
                PLang
              </span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                v2.0
              </span>
            </div>

            <span className="hidden md:inline-block text-xs text-slate-400 pl-3 border-l border-slate-800">
              CMPSC 132 • Arithmetic Programming Language
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-[#111622] p-1 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setActiveTab('ide')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'ide'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IDE & REPL
            </button>

            <button
              onClick={() => setActiveTab('handbook')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'handbook'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Syntax Guide
            </button>

            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'analysis'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PL Evaluation
            </button>
          </nav>

          {/* Example Preset Selector */}
          <div className="flex items-center space-x-2">
            <span className="hidden lg:inline text-xs text-slate-400">Example:</span>
            <select
              value={activePreset?.id || 'integer_arithmetic'}
              onChange={(e) => onSelectPreset(PRESET_PROGRAMS[e.target.value])}
              className="bg-[#111622] text-slate-200 text-xs font-mono rounded-lg px-3 py-1.5 border border-slate-700/80 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {Object.values(PRESET_PROGRAMS).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
