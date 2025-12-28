"use client";

import { ReactNode, useEffect } from 'react';

export interface SearchPanelShellProps {
  children: ReactNode;
  ctaLabel: string;
  onSearch: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function SearchPanelShell({
  children,
  ctaLabel,
  onSearch,
  loading = false,
  disabled = false,
}: SearchPanelShellProps) {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchPanelShell.tsx:13',message:'SearchPanelShell rendered',data:{ctaLabel,hasOnSearch:!!onSearch,loading,disabled},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
  }, [ctaLabel, onSearch, loading, disabled]);
  // #endregion

  return (
    <div className="ec-card mb-20" suppressHydrationWarning>
      {children}
      {/* CTA Row - Right Aligned */}
      <div className="ec-cta-row">
        <button
          type="button"
          onClick={(e) => {
            console.log('[DEBUG] Search button clicked', { ctaLabel, loading, disabled, hasOnSearch: !!onSearch, onSearchType: typeof onSearch });
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchPanelShell.tsx:26',message:'Search button clicked',data:{ctaLabel,loading,disabled,hasOnSearch:!!onSearch,onSearchType:typeof onSearch},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
            // #endregion
            e.preventDefault();
            e.stopPropagation();
            console.log('[DEBUG] After preventDefault', { hasOnSearch: !!onSearch, loading, disabled });
            if (onSearch && !loading && !disabled) {
              console.log('[SearchPanelShell] Calling onSearch', { onSearchName: onSearch.name, onSearchType: typeof onSearch });
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchPanelShell.tsx:32',message:'[SearchPanelShell] Calling onSearch',data:{ctaLabel,onSearchType:typeof onSearch,onSearchName:onSearch.name},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
              // #endregion
              (async () => {
                try {
                  await onSearch();
                  console.log('[SearchPanelShell] onSearch completed');
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchPanelShell.tsx:40',message:'[SearchPanelShell] onSearch completed',data:{ctaLabel},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                  // #endregion
                } catch (err) {
                  console.error('[SearchPanelShell] onSearch error', err);
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchPanelShell.tsx:45',message:'[SearchPanelShell] onSearch error',data:{ctaLabel,error:err instanceof Error?err.message:'Unknown',errorStack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'E'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
                  // #endregion
                }
              })();
            } else {
              console.warn('[DEBUG] onSearch blocked', { hasOnSearch: !!onSearch, loading, disabled });
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchPanelShell.tsx:51',message:'onSearch blocked',data:{hasOnSearch:!!onSearch,loading,disabled},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'B'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
              // #endregion
              console.warn('SearchPanelShell: onSearch blocked', { hasOnSearch: !!onSearch, loading, disabled });
            }
          }}
          disabled={loading || disabled}
          className="px-8 py-4 min-w-[320px] rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.5)] to-[rgba(28,140,130,0.4)] border-2 border-[rgba(28,140,130,0.6)] text-ec-text font-semibold text-base shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3),0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_18px_rgba(28,140,130,0.6),0_0_32px_rgba(28,140,130,0.4),0_12px_40px_rgba(0,0,0,0.5)] hover:border-[rgba(28,140,130,0.8)] hover:from-[rgba(28,140,130,0.6)] hover:to-[rgba(28,140,130,0.5)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3),0_8px_32px_rgba(0,0,0,0.4)] disabled:hover:border-[rgba(28,140,130,0.6)]"
        >
          {loading ? 'Searching...' : ctaLabel}
        </button>
      </div>
    </div>
  );
}

