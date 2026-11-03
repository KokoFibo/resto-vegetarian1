/**
 * Kontrak data antara frontend dan backend. Lihat API-CONTRACT.md.
 * Frontend hanya membaca bentuk data ini; ia tidak tahu apa pun tentang database, penyimpanan foto, atau AI.
 */

/** Teks per bahasa. Bahasa yang belum diterjemahkan boleh kosong; tampilan memakai bahasa utama. */
export type Localized = Record<string, string | null | undefined>;

export type RestaurantType = 'vegan' | 'vegetarian' | 'umum';

export type SiteBrand = { brand_name: string; tagline: string | null };

/** Warna tema yang SUDAH dihitung backend. Dipetakan ke variabel CSS (lib/theme.ts). */
export type ThemeColors = { primary: string; secondary: string; accent: string; bg: string; bg2: string; ink: string; ink2: string; line: string };
export type Theme = { id: string; dark: boolean; colors: ThemeColors };

/** Teks hero yang boleh diganti owner. Kunci yang tidak ada / kosong = teks bawaan template. */
export type HeroKey = 'eyebrow' | 'title' | 'title_em' | 'lead' | 'chip1' | 'chip2' | 'chip3' | 'cta_order' | 'cta_menu';
export type Hero = { texts: Partial<Record<HeroKey, Localized>>; image: string | null };

export type Banner = {
  id: string;
  kind: 'info' | 'promo' | 'holiday';
  scope: 'all' | 'home' | 'order';
  link_url: string | null;              // hanya https://… atau /…
  blocks_orders: boolean;
  rev: number | string;                 // berubah bila isi banner berubah (pengunjung yang sudah menutupnya melihatnya lagi)
  text: Localized;
  link_label: Localized | null;
};

/** Satu restoran (satu website). */
export type Site = {
  id: string;
  slug: string;
  status: string;                       // hanya 'trial' dan 'active' yang ditampilkan
  restaurant_type: RestaurantType;
  template_id: string;                  // template tampilan (src/templates); id tak dikenal → template bawaan
  languages: string[];                  // urutan: [bahasa utama, bahasa kedua?]
  translations: Record<string, SiteBrand>;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  maps_url: string | null;
  address: string | null;               // satu isian, tidak diterjemahkan
  opening_hours: Record<string, string> | null;   // { lunch: '11:30-14:30', ... }
  primary_color: string | null;         // usang; abaikan
  theme: Theme | null;                  // null = tampilan bawaan
  orders_open: boolean;                 // false = "Tutup sementara" / banner Libur yang menutup pemesanan
  hero: Hero;
  banners: Banner[];                    // sudah disaring tanggal & zona waktu oleh backend; maks 3
};

export type Category = { slug: string; glyph: string; name: Localized };

export type Dish = {
  id: string;
  cat: string;                          // slug kategori
  price: number;                        // IDR penuh, mis. 238000
  img: string | null;                   // URL foto lengkap (backend yang menyusunnya)
  egg: boolean;
  onion: boolean;
  nonHalal: boolean;
  spicy: number;                        // 0 = tidak pedas, 1-5 = level
  soldOut: boolean;
  featured: boolean;                    // ditandai ★ di admin (maks 6)
  name: Localized;
  short: Localized;
  detail: Localized | null;
  badge: Localized | null;
};

export type Menu = { cats: Category[]; dishes: Dish[] };

export type Table = { label: string };

export type OrderRequest = {
  token: string;
  lang: string;
  items: { id: string; qty: number }[];
  name: string;
  note: string;
};

export type OrderResult = { order_no: number | string; table_label: string; total_idr: number };
export type OrderError = { code: string };
