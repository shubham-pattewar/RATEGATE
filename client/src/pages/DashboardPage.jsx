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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Endpoints</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
        <div className="text-sm text-gray-500 dark:text-gray-400 py-12 text-center">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600 py-12 text-center">Failed to load endpoints.</div>
      ) : data?.length === 0 ? (
        <Card>
          <CardBody className="py-16 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Activity className="h-6 w-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900 dark:text-white">No endpoints yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Register your first API endpoint to start rate limiting.</p>
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Name', 'Target URL', 'Rate limit', 'Algorithm', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {data.map((ep) => (
                  <tr key={ep.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{ep.name}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 font-mono text-xs truncate block">
                        {ep.targetUrl}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {ep.rateLimit.limit} req / {windowLabel(ep.rateLimit.windowMs)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color="blue">Sliding window</Badge>
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
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">API key</span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your key prefix: <code className="font-mono text-gray-900 dark:text-white">{user?.apiKeyPrefix}…</code>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Created {user?.apiKeyCreatedAt ? new Date(user.apiKeyCreatedAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleRegenerate} disabled={regenerating} id="btn-regenerate-key">
                <RotateCcw className="h-3.5 w-3.5" />
                {regenerating ? 'Regenerating…' : 'Regenerate key'}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">Proxy URL pattern:</strong>{' '}
                <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  {window.location.origin}/proxy/:endpointId
                </code>
                {' '}<span className="text-xs">— send your API key in the <code className="font-mono">X-API-Key</code> header.</span>
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {showCreate && <CreateEndpointModal onClose={() => setShowCreate(false)} />}
    </Layout>
  );
}
