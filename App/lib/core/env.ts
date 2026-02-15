export function hasEnv(key: string): boolean {
  return !!process.env[key];
}

export function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is missing`);
  return v;
}

/** True when deployed to Vercel production. */
export function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * PRODUCTION SAFETY: In production, no demo data, no fallback providers.
 * Missing env vars must throw.
 */
export function requireEnvInProduction(key: string): string {
  if (isProduction()) {
    const v = (process.env[key] ?? "").trim();
    if (!v) throw new Error(`[production] ${key} is required and must be set`);
    return v;
  }
  return process.env[key] ?? "";
}