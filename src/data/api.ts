/**
 * Satu-satunya tempat frontend berbicara dengan backend (lihat API-CONTRACT.md).
 * Tanpa API_URL, frontend memakai data contoh (demo.ts) dan pemesanan dinonaktifkan.
 */
import { env } from '../lib/env';
import { cleanTheme } from '../lib/theme';
import { demoMenu, demoSite } from './demo';
import type { Banner, Dish, Hero, HeroKey, Localized, Menu, OrderError, OrderRequest, OrderResult, Site, Table } from './types';

const TIMEOUT_MS = 8000;
const TOKEN = /^[0-9a-f]{32}$/;

const baseUrl = (locals: unknown) => env(locals, 'API_URL')?.replace(/\/+$/, '') || null;
export const isDemo = (site: Site) => site.id === 'demo';

/* ---- Normalisasi defensif: field baru boleh tidak ada (backend lama) atau berisi sampah; tampilan jatuh ke bawaan ---- */
const HERO_KEYS: HeroKey[] = ['eyebrow', 'title', 'title_em', 'lead', 'chip1', 'chip2', 'chip3', 'cta_order', 'cta_menu'];
const SAFE_LINK = /^(?:https:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*)$/;       // https://… atau /… (bukan //host, bukan javascript:)
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function localized(v: unknown): Localized {
  const out: Localized = {};
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (/^[a-z]{2}$/.test(k) && typeof x === 'string' && x.trim()) out[k] = x.trim();
  return out;
}
const hasText = (m: Localized) => Object.keys(m).length > 0;

function normalizeHero(raw: unknown): Hero {
  const r = (raw && typeof raw === 'object' ? raw : {}) as { texts?: Record<string, unknown>; image?: unknown };
  const texts: Hero['texts'] = {};
  for (const k of HERO_KEYS) { const m = localized(r.texts?.[k]); if (hasText(m)) texts[k] = m; }
  const image = typeof r.image === 'string' && /^https?:\/\//.test(r.image) ? r.image : null;
  return { texts, image };
}

function normalizeBanners(raw: unknown): Banner[] {
  if (!Array.isArray(raw)) return [];
  const out: Banner[] = [];
  for (const b of raw) {
    if (!b || typeof b !== 'object') continue;
    const x = b as Record<string, unknown>, text = localized(x.text);
    if (!SAFE_ID.test(String(x.id ?? '')) || !hasText(text)) continue;
    const link = typeof x.link_url === 'string' && SAFE_LINK.test(x.link_url.trim()) ? x.link_url.trim() : null;
    out.push({
      id: String(x.id), text, link_url: link, link_label: link ? localized(x.link_label) : null, blocks_orders: x.blocks_orders === true,
      kind: x.kind === 'promo' || x.kind === 'holiday' ? x.kind : 'info', scope: x.scope === 'home' || x.scope === 'order' ? x.scope : 'all',
      rev: typeof x.rev === 'number' || typeof x.rev === 'string' ? String(x.rev).slice(0, 20) : '0',
    });
    if (out.length === 3) break;
  }
  return out;
}

function normalizeSite(site: Site): Site {
  if (!Array.isArray(site.languages) || !site.languages.length) site.languages = ['id'];
  site.theme = cleanTheme(site.theme);
  site.orders_open = site.orders_open !== false;
  site.hero = normalizeHero(site.hero);
  site.banners = normalizeBanners(site.banners);
  return site;
}

const normalizeDish = (d: Dish): Dish => ({ ...d, featured: d.featured === true });

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
  if (!base) return demoSite(locals);
  const host = (request.headers.get('host') || new URL(request.url).host).split(':')[0].toLowerCase();
  const site = await get<Site>(base, 'site', { host, slug: env(locals, 'DEFAULT_SITE_SLUG') });
  return site ? normalizeSite(site) : null;
}

export async function getMenu(locals: unknown, site: Site): Promise<Menu> {
  const base = baseUrl(locals);
  if (!base || isDemo(site)) return demoMenu(locals);
  const menu = (await get<Menu>(base, 'menu', { site: site.id })) ?? { cats: [], dishes: [] };
  return { cats: menu.cats ?? [], dishes: (menu.dishes ?? []).map(normalizeDish) };
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
