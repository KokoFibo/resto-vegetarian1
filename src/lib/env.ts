declare const process: { env?: Record<string, string | undefined> } | undefined;

/** Baca variabel lingkungan: runtime Cloudflare dulu, lalu build/dev. Hanya dipakai di server. */
export const env = (locals: unknown, key: string): string | undefined =>
  (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env?.[key] ??
  (import.meta.env as Record<string, string | undefined>)[key] ??
  (typeof process !== 'undefined' ? process.env?.[key] : undefined);
