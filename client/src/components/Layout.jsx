import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from './Button.jsx';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleDark = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rg_theme', 'dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rg_theme', 'light');
      setIsDark(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfe] dark:bg-[#080c14] text-slate-900 dark:text-slate-100 relative overflow-x-hidden transition-colors duration-200">
      {/* Atmospheric Background Gradients */}
      {/* Light Mode Soft Atmospheric Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[380px] bg-gradient-to-b from-purple-200/25 via-indigo-100/20 to-transparent blur-[100px] rounded-full -z-10 dark:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 right-[-10%] w-[500px] h-[350px] bg-blue-100/20 blur-[90px] rounded-full -z-10 dark:hidden"
      />

      {/* Dark Mode Gradient Accent Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[420px] bg-gradient-to-b from-purple-900/20 via-indigo-950/20 to-transparent blur-[120px] rounded-full -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none hidden dark:block absolute top-20 right-[-5%] w-[450px] h-[350px] bg-purple-900/15 blur-[100px] rounded-full -z-10"
      />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#080c14]/80 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs group-hover:shadow-[0_0_12px_rgba(147,51,234,0.4)] transition-all">
              <Zap className="h-4.5 w-4.5 fill-white/20" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">
              RateGate
            </span>
          </Link>

          {/* Right Navigation items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <span className="hidden sm:inline-flex items-center text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-[#0f1626] px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                {user.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDark}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              id="btn-toggle-theme"
              className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 p-2"
            >
              {isDark ? (
                <Sun className="h-4.5 w-4.5 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-slate-600 transition-transform hover:-rotate-12" />
              )}
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                id="btn-logout"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 text-sm font-medium px-3 py-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Sign out</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
