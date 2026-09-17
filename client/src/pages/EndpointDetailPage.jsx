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

function fmtTimestamp(ts, range = '24h') {
  const d = new Date(ts);
  if (range === '7d') {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
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
    gray:  'text-zinc-900 dark:text-zinc-100',
    green: 'text-emerald-600 dark:text-emerald-400',
    red:   'text-rose-600 dark:text-rose-400',
    blue:  'text-zinc-900 dark:text-zinc-100',
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums tracking-tight ${colorMap[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
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
    <Card className="mt-6 border-zinc-200/90 dark:border-zinc-800">
      <CardHeader>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
          <Settings className="h-4 w-4 text-zinc-400" /> Endpoint configuration
        </span>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors" id="btn-close-settings">
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input id="set-name" label="Name" value={form.name} onChange={set('name')} />
          <Input id="set-url" label="Target URL" value={form.targetUrl} onChange={set('targetUrl')} />
          <Input id="set-limit" label="Max requests" type="number" min="1" value={form.limit} onChange={set('limit')} />
          <div className="space-y-1.5">
            <label htmlFor="set-window" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Window (ms)</label>
            <select
              id="set-window"
              value={form.windowMs}
              onChange={set('windowMs')}
              className="block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400"
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

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            id="set-active"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500/20"
          />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Endpoint active</span>
        </label>

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

        <div className="flex gap-3 pt-1">
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
    time: fmtTimestamp(row.timestamp, range),
    Allowed: row.allowed,
    Blocked: row.blocked,
    Errors: row.errors,
  }));

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Endpoints
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{endpoint.name}</span>
        <Badge color={endpoint.isActive ? 'green' : 'gray'} className="ml-1">{endpoint.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{endpoint.name}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">{endpoint.targetUrl}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
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
      <Card className="mb-6 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/90 dark:border-zinc-800">
        <CardBody className="py-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Proxy Gateway URL:{' '}
            <code className="font-mono text-xs text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700/80 shadow-2xs select-all">
              {import.meta.env.VITE_API_URL || window.location.origin}/proxy/{id}
            </code>
          </p>
        </CardBody>
      </Card>

      {/* Range selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Traffic analytics</h2>
        <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/60 dark:border-zinc-700/60">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              id={`btn-range-${r.value}`}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === r.value
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Request volume</span>
        </CardHeader>
        <CardBody>
          {statsLoading ? (
            <div className="h-48 flex items-center justify-center text-xs text-zinc-400">Loading metrics…</div>
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-zinc-400">No traffic recorded for this window.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/80" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#f4f4f5' }}
                  itemStyle={{ padding: '1px 0' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Area type="monotone" dataKey="Allowed" stroke="#10b981" strokeWidth={2} fill="url(#gradAllowed)" />
                <Area type="monotone" dataKey="Blocked" stroke="#f43f5e" strokeWidth={2} fill="url(#gradBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Top clients */}
      {topClients.length > 0 && (
        <Card>
          <CardHeader>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Top clients</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20">
                  {['Client ID', 'Requests', 'Allowed', 'Blocked', 'Block %'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {topClients.map((c) => (
                  <tr key={c.clientId} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{c.clientId}</td>
                    <td className="px-6 py-3 tabular-nums text-xs">{c.total.toLocaleString()}</td>
                    <td className="px-6 py-3 tabular-nums text-emerald-600 dark:text-emerald-400 text-xs">{c.allowed.toLocaleString()}</td>
                    <td className="px-6 py-3 tabular-nums text-rose-600 dark:text-rose-400 text-xs">{c.blocked.toLocaleString()}</td>
                    <td className="px-6 py-3 text-xs">
                      <span className={c.blocked / c.total > 0.2 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-zinc-600 dark:text-zinc-400'}>
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
