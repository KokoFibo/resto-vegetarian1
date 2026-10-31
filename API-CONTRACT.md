# Kontrak API frontend ↔ backend

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
  "primary_color": null
}
```

- `restaurant_type`: `vegan` | `vegetarian` | `umum`.
- `languages`: urutan `[utama, kedua?]`, kode dari `id en zh fr es ko ja`.
- `status`: hanya `trial` dan `active` yang ditampilkan; nilai lain menampilkan halaman "dinonaktifkan".
- `maps_url`: koordinat `lat,lng`, URL Google Maps, atau teks pencarian.

## GET /v1/menu?site=<site.id>

Hanya kategori dan menu yang terlihat dan tidak diarsipkan, sudah berurutan.

```json
{
  "cats": [ { "slug": "main", "glyph": "馔", "name": { "id": "Hidangan Utama", "zh": "主菜" } } ],
  "dishes": [ {
    "id": "uuid", "cat": "main", "price": 238000,
    "img": "https://images.contoh.com/restaurant/tenants/aisin/menu/tahu-ab12.webp",
    "egg": false, "onion": false, "nonHalal": false, "spicy": 0, "soldOut": false,
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
| `E:unavailable` | 503 | layanan belum siap (juga dipakai frontend bila backend tidak terjangkau) |

Kode lain ditampilkan sebagai `E:unavailable`.

## Catatan

- Timeout panggilan dari frontend: 8 detik.
- Halaman selain Order di-cache di tepi Cloudflare selama 60 detik; perubahan menu dari backend muncul dalam kira-kira semenit.
- Bila `API_URL` kosong, frontend memakai data contoh dan menolak pesanan dengan `E:unavailable`.
