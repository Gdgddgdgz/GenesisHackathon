import React, { useState, useEffect } from 'react';
import { FileText, Clock, ShieldCheck } from 'lucide-react';
import api from '../services/api';

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

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Audit Logs...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Immutable Audit Trail</h1>
                <p className="text-slate-500 mt-1">Plug-and-play abstraction for enterprise traceability (Mock Persistence: InMemory-Stream)</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Timestamp</th>
                            <th className="p-4 font-semibold text-slate-600">Action</th>
                            <th className="p-4 font-semibold text-slate-600">Entity</th>
                            <th className="p-4 font-semibold text-slate-600">Details</th>
                            <th className="p-4 font-semibold text-slate-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-500 text-sm font-mono">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-slate-800">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${log.action.includes('IN') ? 'bg-green-100 text-green-700' :
                                        log.action.includes('OUT') ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600 text-sm">{log.entity} #{log.entityId}</td>
                                <td className="p-4 text-slate-600 text-sm">
                                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                                        {JSON.stringify(log.details)}
                                    </code>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                        <ShieldCheck size={14} /> Verified
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>No audit records found yet. (Persistence Layer: Plug-and-Play)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditTrail;
