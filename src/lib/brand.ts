import type { Site } from '../data/types';

/** Nama brand dan slogan untuk satu bahasa; kolom yang kosong memakai bahasa utama. */
export function brandOf(site: Site, lang: string): { brand: string; tagline: string | null } {
  const own = site.translations[lang];
  const main = site.translations[site.languages[0]] ?? Object.values(site.translations)[0];
  return { brand: own?.brand_name || main?.brand_name || site.slug, tagline: own?.tagline ?? main?.tagline ?? null };
}
