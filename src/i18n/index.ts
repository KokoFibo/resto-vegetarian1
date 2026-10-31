import type { Localized, Site } from '../data/types';

/** Semua kode bahasa yang disiapkan; yang aktif per restoran ditentukan backend (maksimal 2). */
export const LANGS = ['id', 'en', 'zh', 'fr', 'es', 'ko', 'ja'] as const;
export const LANG_LABEL: Record<string, string> = { id: 'ID', en: 'EN', zh: '中', fr: 'FR', es: 'ES', ko: '한', ja: '日' };
export const HTML_LANG: Record<string, string> = { id: 'id', en: 'en', zh: 'zh-CN', fr: 'fr', es: 'es', ko: 'ko', ja: 'ja' };

/** Teks tetap per bahasa. Bahasa Indonesia wajib; bahasa yang belum ditulis memakai Indonesia. */
export type Txt = { id: string; en?: string; zh?: string; fr?: string; es?: string; ko?: string; ja?: string };

export const pick = (t: Txt, lang: string): string => (t as Record<string, string | undefined>)[lang] ?? t.id;

/** Teks dari backend: bahasa yang diminta, lalu bahasa utama, lalu bahasa apa pun yang terisi. */
export function loc(m: Localized | null | undefined, lang: string, primary: string): string {
  if (!m) return '';
  return m[lang] || m[primary] || Object.values(m).find(Boolean) || '';
}

/** Alamat halaman: bahasa utama tanpa awalan (/menu), bahasa kedua berawalan (/zh/menu). */
export const href = (site: Site, lang: string, slug = ''): string =>
  (lang === site.languages[0] ? '/' : `/${lang}/`) + slug;
