import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Navigation,
  Users, 
  Banknote, 
  Receipt, 
  ReceiptText,
  FileSpreadsheet,
  Briefcase, 
  LogOut, 
  Copy, 
  Check, 
  Menu, 
  X,
  WalletCards
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCopyCode = () => {
    if (user?.invite_code) {
      navigator.clipboard.writeText(user.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: "Today's Route", path: '/today-route', icon: Navigation, highlight: true },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Loans', path: '/loans', icon: Banknote },
    { label: 'Collections', path: '/collections', icon: Receipt },
    { label: 'Expenses', path: '/expenses', icon: ReceiptText },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Partners & Audit', path: '/partners', icon: Briefcase },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Business Loop */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <WalletCards className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center">
                  katha<span className="text-emerald-600">check</span>
                </span>
              </div>
            </Link>

            {user?.business_name && (
              <div className="hidden xl:flex items-center space-x-2 pl-3 border-l border-slate-200">
                <div className="bg-slate-100 rounded-lg px-2 py-0.5 flex items-center space-x-1.5 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                    {user.business_name}
                  </span>
                  <button 
                    onClick={handleCopyCode}
                    title="Copy Invite Code to share with partners"
                    className="flex items-center space-x-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <span>{user.invite_code}</span>
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-emerald-600" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs' 
                      : item.highlight 
                        ? 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-end space-x-1">
                <span>{user?.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase">
                  {user?.role || 'Partner'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[120px]">{user?.email}</div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {user?.business_name && (
            <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
              <div>
                <div className="text-xs text-slate-500">Business Loop</div>
                <div className="text-sm font-semibold text-slate-800">{user.business_name}</div>
              </div>
              <button 
                onClick={handleCopyCode}
                className="flex items-center space-x-1 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded"
              >
                <span>Code: {user.invite_code}</span>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">{user?.name}</div>
              <div className="text-[11px] text-slate-500">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
