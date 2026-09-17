import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { ArrowLeft, Settings, Save, X } from 'lucide-react';
import { endpointsApi } from '../api/resources.js';
import { Layout } from '../components/Layout.jsx';
import { Card, CardHeader, CardBody } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pct(a, b) {
  if (!b) return '0%';
  return `${Math.round((a / b) * 100)}%`;
}

function fmtTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function windowLabel(ms) {
  if (ms < 60_000) return `${ms / 1000}s`;
  if (ms < 3_600_000) return `${ms / 60_000}m`;
  if (ms < 86_400_000) return `${ms / 3_600_000}h`;
  return `${ms / 86_400_000}d`;
}

const RANGES = [
  { label: '1h',  value: '1h' },
  { label: '6h',  value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d',  value: '7d' },
];

// ---------------------------------------------------------------------------
// Summary stat cards
// ---------------------------------------------------------------------------
function StatCard({ label, value, sub, color = 'gray' }) {
  const colorMap = {
    gray:  'text-gray-900 dark:text-white',
    green: 'text-green-700 dark:text-green-400',
    red:   'text-red-700 dark:text-red-400',
    blue:  'text-blue-700 dark:text-blue-400',
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${colorMap[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Inline settings editor
// ---------------------------------------------------------------------------
function SettingsPanel({ endpoint, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: endpoint.name,
    targetUrl: endpoint.targetUrl,
    limit: String(endpoint.rateLimit.limit),
    windowMs: String(endpoint.rateLimit.windowMs),
    isActive: endpoint.isActive,
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      endpointsApi.update(endpoint.id, {
        name: form.name.trim(),
        targetUrl: form.targetUrl.trim(),
        rateLimit: { limit: Number(form.limit), windowMs: Number(form.windowMs) },
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endpoint', endpoint.id] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.error?.message ?? 'Update failed.'),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className="mt-6">
      <CardHeader>
        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2"><Settings className="h-4 w-4" /> Endpoint settings</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800" id="btn-close-settings">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input id="set-name" label="Name" value={form.name} onChange={set('name')} />
          <Input id="set-url" label="Target URL" value={form.targetUrl} onChange={set('targetUrl')} />
          <Input id="set-limit" label="Max requests" type="number" min="1" value={form.limit} onChange={set('limit')} />
          <div className="space-y-1">
            <label htmlFor="set-window" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Window (ms)</label>
            <select
              id="set-window"
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

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id="set-active"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Endpoint active</span>
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} id="btn-cancel-settings">Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} id="btn-save-settings">
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function EndpointDetailPage() {
  const { id } = useParams();
  const [range, setRange] = useState('24h');
  const [showSettings, setShowSettings] = useState(false);

  const { data: endpoint, isLoading: epLoading } = useQuery({
    queryKey: ['endpoint', id],
    queryFn: () => endpointsApi.get(id).then((r) => r.data.endpoint),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', id, range],
    queryFn: () => endpointsApi.stats(id, range).then((r) => r.data),
    refetchInterval: 30_000, // live refresh every 30 s
    enabled: !!endpoint,
  });

  if (epLoading) {
    return (
      <Layout>
        <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
      </Layout>
    );
  }

  if (!endpoint) {
    return (
      <Layout>
        <div className="text-sm text-red-500 py-12 text-center">Endpoint not found.</div>
      </Layout>
    );
  }

  const s = stats?.summary;
  const timeseries = stats?.timeseries ?? [];
  const topClients = stats?.topClients ?? [];

  // Format timeseries for recharts
  const chartData = timeseries.map((row) => ({
    time: fmtTimestamp(row.timestamp),
    Allowed: row.allowed,
    Blocked: row.blocked,
    Errors: row.errors,
  }));

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Endpoints
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{endpoint.name}</span>
        <Badge color={endpoint.isActive ? 'green' : 'gray'} className="ml-1">{endpoint.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{endpoint.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate">{endpoint.targetUrl}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {endpoint.rateLimit.limit} req / {windowLabel(endpoint.rateLimit.windowMs)} · Sliding window
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowSettings((v) => !v)} id="btn-settings">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {showSettings && <SettingsPanel endpoint={endpoint} onClose={() => setShowSettings(false)} />}

      {/* Proxy URL */}
      <Card className="mb-6 bg-gray-50 dark:bg-gray-900/50">
        <CardBody className="py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Proxy URL:{' '}
            <code className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              {window.location.origin}/proxy/{id}
            </code>
          </p>
        </CardBody>
      </Card>

      {/* Range selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Traffic analytics</h2>
        <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              id={`btn-range-${r.value}`}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total" value={s.total.toLocaleString()} />
          <StatCard label="Allowed" value={s.allowed.toLocaleString()} color="green" sub={pct(s.allowed, s.total)} />
          <StatCard label="Blocked" value={s.blocked.toLocaleString()} color="red" sub={pct(s.blocked, s.total)} />
          <StatCard label="Block rate" value={`${(s.blockRate * 100).toFixed(1)}%`} color={s.blockRate > 0.1 ? 'red' : 'gray'} />
          <StatCard label="Avg latency" value={s.avgLatencyMs != null ? `${s.avgLatencyMs}ms` : '—'} color="blue" />
        </div>
      )}

      {/* Volume chart */}
      <Card className="mb-6">
        <CardHeader>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Request volume</span>
        </CardHeader>
        <CardBody>
          {statsLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading…</div>
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  itemStyle={{ padding: '1px 0' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Area type="monotone" dataKey="Allowed" stroke="#22c55e" strokeWidth={2} fill="url(#gradAllowed)" />
                <Area type="monotone" dataKey="Blocked" stroke="#ef4444" strokeWidth={2} fill="url(#gradBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Top clients */}
      {topClients.length > 0 && (
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Top clients</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Client ID', 'Requests', 'Allowed', 'Blocked', 'Block %'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {topClients.map((c) => (
                  <tr key={c.clientId} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{c.clientId}</td>
                    <td className="px-6 py-3 tabular-nums">{c.total.toLocaleString()}</td>
                    <td className="px-6 py-3 tabular-nums text-green-700 dark:text-green-400">{c.allowed.toLocaleString()}</td>
                    <td className="px-6 py-3 tabular-nums text-red-600 dark:text-red-400">{c.blocked.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={c.blocked / c.total > 0.2 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                        {pct(c.blocked, c.total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Layout>
  );
}
