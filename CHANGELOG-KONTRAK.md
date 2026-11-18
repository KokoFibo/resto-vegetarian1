# Perubahan kontrak API (v1 → v1.1 → v1.2 → v1.3 → v1.4 → v1.5)

## v1.5 — QR Kasir (take away), istilah yang bisa diubah Owner (hanya tambahan)

- `GET /v1/table` → `{ label, kind: "table" | "counter" }`. Frontend lama yang mengabaikan `kind` tetap jalan (QR kasir tampil seperti meja biasa, tetapi tanpa batas nama wajib). Backend lama tanpa `kind` = `"table"`.
- **QR Kasir** (`kind = "counter"`): satu per restoran. Pelanggan memindai di kasir; **nama wajib** (`POST /v1/orders` → `E:name_required` 400 bila kosong), tiap pesanan menjadi **tagihan sendiri** ("Take away #nomor · Nama"), tanpa batas 15 pelanggan/meja, batas 10 dtk/perangkat tetap. `POST /v1/orders` kini juga mengembalikan `kind`. "Minta bill" untuk QR kasir menjawab `E:no_bill`; frontend menyembunyikan tombolnya.
- `GET /v1/site` → field baru **`labels`**: `{ takeaway?, online_link?, send_order?, i_paid? }`, masing-masing `{ <bahasa>: teks }` (maks 40 karakter). Kosong/tidak ada = teks bawaan. Bahasa tanpa istilah sendiri memakai teks bawaan bahasa itu, **bukan** istilah bahasa lain.
- Perubahan tampilan frontend: tautan "Pesan online" **tidak lagi** di navigasi utama (tetap ada di halaman Order tanpa QR). Di `/pesan` dan `/pesanan/<token>` header tidak memuat Beranda dan Order.
- Pesanan oleh staf (admin) tidak memakai API publik.

## v1.4 — Pesanan online / takeaway (hanya tambahan)

- `GET /v1/site` → field baru **`online`**: `{ enabled, prepay, qris_url, pickup_note }`. Backend lama tanpa field ini = pesanan online mati (frontend menganggap `enabled=false`; `prepay` hanya aktif bila `qris_url` berupa `https://…`).
- **`POST /v1/online-orders`** `{ site, lang, items[{id,qty}], name, phone, pickup_by, pay_plan, note, client? }` → `{ order_no, token, status:"pending", pickup_by, pay_plan, figures, total_idr }`. `total_idr` = total AKHIR (sudah termasuk biaya layanan dan pajak): itu yang dibayar pelanggan.
- **`GET /v1/online-orders?site=&token=`** → status untuk halaman pelanggan (tanpa nomor WhatsApp). `status`: `pending new preparing ready done cancelled rejected expired`.
- **`POST /v1/online-claim`** `{ site, token }` → `{ ok:true }` ("Saya sudah bayar", jalur QRIS; idempotent).
- Kode galat baru: `E:online_off` (409), `E:name_required` (400), `E:phone_invalid` (400), `E:prepay_off` (409), `E:pending_full` (429), `E:invalid_order` (404); frontend menambah `E:captcha` (403, Turnstile). Kode lama dipakai ulang: `E:closed`, `E:empty`, `E:rate_limited`, `E:item_unavailable`, `E:unavailable`.
- Halaman frontend baru: **`/pesan`** (formulir) dan **`/pesanan/<token>`** (status, memuat ulang sendiri). Muncul hanya bila `site.online.enabled`; template yang belum punya tampilannya menjawab 404 untuk dua rute itu.
- Konfigurasi frontend baru (opsional): `TURNSTILE_SITEKEY` (publik) dan `TURNSTILE_SECRET` (rahasia). Tanpa keduanya, pemeriksaan Turnstile dilewati.
- Nominal di halaman pesanan online memakai **rupiah eksak** (`Rp 69.300`), bukan `IDR 69k` seperti label menu, karena pelanggan QRIS harus mengetik nominal yang tepat.

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
