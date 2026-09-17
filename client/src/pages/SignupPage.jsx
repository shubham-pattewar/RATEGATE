import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setServerError('');
    setLoading(true);
    try {
      await signup(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const data = err.response?.data?.error;
      if (data?.details) {
        const fe = {};
        for (const d of data.details) fe[d.path] = d.message;
        setErrors(fe);
      } else {
        setServerError(data?.message ?? 'Sign up failed. Please try again.');
      }
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
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Create an account</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Deploy and protect your APIs with sub-ms rate limits</p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="signup-email"
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
              autoComplete="email"
              error={errors.email}
              required
            />
            <Input
              id="signup-password"
              label="Password (min 8 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password}
              required
            />

            {serverError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400" role="alert">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full mt-1" disabled={loading} id="btn-signup">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
