import React, { useState } from 'react';
import { 
  User, 
  X, 
  KeyRound, 
  Mail, 
  LogOut, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { registerUser, loginUser } from '../services/api';

const UserProfileModal = ({ isOpen, onClose, user, setUser, theme, setTheme, onNotification }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegisterMode) {
        const res = await registerUser({ email, full_name: fullName, password });
        setUser(res);
        onNotification('Registered & logged in successfully!', 'success');
      } else {
        const res = await loginUser({ email, password });
        setUser(res);
        onNotification('Welcome back! Logged in successfully.', 'success');
      }
      onClose();
    } catch (err) {
      onNotification(err.response?.data?.detail || 'Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    onNotification('Logged out.', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="saas-card p-6 max-w-md w-full space-y-4 border-cyan-500/40 bg-[#0c1220]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {user ? 'User Profile & Settings' : (isRegisterMode ? 'Create Account' : 'Sign In')}
              </h3>
              <p className="text-[11px] text-slate-400">Personal Digital Twin Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If User is Logged In */}
        {user ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold text-slate-100">{user.full_name || 'Dr. Palanisamy'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-cyan-400">{user.email}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-500">Security Session:</span>
                <span className="text-emerald-400 font-mono font-bold">JWT Authenticated</span>
              </div>
            </div>

            {/* Theme Switcher Controls */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block">Dashboard Theme Preference:</span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    theme === 'dark'
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Deep Navy (Dark)</span>
                </button>
                <button
                  onClick={() => setTheme('midnight')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    theme === 'midnight'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Midnight Glow</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold border border-rose-800 flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <form onSubmit={handleAuth} className="space-y-3 text-xs">
            {isRegisterMode && (
              <div>
                <label className="text-slate-300 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Santhosh Kumar"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>
            )}

            <div>
              <label className="text-slate-300 font-semibold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="santhosh@gmail.com"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Processing...' : (isRegisterMode ? 'Register Account' : 'Sign In')}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : 'Need an account? Register here'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
