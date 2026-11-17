/**
 * Satu-satunya tempat frontend berbicara dengan backend (lihat API-CONTRACT.md).
 * Tanpa API_URL, frontend memakai data contoh (demo.ts) dan pemesanan dinonaktifkan.
 */
import { isReservedPlatformHost, requestHost } from '../lib/host';
import { env } from '../lib/env';
import { cleanTheme } from '../lib/theme';
import { demoMenu, demoSite } from './demo';
import type { Banner, BillRequestResult, Dish, Hero, HeroKey, Localized, Menu, OnlineOrderRequest, OnlineOrderResult, OnlineOrderStatus, OrderError, OrderRequest, OrderResult, Site, SiteOnline, Table } from './types';

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

function normalizeOnline(raw: unknown): SiteOnline {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const enabled = r.enabled === true, qris = typeof r.qris_url === 'string' && /^https:\/\//.test(r.qris_url) ? r.qris_url : null;
  return { enabled, prepay: enabled && r.prepay === true && !!qris, qris_url: qris, pickup_note: typeof r.pickup_note === 'string' && r.pickup_note.trim() ? r.pickup_note.trim().slice(0, 300) : null };
}

function normalizeSite(site: Site): Site {
  if (!Array.isArray(site.languages) || !site.languages.length) site.languages = ['id'];
  site.theme = cleanTheme(site.theme);
  site.orders_open = site.orders_open !== false;
  site.menu_display = site.menu_display === 'text' ? 'text' : 'photo';
  site.hero = normalizeHero(site.hero);
  site.banners = normalizeBanners(site.banners);
  site.online = normalizeOnline(site.online);
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
  const host = requestHost(request);
  if (!host || isReservedPlatformHost(host, env(locals, 'BASE_DOMAIN'))) return null;   // admin./api./www. bukan restoran
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
        client: TOKEN.test(String(input.client ?? '')) ? String(input.client) : undefined,
      }),
    });
    const body = await res.json().catch(() => ({ code: 'E:unavailable' }));
    return { status: res.status, body };
  } catch { return unavailable; }
}

/** Pelanggan menekan "Minta bill": kasir diberi penanda. Idempotent. */
export async function requestBill(locals: unknown, request: Request, input: { token?: string; client?: string }): Promise<{ status: number; body: BillRequestResult | OrderError }> {
  const unavailable = { status: 503, body: { code: 'E:unavailable' } };
  const base = baseUrl(locals);
  if (!base) return unavailable;
  let site: Site | null;
  try { site = await getSite(request, locals); } catch { return unavailable; }
  if (!site || isDemo(site)) return unavailable;
  try {
    const res = await fetch(`${base}/v1/bill-request`, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({ site: site.id, token: String(input.token ?? ''), client: TOKEN.test(String(input.client ?? '')) ? String(input.client) : undefined }),
    });
    const body = await res.json().catch(() => ({ code: 'E:unavailable' }));
    return { status: res.status, body };
  } catch { return unavailable; }
}

/* ---------------- Pesanan online (v1.4) ---------------- */
const unavailable = { status: 503, body: { code: 'E:unavailable' } as OrderError };

/** Memastikan Turnstile lolos bila dikonfigurasi (TURNSTILE_SECRET). Tanpa secret = dilewati. Ini lapisan tambahan: batas sebenarnya ada di database. */
async function captchaOk(locals: unknown, request: Request, token: string | undefined): Promise<boolean> {
  const secret = env(locals, 'TURNSTILE_SECRET'); if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    const ip = request.headers.get('cf-connecting-ip'); if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return ((await r.json()) as { success?: boolean }).success === true;
  } catch { return false; }
}

async function onlineSite(locals: unknown, request: Request): Promise<Site | null> {
  try { const s = await getSite(request, locals); return s && !isDemo(s) ? s : null; } catch { return null; }
}

export async function sendOnlineOrder(locals: unknown, request: Request, input: Partial<OnlineOrderRequest>): Promise<{ status: number; body: OnlineOrderResult | OrderError }> {
  const base = baseUrl(locals); if (!base) return unavailable;
  const site = await onlineSite(locals, request); if (!site) return unavailable;
  if (!site.online?.enabled) return { status: 409, body: { code: 'E:online_off' } };
  if (!(await captchaOk(locals, request, input.captcha))) return { status: 403, body: { code: 'E:captcha' } };
  try {
    const res = await fetch(`${base}/v1/online-orders`, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        site: site.id, lang: String(input.lang ?? '').slice(0, 5),
        items: (input.items ?? []).slice(0, 40).map(i => ({ id: String(i.id), qty: Math.round(Number(i.qty)) })),
        name: String(input.name ?? '').slice(0, 60), phone: String(input.phone ?? '').slice(0, 30), note: String(input.note ?? '').slice(0, 200),
        pickup_by: input.pickup_by === 'courier' ? 'courier' : 'customer', pay_plan: input.pay_plan === 'prepay_qris' ? 'prepay_qris' : 'at_pickup',
        client: TOKEN.test(String(input.client ?? '')) ? String(input.client) : undefined,
      }),
    });
    return { status: res.status, body: await res.json().catch(() => unavailable.body) };
  } catch { return unavailable; }
}

export async function getOnlineStatus(locals: unknown, request: Request, token: string): Promise<{ status: number; body: OnlineOrderStatus | OrderError }> {
  if (!TOKEN.test(token)) return { status: 404, body: { code: 'E:invalid_order' } };
  const base = baseUrl(locals); if (!base) return unavailable;
  const site = await onlineSite(locals, request); if (!site) return unavailable;
  try {
    const res = await fetch(`${base}/v1/online-orders?${new URLSearchParams({ site: site.id, token })}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { status: res.status, body: await res.json().catch(() => unavailable.body) };
  } catch { return unavailable; }
}

export async function claimOnlinePayment(locals: unknown, request: Request, token: string): Promise<{ status: number; body: { ok: true } | OrderError }> {
  if (!TOKEN.test(token)) return { status: 404, body: { code: 'E:invalid_order' } };
  const base = baseUrl(locals); if (!base) return unavailable;
  const site = await onlineSite(locals, request); if (!site) return unavailable;
  try {
    const res = await fetch(`${base}/v1/online-claim`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS), body: JSON.stringify({ site: site.id, token }) });
    return { status: res.status, body: await res.json().catch(() => unavailable.body) };
  } catch { return unavailable; }
}
