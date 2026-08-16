import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService, aiService } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowRight, 
  UploadCloud,
  HeartPulse,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUpIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4', '#ef4444', '#64748b'];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sumData = await analyticsService.getSummary();
        const catData = await analyticsService.getCategories();
        const trendData = await analyticsService.getTrends();
        const merchData = await analyticsService.getMerchants(5);
        const insData = await aiService.getInsights();

        setSummary(sumData);
        setCategories(catData);
        setTrends(trendData);
        setMerchants(merchData);
        setInsights(insData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const hasData = summary && (summary.total_income > 0 || summary.total_expenses > 0);

  if (!hasData) {
    return (
      <div className="glass-panel border border-slate-800/80 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6 bg-[#090d1f]/40 backdrop-blur-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-16 h-16 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <UploadCloud className="w-8 h-8 text-brand-500" />
        </div>
        <div className="space-y-2 z-10 relative">
          <h3 className="text-xl font-bold text-white tracking-wide">No Transaction Data Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            Get started by uploading your bank statement statement (CSV). The system will analyze, clean, and display your spending trends.
          </p>
        </div>
        <div className="pt-4 z-10 relative">
          <Link to="/upload" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-brand-600/15 hover:shadow-brand-600/25">
            Upload Statement
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const kpis = [
    { 
      name: 'Current Balance', 
      value: `₹${summary.current_balance.toLocaleString('en-IN')}`, 
      icon: Wallet, 
      color: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
      gradient: 'from-brand-500/5 to-transparent'
    },
    { 
      name: 'Total Income', 
      value: `₹${summary.total_income.toLocaleString('en-IN')}`, 
      icon: TrendingUp, 
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      gradient: 'from-emerald-500/5 to-transparent'
    },
    { 
      name: 'Total Expenses', 
      value: `₹${summary.total_expenses.toLocaleString('en-IN')}`, 
      icon: TrendingDown, 
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
      gradient: 'from-red-500/5 to-transparent'
    },
    { 
      name: 'Financial Health Score', 
      value: `${summary.health_score}/100`, 
      icon: HeartPulse, 
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      gradient: 'from-purple-500/5 to-transparent'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={kpi.name} 
              className={`glass-panel bg-gradient-to-br ${kpi.gradient} bg-[#090d1f]/30 rounded-2xl p-6 border border-slate-800/80 hover:border-slate-700/60 transition-all duration-300 flex items-center justify-between shadow-xl`}
            >
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{kpi.name}</span>
                <p className="text-2xl font-extrabold text-white tracking-tight">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights Drawer */}
      {insights.length > 0 && (
        <div className="glass-panel border border-slate-800/85 rounded-2xl p-6 bg-[#090d1f]/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">AI-Generated Personal Insights</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-slate-950/30 border border-slate-850 p-5 rounded-xl space-y-3 hover:border-slate-800 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white leading-tight">{insight.title}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                    insight.type === 'POSITIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    insight.type === 'WARNING' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    insight.type === 'IMPORTANT' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                    'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    {insight.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{insight.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cash flow trends Bar Chart */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Monthly Ledger Inflows vs Outflows</h3>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12182c" />
                <XAxis dataKey="month_name" stroke="#64748b" fontSize={10} fontStyle="bold" />
                <YAxis stroke="#64748b" fontSize={10} fontStyle="bold" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d1f', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                  itemStyle={{ fontSize: 11 }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'semibold' }} />
                <Bar dataKey="income" name="Salary / Income Credits" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Spendings / Debits" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category donut breakdown */}
        <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Expenses by Category</h3>
          
          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="category"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d1f', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 space-y-2 overflow-y-auto max-h-36 pr-1">
            {categories.slice(0, 5).map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-400 font-medium">{cat.category}</span>
                </div>
                <span className="text-white font-bold">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Merchants & Savings rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Top Merchants bar list */}
        <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 space-y-5 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Top Invoiced Merchants</h3>
          
          <div className="space-y-4">
            {merchants.map((m) => {
              const maxAmount = merchants[0]?.amount || 1;
              const percent = (m.amount / maxAmount) * 100;
              return (
                <div key={m.merchant} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-bold">{m.merchant}</span>
                    <span className="text-white font-extrabold">₹{m.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Savings Rate display */}
        <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Target Savings Audit</h3>
            <span className="text-xs text-brand-400 font-bold">{summary.savings_rate}% Actual Rate</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-4 py-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ideal Monthly buffer limit (20%)</span>
              <p className="text-3xl font-extrabold text-white">₹{(summary.total_income * 0.20).toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Calculated dynamically matching the standard 50/30/20 budget framework.
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-850/60 flex justify-around text-center text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Savings Rating</span>
                <p className="text-white font-bold text-xs">{summary.savings_rate >= 20 ? 'Excellent' : 'Needs Review'}</p>
              </div>
              <div className="border-r border-slate-850"></div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Daily Average Spent</span>
                <p className="text-white font-bold text-xs">₹{summary.avg_daily_spending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
