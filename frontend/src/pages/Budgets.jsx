import React, { useState, useEffect } from 'react';
import { budgetService } from '../services/api';
import { Plus, Trash2, Wallet, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  "Overall", "Food & Dining", "Groceries", "Transportation", "Shopping", 
  "Entertainment", "Utilities", "Rent", "Healthcare", "Education", 
  "Travel", "Subscriptions", "EMI / Loans", "Insurance", "Investment"
];

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Overall');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getAll();
      setBudgets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please provide a valid budget limit.');
      return;
    }
    
    try {
      await budgetService.create({
        category,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year)
      });
      setAmount('');
      loadBudgets();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create budget configuration.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await budgetService.delete(id);
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      
      {/* Create Budget card */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 h-fit bg-[#090d1f]/20 shadow-xl space-y-6">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Setup Budget Target</h3>
          <p className="text-slate-400 text-[11px] leading-relaxed">Set spending caps to monitor and control category-level monthly outflows.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Limit Amount (INR)</label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-dark-950/80 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Array.from({ length: 12 }, (_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {new Date(0, idx).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-dark-950/80 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Budget Limit
          </button>
        </form>
      </div>

      {/* Budgets Tracker list */}
      <div className="lg:col-span-2 glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex justify-between items-center pb-4 border-b border-slate-850">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Budget Targets</h3>
          <span className="text-xs text-slate-550 font-bold">{budgets.length} configured</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <Wallet className="w-8 h-8 mx-auto text-slate-600" />
            <p>No monthly budget caps defined yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.map((b) => {
              const ratio = b.amount > 0 ? b.spent / b.amount : 0.0;
              const percent = Math.min(100, ratio * 100);
              
              let statusLabel = 'Safe';
              let statusColor = 'text-green-500 bg-green-550/10 border-green-500/20';
              if (ratio >= 1.0) {
                statusLabel = 'Exceeded';
                statusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
              } else if (ratio >= 0.85) {
                statusLabel = 'Critical';
                statusColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
              } else if (ratio >= 0.70) {
                statusLabel = 'Warning';
                statusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-550/20';
              }

              return (
                <div key={b.id} className="space-y-3 bg-slate-950/20 p-5 rounded-xl border border-slate-850">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-xs leading-none">{b.category}</h4>
                      <p className="text-[10px] text-slate-550 font-bold mt-1">Period: {b.month}/{b.year}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          ratio >= 1.0 ? 'bg-red-500' :
                          ratio >= 0.85 ? 'bg-orange-500' :
                          ratio >= 0.70 ? 'bg-yellow-500' :
                          'bg-brand-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-450 font-medium">
                      <span>Spent: ₹{b.spent.toLocaleString('en-IN')} / ₹{b.amount.toLocaleString('en-IN')}</span>
                      <span>{Math.round(percent)}% Used (Remaining: ₹{Math.max(0, b.amount - b.spent).toLocaleString('en-IN')})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Budgets;
