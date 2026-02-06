import React from 'react';
import { LayoutDashboard, Package, Map, Users, Settings, FileText, LogOut, User, Sun, Moon, Globe, ShoppingCart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Map, label: 'Demand Map', path: '/map' },
        { icon: Globe, label: 'Location Intel', path: '/map-intel' },
        { icon: ShoppingCart, label: 'Billing Counter', path: '/billing' },
        { icon: Users, label: 'Vendors', path: '/vendors' },
        { icon: FileText, label: 'Audit Trail', path: '/audit' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="h-screen w-72 glass-sidebar text-white p-6 fixed left-0 top-0 z-50 flex flex-col">
            <div className="flex items-center gap-3 mb-10 px-2">
                <img
                    src="/logo.jpg"
                    alt="Restockery Logo"
                    className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-blue-600/10 brightness-110"
                />
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight">SME Synth</h1>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Genesis Hackathon</span>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative group ${isActive
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                                />
                            )}
                            <Icon size={20} className={isActive ? 'text-blue-400' : 'group-hover:text-white'} />
                            <span className="font-semibold tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/10">
                        <User className="text-slate-400" size={20} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-[var(--text-secondary)] hover:bg-white/5 transition-all font-bold tracking-wide border border-transparent hover:border-[var(--border-glass)]"
                >
                    <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-500" />}
                        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}>
                        <motion.div
                            animate={{ x: theme === 'dark' ? 20 : 0 }}
                            className="w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                    </div>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold tracking-wide"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
