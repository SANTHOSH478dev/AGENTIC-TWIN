import React, { useState, useEffect } from 'react';
import { predictionService, analyticsService } from '../services/api';
import { AlertCircle, HelpCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const Predictions = () => {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const predRes = await predictionService.getProjections();
        const trendRes = await analyticsService.getTrends();
        
        setData(predRes);
        setTrends(trendRes);
      } catch (err) {
        setError(err.response?.data?.detail || 'Projections require at least three months of history.');
      } finally {
        setLoading(false);
      }
    };
    loadPredictions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel border border-slate-800/80 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6 bg-[#090d1f]/40 backdrop-blur-xl">
        <div className="w-16 h-16 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-wide">Insufficient Data for Predictions</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            {error} Projections use statistical trend forecasting which requires at least three months of monthly statement data.
          </p>
        </div>
      </div>
    );
  }

  const chartData = [...trends.map(t => ({
    name: t.month_name,
    expense: t.expense,
    income: t.income,
    type: 'Historical'
  }))];

  if (data?.predictions?.length > 0) {
    const nextMonth = data.predictions[0];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = `${monthNames[nextMonth.target_month - 1]} ${nextMonth.target_year}`;
    
    chartData.push({
      name: `${label} (Projected)`,
      expense: nextMonth.predicted_expense,
      income: nextMonth.predicted_income,
      type: 'Projected'
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Summary Projections Card */}
      {data?.predictions?.length > 0 && (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 bg-[#090d1f]/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Next Month Projections Summary</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">{data.explanation}</p>
          </div>
          
          <div className="flex gap-8 bg-slate-950/40 border border-slate-850 p-6 rounded-2xl shrink-0 text-center shadow-inner">
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Projected Outflow</span>
              <p className="text-2xl font-extrabold text-brand-500">₹{data.predictions[0].predicted_expense.toLocaleString('en-IN')}</p>
            </div>
            <div className="border-r border-slate-850"></div>
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Projected Inflow</span>
              <p className="text-2xl font-extrabold text-white">₹{data.predictions[0].predicted_income.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Forecasting Trend Projections</h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#12182c" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontStyle="bold" />
              <YAxis stroke="#64748b" fontSize={10} fontStyle="bold" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090d1f', border: '1px solid #1e293b', borderRadius: '12px' }}
                labelStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                itemStyle={{ fontSize: 11 }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'semibold' }} />
              <Line type="monotone" dataKey="expense" name="Expenses (INR)" stroke="#f43f5e" strokeWidth={2.5} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="income" name="Income Credits (INR)" stroke="#10b981" strokeWidth={2} />
              
              {data?.predictions?.length > 0 && (
                <ReferenceLine 
                  x={chartData[chartData.length - 1].name} 
                  stroke="#eab308" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Projected Boundary', fill: '#eab308', fontSize: 9, position: 'top', fontWeight: 'bold' }} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Backtesting Table */}
      <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/20 rounded-2xl p-6 space-y-5 shadow-xl">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Scientific Forecasting Performance Backtesting</h3>
          </div>
          <p className="text-[11px] text-slate-400 max-w-2xl leading-relaxed">
            To ensure projection transparency, we compare our Linear Regression model against a Moving Average baseline. 
            Evaluation metrics are calculated by backtesting predictions against your actual historical data.
          </p>
        </div>

        <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/20 text-slate-450 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Forecasting Approach</th>
                <th className="py-4 px-6">Mean Absolute Error (MAE)</th>
                <th className="py-4 px-6">Root Mean Squared Error (RMSE)</th>
                <th className="py-4 px-6">Mean Absolute Percentage Error (MAPE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-slate-300 font-medium">
              {data.evaluation_table.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                  <td className="py-4 px-6 font-bold text-white">{row.model}</td>
                  <td className="py-4 px-6">{row.MAE}</td>
                  <td className="py-4 px-6">{row.RMSE}</td>
                  <td className="py-4 px-6 font-extrabold text-brand-400">{row.MAPE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
