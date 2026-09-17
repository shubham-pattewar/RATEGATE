import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 transition-colors">
      <div className="w-full max-w-sm">
        {/* Logo & Heading */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs mb-3.5">
            <Zap className="h-5 w-5 text-emerald-500 fill-emerald-500/20" strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome back</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Sign in to manage your RateGate endpoints</p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="login-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
              autoComplete="email"
              required
            />
            <Input
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-1" disabled={loading} id="btn-login">
              {loading ? 'Authenticating…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
