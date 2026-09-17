import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ExternalLink, Trash2, Activity, ChevronRight, Key, RotateCcw } from 'lucide-react';
import { endpointsApi, authApi } from '../api/resources.js';
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

  return (
    <Layout>
      <ApiKeyBanner />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Endpoints</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {data?.length ?? 0} registered endpoint{data?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} id="btn-new-endpoint">
          <Plus className="h-4 w-4" />
          New endpoint
        </Button>
      </div>

      {/* Endpoints table */}
      {isLoading ? (
        <div className="text-xs text-zinc-400 py-16 text-center">Loading endpoints…</div>
      ) : error ? (
        <div className="text-xs text-rose-500 py-16 text-center">Failed to load endpoints.</div>
      ) : data?.length === 0 ? (
        <Card>
          <CardBody className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center">
              <Activity className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No endpoints configured</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Register an upstream API endpoint to enforce sliding-window rate limiting.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} id="btn-first-endpoint">
              <Plus className="h-4 w-4" /> Register endpoint
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20">
                  {['Name', 'Target URL', 'Rate limit', 'Algorithm', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {data.map((ep) => (
                  <tr key={ep.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{ep.name}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-mono text-xs truncate block">
                        {ep.targetUrl}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-300 text-xs">
                      {ep.rateLimit.limit} req / {windowLabel(ep.rateLimit.windowMs)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color="gray">Sliding window</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={ep.isActive ? 'green' : 'gray'}>{ep.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/endpoints/${ep.id}`)} id={`btn-view-${ep.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        {deleteConfirm === ep.id ? (
                          <>
                            <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(ep.id)} disabled={deleteMutation.isPending} id={`btn-confirm-delete-${ep.id}`}>Confirm</Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)} id={`btn-cancel-delete-${ep.id}`}>Cancel</Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(ep.id)} id={`btn-delete-${ep.id}`}>
                            <Trash2 className="h-4 w-4 text-zinc-400 hover:text-rose-500" />
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

      {/* Account section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Account API Key</span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Active key prefix: <code className="font-mono text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60">{user?.apiKeyPrefix}…</code>
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Issued {user?.apiKeyCreatedAt ? new Date(user.apiKeyCreatedAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleRegenerate} disabled={regenerating} id="btn-regenerate-key">
                <RotateCcw className="h-3.5 w-3.5" />
                {regenerating ? 'Rotating…' : 'Rotate API key'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Proxy URL info */}
      {data?.length > 0 && (
        <div className="mt-4">
          <Card>
            <CardBody>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <strong className="text-zinc-900 dark:text-zinc-100">Gateway pattern:</strong>{' '}
                <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                  {import.meta.env.VITE_API_URL || window.location.origin}/proxy/:endpointId
                </code>
                {' '}<span className="text-xs text-zinc-500 dark:text-zinc-400">— Pass your API key in the <code className="font-mono">X-API-Key</code> header.</span>
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {showCreate && <CreateEndpointModal onClose={() => setShowCreate(false)} />}
    </Layout>
  );
}
