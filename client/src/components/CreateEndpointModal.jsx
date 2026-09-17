/**
 * Modal dialog for creating a new endpoint.
 * Validates locally first, then calls the API.  On success the parent
 * invalidates the endpoints query so the table refreshes automatically.
 */
import { useState } from 'react';
import { X, Network } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpointsApi } from '../api/resources.js';
import { Input } from './Input.jsx';
import { Button } from './Button.jsx';

export function CreateEndpointModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    targetUrl: '',
    limit: '100',
    windowMs: '60000',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      endpointsApi.create({
        name: form.name.trim(),
        targetUrl: form.targetUrl.trim(),
        rateLimit: {
          limit: Number(form.limit),
          windowMs: Number(form.windowMs),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endpoints'] });
      onClose();
    },
    onError: (err) => {
      const data = err.response?.data?.error;
      if (data?.details) {
        const fe = {};
        for (const d of data.details) fe[d.path] = d.message;
        setFieldErrors(fe);
      } else {
        setServerError(data?.message ?? 'Failed to create endpoint.');
      }
    },
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.targetUrl.trim()) e.targetUrl = 'Target URL is required';
    const limit = Number(form.limit);
    if (!Number.isInteger(limit) || limit < 1) e['rateLimit.limit'] = 'Must be a positive integer';
    const windowMs = Number(form.windowMs);
    if (!Number.isInteger(windowMs) || windowMs < 1000) e['rateLimit.windowMs'] = 'Must be ≥ 1000 ms';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fe = validate();
    if (Object.keys(fe).length) { setFieldErrors(fe); return; }
    setFieldErrors({});
    setServerError('');
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#0e1526] rounded-[18px] shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center border border-purple-200/60 dark:border-purple-900/40">
              <Network className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Register New Endpoint</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure rate-limiting rule and target URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            id="btn-close-modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
          <Input
            id="ep-name"
            label="Display name"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Payments API, Auth Service"
            error={fieldErrors.name}
          />
          <Input
            id="ep-url"
            label="Target URL"
            value={form.targetUrl}
            onChange={set('targetUrl')}
            placeholder="https://api.example.com"
            error={fieldErrors.targetUrl}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              id="ep-limit"
              label="Max requests"
              type="number"
              min="1"
              value={form.limit}
              onChange={set('limit')}
              error={fieldErrors['rateLimit.limit']}
            />
            <div className="space-y-1.5">
              <label htmlFor="ep-window" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Window duration
              </label>
              <select
                id="ep-window"
                value={form.windowMs}
                onChange={set('windowMs')}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101c] text-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="1000">1 second</option>
                <option value="10000">10 seconds</option>
                <option value="60000">1 minute</option>
                <option value="300000">5 minutes</option>
                <option value="3600000">1 hour</option>
                <option value="86400000">24 hours</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
            <p className="text-sm text-purple-900/90 dark:text-purple-300/90 leading-relaxed">
              Algorithm: <span className="font-bold">Sliding window log</span> — tracks individual request timestamps in Redis for exact rate control per client API key.
            </p>
          </div>

          {serverError && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" id="btn-cancel-create">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending} id="btn-submit-create">
              {mutation.isPending ? 'Creating…' : 'Create endpoint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
