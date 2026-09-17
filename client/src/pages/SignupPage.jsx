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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfe] dark:bg-[#080c14] px-4 relative overflow-hidden text-slate-900 dark:text-slate-100 selection:bg-purple-500/20">
      {/* Soft atmospheric gradient blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-500/15 via-indigo-500/10 to-blue-500/10 dark:from-purple-600/20 dark:via-indigo-600/15 dark:to-transparent rounded-full blur-3xl -z-10" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-[400px] h-[300px] bg-blue-500/5 dark:bg-purple-900/15 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-sm">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_20px_rgba(147,51,234,0.35)] mb-3.5">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create an account</h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Start protecting your APIs in seconds</p>
        </div>

        {/* Form Card */}
        <div className="p-7 rounded-[18px] bg-white/90 dark:bg-[#0e1526]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xl dark:shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="signup-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email}
              required
            />
            <Input
              id="signup-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={errors.password}
              required
            />

            {serverError && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40" role="alert">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading} id="btn-signup">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
