import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertOctagon, 
  FileText, 
  ShieldAlert, 
  Zap 
} from 'lucide-react';

const PolicyAuditView = ({ auditLogs, onActionDecision }) => {
  const [filterRisk, setFilterRisk] = useState('ALL');

  if (!auditLogs) return <div className="p-8 text-center text-slate-400">Loading Policy Logs...</div>;

  const pendingApprovals = auditLogs.filter(log => log.status === 'pending_user_consent');
  const filteredLogs = filterRisk === 'ALL' 
    ? auditLogs 
    : auditLogs.filter(log => log.risk_level === filterRisk);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="pdt-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            Policy, Consent & Audit Governance Layer
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Human-in-the-loop security barrier enforcing confirmation-gated execution for high-impact schedule and financial actions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
            Tier 1: Authorized (Auto)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40 font-mono">
            Tier 2: Assisted (Gated)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            Tier 3: Advisory (Info)
          </span>
        </div>
      </div>

      {/* Pending User Consent Action Cards */}
      {pendingApprovals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            Pending Action Authorization Requests ({pendingApprovals.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((log) => (
              <div key={log.id} className="pdt-card p-5 border-amber-500/50 bg-amber-950/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Assisted Action (Gated)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-100">{log.action_type.replace('_', ' ').toUpperCase()}</h4>
                  <p className="text-sm text-slate-300">{log.target_summary}</p>
                </div>

                {log.payload && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400 space-y-1">
                    <span className="text-slate-500 block font-sans font-semibold">Action Payload:</span>
                    <pre className="text-cyan-300 whitespace-pre-wrap">{JSON.stringify(log.payload, null, 2)}</pre>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => onActionDecision(log.id, 'approve')}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Execution</span>
                  </button>

                  <button
                    onClick={() => onActionDecision(log.id, 'reject')}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-300 font-semibold text-sm border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Audit Trail Table */}
      <div className="pdt-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            System Audit Trail Log ({filteredLogs.length})
          </h3>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Filter Tier:</span>
            {['ALL', 'Authorized', 'Assisted', 'Advisory'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterRisk(tier)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterRisk === tier
                    ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Summary Description</th>
                <th className="py-3 px-4">Consent Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{log.action_type}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      log.risk_level === 'Assisted' 
                        ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                        : log.risk_level === 'Authorized'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {log.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.target_summary}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {log.status === 'approved' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {log.status === 'rejected' && (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                    {log.status === 'auto_executed' && (
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Pre-Authorized
                      </span>
                    )}
                    {log.status === 'pending_user_consent' && (
                      <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Consent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PolicyAuditView;
