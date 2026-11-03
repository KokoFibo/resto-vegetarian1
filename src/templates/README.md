# Menambah template baru

1. Buat folder `src/templates/<id>/` berisi layout (`Base.astro`) dan tampilan `Home`, `Menu`, `Filosofi`, `Order`, `Kontak`, `NotFound`
   (props sama dengan template `aisin`; lihat `src/views/types.ts`). Semua data datang dari `site`/`menu`/`table`; jangan memanggil API sendiri.
2. Daftarkan di `src/templates/index.ts`.
3. Aktifkan di database: `insert into public.templates (id, name, description, preview_image, sort) values ('<id>', 'Nama', 'Deskripsi', 'restaurant/templates/<id>.webp', 2);`
   (id harus sama persis dengan kunci registri). Template yang tidak ada di registri otomatis jatuh ke `aisin`.
4. Tema warna restoran (`site.theme`) tetap berlaku di semua template lewat variabel CSS; pakai `themeCss()` seperti `Base.astro` aisin.
