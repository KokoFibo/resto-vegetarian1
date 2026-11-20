// Uji DOM skrip klien pesanan online dengan jsdom: HTML sungguhan dari server SSR, skrip dibundel (esbuild) dan dijalankan di jsdom dengan fetch palsu.
import { spawn } from 'node:child_process';
import http from 'node:http';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
const ROOT = process.cwd();
let pass = 0, fail = 0; const ok = (n, c, x = '') => { c ? pass++ : fail++; console.log(c ? '  ✔' : '  ✘', n, c ? '' : x); };
const T = 'c'.repeat(32);
const site = { id: 's5', slug: 'ol', status: 'active', restaurant_type: 'vegan', languages: ['id', 'en'], translations: { id: { brand_name: 'Warung Online', tagline: null }, en: { brand_name: 'Online Eatery', tagline: null } },
  phone: null, whatsapp: null, email: null, maps_url: null, address: null, opening_hours: null, primary_color: null, theme: null, orders_open: true, hero: { texts: {}, image: null }, banners: [],
  online: { enabled: true, prepay: true, qris_url: 'https://images.test/qris-1.webp', pickup_note: 'Ambil di kasir depan.' },
  labels: { takeaway: { id: 'Bungkus' }, send_order: { id: 'Pesan sekarang' }, i_paid: { id: 'Sudah transfer' } } };
const menu = { cats: [{ slug: 'main', glyph: '', name: { id: 'Utama' } }], dishes: [
  { id: 'd1', cat: 'main', price: 30000, img: null, egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, name: { id: 'Nasi A' }, short: { id: 'x' }, detail: { id: 'Detail A' }, badge: null },
  { id: 'd2', cat: 'main', price: 20000, img: null, egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, name: { id: 'Nasi B' }, short: { id: 'x' }, detail: { id: 'Detail B' }, badge: null }] };
let statusBody = {};
const api = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); res.setHeader('content-type', 'application/json');
  if (u.pathname === '/v1/site') return res.end(JSON.stringify(site));
  if (u.pathname === '/v1/menu') return res.end(JSON.stringify(menu));
  if (u.pathname === '/v1/table') return res.end(JSON.stringify((u.searchParams.get('token') || '').startsWith('e') ? { label: 'Take away', kind: 'counter' } : { label: 'Meja 1', kind: 'table' }));
  res.statusCode = 404; res.end('{}');
}).listen(4610);
const child = spawn('node', ['.test-dist/server/entry.mjs'], { cwd: ROOT, env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: '4811', API_URL: 'http://127.0.0.1:4610', MEDIA_URL: '' }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await fetch('http://127.0.0.1:4811/', { method: 'HEAD' }); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
const page = async path => (await fetch('http://127.0.0.1:4811' + path, { headers: { host: 'online.test' } })).text();
const bundle = async file => (await build({ entryPoints: [file], bundle: true, write: false, format: 'iife', target: 'es2020' })).outputFiles[0].text;
const [pesanJs, pesananJs, orderJs, uiJs] = [await bundle('src/scripts/pesan.ts'), await bundle('src/scripts/pesanan.ts'), await bundle('src/scripts/order.ts'), await bundle('src/scripts/ui.ts')];

async function boot(html, url, js, fetchImpl) {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; w.fetch = fetchImpl; w.crypto ??= globalThis.crypto; w.scrollTo = () => {}; w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }; w.matchMedia ??= () => ({ matches: false, addEventListener() {}, addListener() {} });
  const assigned = []; Object.defineProperty(w, '__assigned', { value: assigned });
  w.eval(js); w.document.dispatchEvent(new w.Event('astro:page-load'));
  return { w, d: w.document, assigned };
}
const tick = (ms = 30) => new Promise(r => setTimeout(r, ms));

