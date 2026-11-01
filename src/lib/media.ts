import { env } from './env';

/**
 * Alamat gambar bawaan template (bukan foto menu: foto menu & hero kustom sudah berupa URL dari API).
 * - MEDIA_URL terisi  → `${MEDIA_URL}/<kunci R2>`, mis. https://images.kokofibo.com/restaurant/defaults/aisin/koki-gu.webp
 * - MEDIA_URL kosong  → cadangan lokal `/images/<berkas>` (folder public/images tetap ada untuk mode contoh/dev)
 * URL penuh (https://…) atau alamat berawalan "/" dikembalikan apa adanya.
 */
export function mediaUrl(locals: unknown, key: string | null | undefined): string {
  if (!key) return '';
  if (/^https?:\/\//.test(key) || key.startsWith('/')) return key;
  const base = env(locals, 'MEDIA_URL')?.trim().replace(/\/+$/, '');
  return base ? `${base}/${key}` : `/images/${key.split('/').pop()}`;
}
