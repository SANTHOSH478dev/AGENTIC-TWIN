import React from 'react';
import { 
  Activity, 
  Calendar, 
  Bot, 
  ShieldCheck, 
  BrainCircuit, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Sun,
  Moon,
  User,
  Mic
} from 'lucide-react';

const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  twinState, 
  conflictsCount, 
  pendingPolicyCount, 
  onOpenVoiceModal, 
  onOpenProfileModal,
  theme,
  onToggleTheme,
  user
}) => {
  const tabs = [
    { id: 'twin', label: 'Twin State', icon: Activity },
    { id: 'schedule', label: 'Daily Schedule', icon: Calendar },
    { id: 'planner', label: 'Agentic AI Planner', icon: Bot },
    { id: 'policy', label: 'Policy & Consent', icon: ShieldCheck, badge: pendingPolicyCount },
    { id: 'memory', label: 'Memory & Rules', icon: BrainCircuit },
    { id: 'ablation', label: 'Benchmark Lab', icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b101d]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Product Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-xs font-mono tracking-tighter">
            PDT
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Personal Digital Twin
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-bold">
                PRO-V1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-normal">Predictive Daily Resource Optimization Engine</p>
          </div>
        </div>

        {/* Status Badges & Interactive Controls */}
        <div className="flex items-center space-x-2.5 text-xs font-medium">
          {/* Twin Synced Status */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px]">Twin Synced</span>
          </div>

          {/* Forecasted Conflicts */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border ${
            conflictsCount > 0 
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' 
              : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px]">{conflictsCount} Conflict{conflictsCount !== 1 ? 's' : ''} Forecasted</span>
          </div>

          {/* Pending Consent */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border ${
            pendingPolicyCount > 0 
              ? 'bg-sky-950/60 text-sky-300 border-sky-800/60' 
              : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
          }`}>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px]">{pendingPolicyCount} Pending Consent</span>
          </div>

          {/* Voice Assistant Button */}
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold transition-all shadow-md shadow-cyan-500/10"
            title="Open Voice AI Assistant"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px]">Voice AI</span>
          </button>

          {/* Theme & Profile controls */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
            <button 
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors" 
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            <button 
              onClick={onOpenProfileModal}
              className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 hover:bg-cyan-900 transition-colors"
              title="User Profile & Settings"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto mt-2.5 border-t border-slate-800/60 pt-2">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-500 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
