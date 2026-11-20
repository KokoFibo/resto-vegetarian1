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
  menu_display?: 'photo' | 'text';      // pilihan Owner: 'text' = daftar teks tanpa foto (default 'photo'; backend lama boleh tanpa field ini)
  primary_lang?: string;                // bahasa utama (isi). languages[0] = bahasa tampilan awal (alamat tanpa awalan)
  labels?: Record<string, Record<string, string>>;   // istilah yang diubah Owner: { kunci: { bahasa: teks } }; kosong = teks bawaan
  online?: SiteOnline;                  // pesanan online (takeaway); backend lama tanpa field ini = mati
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

/** kind = "counter": QR kasir (take away): nama wajib, tiap pesanan tagihan sendiri, tanpa "Minta bill". */
export type Table = { label: string; kind: 'table' | 'counter' };

export type OrderRequest = {
  token: string;
  lang: string;
  items: { id: string; qty: number }[];
  name: string;
  note: string;
  /** 32 hex acak per perangkat (dibuat di browser) — mengenali pelanggan yang sama di satu meja. */
  client?: string;
};

export type OrderResult = { order_no: number | string; table_label: string; total_idr: number; my_total_idr?: number; kind?: 'table' | 'counter' };
export type BillRequestResult = { table_label: string; my_total_idr: number; has_fees: boolean };
export type OrderError = { code: string };

/** Pesanan online (v1.4). */
export type SiteOnline = { enabled: boolean; prepay: boolean; qris_url: string | null; pickup_note: string | null };
export type OnlineOrderRequest = { lang: string; items: { id: string; qty: number }[]; name: string; phone: string; pickup_by: 'customer' | 'courier'; pay_plan: 'at_pickup' | 'prepay_qris'; note: string; client?: string; captcha?: string };
export type Figures = { subtotal: number; service?: number; tax?: number; discount?: number; total: number; service_pct?: number; tax_pct?: number };
export type OnlineOrderResult = { order_no: string; token: string; status: 'pending'; pickup_by: 'customer' | 'courier'; pay_plan: 'at_pickup' | 'prepay_qris'; figures: Figures; total_idr: number };
export type OnlineStatusName = 'pending' | 'new' | 'preparing' | 'ready' | 'done' | 'cancelled' | 'rejected' | 'expired';
export type OnlineOrderStatus = {
  order_no: string; status: OnlineStatusName; name: string | null; pickup_by: 'customer' | 'courier'; pay_plan: 'at_pickup' | 'prepay_qris';
  pay_claimed: boolean; paid: boolean; reject_reason: string | null; created_at: string; note: string | null;
  figures: Figures; items: { name: string; qty: number; line_total: number }[];
};
