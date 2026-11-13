# Perubahan kontrak API (v1 → v1.1 → v1.2)

## v1.3 — Tampilan menu (hanya tambahan)
- `Site.menu_display`: `"photo" | "text"`, default `photo`. Mode `text` = daftar menu tanpa foto. Field boleh tidak ada (= `photo`).

## v1.2 — Tagihan meja (hanya tambahan)
- `POST /v1/orders`: body menerima `client` (32 hex acak per perangkat, opsional); respons menambah `my_total_idr`. Batas pesanan diganti: 1 pesanan/10 dtk **per perangkat** (`E:rate_limited`) dan maks 15 pelanggan per meja (`E:table_full`, 409). `E:too_many_active` tidak dipakai lagi.
- Endpoint baru `POST /v1/bill-request` (tombol Minta bill) dengan galat `E:no_bill`. Lihat `API-CONTRACT.md`.
- Backend lama tetap dilayani: frontend baru tanpa `client` tetap bekerja (backend membuatkan acak), dan field respons baru boleh tidak ada.

---


Untuk pembuat backend `/v1`. Semuanya **tambahan**: backend lama tetap dilayani (frontend memakai tampilan bawaan bila field tidak ada).

## GET /v1/site — field baru
| Field | Tipe | Catatan |
|---|---|---|
| `theme` | `null` \| `{ id, dark, colors{primary,secondary,accent,bg,bg2,ink,ink2,line} }` | **Warna dihitung backend** dari `tenants.theme/theme_custom/theme_dark`. `giok` tanpa gelap boleh `null`. Rumus turunan untuk `custom`: `secondary = campur(primary, #FFFFFF, 15%)`, `bg2 = campur(bg, primary, 6%)`, `ink #1E2621` (gelap: `#F2EFE9`), `ink2 #404944` (gelap: `#C9C5BC`), `line = rgba(primary, .12)`. Preset: lihat `src/lib/themes.ts` di backend admin. |
| `orders_open` | boolean | `not orders_paused` dan tidak ada banner Libur `blocks_orders` yang tayang hari ini (zona waktu restoran). |
| `hero` | `{ texts, image }` | `texts.<eyebrow\|title\|title_em\|lead\|chip1\|chip2\|chip3\|cta_order\|cta_menu>` = `{bahasa: teks}` dari `site_texts('hero.<kunci>')` + `site_text_translations` (kosong dibuang). `image` = URL penuh dari `site_images` slot `hero`, atau `null`. |
| `banners` | array maks 3 | `{ id, kind, scope, link_url, blocks_orders, rev, text{lang}, link_label{lang}\|null }`, hanya yang tayang hari ini. `rev` = detik-epoch `updated_at`. |
| `primary_color` | — | Usang, diabaikan. |

## GET /v1/menu — field baru
- `dishes[].featured` (boolean) dari `menu_items.is_featured`. `cats[].glyph` boleh kosong.

## POST /v1/orders — kode galat baru
- `E:closed` (disarankan HTTP 409): `place_order` melempar `E:closed` bila pemesanan ditutup. Frontend menampilkan pesan tutup (ID/EN/ZH) dan meneruskan status serta kode apa adanya.

## Konfigurasi frontend baru
- `MEDIA_URL` (publik): alamat bucket R2 untuk gambar bawaan `restaurant/defaults/aisin/*.webp`.
- `DEMO_SCENARIO` (hanya mode contoh).

## Keputusan yang sudah diambil
1. Keterangan kartu hero (stempel + nama hidangan + harga) hanya tampil bersama foto hero bawaan.
2. Set konten Aisin (statistik, Filosofi, teks Mandarin) hanya untuk `slug = aisin`; restoran lain memakai set generik (tanpa statistik, tanpa halaman Filosofi).
3. Teks hero: `kustom[bahasa] → kustom[utama] → bawaan`; `title` + `title_em` dipasangkan.
4. Beranda menampilkan sampai 6 hidangan `featured` berfoto; tanpa itu, 3 hidangan pertama berfoto.
5. Mode gelap didukung (CSS tanpa warna keras); hanya Super Admin yang bisa mengaktifkannya.
6. `MEDIA_URL` lewat variabel lingkungan, bukan dari API.
