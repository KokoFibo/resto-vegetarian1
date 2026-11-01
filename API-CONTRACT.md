# Kontrak API frontend ↔ backend (v1.1)

> v1.1 hanya **menambah** field (tema, hero, banner, `orders_open`, `featured`) dan kode galat `E:closed`; semua field v1 tetap. Daftar perubahan: [`CHANGELOG-KONTRAK.md`](./CHANGELOG-KONTRAK.md).

Dibuat dari bentuk data yang selama ini dipakai frontend, jadi backend cukup memetakan keluaran yang sudah ada (fungsi `resolve_tenant`, `resolve_table`, `place_order`, dan kueri menu) ke alamat di bawah. Semua jawaban berupa JSON. Backend dipanggil dari server frontend (bukan dari browser), jadi CORS tidak diperlukan.

Alamat dasar: `API_URL`. Semua jalur berawalan `/v1`.

## GET /v1/site?host=<domain>&slug=<opsional>

Restoran dari domain yang dibuka pengunjung. `slug` hanya dikirim bila `DEFAULT_SITE_SLUG` diisi (pratinjau).

- `200` → objek **Site**
- `404` → domain tidak dikenal
- selain itu → galat; frontend menampilkan "layanan sementara tidak tersedia"

```json
{
  "id": "uuid", "slug": "aisin", "status": "active",
  "restaurant_type": "vegetarian",
  "languages": ["id", "zh"],
  "translations": { "id": { "brand_name": "Aisin Vegetarian", "tagline": "Gastronomi Nabati Zen" },
                    "zh": { "brand_name": "爱心素食", "tagline": "禅意植物料理" } },
  "phone": "+62…", "whatsapp": null, "email": null,
  "maps_url": "-6.2,106.8", "address": "Jl. …",
  "opening_hours": { "lunch": "11:30-14:30", "tea": "14:30-17:00", "dinner": "17:30-21:30" },
  "primary_color": null,
  "theme": { "id": "samudra", "dark": false,
             "colors": { "primary": "#1F4E6B", "secondary": "#2F6F94", "accent": "#B45F14", "bg": "#F6F9FB",
                         "bg2": "#E8EFF4", "ink": "#1E2621", "ink2": "#404944", "line": "rgba(31,78,107,.12)" } },
  "orders_open": true,
  "hero": { "texts": { "title": { "id": "…", "zh": "…" }, "title_em": { "id": "…" }, "lead": { "id": "…" } },
            "image": "https://images.contoh.com/restaurant/tenants/aisin/site/hero-ab12.webp" },
  "banners": [ { "id": "uuid", "kind": "holiday", "scope": "all", "link_url": null, "blocks_orders": true, "rev": 1767225600,
                 "text": { "id": "Kami libur 1–5 Januari", "zh": "…" }, "link_label": null } ]
}
```

- `restaurant_type`: `vegan` | `vegetarian` | `umum`.
- `languages`: urutan `[utama, kedua?]`, kode dari `id en zh fr es ko ja`.
- `status`: hanya `trial` dan `active` yang ditampilkan; nilai lain menampilkan halaman "dinonaktifkan".
- `maps_url`: koordinat `lat,lng`, URL Google Maps, atau teks pencarian.
- `primary_color`: **usang**, diabaikan frontend (gantinya `theme`).

### Field tampilan dari admin (v1.1) — semuanya boleh tidak ada

Frontend membaca field ini secara defensif: bila tidak ada, `null`, atau tidak valid, tampilan jatuh ke bawaan template (backend lama tetap berjalan). Nilai yang tidak valid (warna bukan `#RRGGBB`/`rgba()`, tautan bukan `https://…` atau `/…`, id dengan karakter aneh) dibuang oleh frontend.