console.log('\n[U1] /pesan — keranjang, validasi, kirim');
{
  const html = await page('/pesan'); const calls = [];
  const f = async (u, init) => { calls.push({ u, body: JSON.parse(init.body) }); return { ok: true, status: 200, json: async () => ({ token: T, order_no: '0007' }) }; };
  let nav = null;
  const { w, d } = await boot(html, 'http://online.test/pesan', pesanJs, f);
  const click = (sel, n = 1) => { for (let i = 0; i < n; i++) d.querySelector(sel).dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
  const oi = id => `.oi[data-id="${id}"] button[data-d="+"]`;
  ok('keranjang kosong: pesan "belum ada hidangan"', d.querySelector('#lines').textContent.includes('Belum ada hidangan'));
  click(oi('d1'), 2); click(oi('d2'));
  ok('qty & subtotal: 2×30k + 1×20k = 80k', d.querySelector('.oi[data-id="d1"] output').textContent === '2' && d.querySelector('#total').textContent === 'Rp 80.000', d.querySelector('#total').textContent);
  ok('baris ringkasan tampil', d.querySelectorAll('#lines li').length === 2);
  click('.oi[data-id="d2"] button[data-d="-"]', 3); ok('qty tidak turun di bawah 0', d.querySelector('.oi[data-id="d2"] output').textContent === '0');
  click(oi('d2'), 30); ok('qty maks 20', d.querySelector('.oi[data-id="d2"] output').textContent === '20');
  click('.oi[data-id="d2"] button[data-d="-"]', 20);
  const submit = async () => { d.querySelector('#pesanForm').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(); };
  await submit(); ok('nama kosong → galat E:name_required, tidak mengirim', d.querySelector('#orderErr').textContent.includes('Nama wajib') && calls.length === 0);
  d.querySelector('[name=name]').value = 'Budi'; await submit(); ok('WA kosong → galat E:phone_invalid, tidak mengirim', d.querySelector('#orderErr').textContent.includes('Nomor WhatsApp tidak valid') && calls.length === 0);
  d.querySelector('[name=phone]').value = '0812 3456 7890';
  d.querySelector('[name=pickup_by][value=courier]').checked = true; d.querySelector('[name=pay_plan][value=prepay_qris]').checked = true; d.querySelector('[name=note]').value = 'jam 7';
  await submit();
  ok('mengirim ke /api/pesan dengan semua field', calls.length === 1 && calls[0].u === '/api/pesan' && calls[0].body.name === 'Budi' && calls[0].body.phone === '0812 3456 7890' && calls[0].body.pickup_by === 'courier' && calls[0].body.pay_plan === 'prepay_qris' && calls[0].body.note === 'jam 7', JSON.stringify(calls[0]));
  ok('item dikirim hanya id+qty (tanpa harga)', JSON.stringify(calls[0].body.items) === JSON.stringify([{ id: 'd1', qty: 2 }]) && !('price' in calls[0].body));
  ok('client id 32 hex dikirim', /^[0-9a-f]{32}$/.test(calls[0].body.client));
  ok('tombol aktif lagi setelah kirim', d.querySelector('#orderBtn').disabled === false);
}
console.log('\n[U2] /pesan — galat dari server ditampilkan');
{
  const html = await page('/pesan');
  const f = async () => ({ ok: false, status: 429, json: async () => ({ code: 'E:pending_full' }) });
  const { w, d } = await boot(html, 'http://online.test/pesan', pesanJs, f);
  d.querySelector('.oi[data-id="d1"] button[data-d="+"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  d.querySelector('[name=name]').value = 'Budi'; d.querySelector('[name=phone]').value = '0812345678';
  d.querySelector('#pesanForm').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('E:pending_full → pesan ramah', d.querySelector('#orderErr').textContent.includes('Terlalu banyak pesanan'), d.querySelector('#orderErr').textContent);
  const f2 = async () => { throw new Error('offline'); };
  const b2 = await boot(html, 'http://online.test/pesan', pesanJs, f2);
  b2.d.querySelector('.oi[data-id="d1"] button[data-d="+"]').dispatchEvent(new b2.w.MouseEvent('click', { bubbles: true }));
  b2.d.querySelector('[name=name]').value = 'B'; b2.d.querySelector('[name=phone]').value = '0812345678';
  b2.d.querySelector('#pesanForm').dispatchEvent(new b2.w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('jaringan putus → "belum tersedia", tombol aktif lagi', b2.d.querySelector('#orderErr').textContent.includes('belum tersedia') && b2.d.querySelector('#orderBtn').disabled === false);
}

console.log('\n[U3] /pesanan/<token> — tampilan tiap status');
const statuses = {
  pending_prepay: { order_no: '0007', status: 'pending', name: 'Budi', pickup_by: 'courier', pay_plan: 'prepay_qris', pay_claimed: false, paid: false, reject_reason: null, figures: { subtotal: 60000, service: 3000, tax: 6300, total: 69300 }, items: [{ name: 'Nasi A', qty: 2, line_total: 60000 }] },
  pending_claimed: { order_no: '0007', status: 'pending', name: 'Budi', pickup_by: 'customer', pay_plan: 'prepay_qris', pay_claimed: true, paid: false, reject_reason: null, figures: { subtotal: 60000, service: 0, tax: 0, total: 60000 }, items: [] },
  pending_pickup: { order_no: '0008', status: 'pending', name: 'Ani', pickup_by: 'customer', pay_plan: 'at_pickup', pay_claimed: false, paid: false, reject_reason: null, figures: { subtotal: 30000, total: 33000 }, items: [{ name: 'Nasi A', qty: 1, line_total: 30000 }] },
  ready: { order_no: '0007', status: 'ready', name: 'Budi', pickup_by: 'customer', pay_plan: 'at_pickup', pay_claimed: false, paid: false, reject_reason: null, figures: { subtotal: 30000, total: 33000 }, items: [] },
  rejected_paid: { order_no: '0007', status: 'rejected', name: 'Budi', pickup_by: 'customer', pay_plan: 'prepay_qris', pay_claimed: true, paid: false, reject_reason: 'Stok habis', figures: { subtotal: 30000, total: 33000 }, items: [] },
  expired: { order_no: '0007', status: 'expired', name: 'Budi', pickup_by: 'customer', pay_plan: 'at_pickup', pay_claimed: false, paid: false, reject_reason: null, figures: { subtotal: 30000, total: 33000 }, items: [] },
  paid_new: { order_no: '0007', status: 'new', name: 'Budi', pickup_by: 'customer', pay_plan: 'prepay_qris', pay_claimed: true, paid: true, reject_reason: null, figures: { subtotal: 30000, total: 33000 }, items: [] },
};
const html = await page('/pesanan/' + T);
const show = async (key, extra = {}) => {
  const f = async u => ({ ok: true, status: 200, json: async () => statuses[key] });
  const b = await boot(html, 'http://online.test/pesanan/' + T, pesananJs, f); await tick(); return b;
};
{
  let b = await show('pending_prepay'); let t = b.d.querySelector('#statusBox').textContent;
  ok('pending+QRIS: nomor, status menunggu, gambar QRIS, total akhir, tombol bayar (istilah Owner "Sudah transfer")', t.includes('#0007') && b.d.querySelector('.qrisbox button')?.textContent === 'Sudah transfer' && t.includes('Menunggu konfirmasi') && b.d.querySelector('img.qrisimg')?.src === 'https://images.test/qris-1.webp' && t.includes('Rp 69.300') && !!b.d.querySelector('.qrisbox button'), t.slice(0, 300));
  ok('rincian eksak: Rp 60.000 + layanan Rp 3.000 + pajak Rp 6.300', t.includes('Rp 60.000') && t.includes('Rp 3.000') && t.includes('Rp 6.300') && !t.includes('IDR') && t.includes('Biaya layanan') && t.includes('Pajak') && t.includes('Kurir') && t.includes('Budi') && t.includes('2 × Nasi A'));
  ok('petunjuk pengambilan Owner tampil', t.includes('Ambil di kasir depan.'));
  ok('tidak ada nomor WA di halaman', !/\+?62\d{8,}|0812/.test(t));
  b = await show('pending_claimed'); ok('sudah menekan bayar: pesan terima kasih, tombol hilang', b.d.querySelector('#statusBox').textContent.includes('Staf kami akan memeriksa') && !b.d.querySelector('.qrisbox button'));
  b = await show('pending_pickup'); t = b.d.querySelector('#statusBox').textContent; ok('bayar di tempat: info bayar di kasir, tanpa QRIS', t.includes('Pembayaran dilakukan saat Anda mengambil') && !b.d.querySelector('img.qrisimg'));
  b = await show('ready'); ok('ready: "Siap diambil" + petunjuk', b.d.querySelector('#statusBox').textContent.includes('Siap diambil') && b.d.querySelector('#statusBox').textContent.includes('Ambil di kasir depan.'));
  b = await show('rejected_paid'); t = b.d.querySelector('#statusBox').textContent; ok('ditolak: alasan + info pengembalian dana (sudah klaim bayar)', t.includes('Pesanan ditolak') && t.includes('Stok habis') && t.includes('pengembalian dana'), t);
  b = await show('expired'); ok('kedaluwarsa: pesan 15 menit, tanpa tombol/QRIS', b.d.querySelector('#statusBox').textContent.includes('15 menit') && !b.d.querySelector('#statusBox button'));
  b = await show('paid_new'); ok('lunas: "pembayaran sudah kami terima", tanpa tombol bayar', b.d.querySelector('#statusBox').textContent.includes('Pembayaran sudah kami terima') && !b.d.querySelector('.qrisbox'));
}
console.log('\n[U4] "Saya sudah bayar" memanggil /api/pesanan lalu memuat ulang');
{
  const calls = []; let claimed = false;
  const f = async (u, init) => { calls.push([u, init?.method || 'GET']); if (init?.method === 'POST') { claimed = true; return { ok: true, status: 200, json: async () => ({ ok: true }) }; } return { ok: true, status: 200, json: async () => ({ ...statuses.pending_prepay, pay_claimed: claimed }) }; };
  const b = await boot(html, 'http://online.test/pesanan/' + T, pesananJs, f); await tick();
  b.d.querySelector('.qrisbox button').dispatchEvent(new b.w.MouseEvent('click', { bubbles: true })); await tick(80);
  ok('POST /api/pesanan dipanggil dengan token', calls.some(c => c[1] === 'POST' && c[0] === '/api/pesanan'));
  ok('setelah klaim: tombol hilang & pesan terima kasih', !b.d.querySelector('.qrisbox button') && b.d.querySelector('#statusBox').textContent.includes('Staf kami akan memeriksa'));
}
console.log('\n[U5] token tidak dikenal & gangguan sementara');
{
  let b = await boot(html, 'http://online.test/pesanan/' + T, pesananJs, async () => ({ ok: false, status: 404, json: async () => ({ code: 'E:invalid_order' }) })); await tick();
  ok('404 → "Pesanan tidak ditemukan"', b.d.querySelector('#statusBox').textContent.includes('Pesanan tidak ditemukan'));
  b = await boot(html, 'http://online.test/pesanan/' + T, pesananJs, async () => ({ ok: false, status: 503, json: async () => ({ code: 'E:unavailable' }) })); await tick();
  ok('503 → tampilan sementara dipertahankan ("Memuat…"), tidak menampilkan galat menakutkan', b.d.querySelector('#statusBox').textContent.includes('Memuat') && !b.d.querySelector('.err'));
}
console.log('\n[U6] QR kasir (take away): nama wajib, tanpa minta bill');
{
  const CT = 'e'.repeat(32), calls = [];
  const html = await page('/order?meja=' + CT);
  const f = async (u, init) => { calls.push({ u, body: JSON.parse(init.body) }); return { ok: true, status: 200, json: async () => ({ order_no: '0009', table_label: 'Take away', total_idr: 30000, kind: 'counter' }) }; };
  const { w, d } = await boot(html, 'http://online.test/order?meja=' + CT, orderJs, f);
  ok('judul memakai istilah Owner "Bungkus"; tanpa tombol minta bill', d.body.textContent.includes('Bungkus') && !d.querySelector('#billBtn'));
  d.querySelector('.oi[data-id="d1"] button[data-d="+"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const submit = async () => { d.querySelector('#orderForm').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(); };
  await submit(); ok('tanpa nama → galat E:name_required, tidak mengirim', d.querySelector('#orderErr').textContent.includes('Nama wajib') && calls.length === 0, d.querySelector('#orderErr').textContent);
  d.querySelector('[name=name]').value = 'Budi'; await submit();
  ok('dengan nama → mengirim ke /api/orders', calls.length === 1 && calls[0].u === '/api/orders' && calls[0].body.name === 'Budi' && calls[0].body.token === CT);
  ok('layar sukses: nomor pesanan, "Bungkus" (bukan label meja), petunjuk ke kasir', d.querySelector('#doneNo').textContent === '#0009' && d.querySelector('#doneInfo').textContent.startsWith('Bungkus') && d.querySelector('#orderDone').textContent.includes('Tunjukkan nomor pesanan') && !d.querySelector('#orderDone').hidden);
  const html2 = await page('/order?meja=' + 'a'.repeat(32)); calls.length = 0;
  const m = await boot(html2, 'http://online.test/order?meja=' + 'a'.repeat(32), orderJs, f);
  m.d.querySelector('.oi[data-id="d1"] button[data-d="+"]').dispatchEvent(new m.w.MouseEvent('click', { bubbles: true }));
  m.d.querySelector('#orderForm').dispatchEvent(new m.w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('meja biasa: nama tetap opsional (mengirim tanpa nama)', calls.length === 1 && calls[0].body.name === '' && !!m.d.querySelector('#billBtn'));
}
console.log('\n[U7] kartu menu: ketukan mana saja menutup deskripsi');
{
  const html = await page('/menu');
  const { w, d } = await boot(html, 'http://online.test/menu', uiJs, async () => ({ ok: true, json: async () => ({}) }));
  const cards = [...d.querySelectorAll('.card.hasd')];
  const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  ok('ada kartu dengan deskripsi', cards.length === 2, String(cards.length));
  click(cards[0]); ok('ketuk kartu → terbuka', cards[0].classList.contains('open'));
  click(cards[0].querySelector('.detail')); ok('ketuk DI DALAM deskripsi → tertutup', !cards[0].classList.contains('open'));
  click(cards[0]); click(d.body); ok('ketuk di LUAR (body) → tertutup', !cards[0].classList.contains('open'));
  click(cards[0]); click(cards[0]); ok('ketuk kartu yang sama saat terbuka → tertutup', !cards[0].classList.contains('open'));
  click(cards[0]); click(cards[1]); ok('ketuk kartu lain → yang lama tertutup, yang baru terbuka', !cards[0].classList.contains('open') && cards[1].classList.contains('open'));
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); ok('Escape menutup', !cards[1].classList.contains('open'));
  cards[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); ok('Enter pada kartu terfokus membuka (keyboard)', cards[0].classList.contains('open'));
  cards[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', bubbles: true })); ok('Spasi menutup', !cards[0].classList.contains('open'));
  d.dispatchEvent(new w.Event('astro:page-load')); click(cards[0]); ok('pemuatan ulang halaman tidak menggandakan pendengar (tetap 1 kali buka-tutup)', cards[0].classList.contains('open'));
  const css = (await import('node:fs')).readFileSync('src/styles/components.css', 'utf8');
  ok('CSS: hover hanya untuk perangkat berkursor (tidak menempel di layar sentuh)', /@media \(hover: hover\) and \(pointer: fine\)\s*\{[^}]*\.card\.hasd:hover \.detail/.test(css) && !/^\.card\.hasd:hover \.detail/m.test(css));
}
console.log('\n[U8] saklar mode terang/gelap pengunjung');
{
  const html = await page('/menu');
  const mk = async pre => { const dom = new JSDOM(html, { url: 'http://online.test/menu', runScripts: 'outside-only', pretendToBeVisual: true }); const w = dom.window; if (pre) w.localStorage.setItem('resto_mode', pre); w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }; w.scrollTo = () => {}; w.eval(uiJs); w.document.dispatchEvent(new w.Event('astro:page-load')); return w; };
  const w = await mk(); const d = w.document, btn = d.querySelector('#modeBtn'), root = d.documentElement;
  ok('tombol mode ada; belum memilih → tanpa data-mode (tema restoran)', !!btn && root.dataset.mode === undefined && root.dataset.base === 'light');
  ok('label awal = tujuan klik (gelap)', btn.getAttribute('aria-label') === 'Mode gelap' && btn.getAttribute('aria-pressed') === 'false');
  btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  ok('klik → data-mode=dark, disimpan, label & aria-pressed berubah', root.dataset.mode === 'dark' && w.localStorage.getItem('resto_mode') === 'dark' && btn.getAttribute('aria-pressed') === 'true' && btn.getAttribute('aria-label') === 'Mode terang');
  btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); ok('klik lagi → light', root.dataset.mode === 'light' && w.localStorage.getItem('resto_mode') === 'light');
  const w2 = await mk('dark'); ok('pilihan tersimpan diterapkan saat halaman dimuat ulang', w2.document.documentElement.dataset.mode === 'dark' && w2.document.querySelector('#modeBtn').getAttribute('aria-pressed') === 'true');
  const w3 = await mk('sampah'); ok('nilai tersimpan tidak valid diabaikan', w3.document.documentElement.dataset.mode === undefined);
  w2.localStorage.setItem('resto_mode', 'light'); delete w2.document.documentElement.dataset.mode; w2.document.dispatchEvent(new w2.Event('astro:after-swap')); ok('setelah pindah halaman (swap) pilihan diterapkan ulang', w2.document.documentElement.dataset.mode === 'light');
}
child.kill(); api.close();
console.log(`\nHasil UI: ${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
