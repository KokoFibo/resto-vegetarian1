# Aisin — frontend

Website pengunjung restoran (Astro, SSR di Cloudflare). Berisi **hanya** tampilan: Beranda, Menu, Filosofi, Order (lewat QR meja), dan Kontak, dalam maksimal 2 bahasa per restoran. Tidak ada halaman pengelolaan, tidak ada kunci rahasia, dan tidak ada akses langsung ke database, penyimpanan foto, atau AI.

Semua data datang dari backend lewat API publik yang dijelaskan di [`API-CONTRACT.md`](./API-CONTRACT.md).

## Menjalankan

```
npm install
npm run dev        # http://localhost:4321
npm run build
npm run check      # pemeriksaan tipe
npm run mock-api   # API tiruan lokal (port 4600) untuk mencoba mode API tanpa backend
npm run test:e2e   # uji ujung-ke-ujung: membangun dengan adapter Node lalu memeriksa HTML pada banyak skenario
```

Tanpa `API_URL`, frontend berjalan dalam **mode contoh**: menampilkan restoran dan menu bawaan Aisin (`src/data/demo.ts`), dan pemesanan dinonaktifkan. Dengan `API_URL`, restoran ditentukan dari domain yang dibuka.

| Variabel | Fungsi |
|---|---|
| `API_URL` | Alamat backend, mis. `https://api.contoh.com`. Kosong = mode contoh. |
| `DEFAULT_SITE_SLUG` | Hanya untuk pengembangan/pratinjau (localhost, `*.pages.dev`). Jangan diisi di produksi. |
| `MEDIA_URL` | Alamat publik bucket gambar R2 (mis. `https://images.kokofibo.com`) untuk gambar **bawaan** template. Kosong = cadangan lokal `/images/<berkas>`. |
| `DEMO_SCENARIO` | Hanya mode contoh: `closed`, `banners`, `featured`, `hero-custom`, `theme-<id>`, `theme-custom`, `theme-dark` (boleh beberapa, dipisah koma) untuk melihat keadaan dari admin. |

Deploy: Cloudflare Pages, build command `npm run build`, output `dist`. Bila muncul error `Invalid binding SESSION`, tambahkan KV binding `SESSION`.

## Struktur

```
src/
  data/        types.ts (bentuk data dari backend) · api.ts (satu-satunya pemanggil backend, normalisasi defensif) · demo.ts (data & skenario contoh)
  i18n/        index.ts (bahasa, href, pemilih teks) · ui.ts (teks antarmuka: navigasi, label, galat)
  content/     index.ts (contentFor: set konten per restoran) · aisin.ts (teks Aisin: Beranda, Filosofi, Kontak)
  lib/         theme.ts (tema → variabel CSS, validasi) · media.ts (alamat gambar bawaan: R2 / cadangan lokal) · brand, env, format, maps
  layouts/     Base.astro (tema, banner)
  components/  Header, Footer, LangSwitch, DishCard, DishTags, PageHead, Banners, Utensils
  views/       Home, Menu, Filosofi, Order, Kontak, NotFound
  pages/       [...path].astro (pengarah rute) · api/orders.ts (penerus tipis ke backend)
  scripts/     ui.ts (reveal, menu HP, token meja) · order.ts (formulir pesanan)
  styles/      base.css · components.css · pages.css
tools/         mock-api.mjs (API tiruan) · e2e.mjs (uji ujung-ke-ujung)
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

## Yang dikelola dari admin (tampil lewat API)

Warna (skema/kustom, termasuk mode gelap), hero Beranda (teks + foto), banner info/promo/libur, tombol "Tutup sementara" (halaman Order ditutup, galat `E:closed`), dan hidangan unggulan ★. Rincian field dan pemetaannya ada di [`API-CONTRACT.md`](./API-CONTRACT.md); riwayat perubahan kontrak di [`CHANGELOG-KONTRAK.md`](./CHANGELOG-KONTRAK.md). Restoran yang belum mengatur apa pun tampil persis seperti bawaan.

## Gambar bawaan di Cloudflare R2

Gambar bawaan template ada di R2 pada `restaurant/defaults/aisin/<berkas>.webp` dan dialamatkan lewat `MEDIA_URL` (`lib/media.ts`). Folder `public/images` **tetap dipertahankan** sebagai cadangan (dipakai bila `MEDIA_URL` kosong). Pengunggahan dilakukan skrip `scripts/upload-images.mjs` di proyek backend (tidak menghapus apa pun; `--dry` untuk rencana). Foto menu dan foto hero kustom datang dari API sebagai URL penuh.

## Catatan

- Set konten **Aisin** (teks Mandarin, pita statistik, halaman Filosofi) hanya dipakai bila `slug = aisin`. Restoran lain memakai set generik (`content/index.ts`): brand/slogan dari backend, tanpa statistik, tanpa Filosofi. Teks hero tetap bisa diganti owner untuk semua restoran.
- Pengisian Filosofi/statistik/galeri dari admin direncanakan pada tahap berikutnya.
- Halaman non-Order di-cache 60 detik di tepi Cloudflare, jadi perubahan dari admin muncul dalam ±1 menit.
