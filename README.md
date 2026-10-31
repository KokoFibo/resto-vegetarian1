# Aisin — frontend

Website pengunjung restoran (Astro, SSR di Cloudflare). Berisi **hanya** tampilan: Beranda, Menu, Filosofi, Order (lewat QR meja), dan Kontak, dalam maksimal 2 bahasa per restoran. Tidak ada halaman pengelolaan, tidak ada kunci rahasia, dan tidak ada akses langsung ke database, penyimpanan foto, atau AI.

Semua data datang dari backend lewat API publik yang dijelaskan di [`API-CONTRACT.md`](./API-CONTRACT.md).

## Menjalankan

```
npm install
npm run dev        # http://localhost:4321
npm run build
npm run check      # pemeriksaan tipe
```

Tanpa `API_URL`, frontend berjalan dalam **mode contoh**: menampilkan restoran dan menu bawaan Aisin (`src/data/demo.ts`), dan pemesanan dinonaktifkan. Dengan `API_URL`, restoran ditentukan dari domain yang dibuka.

| Variabel | Fungsi |
|---|---|
| `API_URL` | Alamat backend, mis. `https://api.contoh.com`. Kosong = mode contoh. |
| `DEFAULT_SITE_SLUG` | Hanya untuk pengembangan/pratinjau (localhost, `*.pages.dev`). Jangan diisi di produksi. |

Deploy: Cloudflare Pages, build command `npm run build`, output `dist`. Bila muncul error `Invalid binding SESSION`, tambahkan KV binding `SESSION`.

## Struktur

```
src/
  data/        types.ts (bentuk data dari backend) · api.ts (satu-satunya pemanggil backend) · demo.ts
  i18n/        index.ts (bahasa, href, pemilih teks) · ui.ts (teks antarmuka: navigasi, label, galat)
  content/     aisin.ts — teks Beranda, Filosofi, Kontak (terpisah dari tampilan)
  layouts/     Base.astro
  components/  Header, Footer, LangSwitch, DishCard, DishTags, PageHead, Utensils
  views/       Home, Menu, Filosofi, Order, Kontak, NotFound
  pages/       [...path].astro (pengarah rute) · api/orders.ts (penerus tipis ke backend)
  scripts/     ui.ts (reveal, menu HP, token meja) · order.ts (formulir pesanan)
  styles/      base.css · components.css · pages.css
```

Alamat halaman: bahasa utama tanpa awalan (`/menu`), bahasa kedua berawalan (`/zh/menu`). Alamat lain menghasilkan 404.

## Yang sudah dipindahkan ke backend (bukan bagian repo ini)

| Dulu di proyek tunggal | Sekarang |
|---|---|
| Halaman dan skrip admin, `pages/api/users`, `translate`, `upload` | Backend |
| `supabase/*.sql`, `scripts/*` (seed, unggah foto) | Backend |
| `lib/tenant.ts`, `lib/menu.ts` (akses Supabase, susun URL foto R2) | Backend: `GET /v1/site`, `/v1/menu`, `/v1/table` |
| `pages/api/orders.ts` (memanggil `place_order`) | Backend: `POST /v1/orders`. Frontend hanya meneruskan. |
| Kunci `SUPABASE_*`, `GEMINI_API_KEY`, `R2_*` | Backend |

Tidak ada tautan ke halaman pengelolaan di frontend ini. Pengelolaan menu dan pesanan ada di backend yang terpisah.

## Catatan

- Teks Beranda/Filosofi/Kontak masih bawaan Aisin (`src/content/aisin.ts`). Untuk restoran lain, ganti berkas itu atau sambungkan ke data dari backend.
- Foto hidangan datang dari backend sebagai URL lengkap. Foto merek (koki, hero) ada di `public/images`.
