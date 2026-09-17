/**
 * Modal dialog for creating a new endpoint.
 * Validates locally first, then calls the API.  On success the parent
 * invalidates the endpoints query so the table refreshes automatically.
 */
import { useState } from 'react';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Register new endpoint</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" id="btn-close-modal">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
          <Input id="ep-name" label="Display name" value={form.name} onChange={set('name')} placeholder="My production API" error={fieldErrors.name} />
          <Input id="ep-url" label="Target URL" value={form.targetUrl} onChange={set('targetUrl')} placeholder="https://api.example.com" error={fieldErrors.targetUrl} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="ep-limit"
              label="Max requests"
              type="number"
              min="1"
              value={form.limit}
              onChange={set('limit')}
              error={fieldErrors['rateLimit.limit']}
            />
            <div className="space-y-1">
              <label htmlFor="ep-window" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Window (ms)
              </label>
              <select
                id="ep-window"
                value={form.windowMs}
                onChange={set('windowMs')}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Algorithm: <strong>Sliding window log</strong> — exact count of requests in the last <em>window</em> ms per client.
          </p>

          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" id="btn-cancel-create">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending} id="btn-submit-create">
              {mutation.isPending ? 'Creating…' : 'Create endpoint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
