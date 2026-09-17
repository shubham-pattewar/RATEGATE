import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowLeft, Settings, Save, X, ExternalLink, Activity } from 'lucide-react';
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

function fmtTimestamp(ts, range = '6h') {
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
    gray:   'text-slate-900 dark:text-white',
    green:  'text-emerald-600 dark:text-emerald-400',
    red:    'text-rose-600 dark:text-rose-400',
    blue:   'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="p-5 rounded-[14px] bg-white/95 dark:bg-[#0e1526]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight tabular-nums ${colorMap[color]}`}>{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 font-medium">{sub}</p>}
    </div>
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
    <Card className="mt-6 mb-8 border-purple-200/50 dark:border-purple-900/40">
      <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" /> Endpoint Configuration
        </span>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          id="btn-close-settings"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardBody className="space-y-4.5 p-6">
        <div className="grid sm:grid-cols-2 gap-4.5">
          <Input id="set-name" label="Name" value={form.name} onChange={set('name')} />
          <Input id="set-url" label="Target URL" value={form.targetUrl} onChange={set('targetUrl')} />
          <Input id="set-limit" label="Max requests" type="number" min="1" value={form.limit} onChange={set('limit')} />
          <div className="space-y-1.5">
            <label htmlFor="set-window" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Window duration
            </label>
            <select
              id="set-window"
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

        <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
          <input
            id="set-active"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 dark:bg-slate-900"
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active endpoint (allows live proxy traffic)</span>
        </label>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} id="btn-cancel-settings">Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} id="btn-save-settings">
            <Save className="h-4.5 w-4.5 mr-1.5" />
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
  const [range, setRange] = useState('6h');
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
        <div className="text-sm text-slate-400 py-16 text-center font-medium flex items-center justify-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          Loading endpoint metrics…
        </div>
      </Layout>
    );
  }

  if (!endpoint) {
    return (
      <Layout>
        <div className="text-sm text-rose-500 py-16 text-center font-medium">Endpoint not found.</div>
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

  const proxyUrl = `${import.meta.env.VITE_API_URL || window.location.origin}/proxy/${id}`;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2.5 mb-6 text-base">
        <Link to="/" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 font-medium transition-colors">
          <ArrowLeft className="h-4 w-4" /> Endpoints
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="font-bold text-slate-900 dark:text-white truncate max-w-sm">{endpoint.name}</span>
        <Badge color={endpoint.isActive ? 'green' : 'gray'} showDot={endpoint.isActive} className="ml-1.5">
          {endpoint.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{endpoint.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-2 flex items-center gap-1.5 truncate">
            <ExternalLink className="h-4 w-4 inline text-slate-400 shrink-0" />
            {endpoint.targetUrl}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Badge color="purple">Sliding Window Log</Badge>
            <span className="text-sm text-slate-400 dark:text-slate-400 font-medium">
              {endpoint.rateLimit.limit} req / {windowLabel(endpoint.rateLimit.windowMs)}
            </span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setShowSettings((v) => !v)} id="btn-settings" className="px-4 py-2 text-sm font-semibold">
          <Settings className="h-4.5 w-4.5 mr-1.5" />
          Settings
        </Button>
      </div>

      {showSettings && <SettingsPanel endpoint={endpoint} onClose={() => setShowSettings(false)} />}

      {/* Proxy URL Banner */}
      <div className="mb-8 p-5 rounded-[16px] bg-white/80 dark:bg-[#0e1526]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-900/40">
            <Activity className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Proxy Route:</p>
            <code className="font-mono text-sm font-semibold text-purple-700 dark:text-purple-300 truncate block mt-0.5 select-all">
              {proxyUrl}
            </code>
          </div>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(proxyUrl)}
          className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 self-start sm:self-auto shrink-0 transition-colors px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/50 flex items-center gap-1.5"
        >
          Copy route
        </button>
      </div>

      {/* Range selector & Section Title */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Traffic Analytics</h2>
        <div className="flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              id={`btn-range-${r.value}`}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === r.value
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          <StatCard label="Total Requests" value={s.total.toLocaleString()} />
          <StatCard label="Allowed" value={s.allowed.toLocaleString()} color="green" sub={pct(s.allowed, s.total)} />
          <StatCard label="Blocked" value={s.blocked.toLocaleString()} color="red" sub={pct(s.blocked, s.total)} />
          <StatCard label="Block Rate" value={`${(s.blockRate * 100).toFixed(1)}%`} color={s.blockRate > 0.1 ? 'red' : 'gray'} />
          <StatCard label="Avg Latency" value={s.avgLatencyMs != null ? `${s.avgLatencyMs}ms` : '—'} color="purple" />
        </div>
      )}

      {/* Volume chart */}
      <Card className="mb-8">
        <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-base font-bold text-slate-900 dark:text-white">Request Volume Over Time</span>
        </CardHeader>
        <CardBody className="pt-3 p-6">
          {statsLoading ? (
            <div className="h-60 flex items-center justify-center text-sm text-slate-400">Loading metrics…</div>
          ) : chartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-sm text-slate-400 font-medium">
              No traffic recorded for this time period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800/60" />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 13,
                    borderRadius: 10,
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
                <Area type="monotone" dataKey="Allowed" stroke="#10b981" strokeWidth={2.5} fill="url(#gradAllowed)" />
                <Area type="monotone" dataKey="Blocked" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gradBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Top clients */}
      {topClients.length > 0 && (
        <Card>
          <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-base font-bold text-slate-900 dark:text-white">Top Active Clients</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                  {['Client ID', 'Requests', 'Allowed', 'Blocked', 'Block %'].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {topClients.map((c) => (
                  <tr key={c.clientId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md">
                        {c.clientId}
                      </span>
                    </td>
                    <td className="px-6 py-4 tabular-nums text-sm font-bold text-slate-900 dark:text-white">{c.total.toLocaleString()}</td>
                    <td className="px-6 py-4 tabular-nums text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{c.allowed.toLocaleString()}</td>
                    <td className="px-6 py-4 tabular-nums text-sm text-rose-600 dark:text-rose-400 font-semibold">{c.blocked.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.blocked / c.total > 0.2
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
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
