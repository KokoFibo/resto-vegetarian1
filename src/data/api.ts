/**
 * Satu-satunya tempat frontend berbicara dengan backend (lihat API-CONTRACT.md).
 * Tanpa API_URL, frontend memakai data contoh (demo.ts) dan pemesanan dinonaktifkan.
 */
import { env } from '../lib/env';
import { DEMO_MENU, DEMO_SITE } from './demo';
import type { Menu, OrderError, OrderRequest, OrderResult, Site, Table } from './types';

const TIMEOUT_MS = 8000;
const TOKEN = /^[0-9a-f]{32}$/;

const baseUrl = (locals: unknown) => env(locals, 'API_URL')?.replace(/\/+$/, '') || null;
export const isDemo = (site: Site) => site.id === 'demo';

async function get<T>(base: string, path: string, params: Record<string, string | null | undefined>): Promise<T | null> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  const res = await fetch(`${base}/v1/${path}?${qs}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** Restoran dari domain yang dibuka. null = domain tidak dikenal; melempar error bila backend bermasalah. */
export async function getSite(request: Request, locals: unknown): Promise<Site | null> {
  const base = baseUrl(locals);
  if (!base) return DEMO_SITE;
  const host = (request.headers.get('host') || new URL(request.url).host).split(':')[0].toLowerCase();
  const site = await get<Site>(base, 'site', { host, slug: env(locals, 'DEFAULT_SITE_SLUG') });
  if (!site) return null;
  if (!Array.isArray(site.languages) || !site.languages.length) site.languages = ['id'];
  return site;
}

export async function getMenu(locals: unknown, site: Site): Promise<Menu> {
  const base = baseUrl(locals);
  if (!base || isDemo(site)) return DEMO_MENU;
  return (await get<Menu>(base, 'menu', { site: site.id })) ?? { cats: [], dishes: [] };
}

/** Meja dari token QR; null bila token salah, meja nonaktif, atau bukan milik restoran ini. */
export async function getTable(locals: unknown, site: Site, token: string): Promise<Table | null> {
  const base = baseUrl(locals);
  if (!base || isDemo(site) || !TOKEN.test(token)) return null;
  return get<Table>(base, 'table', { site: site.id, token });
}

/** Meneruskan pesanan ke backend. Harga tidak pernah dikirim: backend menghitungnya sendiri. */
export async function sendOrder(locals: unknown, request: Request, input: Partial<OrderRequest>): Promise<{ status: number; body: OrderResult | OrderError }> {
  const unavailable = { status: 503, body: { code: 'E:unavailable' } };
  const base = baseUrl(locals);
  if (!base) return unavailable;
  let site: Site | null;
  try { site = await getSite(request, locals); } catch { return unavailable; }
  if (!site || isDemo(site)) return unavailable;
  try {
    const res = await fetch(`${base}/v1/orders`, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        site: site.id, token: String(input.token ?? ''), lang: String(input.lang ?? '').slice(0, 5),
        items: (input.items ?? []).slice(0, 40).map(i => ({ id: String(i.id), qty: Math.round(Number(i.qty)) })),
        name: String(input.name ?? '').slice(0, 60), note: String(input.note ?? '').slice(0, 200),
      }),
    });
    const body = await res.json().catch(() => ({ code: 'E:unavailable' }));
    return { status: res.status, body };
  } catch { return unavailable; }
}
