/**
 * ApiKeyBanner — displayed immediately after signup or API-key regeneration.
 * The raw key is shown once; the user must copy it before dismissing.
 */
import { useState } from 'react';
import { Copy, Check, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function ApiKeyBanner() {
  const { apiKey, dismissApiKey } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!apiKey) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Your API key — copy it now, it won&apos;t be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-amber-100 dark:bg-amber-900/50 px-3 py-1.5 font-mono text-xs text-amber-900 dark:text-amber-100 break-all">
              {apiKey}
            </code>
            <button
              onClick={copy}
              className="shrink-0 rounded p-1.5 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              aria-label="Copy API key"
              id="btn-copy-api-key"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Use this key in the <code className="font-mono">X-API-Key</code> header for all proxy requests.
          </p>
        </div>
        <button
          onClick={dismissApiKey}
          className="shrink-0 rounded p-1 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
          aria-label="Dismiss"
          id="btn-dismiss-api-key"
        >
          <X className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        </button>
      </div>
    </div>
  );
}
