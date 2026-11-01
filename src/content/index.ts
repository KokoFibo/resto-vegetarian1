import type { Site } from '../data/types';
import type { Txt } from '../i18n';
import { ui } from '../i18n/ui';
import { brandOf } from '../lib/brand';
import * as aisin from './aisin';

/** Bentuk konten halaman Beranda/Filosofi/Kontak yang dibaca tampilan. */
export type HomeContent = {
  eyebrow: Txt;
  title: Txt;
  titleEm: Txt | null;
  lead: Txt;
  chips: { text: Txt; gold: boolean }[];
  /** image = kunci R2 gambar bawaan (null = tanpa foto bawaan); stamp/kicker/dish/price = keterangan milik foto bawaan. */
  hero: { image: string | null; alt: Txt; stamp: string | null; kicker: Txt | null; dish: Txt | null; price: number | null };
  stats: { value: string; label: Txt }[];
  featured: Txt;
  categories: Txt;
  cta: { title: Txt; body: Txt; button: Txt };
};
export type PhilosophyContent = typeof aisin.philosophy;
export type ContactContent = typeof aisin.contact;
export type SiteContent = { home: HomeContent; philosophy: PhilosophyContent | null; contact: ContactContent };

/** Teks yang sama di semua bahasa situs (nama brand dsb.), dalam bentuk Txt. */
const perLang = (site: Site, f: (lang: string) => string): Txt =>
  Object.assign({ id: f('id') }, Object.fromEntries(site.languages.map(l => [l, f(l)]))) as Txt;

/**
 * Konten per restoran. Set Aisin (teks Mandarin, statistik, Filosofi) hanya untuk slug "aisin".
 * Restoran lain memakai set generik netral: brand/slogan dari backend, tanpa pita statistik, tanpa halaman Filosofi.
 * (Teks hero tetap bisa diganti owner lewat site.hero untuk semua restoran.)
 */
export function contentFor(site: Site): SiteContent {
  if (site.slug === 'aisin') return { home: aisin.home as HomeContent, philosophy: aisin.philosophy, contact: aisin.contact };
  const chip = site.restaurant_type === 'umum' ? [] : [{ text: site.restaurant_type === 'vegan' ? ui.generic.chipVegan : ui.generic.chipVegetarian, gold: false }];
  return {
    home: {
      eyebrow: perLang(site, l => brandOf(site, l).brand),
      title: perLang(site, l => brandOf(site, l).tagline || brandOf(site, l).brand),
      titleEm: null,
      lead: ui.generic.lead,
      chips: chip,
      hero: { image: null, alt: perLang(site, l => brandOf(site, l).brand), stamp: null, kicker: null, dish: null, price: null },
      stats: [],
      featured: aisin.home.featured, categories: aisin.home.categories, cta: aisin.home.cta,
    },
    philosophy: null,
    contact: { ...aisin.contact, directions: ui.generic.directions },
  };
}
