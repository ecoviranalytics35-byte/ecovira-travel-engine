"use client";

export interface AutocompleteDebugInfo {
  url: string;
  status: number;
  count: number;
  error?: string;
}

interface DebugAutocompletePanelProps {
  info: AutocompleteDebugInfo | null;
  label?: string;
}

export function DebugAutocompletePanel({ info, label = "Autocomplete" }: DebugAutocompletePanelProps) {
  if (!info) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-left font-mono text-xs text-amber-200">
        <div className="font-semibold uppercase tracking-wider text-amber-400">{label} (debug)</div>
        <div className="mt-1 text-ec-muted">No request yet</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-left font-mono text-xs text-amber-200">
      <div className="font-semibold uppercase tracking-wider text-amber-400">{label} (debug)</div>
      <div className="mt-2 space-y-1 break-all">
        <div><span className="text-ec-muted">URL:</span> {info.url || "—"}</div>
        <div><span className="text-ec-muted">Status:</span> {info.status ?? "—"}</div>
        <div><span className="text-ec-muted">Count:</span> {info.count ?? "—"}</div>
        {info.error != null && info.error !== "" && (
          <div><span className="text-ec-muted">Error:</span> <span className="text-red-300">{info.error}</span></div>
        )}
      </div>
    </div>
  );
}
