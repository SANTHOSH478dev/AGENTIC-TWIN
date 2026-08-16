import React, { useState, useEffect } from 'react';
import { securityService } from '../services/api';
import { ShieldCheck, ShieldAlert, Cpu, BarChart2 } from 'lucide-react';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await securityService.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Encryption Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Enc Specs */}
        <div className="glass-panel bg-[#090d1f]/20 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cryptographic Standards</span>
            <h3 className="text-lg font-extrabold text-white">Password Protection</h3>
            
            <div className="space-y-1.5 text-xs text-slate-400 font-medium">
              <p className="flex justify-between"><span>Hashing Algorithm:</span> <span className="text-white font-bold">Bcrypt (Salt Rounds: 12)</span></p>
              <p className="flex justify-between"><span>Session Transport:</span> <span className="text-white font-bold">JWT (HS256 Signature)</span></p>
              <p className="flex justify-between"><span>Token Expiry:</span> <span className="text-white font-bold">30 Minutes</span></p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mt-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Database isolation card */}
        <div className="glass-panel bg-[#090d1f]/20 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl md:col-span-2">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Database Architecture Isolation</span>
            <h3 className="text-lg font-extrabold text-white">Multi-Tenant Database Row-Level Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Your personal data, bank logs, AI chat sessions, and forecasts are strictly sandboxed at the ORM mapping layer. 
              The application explicitly binds the authenticated user ID extracted from JWT payloads to database selectors, preventing data leak vulnerabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel border border-slate-800/80 bg-[#090d1f]/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-[#090d1f]/20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Security Audit Trail</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-slate-550 text-xs">
            No secure activity records generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/20 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Action / Operation</th>
                  <th className="py-4 px-6">Client IP Address</th>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6 text-right">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-white font-mono uppercase">{log.action}</td>
                    <td className="py-4 px-6 text-slate-450">{log.ip_address}</td>
                    <td className="py-4 px-6">{new Date(log.timestamp).toLocaleString()}</td>
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

export default SecurityLogs;