| Field | Isi | Sumber di admin / database |
|---|---|---|
| `theme` | `null` = tampilan bawaan. Bila ada: `id` (`giok teh samudra bata anggur zaitun arang custom`), `dark`, dan `colors` **yang sudah dihitung backend** | Tab Tampilan Website → Warna: `tenants.theme`, `theme_custom`, `theme_dark` |
| `orders_open` | `false` = pemesanan ditutup | Tombol "Tutup sementara" (`tenants.orders_paused`) **atau** banner Libur dengan `blocks_orders` yang sedang tayang |
| `hero.texts.<kunci>` | `Localized`; kunci: `eyebrow title title_em lead chip1 chip2 chip3 cta_order cta_menu`. Kunci kosong/tidak ada = teks bawaan | Tab Tampilan Website → Hero: `site_texts` (`hero.<kunci>`) + `site_text_translations` |
| `hero.image` | URL foto hero (portrait 4:5) atau `null` = foto bawaan | `site_images` slot `hero` |
| `banners[]` | Maks 3, sudah disaring tanggal menurut zona waktu restoran, berurutan | Tab Banner: `site_banners` + `site_banner_translations` |

**Warna tema (`theme.colors`)** dipetakan frontend ke variabel CSS: `primary→--jade`, `secondary→--sage`, `accent→--vm`, `bg→--bg`, `bg2→--bg2`, `ink→--ink`, `ink2→--ink2`, `line→--line`. `primary`, `accent`, `bg` wajib `#RRGGBB`; sisanya `#RRGGBB` atau `rgba(r,g,b,a)`. Backend menjamin kontras: `primary` terhadap `bg` ≥ 4,5:1 dan **putih** di atas `accent` ≥ 4,5:1 (teks tombol aksen selalu putih). Preset `giok` sama dengan tampilan bawaan, jadi boleh dikirim sebagai `null`.

**Batas panjang teks** (admin menolak lebih panjang): `eyebrow` 60, `title` 120, `title_em` 120, `lead` 400, `chip1-3` 40, `cta_order` 30, `cta_menu` 30; banner `text` 140, `link_label` 30; `brand_name` 80, `tagline` 160.

**Banner:** `kind` = `info | promo | holiday`; `scope` = `all | home | order`; `link_url` hanya `https://…` atau `/…` (selain itu dibuang); `rev` berubah setiap banner diedit (pengunjung yang menutupnya melihatnya lagi). Frontend menampilkan maksimal 3.

**Aturan teks hero (frontend):** per kolom `kustom[bahasa halaman] → kustom[bahasa utama] → teks bawaan template`. Pengecualian: bila `title` kustom ada, `title_em` kustom dipakai apa adanya (boleh kosong) dan tidak dicampur dengan kalimat tekan bawaan. Bila `hero.image` ada, stempel dan keterangan kartu (milik foto bawaan) disembunyikan.

## GET /v1/menu?site=<site.id>

Hanya kategori dan menu yang terlihat dan tidak diarsipkan, sudah berurutan.

```json
{
  "cats": [ { "slug": "main", "glyph": "馔", "name": { "id": "Hidangan Utama", "zh": "主菜" } } ],
  "dishes": [ {
    "id": "uuid", "cat": "main", "price": 238000,
    "img": "https://images.contoh.com/restaurant/tenants/aisin/menu/tahu-ab12.webp",
    "egg": false, "onion": false, "nonHalal": false, "spicy": 0, "soldOut": false, "featured": true,
    "name":   { "id": "…", "zh": "…" },
    "short":  { "id": "…", "zh": "…" },
    "detail": { "id": "…" },
    "badge":  null
  } ]
}
```

- `price`: IDR penuh. `img`: URL lengkap (backend yang menyusun dari kunci foto) atau `null`.
- `spicy`: `0` bila tidak pedas, `1`–`5` bila pedas (backend menghitung dari `is_spicy` dan `spice_level`).
- Teks per bahasa boleh tidak lengkap; frontend memakai bahasa utama bila terjemahan kosong. `detail` dan `badge` boleh `null`.
- `cat` merujuk `slug` kategori.
- `featured` (v1.1, boleh tidak ada = `false`): ditandai ★ di admin (`menu_items.is_featured`, maks 6). Beranda menampilkan hidangan `featured` yang punya `img`; bila tidak ada satu pun, tiga hidangan pertama yang berfoto. `cats[].glyph` boleh kosong (tidak dipakai tampilan).

## GET /v1/table?site=<site.id>&token=<32 hex>

Meja dari token QR.

- `200` → `{ "label": "Meja 7" }`
- `404` → token salah, meja nonaktif, atau bukan milik restoran ini

## POST /v1/orders

