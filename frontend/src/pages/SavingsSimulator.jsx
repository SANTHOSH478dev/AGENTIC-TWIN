import React, { useState, useEffect } from 'react';
import { recurringService, simulationService } from '../services/api';
import { Sliders, Sparkles, CheckSquare, Square, ArrowRight, HelpCircle, BarChart2 } from 'lucide-react';

const CATEGORIES = ["Food & Dining", "Groceries", "Shopping", "Entertainment", "Utilities", "Subscriptions", "Travel"];

const SavingsSimulator = () => {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reductions, setReductions] = useState({
    "Food & Dining": 0,
    "Groceries": 0,
    "Shopping": 0,
    "Entertainment": 0,
    "Utilities": 0,
    "Subscriptions": 0,
    "Travel": 0
  });
  
  const [selectedRecurring, setSelectedRecurring] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const recPayments = await recurringService.getPayments();
      setRecurring(recPayments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSliderChange = (cat, val) => {
    setReductions(prev => ({
      ...prev,
      [cat]: parseInt(val)
    }));
  };

  const toggleRecurring = (id) => {
    setSelectedRecurring(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimulating(true);
    setResult(null);

    // filter non-zero reductions
    const activeReductions = {};
    Object.entries(reductions).forEach(([cat, val]) => {
      if (val > 0) activeReductions[cat] = val;
    });

    try {
      const data = await simulationService.simulate({
        category_reductions: activeReductions,
        cancel_recurring_ids: selectedRecurring
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      
      {/* Simulation Controls side */}
      <div className="lg:col-span-1 glass-panel border border-slate-800/80 rounded-2xl p-6 bg-[#090d1f]/20 shadow-xl space-y-6">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">What-If Budget Simulator</h3>
          <p className="text-slate-400 text-[11px] leading-relaxed">Adjust monthly budget reductions or cancel recurring subscriptions to simulate cash flow impacts.</p>
        </div>

        <form onSubmit={handleSimulate} className="space-y-6">
          
          {/* Category sliders */}
          <div className="space-y-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Category Reductions</span>
            
            {CATEGORIES.map(cat => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">{cat}</span>
                  <span className="text-brand-400 font-bold">{reductions[cat]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={reductions[cat]}
                  onChange={(e) => handleSliderChange(cat, e.target.value)}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            ))}
          </div>

          {/* Subscriptions Cancellations list */}
          {recurring.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Simulated Cancel Subscriptions</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recurring.map((rp) => {
                  const isChecked = selectedRecurring.includes(rp.id);
                  return (
                    <div 
                      key={rp.id} 
                      onClick={() => toggleRecurring(rp.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-brand-500/40 bg-brand-500/5' 
                          : 'border-slate-850 hover:border-slate-700/60 bg-slate-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-brand-500 shrink-0" /> : <Square className="w-4 h-4 text-slate-500 shrink-0" />}
                        <span className="text-[11px] font-bold text-white leading-none">{rp.merchant}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold">₹{rp.average_amount.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={simulating}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg"
          >
            <Sliders className="w-4 h-4" />
            {simulating ? 'Running Simulator...' : 'Run Simulation'}
          </button>
        </form>
      </div>

      {/* Simulation results output pane */}
      <div className="lg:col-span-2 space-y-6">
        {result ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Top result summary card */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 bg-[#090d1f]/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">Simulation Output Results</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Expected Savings: ₹{result.expected_savings.toLocaleString('en-IN')}/mo</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{result.explanation}</p>
              </div>
            </div>

            {/* Comparison Metrics table */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 bg-[#090d1f]/20 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                <BarChart2 className="w-4 h-4 text-brand-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Workspace Baseline vs. Simulator Comparison</h3>
              </div>

              <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/20 text-slate-450 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Financial Dimension</th>
                      <th className="py-4 px-6">Current Pattern</th>
                      <th className="py-4 px-6">Simulated Scenario</th>
                      <th className="py-4 px-6 text-right">Estimated Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-300 font-medium">
                    {result.comparison_table.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 px-6 font-bold text-white">{row.metric}</td>
                        <td className="py-4 px-6 text-slate-400">{row.current}</td>
                        <td className="py-4 px-6 font-bold text-white">{row.projected}</td>
                        <td className={`py-4 px-6 text-right font-extrabold ${
                          row.difference.startsWith('-') ? 'text-emerald-500' : 'text-brand-400'
                        }`}>
                          {row.difference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-panel border border-slate-800/80 rounded-2xl p-12 text-center bg-[#090d1f]/20 shadow-xl h-full flex flex-col justify-center items-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white tracking-wide">Ready for Simulation</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Configure category reductions and cancellation checkboxes on the left, then click "Run Simulation" to calculate personal finance scenario projections.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SavingsSimulator;
