import type { APIRoute } from 'astro';
import { sendOrder } from '../../data/api';
import type { OrderRequest } from '../../data/types';

export const prerender = false;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** Penerus tipis: browser memanggil alamat yang sama dengan website, server meneruskannya ke backend. Tanpa logika bisnis. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (Number(request.headers.get('content-length') || 0) > 20000) return json({ code: 'E:empty' }, 413);
  let input: Partial<OrderRequest>;
  try { input = await request.json(); } catch { return json({ code: 'E:empty' }, 400); }
  const { status, body } = await sendOrder(locals, request, input);
  return json(body, status);
};
