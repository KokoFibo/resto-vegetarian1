import type { APIRoute } from 'astro';
import { env } from '../lib/env';
import { requestHost } from '../lib/host';

/**
 * Diagnosis: buka https://<apa-saja>.<domain-dasar>/healthz.
 *  - Tidak ada balasan / error 522 dari Cloudflare → Worker TIDAK menerima permintaan (route atau DNS wildcard belum benar).
 *  - JSON {"worker":"ok",...} → Worker hidup; lihat "api_status" untuk memastikan Worker bisa menghubungi API admin.
 * Tidak membuka rahasia apa pun (hanya host, domain dasar, dan alamat API yang memang publik).
 */
export const prerender = false;
export const GET: APIRoute = async ({ request, locals }) => {
  const host = requestHost(request), api = (env(locals, 'API_URL') || '').replace(/\/+$/, '');
  let api_status: number | string = 'API_URL belum diisi';
  const t0 = Date.now();
  if (api) {
    try { api_status = (await fetch(`${api}/v1/site?host=${encodeURIComponent(host ?? '-')}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(6000) })).status; }
    catch (e) { api_status = `gagal: ${(e as Error).name}`; }
  }
  const hint = api_status === 200 ? 'Restoran ditemukan dan API terjangkau.' : api_status === 404 ? 'API terjangkau, tetapi host ini belum terdaftar di tenant_domains (restoran tidak ada).' : 'Worker hidup, tetapi API admin tidak terjangkau atau error: periksa API_URL, route Worker = None untuk admin./api., dan flag global_fetch_strictly_public.';
  return new Response(JSON.stringify({ worker: 'ok', host, base_domain: env(locals, 'BASE_DOMAIN') ?? null, api: api || null, api_status, api_ms: Date.now() - t0, hint }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
};
