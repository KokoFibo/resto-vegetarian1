import type { APIRoute } from 'astro';
import { requestBill } from '../../data/api';

export const prerender = false;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** Penerus tipis untuk tombol "Minta bill". Tanpa logika bisnis. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (Number(request.headers.get('content-length') || 0) > 2000) return json({ code: 'E:invalid_table' }, 413);
  let input: { token?: string; client?: string };
  try { input = await request.json(); } catch { return json({ code: 'E:invalid_table' }, 400); }
  const { status, body } = await requestBill(locals, request, input);
  return json(body, status);
};
