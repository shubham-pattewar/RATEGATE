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
    // Sync state with DOM on mount
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
    <div className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Nav */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-zinc-100 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Zap className="h-4 w-4 fill-emerald-500/20" strokeWidth={2.5} />
            </div>
            <span className="tracking-tight text-base font-semibold">RateGate</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <span className="hidden sm:block text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/60 dark:border-zinc-700/50">
                {user.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDark}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              id="btn-toggle-theme"
              className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-zinc-600 transition-transform hover:-rotate-12" />
              )}
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={handleLogout} id="btn-logout" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Sign out</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