```json
{ "site": "uuid", "token": "<32 hex>", "lang": "id",
  "items": [ { "id": "uuid-menu", "qty": 2 } ], "name": "Anton", "note": "" }
```

Frontend sudah membatasi: 1–40 baris, `qty` 1–20, `name` ≤ 60 dan `note` ≤ 200 karakter. **Harga tidak dikirim**; backend menghitung ulang dan tetap wajib memvalidasi semuanya.

- `200` → `{ "order_no": 42, "table_label": "Meja 7", "total_idr": 238000 }`
- galat → status HTTP yang sesuai dan `{ "code": "…" }`. Kode yang dikenali frontend:

| Kode | Status disarankan | Arti |
|---|---|---|
| `E:invalid_table` | 403 | QR tidak valid / meja nonaktif |
| `E:empty` | 400 | tidak ada hidangan / data tidak valid |
| `E:rate_limited` | 429 | pesanan terlalu rapat |
| `E:too_many_active` | 429 | terlalu banyak pesanan aktif di meja |
| `E:item_unavailable` | 409 | ada hidangan yang sudah tidak tersedia |
| `E:closed` | 409 | pemesanan ditutup (Tutup sementara / banner Libur yang menutup) — v1.1 |
| `E:unavailable` | 503 | layanan belum siap (juga dipakai frontend bila backend tidak terjangkau) |

Kode lain ditampilkan sebagai `E:unavailable`.

## Pemetaan Admin → database → API → tampilan

| Admin | Database | API | Tampilan |
|---|---|---|---|
| Restoran: telepon, WhatsApp, email, peta, alamat, jam buka | `tenants.phone whatsapp email maps_url address opening_hours{lunch,tea,dinner}` | `site.*` | Kontak, footer |
| Restoran: nama brand, slogan (per bahasa) | `tenant_translations.brand_name tagline` | `site.translations` | Header, footer, `<title>`, deskripsi |
| Restoran (Super Admin): tipe, bahasa | `tenants.restaurant_type`, `tenant_languages` | `site.restaurant_type`, `site.languages` | Pengantar menu, pilihan bahasa |
| Tampilan Website: warna | `tenants.theme theme_custom theme_dark` | `site.theme` | Variabel CSS seluruh halaman |
| Tampilan Website: hero | `site_texts`, `site_text_translations`, `site_images(hero)` | `site.hero` | Beranda (judul, deskripsi, chip, tombol, foto) |
| Banner | `site_banners`, `site_banner_translations` | `site.banners` | Strip di bawah header |
| Tutup sementara + banner Libur | `tenants.orders_paused`, `site_banners.blocks_orders` | `site.orders_open`, galat `E:closed` | Halaman Order ditutup |
| Menu: harga, habis, ★ unggulan, penanda | `menu_items.price_idr is_sold_out is_featured has_egg has_onion is_non_halal is_spicy spice_level` | `dish.price soldOut featured egg onion nonHalal spicy` | Menu, Beranda, Order |
| Menu: foto | `menu_items.image_key` | `dish.img` (URL penuh) | Kartu menu |
| Meja | `restaurant_tables.label token` | `/v1/table`, QR `/order?meja=<token>` | Halaman Order |

## Gambar bawaan template (bukan lewat API)

Gambar bawaan (hero default, koki, janji kemurnian, dan gambar mode contoh) ada di Cloudflare R2 pada `restaurant/defaults/aisin/<berkas>.webp` dan dialamatkan frontend lewat variabel `MEDIA_URL` (`${MEDIA_URL}/restaurant/defaults/aisin/<berkas>.webp`). `MEDIA_URL` kosong → cadangan lokal `/images/<berkas>` (folder `public/images` tetap ada). Folder `defaults/` terpisah dari `restaurant/tenants/<slug>/(menu|site)/`: satu objek R2 tidak boleh dipakai bersama foto menu atau foto hero, karena admin menghapus kunci lama saat foto diganti.

## Catatan

- Timeout panggilan dari frontend: 8 detik.
- Halaman selain Order di-cache di tepi Cloudflare selama 60 detik; perubahan menu, tema, banner, dan tutup sementara muncul dalam kira-kira semenit. Halaman Order tidak di-cache.
- Bila `API_URL` kosong, frontend memakai data contoh dan menolak pesanan dengan `E:unavailable`.
