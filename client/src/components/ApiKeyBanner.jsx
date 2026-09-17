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
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:border-amber-500/20 dark:bg-amber-950/20 p-4.5 shadow-xs">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-200">
            Your API key — copy it now, it won&apos;t be shown again.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-amber-500/10 dark:bg-zinc-900/90 border border-amber-500/20 dark:border-zinc-800 px-3 py-1.5 font-mono text-xs text-amber-950 dark:text-amber-200 break-all select-all">
              {apiKey}
            </code>
            <button
              onClick={copy}
              className="shrink-0 rounded-lg p-2 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-amber-500/20 dark:border-zinc-700 transition-colors cursor-pointer"
              aria-label="Copy API key"
              id="btn-copy-api-key"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-amber-800 dark:text-amber-300" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-400/80">
            Pass this key in the <code className="font-mono font-semibold px-1 rounded bg-amber-500/10 dark:bg-zinc-800">X-API-Key</code> header with every proxy request.
          </p>
        </div>
        <button
          onClick={dismissApiKey}
          className="shrink-0 rounded-lg p-1.5 hover:bg-amber-500/15 dark:hover:bg-zinc-800 text-amber-700 dark:text-amber-400 transition-colors"
          aria-label="Dismiss"
          id="btn-dismiss-api-key"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
