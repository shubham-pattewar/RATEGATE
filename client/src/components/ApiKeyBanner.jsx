/**
 * ApiKeyBanner — displayed immediately after signup or API-key regeneration.
 * The raw key is shown once; the user must copy it before dismissing.
 */
import { useState } from 'react';
import { Copy, Check, X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
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
    <div className="mb-6 rounded-[14px] border border-amber-300/80 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30 p-4.5 shadow-xs backdrop-blur-xs">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
            Important: Save your new API key
          </p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
            This secret key is displayed only once. Copy and store it securely.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <code className="flex-1 rounded-xl bg-white/90 dark:bg-[#0b101c] border border-amber-200/80 dark:border-amber-900/40 px-3.5 py-2 font-mono text-xs font-semibold text-amber-900 dark:text-amber-200 break-all select-all shadow-2xs">
              {apiKey}
            </code>
            <button
              onClick={copy}
              className={clsx(
                "relative overflow-hidden shrink-0 rounded-xl px-3.5 py-2 border transition-all duration-300 shadow-2xs flex items-center gap-1.5 text-xs font-semibold select-none cursor-pointer",
                copied
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 animate-copy-pulse shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-white dark:bg-[#0e1526] border-amber-200/80 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 active:scale-95 group"
              )}
              aria-label="Copy API key"
              id="btn-copy-api-key"
            >
              {copied && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/25 to-transparent animate-sheen pointer-events-none" />
              )}
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-checkmark" />
                  <span className="animate-copy-text font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-400 font-medium">
            Send this key in the <code className="font-mono bg-amber-100/60 dark:bg-amber-950/60 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200">X-API-Key</code> header for proxy requests.
          </p>
        </div>
        <button
          onClick={dismissApiKey}
          className="shrink-0 rounded-lg p-1.5 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 transition-colors"
          aria-label="Dismiss"
          id="btn-dismiss-api-key"
        >
          <X className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        </button>
      </div>
    </div>
  );
}
