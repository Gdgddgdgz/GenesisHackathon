import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, trend, icon: Icon, alert }) => {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={`glass-card p-6 overflow-hidden relative group transition-all ${alert ? 'border-red-500/30' : ''}`}
        >
            {/* Subtle inner glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full opacity-20 ${alert ? 'bg-red-500' : 'bg-blue-500'}`}></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <span className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-widest">{title}</span>
                <div className={`p-3 rounded-xl transition-all ${alert ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}>
                    <Icon size={22} />
                </div>
            </div>

            <div className="flex items-end gap-3 relative z-10">
                <h3 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{value}</h3>
                {trend !== undefined && (
                    <span className={`text-sm mb-1.5 font-bold flex items-center gap-0.5 ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>

            <div className="mt-4 h-1.5 w-full bg-[var(--bg-main)] rounded-full overflow-hidden relative z-10 shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${alert ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                />
            </div>
        </motion.div>
    );
};

export default StatCard;
