import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { transactionService } from '../services/api';
import { UploadCloud, CheckCircle, AlertTriangle, Clock, ShieldCheck, Sparkles } from 'lucide-react';

const UploadStatement = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setReport(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const data = await transactionService.upload(file);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process statement. Ensure headers exist.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Upload Box */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-8 bg-[#090d1f]/20 shadow-xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-white tracking-wide">Import Bank Ledger</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Ingest transaction logs dynamically. We automatically match column fields (Date, Narration, Withdrawal, Deposit) and deduplicate logs.
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-slate-800 hover:border-brand-500/50 rounded-2xl p-8 text-center transition-all duration-300 relative cursor-pointer bg-slate-950/20 group">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4 pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 group-hover:text-brand-500 group-hover:bg-brand-500/5 transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              
              <div>
                <p className="text-xs font-bold text-white tracking-wide">
                  {file ? file.name : 'Drag & drop or click to choose CSV file'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Standard bank ledger statements in CSV format.'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex gap-2.5 items-start">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? 'Processing Transaction Logs...' : 'Ingest Statement'}
          </button>
        </form>
      </div>

      {/* Quality Report card */}
      {report && (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-8 bg-[#090d1f]/20 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex items-center gap-2 pb-4 border-b border-slate-850">
            <CheckCircle className="text-brand-500 w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Statement Ingestion Quality Report</h3>
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">File Ingested</span>
              <p className="font-bold text-white truncate">{report.filename}</p>
            </div>
            
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Processing Duration</span>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-500" />
                {report.processing_time_ms} ms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="border border-slate-850 bg-slate-900/10 p-4 rounded-xl">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Rows</span>
              <p className="text-xl font-extrabold text-white mt-1">{report.total_rows}</p>
            </div>
            
            <div className="border border-slate-850 bg-slate-900/10 p-4 rounded-xl">
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Valid Saved</span>
              <p className="text-xl font-extrabold text-emerald-500 mt-1">{report.valid_rows}</p>
            </div>

            <div className="border border-slate-850 bg-slate-900/10 p-4 rounded-xl">
              <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">Duplicates</span>
              <p className="text-xl font-extrabold text-yellow-500 mt-1">{report.duplicate_rows}</p>
            </div>

            <div className="border border-slate-850 bg-slate-900/10 p-4 rounded-xl">
              <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Rejected</span>
              <p className="text-xl font-extrabold text-red-500 mt-1">{report.rejected_rows}</p>
            </div>
          </div>

          <div className="bg-brand-500/5 border border-brand-500/10 p-4 rounded-xl flex gap-3 text-[11px] text-slate-400 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
            <p>
              All valid transactions have been cleaned, structured, and securely mapped to your user profile. 
              The hybrid ML models have predicted category labels. Head to the <Link to="/dashboard" className="text-brand-400 font-bold underline hover:text-brand-300">Overview</Link> to inspect results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStatement;
