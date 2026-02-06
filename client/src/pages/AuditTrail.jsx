import React, { useState, useEffect } from 'react';
import { FileText, Clock, ShieldCheck, Database, Terminal, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { motion } from 'framer-motion';

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/inventory/audit');
                setLogs(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load audit logs", err);
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Decrypting Ledger...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                        Neural <span className="text-blue-500">Ledger</span>
                        <Terminal size={32} className="text-slate-700" />
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Immutable record of all inventory and partner interactions</p>
                </div>
                <div className="flex items-center gap-3 bg-[var(--bg-card)] px-4 py-2.5 rounded-xl border border-[var(--border-glass)] uppercase font-black text-[10px] tracking-widest text-[var(--text-secondary)]">
                    <ShieldCheck size={16} className="text-emerald-500" /> End-to-End Encrypted
                </div>
            </div>

            {/* Audit Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-glass)] bg-[var(--bg-main)]/50">
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Temporal Stamp</th>
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Operation</th>
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Affected Entity</th>
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Payload Metadata</th>
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Registry Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-glass)]">
                            {logs.map((log, index) => (
                                <motion.tr
                                    key={log._id || index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="p-6 text-[var(--text-secondary)] text-xs font-mono">
                                        <div className="flex items-center gap-3">
                                            <Clock size={14} className="text-blue-500/50" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${log.action.includes('IN') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            log.action.includes('OUT') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-6 font-bold text-[var(--text-primary)] text-xs">
                                        {log.entity} <span className="text-[var(--text-secondary)] opacity-50 ml-1">#{log.entityId}</span>
                                    </td>
                                    <td className="p-6">
                                        <code className="bg-[var(--bg-main)] px-2 py-1 rounded text-[10px] text-[var(--text-secondary)] border border-[var(--border-glass)]">
                                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                        </code>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                            <ShieldCheck size={14} /> Immutable
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {logs.length === 0 && (
                    <div className="p-20 text-center text-slate-500 flex flex-col items-center">
                        <Database size={48} className="mb-4 text-slate-800" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Ledger is Empty</p>
                        <p className="text-[9px] text-slate-600 mt-2 uppercase">Awaiting System Transactions...</p>
                    </div>
                )}
            </motion.div>

            {/* Summary Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-[var(--border-glass)] flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <ShieldCheck className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-1">Hashing Protocol</h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">All records are hashed using SHA-256 before being committed to the ephemeral state stream, ensuring baseline data integrity.</p>
                    </div>
                </div>
                <div className="glass-card p-6 border-[var(--border-glass)] flex items-start gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <ShieldAlert className="text-amber-500" size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-1">Anomaly Detection</h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">Any manual attempt to bypass the audit layer triggers a neural alert and is flagged for manual review by the SME synth co-pilot.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditTrail;
