import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import { HeartPulse, CheckCircle2, Info, Sparkles, ShieldCheck } from 'lucide-react';

const HealthScore = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const data = await analyticsService.getHealthScore();
        setReport(data);
      } catch (err) {
        setError('Failed to compute score. Ensure statements exist.');
      } finally {
        setLoading(false);
      }
    };
    loadHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="glass-panel border border-slate-800/80 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6 bg-[#090d1f]/40 backdrop-blur-xl">
        <div className="w-16 h-16 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
          <HeartPulse className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-wide">Health Score Unavailable</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            {error || 'Upload bank statements to compute your financial wellness indicators.'}
          </p>
        </div>
      </div>
    );
  }

  const factorTitles = {
    savings: 'Savings Behaviour (30%)',
    ratio: 'Expense-to-Income Ratio (25%)',
    budgets: 'Budget Adherence (20%)',
    stability: 'Cash Flow Stability (15%)',
    volatility: 'Spending Volatility (10%)'
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/20';
    if (score >= 60) return 'text-blue-400 border-blue-500/20';
    if (score >= 40) return 'text-yellow-400 border-yellow-500/20';
    return 'text-red-400 border-red-500/20';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      
      {/* Health Dial Card */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 text-center bg-[#090d1f]/20 shadow-xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        {/* Glow behind circle */}
        <div className="absolute w-48 h-48 bg-brand-600/5 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Wellness Rating</h3>
          <p className="text-[10px] text-slate-550 font-semibold uppercase">Formulated from ledger calculations</p>
        </div>

        {/* Score Dial */}
        <div className="relative w-44 h-44 flex items-center justify-center rounded-full border-[10px] border-slate-950 shadow-inner">
          <div className="absolute inset-1.5 rounded-full border-4 border-slate-850 flex flex-col items-center justify-center bg-slate-950/20">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Score</span>
            <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(report.overall_score).split(' ')[0]}`}>
              {report.overall_score}
            </span>
            <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{report.score_category}</span>
          </div>
        </div>

        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 text-xs text-slate-400 text-left flex gap-2.5 leading-relaxed">
          <Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium">{report.explanation}</p>
        </div>
      </div>

      {/* Factors details */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Factors Breakdown */}
        <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 space-y-5 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-slate-850">Scoring Dimensions Analysis</h3>
          
          <div className="space-y-4">
            {Object.entries(report.factors).map(([key, f]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold">{factorTitles[key] || key}</span>
                  <span className="text-white font-extrabold">{f.score} / {f.max_score}</span>
                </div>
                
                <div className="h-2 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      f.score >= 80 ? 'bg-emerald-500' :
                      f.score >= 60 ? 'bg-blue-500' :
                      f.score >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${(f.score / f.max_score) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">{f.evaluation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Actionable Recommendations</h3>
          </div>
          
          <div className="space-y-3">
            {report.improvement_areas.map((tip, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-350 leading-relaxed bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span className="text-[11px] font-semibold">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScore;
