import { ui } from './i18n/ui';

/** Halaman publik. Alamat di luar daftar ini (termasuk apa pun yang bukan halaman pengunjung) menghasilkan 404. */
export const ROUTES = [
  { slug: '', key: 'home', label: ui.nav.home },
  { slug: 'menu', key: 'menu', label: ui.nav.menu },
  { slug: 'filosofi', key: 'philosophy', label: ui.nav.philosophy },
  { slug: 'order', key: 'order', label: ui.nav.order },
  { slug: 'kontak', key: 'contact', label: ui.nav.contact },
] as const;

export type RouteKey = (typeof ROUTES)[number]['key'];
