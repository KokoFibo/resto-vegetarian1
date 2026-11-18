import { contentFor } from './content';
import type { Site } from './data/types';
import { ui } from './i18n/ui';

/** Halaman publik. Alamat di luar daftar ini (termasuk apa pun yang bukan halaman pengunjung) menghasilkan 404. */
export const ROUTES = [
  { slug: '', key: 'home', label: ui.nav.home },
  { slug: 'menu', key: 'menu', label: ui.nav.menu },
  { slug: 'filosofi', key: 'philosophy', label: ui.nav.philosophy },
  { slug: 'order', key: 'order', label: ui.nav.order },
  { slug: 'pesan', key: 'pesan', label: ui.nav.pesan },
  { slug: 'pesanan', key: 'pesanan', label: ui.nav.pesan },   // /pesanan/<token>: status pesanan online; tidak tampil di navigasi
  { slug: 'kontak', key: 'contact', label: ui.nav.contact },
] as const;

export type RouteKey = (typeof ROUTES)[number]['key'];

/** Halaman yang ada untuk restoran ini: Filosofi hanya bila restoran punya kontennya (lihat content/index.ts). */
export const routesFor = (site: Site) => ROUTES.filter(r => (r.key !== 'philosophy' || contentFor(site).philosophy) && (!['pesan', 'pesanan'].includes(r.key) || site.online?.enabled));
/** Rute di navigasi utama. /pesan dan /pesanan/<token> TIDAK tampil: halaman itu dibuka lewat tautan yang dibagikan restoran atau dari halaman Order. */
export const navRoutesFor = (site: Site) => routesFor(site).filter(r => r.key !== 'pesanan' && r.key !== 'pesan');
