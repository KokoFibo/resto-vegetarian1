import type { APIRoute } from 'astro';
import { sendOnlineOrder } from '../../data/api';
import type { OnlineOrderRequest } from '../../data/types';

export const prerender = false;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** Penerus tipis untuk pesanan online: memeriksa Turnstile (bila dikonfigurasi), lalu meneruskan ke backend. Harga tidak pernah dikirim. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (Number(request.headers.get('content-length') || 0) > 20000) return json({ code: 'E:empty' }, 413);
  let input: Partial<OnlineOrderRequest>;
  try { input = await request.json(); } catch { return json({ code: 'E:empty' }, 400); }
  const { status, body } = await sendOnlineOrder(locals, request, input);
  return json(body, status);
};
