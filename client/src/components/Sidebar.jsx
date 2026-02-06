import { LayoutDashboard, Package, Map, Users, Settings, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Map, label: 'Demand Map', path: '/map' },
        { icon: Users, label: 'Vendors', path: '/vendors' },
        { icon: FileText, label: 'Audit Trail', path: '/audit' },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white p-4 fixed left-0 top-0">
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                <h1 className="text-xl font-bold">SME Synth</h1>
            </div>

            <nav className="space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
