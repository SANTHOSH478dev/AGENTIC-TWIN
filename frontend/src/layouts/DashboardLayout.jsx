import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  UploadCloud, 
  MessageSquareCode, 
  TrendingUp, 
  FileText, 
  LogOut,
  Wallet,
  HeartPulse,
  Sparkles,
  Cpu,
  Sliders,
  ShieldAlert
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Upload Statement', path: '/upload', icon: UploadCloud },
    { name: 'AI Chatbot', path: '/chat', icon: MessageSquareCode },
    { name: 'Predictions', path: '/predictions', icon: TrendingUp },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'Health Score', path: '/health', icon: HeartPulse },
    { name: 'Report Center', path: '/reports', icon: FileText },
    { name: 'ML Center', path: '/ml-center', icon: Cpu },
    { name: 'Savings Simulator', path: '/simulator', icon: Sliders },
    { name: 'Security Logs', path: '/security', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex font-sans overflow-hidden">
      
      {/* Sidebar background mesh glow */}
      <div className="absolute top-0 left-0 w-64 h-full bg-gradient-to-b from-brand-600/5 via-transparent to-transparent pointer-events-none z-0"></div>

      {/* Sidebar */}
      <aside className="w-64 bg-[#090d1f]/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col shrink-0 z-10 relative">
        {/* Brand Header */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-850 bg-[#090d1f]/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-green-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white leading-none">
              CashFlow AI
            </span>
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
              FinTech Analytics
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 relative group ${
                  isActive 
                    ? 'bg-brand-600/10 text-white border-l-4 border-brand-500 shadow-md shadow-brand-500/5' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-850/80 flex flex-col gap-3 bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-sm text-brand-400 uppercase">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Account Owner'}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 border border-red-500/10 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header navbar */}
        <header className="h-20 border-b border-slate-850/80 flex items-center justify-between px-8 bg-[#020617]/40 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-white tracking-wide">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 px-3.5 py-1.5 rounded-full shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                AI Orchestrated
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#020617]">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
