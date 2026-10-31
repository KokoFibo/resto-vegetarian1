import type { Menu, Site, Table } from '../data/types';

/** Props yang diterima setiap tampilan halaman dari pengarah rute. */
export type ViewProps = { lang: string; site: Site; menu: Menu; table: Table | null; token: string };
