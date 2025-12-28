"use client";

import { useEffect } from 'react';
import { SearchPanelShell } from './SearchPanelShell';
import type { SearchPanelShellProps } from './SearchPanelShell';

// Client-only wrapper that shows skeleton while mounting
export default function SearchPanelShellClient(props: SearchPanelShellProps) {
  useEffect(() => {
    console.log('[DEBUG] SearchPanelShellClient mounted', { 
      ctaLabel: props.ctaLabel, 
      hasOnSearch: !!props.onSearch, 
      onSearchType: typeof props.onSearch,
      onSearchName: props.onSearch?.name,
      loading: props.loading, 
      disabled: props.disabled 
    });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchPanelShell.client.tsx:10',message:'SearchPanelShellClient mounted',data:{ctaLabel:props.ctaLabel,hasOnSearch:!!props.onSearch,onSearchType:typeof props.onSearch,onSearchName:props.onSearch?.name,loading:props.loading,disabled:props.disabled},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'D'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
    // #endregion
  }, [props.ctaLabel, props.onSearch, props.loading, props.disabled]);

  // Test if onSearch is callable
  useEffect(() => {
    if (props.onSearch) {
      console.log('[DEBUG] onSearch function details', {
        name: props.onSearch.name,
        type: typeof props.onSearch,
        toString: props.onSearch.toString().substring(0, 100)
      });
    }
  }, [props.onSearch]);

  return <SearchPanelShell {...props} />;
}

