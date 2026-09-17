import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Activity, ChevronRight, Key, RotateCcw, Terminal, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { endpointsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Layout } from '../components/Layout.jsx';
import { Card, CardHeader, CardBody } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';
import { ApiKeyBanner } from '../components/ApiKeyBanner.jsx';
import { CreateEndpointModal } from '../components/CreateEndpointModal.jsx';

function windowLabel(ms) {
  if (ms < 60_000) return `${ms / 1000}s`;
  if (ms < 3_600_000) return `${ms / 60_000}m`;
  if (ms < 86_400_000) return `${ms / 3_600_000}h`;
  return `${ms / 86_400_000}d`;
}

export function DashboardPage() {
  const { user, regenerateApiKey } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // endpointId

  const { data, isLoading, error } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => endpointsApi.list().then((r) => r.data.endpoints),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => endpointsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['endpoints'] }); setDeleteConfirm(null); },
  });

  const [regenerating, setRegenerating] = useState(false);
  const handleRegenerate = async () => {
    if (!window.confirm('This will invalidate your current API key. Continue?')) return;
    setRegenerating(true);
    try { await regenerateApiKey(); } finally { setRegenerating(false); }
  };

  const proxyBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const proxyPatternUrl = `${proxyBaseUrl}/proxy/:endpointId`;
  const [copiedPattern, setCopiedPattern] = useState(false);
  const [copiedEndpointId, setCopiedEndpointId] = useState(null);

  const handleCopyPattern = async () => {
    try {
      await navigator.clipboard.writeText(proxyPatternUrl);
      setCopiedPattern(true);
      setTimeout(() => setCopiedPattern(false), 2000);
    } catch (err) {
      console.error('Failed to copy proxy URL pattern', err);
    }
  };

  const handleCopyEndpointRoute = async (epId) => {
    try {
      await navigator.clipboard.writeText(`${proxyBaseUrl}/proxy/${epId}`);
      setCopiedEndpointId(epId);
      setTimeout(() => setCopiedEndpointId(null), 2000);
    } catch (err) {
      console.error('Failed to copy route to clipboard', err);
    }
  };

  return (
    <Layout>
      <ApiKeyBanner />

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Endpoints
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            {data?.length ?? 0} registered endpoint{data?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} id="btn-new-endpoint" className="self-start sm:self-auto font-semibold px-4.5 py-2.5 text-sm">
          <Plus className="h-4.5 w-4.5" />
          New endpoint
        </Button>
      </div>

      {/* Endpoints Table Card */}
      {isLoading ? (
        <Card className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading endpoints…</p>
        </Card>
      ) : error ? (
        <Card className="py-16 text-center">
          <p className="text-sm text-rose-500 font-medium">Failed to load endpoints. Please refresh the page.</p>
        </Card>
      ) : data?.length === 0 ? (
        <Card>
          <CardBody className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">No endpoints configured yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Register your first API endpoint to start protecting your downstream services with sliding-window limits.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} id="btn-first-endpoint">
              <Plus className="h-4 w-4" /> Register endpoint
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0c1220]/60">
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target URL</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate Limit</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Algorithm</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.map((ep) => (
                  <tr
                    key={ep.id}
                    className="hover:bg-purple-50/20 dark:hover:bg-purple-950/15 transition-colors duration-150 group"
                  >
                    <td className="py-4.5 px-6 text-base font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {ep.name}
                    </td>
                    <td className="py-4.5 px-6 max-w-xs sm:max-w-md">
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-300 truncate block">
                        {ep.targetUrl}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-sm text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                      {ep.rateLimit.limit} req / {windowLabel(ep.rateLimit.windowMs)}
                    </td>
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <Badge color="purple">Sliding window</Badge>
                    </td>
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <Badge color={ep.isActive ? 'green' : 'gray'}>
                        {ep.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4.5 px-6 whitespace-nowrap text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleCopyEndpointRoute(ep.id)}
                          aria-label={`Copy live proxy route for ${ep.name}`}
                          title="Copy live proxy route"
                          id={`btn-copy-route-${ep.id}`}
                          className={clsx(
                            'relative overflow-hidden p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer select-none transition-all duration-300',
                            copiedEndpointId === ep.id
                              ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 animate-copy-pulse shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'bg-transparent border-transparent hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-200/60 dark:hover:border-purple-800/60 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 active:scale-95 group'
                          )}
                        >
                          {copiedEndpointId === ep.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/25 to-transparent animate-sheen pointer-events-none" />
                          )}
                          {copiedEndpointId === ep.id ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-checkmark" />
                              <span className="animate-copy-text text-xs">Copied!</span>
                            </>
                          ) : (
                            <Copy className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                          )}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/endpoints/${ep.id}`)}
                          aria-label={`View endpoint ${ep.name}`}
                          id={`btn-view-${ep.id}`}
                          className="hover:text-purple-600 dark:hover:text-purple-400 p-2"
                        >
                          <ChevronRight className="h-4.5 w-4.5" />
                        </Button>
                        {deleteConfirm === ep.id ? (
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteMutation.mutate(ep.id)}
                              disabled={deleteMutation.isPending}
                              id={`btn-confirm-delete-${ep.id}`}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                              id={`btn-cancel-delete-${ep.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(ep.id)}
                            aria-label={`Delete endpoint ${ep.name}`}
                            id={`btn-delete-${ep.id}`}
                            className="hover:text-rose-500 p-2"
                          >
                            <Trash2 className="h-4.5 w-4.5 text-slate-400 hover:text-rose-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* API Key & Proxy URL Sections: Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* API Key Card */}
        <Card>
          <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Key className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                API Key
              </span>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your key prefix:{' '}
                  <code className="font-mono text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-200/70 dark:border-purple-800/50">
                    {user?.apiKeyPrefix}…
                  </code>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                  Created {user?.apiKeyCreatedAt ? new Date(user.apiKeyCreatedAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <Button
                variant="outline-purple"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerating}
                id="btn-regenerate-key"
                className="shrink-0 self-start sm:self-auto text-sm px-3.5 py-2"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {regenerating ? 'Regenerating…' : 'Regenerate key'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Proxy URL Card */}
        <Card>
          <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Proxy URL Pattern
              </span>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b101c] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                <code className="font-mono text-sm text-slate-800 dark:text-slate-200 select-all block whitespace-nowrap truncate">
                  {proxyBaseUrl}/proxy/:endpointId
                </code>
                <button
                  onClick={handleCopyPattern}
                  id="btn-copy-proxy-pattern"
                  aria-label={copiedPattern ? 'Pattern copied' : 'Copy proxy URL pattern'}
                  className={clsx(
                    'relative overflow-hidden text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer select-none shrink-0 transition-all duration-300',
                    copiedPattern
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 animate-copy-pulse shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                      : 'bg-white dark:bg-[#0e1526] border-slate-200/80 dark:border-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 active:scale-95 group'
                  )}
                >
                  {copiedPattern && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/25 to-transparent animate-sheen pointer-events-none" />
                  )}
                  {copiedPattern ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-checkmark" />
                      <span className="animate-copy-text font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 transition-transform duration-200 group-hover:scale-110" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Send your API key in the <code className="font-mono font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">X-API-Key</code> header with every request.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {showCreate && <CreateEndpointModal onClose={() => setShowCreate(false)} />}
    </Layout>
  );
}
