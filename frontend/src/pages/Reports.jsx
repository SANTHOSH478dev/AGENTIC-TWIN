import React, { useState } from 'react';
import { reportService } from '../services/api';
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';

const Reports = () => {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    setSuccess(false);
    try {
      const blob = await reportService.downloadMonthlyPDF();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'CashFlow_AI_Monthly_Financial_Report.pdf');
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err) {
      setError('Failed to compile PDF report. Upload statements first.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-8 text-center bg-[#090d1f]/20 shadow-xl space-y-6 relative overflow-hidden">
        {/* Glow behind logo */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-600/5 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="w-16 h-16 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-center mx-auto text-brand-500 shadow-lg shadow-brand-500/5 relative z-10">
          <FileText className="w-8 h-8" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <h2 className="text-base font-bold text-white tracking-wide">Generate Printable PDF Statement Audit</h2>
          <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
            Compile your income, expenses, category spending percentages, recurring subscriptions, and outlier anomalies into a printable PDF record.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex gap-2.5 items-start justify-start text-left max-w-md mx-auto relative z-10">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-450 p-4 rounded-xl text-xs flex gap-2.5 items-start justify-start text-left max-w-md mx-auto relative z-10">
            <CheckCircle className="w-5 h-5 shrink-0 text-brand-500" />
            <span className="font-semibold">PDF financial report compiled and downloaded successfully!</span>
          </div>
        )}

        <div className="pt-4 relative z-10">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-600/15 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                Compiling Document...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Report PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
