/**
 * Registri template. Satu aplikasi melayani semua restoran; tampilan dipilih dari site.template_id (tenants.template_id).
 * Menambah template baru: lihat src/templates/README.md.
 */
import type { RouteKey } from '../routes';
import AisinBase from '../layouts/Base.astro';
import Home from '../views/Home.astro';
import Menu from '../views/Menu.astro';
import Filosofi from '../views/Filosofi.astro';
import Order from '../views/Order.astro';
import Kontak from '../views/Kontak.astro';
import NotFound from '../views/NotFound.astro';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Template = {
  /** Layout halaman: props { site, lang, slug, routeKey?, noindex? }; slot = isi halaman. */
  Base: any;
  /** Satu tampilan per rute; props { lang, site, menu, table, token }. */
  views: Record<RouteKey, any>;
  NotFound: any;
};

export const DEFAULT_TEMPLATE = 'aisin';

export const templates: Record<string, Template> = {
  aisin: { Base: AisinBase, views: { home: Home, menu: Menu, philosophy: Filosofi, order: Order, contact: Kontak }, NotFound },
  // modern: { Base: ModernBase, views: { ... }, NotFound: ModernNotFound },   ← template berikutnya
};

export const pickTemplate = (id?: string | null): Template => templates[id ?? ''] ?? templates[DEFAULT_TEMPLATE];
