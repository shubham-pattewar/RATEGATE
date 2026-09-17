/**
 * Shared layout wrapper: top nav + main content area.
 */
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from './Button.jsx';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('rg_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Zap className="h-5 w-5 text-brand-600" strokeWidth={2.5} />
            <span>RateGate</span>
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={toggleDark} aria-label="Toggle dark mode" id="btn-toggle-theme">
              <Sun className="h-4 w-4 block dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={handleLogout} id="btn-logout">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
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
