import React, { useState } from 'react';
import { 
  Clock, 
  Brain, 
  Zap, 
  DollarSign, 
  Navigation, 
  Smartphone, 
  RefreshCw, 
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Info,
  ShieldCheck,
  TrendingUp,
  Target
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const TwinStateView = ({ twinState, onUpdateState, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...twinState });

  if (!twinState) return <div className="p-8 text-center text-slate-400">Loading Twin State...</div>;

  const handleSliderChange = (field, value) => {
    setFormData({ ...formData, [field]: parseFloat(value) });
  };

  const handleSave = async () => {
    await onUpdateState(formData);
    setIsEditing(false);
  };

  // Bar chart data matching screenshot colors
  const resourcesData = [
    { name: 'Attention', val: twinState.current_attention_load, color: '#00d2ff', max: 100 },
    { name: 'Energy', val: twinState.current_energy_level, color: '#9d4edd', max: 100 },
    { name: 'Budget Spent', val: twinState.current_budget_spent, color: '#ff9f1c', max: twinState.daily_budget_limit },
    { name: 'Travel Buffer', val: twinState.default_travel_buffer_mins, color: '#4361ee', max: 60 },
    { name: 'Digital Queue', val: twinState.digital_workload_demand, color: '#f72585', max: 100 },
  ];

  // AI Insights data derived from current twin state
  const insights = [
    {
      id: 1,
      icon: Brain,
      iconColor: 'text-indigo-400',
      title: 'Cognitive load is currently high.',
      subtitle: 'Consider scheduling low-focus tasks.',
      severity: 'High',
      badgeClass: 'badge-high'
    },
    {
      id: 2,
      icon: Zap,
      iconColor: 'text-amber-400',
      title: 'Energy reserve requires recovery time.',
      subtitle: 'Take short breaks to improve stamina.',
      severity: 'Medium',
      badgeClass: 'badge-medium'
    },
    {
      id: 3,
      icon: DollarSign,
      iconColor: 'text-emerald-400',
      title: 'Budget utilization is within daily limit.',
      subtitle: 'You are spending within your budget.',
      severity: 'Good',
      badgeClass: 'badge-good'
    },
    {
      id: 4,
      icon: Navigation,
      iconColor: 'text-sky-400',
      title: 'Travel buffer is sufficient.',
      subtitle: 'No immediate travel constraints.',
      severity: 'Good',
      badgeClass: 'badge-good'
    }
  ];

  return (
    <div className="space-y-5">
      {/* 1. Hero / Status Section */}
      <div className="saas-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Dynamic Multi-Resource Twin State
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Continuously synchronized operational state across time, attention, stamina, budget, and mobility constraints to optimize daily performance.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate State</span>
          </button>
          
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Twin</span>
          </button>
        </div>
      </div>

      {/* Simulator Modal Popover if Editing */}
      {isEditing && (
        <div className="saas-card p-5 space-y-4 border-cyan-500/40 bg-slate-900/90">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Simulate Context Changes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 flex justify-between">
                <span>Cognitive Attention Load</span>
                <span className="text-cyan-400 font-bold">{formData.current_attention_load}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={formData.current_attention_load}
                onChange={(e) => handleSliderChange('current_attention_load', e.target.value)}
                className="w-full mt-1.5 accent-cyan-400"
              />
            </div>
            <div>
              <label className="text-slate-300 flex justify-between">
                <span>Physical Energy Level</span>
                <span className="text-emerald-400 font-bold">{formData.current_energy_level}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={formData.current_energy_level}
                onChange={(e) => handleSliderChange('current_energy_level', e.target.value)}
                className="w-full mt-1.5 accent-emerald-400"
              />
            </div>
            <div>
              <label className="text-slate-300 flex justify-between">
                <span>Current Budget Spend ($)</span>
                <span className="text-amber-400 font-bold">${formData.current_budget_spent}</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="200" 
                step="5"
                value={formData.current_budget_spent}
                onChange={(e) => handleSliderChange('current_budget_spent', e.target.value)}
                className="w-full mt-1.5 accent-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-300 flex justify-between">
                <span>Travel Buffer (Minutes)</span>
                <span className="text-purple-400 font-bold">{formData.default_travel_buffer_mins} mins</span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="60" 
                step="5"
                value={formData.default_travel_buffer_mins}
                onChange={(e) => handleSliderChange('default_travel_buffer_mins', e.target.value)}
                className="w-full mt-1.5 accent-purple-400"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button onClick={() => setIsEditing(false)} className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs">
              Apply Simulation
            </button>
          </div>
        </div>
      )}

      {/* 2. 6 Resource KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: TIME CAPACITY */}
        <div className="saas-card p-4 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Time Capacity</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-100 font-mono">{twinState.total_time_capacity_mins} <span className="text-xs font-normal text-slate-400">mins</span></div>
            <p className="text-[10px] text-slate-400 mt-0.5">14 Working Hours</p>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: '87%' }}></div>
            </div>
            <div className="text-[9px] text-right font-mono text-cyan-400 font-bold">87%</div>
          </div>
        </div>

        {/* Card 2: COGNITIVE LOAD */}
        <div className="saas-card p-4 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cognitive Load</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-100 font-mono">{twinState.current_attention_load} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
            <p className="text-[10px] text-slate-400 mt-0.5">High Focus Load</p>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${twinState.current_attention_load}%` }}></div>
            </div>
            <div className="text-[9px] text-right font-mono text-indigo-400 font-bold">{twinState.current_attention_load}%</div>
          </div>
        </div>

        {/* Card 3: ENERGY STAMINA */}
        <div className="saas-card p-4 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Energy Stamina</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-100 font-mono">{twinState.current_energy_level}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Physical Pool</p>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${twinState.current_energy_level}%` }}></div>
            </div>
            <div className="text-[9px] text-right font-mono text-amber-400 font-bold">{twinState.current_energy_level}%</div>
          </div>
        </div>

        {/* Card 4: DAILY BUDGET */}
        <div className="saas-card p-4 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Daily Budget</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-100 font-mono">${twinState.current_budget_spent}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Limit: ${twinState.daily_budget_limit}</p>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '30%' }}></div>
            </div>
            <div className="text-[9px] text-right font-mono text-amber-400 font-bold">30%</div>
          </div>
        </div>

        {/* Card 5: MOBILITY BUFFER */}
        <div className="saas-card p-4 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <Navigation className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Mobility Buffer</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-100 font-mono">{twinState.default_travel_buffer_mins} <span className="text-xs font-normal text-slate-400">mins</span></div>
            <p className="text-[10px] text-slate-400 mt-0.5">Per Travel Task</p>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full" style={{ width: '40%' }}></div>
            </div>
            <div className="text-[9px] text-right font-mono text-sky-400 font-bold">40%</div>
          </div>
        </div>

        {/* Card 6: DIGITAL WORKLOAD */}
        <div className="saas-card p-4 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Digital Workload</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-100 font-mono">{twinState.digital_workload_demand}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Queue & Screen Time</p>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-pink-400 h-full rounded-full" style={{ width: `${twinState.digital_workload_demand}%` }}></div>
            </div>
            <div className="text-[9px] text-right font-mono text-pink-400 font-bold">48%</div>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid Section: Chart (Left) + Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Multi-Resource Demand Distribution Chart (7/12 width) */}
        <div className="lg:col-span-7 saas-card p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Multi-Resource Demand Distribution
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time utilization across core resources</p>
            </div>
            <button className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span>Today</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourcesData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }} 
                  formatter={(value) => [`${value}`, 'Demand']}
                />
                <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={36}>
                  {resourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Color Legend Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]"></span> Attention
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9d4edd]"></span> Energy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff9f1c]"></span> Budget Spent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4361ee]"></span> Travel Buffer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f72585]"></span> Digital Queue
            </span>
          </div>
        </div>

        {/* Right: AI Insights & Recommendations (5/12 width) */}
        <div className="lg:col-span-5 saas-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            AI Insights & Recommendations
          </h3>

          <div className="space-y-2.5">
            {insights.map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0 ${item.iconColor}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase shrink-0 ${item.badgeClass}`}>
                    {item.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Today's Resource Overview */}
      <div className="saas-card p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          Today's Resource Overview
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-1">
          {/* Item 1 */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Available Time
            </div>
            <div className="text-base font-extrabold text-slate-100 font-mono">6h 30m</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: '54%' }}></div>
            </div>
            <div className="text-[9px] text-right text-slate-400 font-mono">54%</div>
          </div>

          {/* Item 2 */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Remaining Energy
            </div>
            <div className="text-base font-extrabold text-slate-100 font-mono">10%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '10%' }}></div>
            </div>
            <div className="text-[9px] text-right text-slate-400 font-mono">10%</div>
          </div>

          {/* Item 3 */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Remaining Budget
            </div>
            <div className="text-base font-extrabold text-slate-100 font-mono">$69.5</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="text-[9px] text-right text-slate-400 font-mono">65%</div>
          </div>

          {/* Item 4 */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-sky-400" /> Mobility Availability
            </div>
            <div className="text-base font-extrabold text-slate-100 font-mono">20 mins</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full" style={{ width: '40%' }}></div>
            </div>
            <div className="text-[9px] text-right text-slate-400 font-mono">40%</div>
          </div>

          {/* Item 5 */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-pink-400" /> Digital Workload
            </div>
            <div className="text-base font-extrabold text-slate-100 font-mono">47.5%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-pink-400 h-full rounded-full" style={{ width: '48%' }}></div>
            </div>
            <div className="text-[9px] text-right text-slate-400 font-mono">48%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwinStateView;
