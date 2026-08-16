import React, { useState, useEffect } from 'react';
import { mlService } from '../services/api';
import { Cpu, Award, RefreshCw, BarChart2, CheckCircle, Clock } from 'lucide-react';

const MLCenter = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await mlService.getMetrics();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load ML metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainResult(null);
    try {
      const result = await mlService.retrain();
      setRetrainResult(result);
      // reload logs
      const updatedLogs = await mlService.getMetrics();
      setLogs(updatedLogs);
    } catch (err) {
      console.error("ML training fail", err);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Model Specs */}
        <div className="glass-panel bg-[#090d1f]/20 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Classifier Engine Specs</span>
            <h3 className="text-lg font-extrabold text-white">Hybrid ML Classifier</h3>
            
            <div className="space-y-1.5 text-xs text-slate-400 font-medium">
              <p className="flex justify-between"><span>Base Algorithm:</span> <span className="text-white font-bold">Logistic Regression</span></p>
              <p className="flex justify-between"><span>Vectorization:</span> <span className="text-white font-bold">TF-IDF Vectorizer</span></p>
              <p className="flex justify-between"><span>Classes/Categories:</span> <span className="text-white font-bold">19 Categories</span></p>
              <p className="flex justify-between"><span>Status:</span> <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Active</span></p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mt-4">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Retraining Dashboard trigger */}
        <div className="glass-panel bg-[#090d1f]/20 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl md:col-span-2">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Human-in-the-Loop Refitting</span>
            <h3 className="text-lg font-extrabold text-white">Incremental Retraining Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Trigger incremental retraining to feed manual transaction corrections back into the vectorizer. 
              The system builds user-specific weights files to align category classifications to your custom parameters.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-850">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Active Weights File</p>
              <p className="text-xs text-white font-bold">{logs[0]?.model_version || 'v2.0-core-lr-baseline'}</p>
            </div>
            
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-brand-600/15 disabled:opacity-50"
            >
              {retraining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Optimizing Decision Boundaries...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Retrain Model
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Retrain response popup log */}
      {retrainResult && (
        <div className="bg-brand-500/5 border border-brand-500/10 p-5 rounded-2xl flex items-start gap-3.5 text-xs text-slate-350 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
          <Award className="w-6 h-6 text-brand-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h4 className="font-bold text-white leading-tight">Retraining Run Completed Successful!</h4>
            <p className="leading-relaxed text-[11px]">{retrainResult.message}</p>
            <div className="pt-2 flex gap-6 text-[10px] font-bold text-slate-500">
              <p>RECORDS INGESTED: <span className="text-white">{retrainResult.records_count}</span></p>
              <p>TEST SET ACCURACY: <span className="text-brand-450">{retrainResult.accuracy_score * 100}%</span></p>
              <p>COMPILED VERSION: <span className="text-white">{retrainResult.model_version}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Run metrics logs table */}
      <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-[#090d1f]/20">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Retraining Audit Log</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-slate-550 text-xs">
            No custom model training iterations logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/20 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Model version</th>
                  <th className="py-4 px-6">Trained At</th>
                  <th className="py-4 px-6">Training Set Records</th>
                  <th className="py-4 px-6">Verification Accuracy</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-white font-mono">{log.model_version}</td>
                    <td className="py-4 px-6 text-slate-450">{new Date(log.trained_at).toLocaleString()}</td>
                    <td className="py-4 px-6">{log.records_count} rows</td>
                    <td className="py-4 px-6 font-bold text-brand-400">{log.accuracy_score * 100}%</td>
                    <td className="py-4 px-6 text-right uppercase tracking-wider text-[9px] font-bold">
                      <span className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default MLCenter;
