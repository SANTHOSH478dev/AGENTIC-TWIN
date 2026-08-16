import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  BarChart2, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Zap, 
  FileSpreadsheet 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';

const AblationLabView = ({ scenarios, ablationData, onRunBenchmark, isLoading }) => {
  const [selectedScenario, setSelectedScenario] = useState('ALL');

  const handleRun = () => {
    onRunBenchmark(selectedScenario);
  };

  const figure2Data = ablationData?.figure_2_data || [
    { approach: 'Manual Planning', success_rate: 70 },
    { approach: 'Rule-Based Assistant', success_rate: 79 },
    { approach: 'LLM Planner', success_rate: 88 },
    { approach: 'Proposed PDT', success_rate: 94 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="pdt-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-cyan-400" />
            Experimental Setup & Ablation Benchmark Lab
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Empirical validation comparing Personal Digital Twin against baseline planning algorithms across paper metrics (Section V & VI).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Scenario Families</option>
            {scenarios?.map((s) => (
              <option key={s.id} value={s.id}>{s.id}: {s.name}</option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isLoading ? 'Running Suite...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Paper Figure 2 Re-creation Chart */}
      <div className="pdt-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              Figure 2: Planning Success Comparison Across Approaches
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Target design performance comparison across 4 daily planning strategies.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold">
            Proposed PDT: 94% Target
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={figure2Data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="approach" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(value) => [`${value}%`, 'Planning Success Rate']}
              />
              <Bar dataKey="success_rate" radius={[8, 8, 0, 0]}>
                {figure2Data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 3 ? '#38bdf8' : index === 2 ? '#818cf8' : index === 1 ? '#64748b' : '#334155'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quantitative Metrics Matrix Table */}
      {ablationData?.metrics && (
        <div className="pdt-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            Comprehensive Evaluation Metrics Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Planning Approach</th>
                  <th className="py-3 px-4">Success Rate</th>
                  <th className="py-3 px-4">TCR (Completion)</th>
                  <th className="py-3 px-4">CRR (Conflict Red.)</th>
                  <th className="py-3 px-4">RUE (Resource Eff.)</th>
                  <th className="py-3 px-4">RP (Precision)</th>
                  <th className="py-3 px-4">IL (Latency ms)</th>
                  <th className="py-3 px-4">UOR (Override Rate)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ablationData.metrics.map((row, idx) => {
                  const isProposed = row.approach.includes('Proposed');
                  return (
                    <tr key={idx} className={isProposed ? 'bg-cyan-950/20 font-bold' : 'hover:bg-slate-900/40'}>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-100 flex items-center gap-2">
                        {isProposed && <Award className="w-4 h-4 text-cyan-400" />}
                        {row.approach}
                      </td>
                      <td className={`py-3.5 px-4 ${isProposed ? 'text-cyan-400 font-extrabold' : ''}`}>{row.planning_success_rate}%</td>
                      <td className="py-3.5 px-4 text-emerald-400">{row.task_completion_rate}%</td>
                      <td className="py-3.5 px-4 text-cyan-400">{row.conflict_reduction_rate}%</td>
                      <td className="py-3.5 px-4 text-purple-400">{row.resource_efficiency}%</td>
                      <td className="py-3.5 px-4 text-indigo-400">{row.recommendation_precision}%</td>
                      <td className="py-3.5 px-4 text-slate-300">{row.intervention_latency_ms} ms</td>
                      <td className={`py-3.5 px-4 ${isProposed ? 'text-emerald-400' : 'text-amber-400'}`}>{row.user_override_rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-cyan-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Paper Empirical Conclusion:
            </span>
            <p className="leading-relaxed">{ablationData.summary_conclusion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AblationLabView;
