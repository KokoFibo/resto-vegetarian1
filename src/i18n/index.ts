import type { Localized, Site } from '../data/types';

/** Semua kode bahasa yang disiapkan; yang aktif per restoran ditentukan backend (maksimal 2). */
export const LANGS = ['id', 'en', 'zh', 'zt', 'fr', 'es', 'ko', 'ja'] as const;   // zt = 繁體中文 (Chinese Traditional), HTML lang zh-Hant
export const LANG_LABEL: Record<string, string> = { id: 'ID', en: 'EN', zh: '中', zt: '繁', fr: 'FR', es: 'ES', ko: '한', ja: '日' };
export const HTML_LANG: Record<string, string> = { id: 'id', en: 'en', zh: 'zh-CN', zt: 'zh-Hant', fr: 'fr', es: 'es', ko: 'ko', ja: 'ja' };

/** Teks tetap per bahasa. Bahasa Indonesia wajib. Bahasa yang belum ditulis: zt memakai 简体 (zh), lalu Inggris, lalu Indonesia. */
export type Txt = { id: string; en?: string; zh?: string; zt?: string; fr?: string; es?: string; ko?: string; ja?: string };

export const pick = (t: Txt, lang: string): string => { const m = t as Record<string, string | undefined>; return m[lang] ?? (lang === 'zt' ? m.zh : undefined) ?? m.en ?? t.id ?? Object.values(m).find(Boolean) ?? ''; };

/** Teks dari backend: bahasa yang diminta, lalu bahasa utama, lalu bahasa apa pun yang terisi. */
export function loc(m: Localized | null | undefined, lang: string, primary: string): string {
  if (!m) return '';
  return m[lang] || m[primary] || Object.values(m).find(Boolean) || '';
}

/** Alamat halaman: bahasa utama tanpa awalan (/menu), bahasa kedua berawalan (/zh/menu). */
export const href = (site: Site, lang: string, slug = ''): string =>
  (lang === site.languages[0] ? '/' : `/${lang}/`) + slug;

/** Istilah yang bisa diubah Owner di admin (per bahasa). Bahasa tanpa istilah sendiri memakai teks bawaan bahasa itu (bukan istilah bahasa lain). */
export const lbl = (site: Site, lang: string, key: string, fallback: string): string => site.labels?.[key]?.[lang]?.trim() || fallback;

/** Bahasa UTAMA restoran (sumber isi & fallback teks yang belum diterjemahkan). site.languages[0] adalah bahasa TAMPILAN AWAL (bisa berbeda). */
export const primaryOf = (site: Site): string => (site.primary_lang && site.languages.includes(site.primary_lang) ? site.primary_lang : site.languages[0]);
