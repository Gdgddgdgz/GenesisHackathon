import React from 'react';

const StatCard = ({ title, value, trend, icon: Icon, alert }) => {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 font-medium">{title}</span>
                <div className={`p-2 rounded-lg ${alert ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
                {trend && (
                    <span className={`text-sm mb-1 font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatCard;
