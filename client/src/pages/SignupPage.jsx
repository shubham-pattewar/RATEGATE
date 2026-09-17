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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 mb-3">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create an account</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start protecting your APIs in seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="signup-email"
            label="Email"
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
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading} id="btn-signup">
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
