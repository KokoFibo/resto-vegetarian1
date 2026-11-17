import type { APIRoute } from 'astro';
import { claimOnlinePayment, getOnlineStatus } from '../../data/api';

export const prerender = false;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** GET ?token=… → status pesanan online (tanpa nomor WhatsApp). */
export const GET: APIRoute = async ({ request, locals, url }) => {
  const { status, body } = await getOnlineStatus(locals, request, url.searchParams.get('token') || '');
  return json(body, status);
};

/** POST { token } → "Saya sudah bayar" (bayar di muka QRIS). Idempotent. */
export const POST: APIRoute = async ({ request, locals }) => {
  let input: { token?: string };
  try { input = await request.json(); } catch { return json({ code: 'E:invalid_order' }, 400); }
  const { status, body } = await claimOnlinePayment(locals, request, String(input.token ?? ''));
  return json(body, status);
};
