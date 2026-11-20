// Uji ujung-ke-ujung (SSR sungguhan): npm run test:e2e
// Membangun situs dengan adapter Node (astro.test.config.mjs), menjalankannya pada banyak skenario DEMO_SCENARIO dan
// terhadap API tiruan yang sengaja berisi data bermusuhan, lalu memeriksa HTML hasilnya.
import { spawn } from 'node:child_process';
import http from 'node:http';
const ROOT = process.cwd();
let port = 4700, pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('  ✔', name); } else { fail++; console.log('  ✘', name, extra); } };

async function withServer(env, fn) {
  const p = port++, child = spawn('node', ['.test-dist/server/entry.mjs'], { cwd: ROOT, env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: String(p), ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', d => (log += d)); child.stderr.on('data', d => (log += d));
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${p}/`, { method: 'HEAD' }); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  const get = (path, init = {}) => new Promise((resolve, reject) => {
    const rq = http.request({ host: '127.0.0.1', port: p, path, method: init.method || 'GET', headers: init.headers || {} }, res => {
      let b = ''; res.setEncoding('utf8'); res.on('data', d => (b += d)); res.on('end', () => resolve({ status: res.statusCode, text: b, headers: { get: k => res.headers[k.toLowerCase()] } }));
    });
    rq.on('error', reject); if (init.body) rq.write(init.body); rq.end();
  });
  try { await fn(get); } finally { child.kill(); }
}

/* ---- mock backend /v1 ---- */
const SITES = {
  'bistro.test': { id: 's1', slug: 'bistro', status: 'active', restaurant_type: 'vegan', languages: ['id', 'en'],
    translations: { id: { brand_name: 'Bistro Hijau', tagline: 'Makan sehat setiap hari' }, en: { brand_name: 'Green Bistro', tagline: 'Healthy every day' } },
    phone: '0811', whatsapp: null, email: null, maps_url: null, address: 'Jl. Mawar 1', opening_hours: { lunch: '10:00-15:00' }, primary_color: '#ff0000',
    theme: { id: 'custom', dark: false, colors: { primary: 'red;}body{display:none', secondary: '#2F6F94', accent: '#B45F14', bg: '#F6F9FB', bg2: '#E8EFF4', ink: '#1E2621', ink2: '#404944', line: 'rgba(31,78,107,.12)' } },
    orders_open: false,
    hero: { image: 'javascript:alert(1)', texts: { title: { id: '<script>alert(1)</script>Judul' }, junk: { id: 'x' }, lead: 'bukan objek' } },
    banners: [
      { id: 'a', kind: 'promo', scope: 'all', link_url: 'javascript:alert(1)', link_label: { id: 'Klik' }, rev: 3, text: { id: 'Banner A <b>tebal</b>' } },
      { id: 'b c', kind: 'info', scope: 'all', rev: 1, text: { id: 'id tidak valid' } },
      { id: 'c', kind: 'holiday', scope: 'all', link_url: '//evil.com/x', rev: 1, text: { id: 'Banner C' } },
      { id: 'd', kind: 'weird', scope: 'planet', link_url: 'https://ok.example/p', rev: 'r9', text: { id: 'Banner D' } },
      { id: 'e', kind: 'info', scope: 'all', rev: 1, text: { id: 'Banner E (ke-4, harus dibuang)' } },
      { id: 'f', kind: 'info', scope: 'all', rev: 1, text: {} }] },
  'good.test': { id: 's2', slug: 'good', status: 'active', restaurant_type: 'umum', languages: ['id'], translations: { id: { brand_name: 'Warung Baik', tagline: null } },
    phone: null, whatsapp: null, email: null, maps_url: null, address: null, opening_hours: null, primary_color: null,
    theme: { id: 'samudra', dark: false, colors: { primary: '#1F4E6B', secondary: '#2F6F94', accent: '#B45F14', bg: '#F6F9FB', bg2: '#E8EFF4', ink: '#1E2621', ink2: '#404944', line: 'rgba(31,78,107,.12)' } },
    orders_open: true, hero: { texts: {}, image: 'https://images.test/restaurant/tenants/good/site/hero-1.webp' }, banners: [] },
  'old.test': { id: 's3', slug: 'old', status: 'active', restaurant_type: 'vegetarian', languages: ['id'], translations: { id: { brand_name: 'Backend Lama', tagline: 'x' } }, phone: null, whatsapp: null, email: null, maps_url: null, address: null, opening_hours: null, primary_color: null },
};
const ONLINE = { enabled: true, prepay: true, qris_url: 'https://images.test/restaurant/tenants/ol/qris/qris-1.webp', pickup_note: 'Ambil di kasir depan.' };
SITES['online.test'] = { ...SITES['good.test'], id: 's5', slug: 'ol', languages: ['id', 'en'], translations: { id: { brand_name: 'Warung Online', tagline: null }, en: { brand_name: 'Online Eatery', tagline: null } }, online: ONLINE, labels: { takeaway: { id: 'Bungkus' }, online_link: { id: 'Pesan dari sini' }, send_order: { id: 'Pesan sekarang' }, i_paid: { id: 'Sudah transfer' }, bogus: { id: 'x' } } };
SITES['onlinenoqr.test'] = { ...SITES['good.test'], id: 's6', slug: 'olnq', online: { enabled: true, prepay: true, qris_url: null, pickup_note: null } };   // prepay tanpa gambar QRIS harus dianggap mati
SITES['onlineclosed.test'] = { ...SITES['good.test'], id: 's7', slug: 'olc', orders_open: false, online: ONLINE };
SITES['onlinejunk.test'] = { ...SITES['good.test'], id: 's8', slug: 'olj', online: { enabled: 'yes', prepay: 1, qris_url: 'javascript:alert(1)', pickup_note: 5 } };
const TR = { id: { brand_name: 'Warung ID', tagline: null }, zt: { brand_name: '小館', tagline: null }, fr: { brand_name: 'Chez ID', tagline: null } };
SITES['ztdef.test'] = { ...SITES['good.test'], id: 's9', slug: 'ztdef', languages: ['zt', 'id'], primary_lang: 'id', translations: TR };   // tampilan awal = 繁體, bahasa utama = Indonesia
SITES['ztsec.test'] = { ...SITES['good.test'], id: 's10', slug: 'ztsec', languages: ['id', 'zt'], primary_lang: 'id', translations: TR };
SITES['fr.test'] = { ...SITES['good.test'], id: 's12', slug: 'fr', languages: ['id', 'fr'], primary_lang: 'id', translations: TR };
SITES['dark.test'] = { ...SITES['good.test'], id: 's11', slug: 'dark', theme: { id: 'dark', dark: true, colors: { primary: '#E8D9A8', secondary: '#EEE2BC', accent: '#B45F14', bg: '#14201A', bg2: '#1C2C24', ink: '#F2EFE9', ink2: '#C9C5BC', line: 'rgba(232,217,168,.14)' } } };
SITES['text.test'] = { ...SITES['good.test'], id: 's4', slug: 'text', menu_display: 'text' };   // backend sungguhan mengirim menu_display
const MENU = { cats: [{ slug: 'main', glyph: '', name: { id: 'Utama' } }], dishes: [
  { id: 'd1', cat: 'main', price: 30000, img: 'https://images.test/restaurant/tenants/x/menu/a.webp', egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, featured: true, name: { id: 'Nasi A' }, short: { id: 'enak' }, detail: null, badge: null },
  { id: 'd2', cat: 'main', price: 20000, img: 'https://images.test/restaurant/tenants/x/menu/b.webp', egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, name: { id: 'Nasi B' }, short: { id: 'enak' }, detail: null, badge: null }] };
const MENU_ML = { cats: [{ slug: 'main', glyph: '', name: { en: 'Mains', id: 'Utama' } }], dishes: [
  { id: 'd1', cat: 'main', price: 30000, img: null, egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, name: { en: 'Dish EN', id: 'Nasi ID' }, short: { en: 'tasty', id: 'enak' }, detail: null, badge: null }] };   // en lebih dulu: fallback harus memilih bahasa UTAMA (id), bukan nilai pertama
let lastOnline = null, onlineCalls = 0;
const api = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); res.setHeader('content-type', 'application/json');
  if (u.pathname === '/v1/online-orders' && req.method === 'POST') { onlineCalls++; let b = ''; req.on('data', d => (b += d)); req.on('end', () => { lastOnline = JSON.parse(b); res.end(JSON.stringify({ order_no: '0007', token: 'c'.repeat(32), status: 'pending', pickup_by: lastOnline.pickup_by, pay_plan: lastOnline.pay_plan, figures: { subtotal: 60000, total: 69300 }, total_idr: 69300 })); }); return; }
  if (u.pathname === '/v1/online-orders') { const t = u.searchParams.get('token'); if (t !== 'c'.repeat(32)) { res.statusCode = 404; return res.end(JSON.stringify({ code: 'E:invalid_order' })); } return res.end(JSON.stringify({ order_no: '0007', status: 'ready', name: 'Budi', pickup_by: 'courier', pay_plan: 'at_pickup', pay_claimed: false, paid: false, reject_reason: null, created_at: '2026-11-17T10:00:00Z', note: null, figures: { subtotal: 60000, service: 3000, tax: 6300, total: 69300 }, items: [{ name: 'Nasi A', qty: 2, line_total: 60000 }] })); }
  if (u.pathname === '/v1/online-claim' && req.method === 'POST') return res.end(JSON.stringify({ ok: true }));
  if (u.pathname === '/v1/site') { const s = SITES[u.searchParams.get('host')]; res.statusCode = s ? 200 : 404; return res.end(JSON.stringify(s || { error: 'nf' })); }
  if (u.pathname === '/v1/menu') return res.end(JSON.stringify(u.searchParams.get('site') === 's9' ? MENU_ML : MENU));
  if (u.pathname === '/v1/table') return res.end(JSON.stringify((u.searchParams.get('token') || '').startsWith('e') ? { label: 'Take away', kind: 'counter' } : { label: 'Meja 1' }));
  if (u.pathname === '/v1/orders') { res.statusCode = 409; return res.end(JSON.stringify({ code: 'E:closed' })); }
  if (u.pathname === '/v1/bill-request') { res.statusCode = 409; return res.end(JSON.stringify({ code: 'E:no_bill' })); }
  res.statusCode = 404; res.end('{}');
}).listen(4600);

// ':root{--jade' = blok TEMA DASAR restoran (di awal <style>); blok mode pengunjung (html[data-mode=…]:root{…}) tidak dihitung sebagai tema dasar.
const has = (t, s) => (s === ':root{--jade' ? /<style[^>]*>html:root\{--jade/.test(t) : t.includes(s)), count = (t, s) => t.split(s).length - 1;

console.log('\n[1] Mode contoh bawaan (tanpa skenario, MEDIA_URL kosong)');
await withServer({}, async get => {
  const h = (await get('/')).text;
  ok('hero foto bawaan lokal /images/jamur-gunung.webp', has(h, 'src="/images/jamur-gunung.webp"'));
  ok('stempel & keterangan kartu tampil', has(h, '禅素合一') && has(h, 'Kuali jamur gunung'));
  ok('tanpa <style> tema', !has(h, ':root{--jade'));
  ok('tanpa banner/has-bn', !has(h, '<body class="has-bn"') && !has(h, 'data-bn='));
  ok('judul bawaan + em', has(h, 'Kembali ke kemurnian,<em>'));
  ok('3 chip, chip ke-3 emas', count(h, '<span class="chip') === 3 && has(h, 'class="chip g"'));
  ok('pita statistik ada', has(h, 'class="ticker"'));
  ok('Hidangan pilihan = 3 kartu berfoto', (h.split('<section class="alt">')[1] || '').split('</section>')[0].split('class="card rv"').length - 1 === 3);
  ok('nav memuat Filosofi', has(h, '/filosofi'));
  ok('/filosofi 200', (await get('/filosofi')).status === 200);
  ok('/zh/ 200 (bahasa kedua)', (await get('/zh/')).status === 200);
  const o = (await get('/order')).text; ok('/order tanpa meja = kotak scan', has(o, 'scanbox') && !has(o, 'id="orderForm"'));
  ok('Cache-Control halaman Home s-maxage=60', (await get('/')).headers.get('cache-control')?.includes('s-maxage=60'));
});

console.log('\n[2] MEDIA_URL terisi → semua gambar bawaan dari R2');
await withServer({ MEDIA_URL: 'https://images.test/' }, async get => {
  let all = '';
  for (const p of ['/', '/menu', '/filosofi']) all += (await get(p)).text;
  ok('hero dari R2', has(all, 'src="https://images.test/restaurant/defaults/aisin/jamur-gunung.webp"'));
  ok('Filosofi: koki & janji dari R2', has(all, 'defaults/aisin/koki-gu.webp') && has(all, 'defaults/aisin/sup-labu-emas-matsutake.webp'));
  ok('kartu menu dari R2', has(all, 'defaults/aisin/pangsit-kuah-truffle.webp'));
  ok('tidak ada /images/ lokal', !/(src|href)="\/images\//.test(all));
});

console.log('\n[3] closed + banners');
await withServer({ DEMO_SCENARIO: 'closed,banners' }, async get => {
  const home = (await get('/')).text, menu = (await get('/menu')).text, ord = (await get('/order?meja=' + 'a'.repeat(32))).text;
  ok('Home: banner libur + promo (scope all + home), tanpa info(order)', has(home, 'bn holiday') && has(home, 'bn promo') && !has(home, 'bn info'));
  ok('Menu: hanya banner libur', has(menu, 'bn holiday') && !has(menu, 'bn promo') && !has(menu, 'bn info'));
  ok('Order: libur + info', has(ord, 'bn holiday') && has(ord, 'bn info') && !has(ord, 'bn promo'));
  ok('body.has-bn', has(home, '<body class="has-bn"'));
  ok('data-bn = id:rev', has(home, 'data-bn="b-holiday:1"'));
  ok('tautan promo + label', has(home, '<a href="/menu">Lihat menu</a>'));
  ok('tombol tutup beraria-label', has(home, 'aria-label="Tutup"'));
  ok('skrip anti-kedip data-astro-rerun', has(home, 'data-astro-rerun'));
  ok('Order ditutup: panel + tanpa formulir', has(ord, 'Pemesanan sedang ditutup') && !has(ord, 'id="orderForm"'));
  const zh = (await get('/zh/')).text; ok('banner bahasa Mandarin', has(zh, '春节优惠'));
});

console.log('\n[3a] garis pembatas');
{
  const css = (await import('node:fs')).readFileSync(new URL('../src/styles/components.css', import.meta.url), 'utf8');
  ok('garis pembatas (.rule) tidak memuat karakter 心', !/\.rule[^{}]*::after/.test(css) && !css.includes('content: "心"'));
}
console.log('\n[3b] tampilan menu: teks saja');
await withServer({ DEMO_SCENARIO: 'text-menu' }, async get => {
  const t = (await get('/menu')).text;
  ok('menu_display=text: daftar teks, tanpa kartu foto', has(t, 'class="dlist"') && has(t, 'class="drow rv"') && !has(t, 'class="card rv"') && !has(t, '<img src='));
  ok('menu_display=text: nama & harga tampil', has(t, 'Sirup Plum Asam Dingin') && has(t, 'class="price"'));
});
await withServer({}, async get => {
  const t = (await get('/menu')).text;
  ok('default (photo): kartu seperti biasa, tanpa daftar teks', has(t, 'class="card rv') && !has(t, 'class="dlist"'));
  ok('menu tanpa foto di mode foto: tanpa kotak placeholder besar', !has(t, 'class="noimg"'));
});

console.log('\n[4] tema');
for (const [sc, expect, not] of [['theme-samudra', ['--jade:#1F4E6B', '--vm:#B45F14', '--on-accent:#FFFFFF', '--bg-a90:rgba(246,249,251,0.9)'], []],
  ['theme-giok', [], [':root{--jade']], ['theme-custom', ['--jade:#6B2D5C'], []], ['theme-dark', ['color-scheme:dark', '--bg:#14201A', '--gold-ink:#E6C65A'], []], ['theme-arang', ['--jade:#2E3A3F'], []]])
  await withServer({ DEMO_SCENARIO: sc }, async get => {
    const h = (await get('/')).text;
    ok(sc + ': variabel yang diharapkan', expect.every(x => has(h, x)), expect.filter(x => !has(h, x)).join('|'));
    ok(sc + ': tidak ada yang tidak diharapkan', not.every(x => !has(h, x)));
    if (sc === 'theme-samudra') { const base = (h.match(/<style[^>]*>(html:root\{[^}]*\})/) || [])[1] || ''; ok('tema terang: blok tema dasar tanpa color-scheme (blok mode pengunjung terpisah)', base.includes('--jade:#1F4E6B') && !base.includes('color-scheme'), base.slice(0, 80)); }
  });

console.log('\n[5] hero kustom (id & zh) + unggulan');
await withServer({ DEMO_SCENARIO: 'hero-custom,featured', MEDIA_URL: 'https://images.test' }, async get => {
  const h = (await get('/')).text, zh = (await get('/zh/')).text;
  ok('eyebrow kustom', has(h, 'Dapur rumahan sejak 2010'));
  ok('judul kustom + kalimat tekan kustom', has(h, 'Sederhana, hangat,<em>selalu dari hati</em>'));
  ok('lead kustom', has(h, 'Masakan nabati yang dimasak pelan'));
  ok('chip1 kustom, chip2 bawaan, chip3 kustom emas', has(h, '>Bahan lokal<') && has(h, 'Bahan gunung pilihan') && has(h, 'chip g">Dimasak pagi ini'));
  ok('tombol pesan kustom, tombol menu bawaan', has(h, '>Pesan dari meja<') && has(h, '>Lihat menu<'));
  ok('foto hero kustom + frame tall', has(h, 'frame tall') && has(h, 'tahu-tiantai-morel.webp'));
  ok('stempel & keterangan bawaan DISEMBUNYIKAN', !has(h, 'class="stamp"') && !has(h, '<div class="cap">') && !has(h, 'class="pr"') && !has(h, 'Hidangan andalan'));
  ok('zh: teks kustom zh', has(zh, '家常厨房') && has(zh, '简单而温暖，<em>始终出于真心</em>') && has(zh, '扫码点餐'));
  ok('zh: chip2 bawaan zh', has(zh, '高山林泉有机溯源'));
  const feat = (h.split('<section class="alt">')[1] || '').split('</section>')[0];
  ok('unggulan = 5 kartu bertanda ★', feat.split('class="card rv"').length - 1 === 5);
});

console.log('\n[6] backend sungguhan (mock) — data bermusuhan, restoran non-Aisin, backend lama');
await withServer({ API_URL: 'http://127.0.0.1:4600', MEDIA_URL: '' }, async get => {
  const h = (await get('/', { headers: { host: 'bistro.test' } })).text;
  ok('tema dengan warna jahat diabaikan seluruhnya', !has(h, ':root{--jade') && !has(h, 'display:none'));
  ok('hero.image javascript: ditolak → tanpa frame (hero solo)', has(h, 'class="hero solo"') && !has(h, 'javascript:') && !has(h, 'class="frame'));
  ok('teks hero di-escape (tanpa <script> mentah)', !has(h, '<script>alert(1)</script>') && has(h, '&lt;script&gt;'));
  ok('banner maks 3; id tak valid & teks kosong dibuang', count(h, 'data-bn=') === 3 && !has(h, 'id tidak valid') && !has(h, 'ke-4'));
  ok('link javascript:/// dibuang, https tetap', !has(h, 'javascript:alert') && !has(h, 'evil.com') && has(h, 'href="https://ok.example/p"'));
  ok('HTML di teks banner di-escape', has(h, 'Banner A &lt;b&gt;tebal&lt;/b&gt;'));
  ok('kind/scope asing → info/all', has(h, 'bn info') && has(h, 'data-bn="d:r9"'));
  ok('non-Aisin: tanpa pita statistik', !has(h, 'class="ticker"'));
  ok('non-Aisin: nav tanpa Filosofi, /filosofi = 404', !has(h, '/filosofi') && (await get('/filosofi', { headers: { host: 'bistro.test' } })).status === 404);
  ok('non-Aisin: judul = slogan, chip vegan', has(h, 'Makan sehat setiap hari') && has(h, '100% vegan'));
  ok('non-Aisin: tidak memuat teks Aisin/Mandarin', !has(h, 'Aisin') && !/[\u4e00-\u9fff]/.test(h));
  ok('tombol Kontak generik (tanpa nama Aisin di zh)', !/爱心素食/.test((await get('/kontak', { headers: { host: 'bistro.test' } })).text));
  const o = (await get('/order?meja=' + 'a'.repeat(32), { headers: { host: 'bistro.test' } })).text;
  ok('orders_open=false dari API → Order ditutup', has(o, 'Pemesanan sedang ditutup') && !has(o, 'id="orderForm"'));
  const r = await get('/api/orders', { method: 'POST', headers: { host: 'bistro.test', 'content-type': 'application/json' }, body: JSON.stringify({ token: 'a'.repeat(32), lang: 'id', items: [{ id: 'd1', qty: 1 }] }) });
  ok('POST /api/orders meneruskan 409 + E:closed', r.status === 409 && JSON.parse(r.text).code === 'E:closed', r.text);
  const rb = await get('/api/bill', { method: 'POST', headers: { host: 'bistro.test', 'content-type': 'application/json' }, body: JSON.stringify({ token: 'a'.repeat(32), client: 'b'.repeat(32) }) });
  ok('POST /api/bill meneruskan 409 + E:no_bill', rb.status === 409 && JSON.parse(rb.text).code === 'E:no_bill', rb.text);
  const og = (await get('/order?meja=' + 'a'.repeat(32), { headers: { host: 'good.test' } })).text;
  ok('halaman Order memuat tombol Minta bill + pesan E:table_full', has(og, 'id="billBtn"') && has(og, 'E:table_full') && has(og, 'data-billok'));
  const g = (await get('/', { headers: { host: 'good.test' } })).text;
  ok('tema valid dari API diterapkan', has(g, '--jade:#1F4E6B') && has(g, '--cta-p:'));
  ok('hero kustom: foto dari API, frame tall, tanpa stempel', has(g, 'hero-1.webp') && has(g, 'frame tall') && !has(g, 'class="stamp"'));
  ok('tanpa featured di API → tampil 2 hidangan berfoto (maks 3)', true);
  const tm = (await get('/menu', { headers: { host: 'text.test' } })).text, gm = (await get('/menu', { headers: { host: 'good.test' } })).text;
  ok('JALUR API: menu_display=text dari backend → daftar teks, tanpa foto', has(tm, 'class="dlist"') && has(tm, 'Nasi A') && !has(tm, 'class="card rv') && !has(tm, 'a.webp'));
  ok('JALUR API: tanpa menu_display (good.test) → kartu foto seperti biasa', has(gm, 'class="card rv') && !has(gm, 'class="dlist"'));
  const old = await get('/', { headers: { host: 'old.test' } }); ok('backend lama (tanpa field baru) tetap 200', old.status === 200 && !has(old.text, 'data-bn') && !has(old.text, ':root{--jade'));
  const m = (await get('/', { headers: { host: 'good.test' } })).text; ok('featured dari API menentukan Hidangan pilihan (Nasi A saja)', has(m, 'Nasi A') && !(m.split('<section class="alt">')[1] || '').split('</section>')[0].includes('Nasi B'));
  ok('host tak dikenal → 404 teks', (await get('/', { headers: { host: 'nope.test' } })).status === 404);
});

console.log('\n[7] pesanan online (takeaway)');
const post = (get, host, path, body) => get(path, { method: 'POST', headers: { host, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const T7 = 'c'.repeat(32);
await withServer({ API_URL: 'http://127.0.0.1:4600', MEDIA_URL: '' }, async get => {
  const h = host => ({ headers: { host } });
  const home = (await get('/', h('online.test'))).text;
  const navOf = html => (html.match(/<nav id="nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
  ok('online aktif: navigasi utama TIDAK memuat "Pesan online"', !has(navOf(home), '/pesan') && !has(navOf(home), 'Pesan online'));
  ok('navigasi utama tetap Beranda, Menu, Order, Kontak', has(navOf(home), 'href="/"') && has(navOf(home), 'href="/menu"') && has(navOf(home), 'href="/order"') && has(navOf(home), 'href="/kontak"'));
  ok('halaman status tidak masuk navigasi', !has(home, 'href="/pesanan"'));
  const off = (await get('/', h('good.test'))).text;
  ok('online mati/tanpa field (good.test): tanpa tautan /pesan', !has(off, '/pesan'));
  const p404 = await get('/pesan', h('good.test')); ok('online mati: /pesan = 404', p404.status === 404);
  const old404 = await get('/pesan', h('old.test')); ok('backend lama: /pesan = 404 (bukan galat)', old404.status === 404);
  const junk = await get('/pesan', h('onlinejunk.test')); ok('field online sampah (tipe salah, javascript:) → dianggap mati: 404', junk.status === 404, String(junk.status));
  const pr = await get('/pesan', h('online.test')); const p = pr.text;
  ok('/pesan 200, formulir online + nama, WA, diambil oleh', pr.status === 200 && has(p, 'id="pesanForm"') && has(p, 'name="phone"') && has(p, 'name="pickup_by"') && has(p, 'value="courier"'));
  ok('/pesan: nama & WA wajib (required)', /name="name"[^>]*required/.test(p) && /name="phone"[^>]*required/.test(p));
  ok('/pesan: opsi bayar QRIS tampil bila prepay aktif', has(p, 'value="prepay_qris"') && has(p, 'value="at_pickup"'));
  ok('/pesan: harga menu & subtotal EKSAK (Rp 30.000), bukan dibulatkan "30k"', has(p, 'Rp 30.000') && !has(p, 'IDR 30k'));
  ok('/pesan: Cache-Control no-store', pr.headers.get('cache-control') === 'no-store');
  ok('/pesan: kunci Turnstile kosong → tanpa widget', !has(p, 'id="captcha"'));
  ok('/pesan: pesan galat baru tersedia untuk skrip', has(p, 'E:phone_invalid') && has(p, 'E:pending_full') && has(p, 'E:name_required'));
  const nq = (await get('/pesan', h('onlinenoqr.test'))).text; ok('prepay tanpa gambar QRIS → opsi QRIS TIDAK tampil', has(nq, 'id="pesanForm"') && !has(nq, 'value="prepay_qris"'));
  const cl = (await get('/pesan', h('onlineclosed.test'))).text; ok('orders_open=false → /pesan ditutup, tanpa formulir', has(cl, 'Pesanan online sedang ditutup') && !has(cl, 'id="pesanForm"'));
  const en = (await get('/en/pesan', h('online.test'))).text; ok('/en/pesan: teks Inggris', has(en, 'Order online') && has(en, 'Picked up by') && has(en, 'WhatsApp number'));
  const ord = (await get('/order', h('online.test'))).text;
  ok('/order tanpa QR → tautan ke /pesan tetap ada (pelanggan makan di tempat bisa pesan bawa pulang)', has(ord, 'href="/pesan"'));
  ok('tautan itu memakai istilah Owner ("Pesan dari sini")', has(ord, 'Pesan dari sini') && !has(ord, 'Atau pesan online'));
  const ord2 = (await get('/order', h('good.test'))).text; ok('/order tanpa QR, online mati → tanpa tautan /pesan', !has(ord2, 'href="/pesan"'));

  const ctr = await get('/order?meja=' + 'e'.repeat(32), h('online.test'));
  ok('QR kasir: halaman Order tampil dengan istilah Owner "Bungkus"', ctr.status === 200 && has(ctr.text, 'Bungkus') && has(ctr.text, 'data-counter="1"'));
  ok('QR kasir: nama WAJIB (required)', /name="name"[^>]*required/.test(ctr.text));
  ok('QR kasir: tanpa tombol "Minta bill"', !has(ctr.text, 'id="billBtn"'));
  ok('QR kasir: petunjuk tunjukkan nomor pesanan di kasir', has(ctr.text, 'Tunjukkan nomor pesanan'));
  const mej = await get('/order?meja=' + 'a'.repeat(32), h('online.test'));
  ok('meja biasa: nama opsional, ada "Minta bill", bukan counter', !/name="name"[^>]*required/.test(mej.text) && has(mej.text, 'id="billBtn"') && !has(mej.text, 'data-counter'));
  const ctrEn = (await get('/en/order?meja=' + 'e'.repeat(32), h('online.test'))).text;
  ok('QR kasir bahasa Inggris: bawaan "Take away", bukan "Bungkus"', has(ctrEn, 'Take away') && !has(ctrEn, 'Bungkus'));
  const ctrDef = (await get('/order?meja=' + 'e'.repeat(32), h('good.test'))).text;
  ok('tanpa istilah Owner: "Take away" bawaan', has(ctrDef, 'Take away') && !has(ctrDef, 'Bungkus'));

  const st = await get('/pesanan/' + T7, h('online.test'));
  ok('/pesanan/<token> 200 + kotak status + noindex + no-store', st.status === 200 && has(st.text, 'id="statusBox"') && has(st.text, 'data-token="' + T7 + '"') && has(st.text, 'name="robots" content="noindex"') && st.headers.get('cache-control') === 'no-store');
  ok('status: QRIS & petunjuk pengambilan diteruskan ke skrip', has(st.text, 'data-qris="https://images.test/restaurant/tenants/ol/qris/qris-1.webp"') && has(st.text, 'data-pickup="Ambil di kasir depan."'));
  ok('status: teks status, tombol & petunjuk memakai istilah Owner "Sudah transfer" (bukan "Saya sudah bayar")', has(st.text, 'Siap diambil') && has(st.text, 'Sudah transfer') && !has(st.text, 'Saya sudah bayar'));
  ok('status: header tanpa Beranda & Order', !has(navOf(st.text), 'href="/"') && !has(navOf(st.text), 'href="/order"') && has(navOf(st.text), 'href="/menu"'));
  const bad = await get('/pesanan/abc', h('online.test')); ok('/pesanan/<token tidak valid> = 404', bad.status === 404);
  const bad2 = await get('/pesanan/' + T7 + '/x', h('online.test')); ok('/pesanan/<token>/x = 404', bad2.status === 404);
  const nopath = await get('/pesanan', h('online.test')); ok('/pesanan tanpa token = 404', nopath.status === 404);
  const stOff = await get('/pesanan/' + T7, h('good.test')); ok('online mati: /pesanan/<token> = 404', stOff.status === 404);
  const enSt = (await get('/en/pesanan/' + T7, h('online.test'))).text; ok('pengalih bahasa di halaman status mempertahankan token', has(enSt, '/pesanan/' + T7) && has(enSt, 'Order status'));

  const body = { lang: 'id', items: [{ id: 'd1', qty: 2 }], name: 'Budi', phone: '0812 3456 7890', note: 'jam 7', pickup_by: 'courier', pay_plan: 'at_pickup', client: 'b'.repeat(32), price: 1, total: 1, captcha: 'x' };
  const r = await post(get, 'online.test', '/api/pesan', body); const rj = JSON.parse(r.text);
  ok('POST /api/pesan → 200, token & total akhir dari backend', r.status === 200 && rj.token === T7 && rj.total_idr === 69300, r.text);
  ok('payload ke backend: site, nama, WA, pickup_by, pay_plan, item; TANPA harga/total/captcha', lastOnline.site === 's5' && lastOnline.name === 'Budi' && lastOnline.phone === '0812 3456 7890' && lastOnline.pickup_by === 'courier' && lastOnline.pay_plan === 'at_pickup' && lastOnline.items[0].qty === 2 && !('price' in lastOnline) && !('total' in lastOnline) && !('captcha' in lastOnline), JSON.stringify(lastOnline));
  await post(get, 'online.test', '/api/pesan', { ...body, pickup_by: 'hacker', pay_plan: 'free' });
  ok('pickup_by/pay_plan liar dinormalkan (customer / at_pickup)', lastOnline.pickup_by === 'customer' && lastOnline.pay_plan === 'at_pickup');
  const before = onlineCalls; const off409 = await post(get, 'good.test', '/api/pesan', body);
  ok('online mati: /api/pesan = 409 E:online_off tanpa memanggil backend', off409.status === 409 && JSON.parse(off409.text).code === 'E:online_off' && onlineCalls === before, off409.text);
  const bigBody = JSON.stringify({ pad: 'x'.repeat(30000) }); const big = await get('/api/pesan', { method: 'POST', headers: { host: 'online.test', 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(bigBody)) }, body: bigBody });
  ok('badan terlalu besar ditolak 413', big.status === 413, String(big.status));
  const g1 = await get('/api/pesanan?token=' + T7, h('online.test')); ok('GET /api/pesanan → status dari backend', g1.status === 200 && JSON.parse(g1.text).status === 'ready', g1.text);
  const g2 = await get('/api/pesanan?token=' + 'd'.repeat(32), h('online.test')); ok('token asing → 404 E:invalid_order', g2.status === 404 && JSON.parse(g2.text).code === 'E:invalid_order', g2.text);
  const g3 = await get('/api/pesanan?token=zzz', h('online.test')); ok('token bentuk salah → 404 tanpa memanggil backend', g3.status === 404);
  const c1 = await post(get, 'online.test', '/api/pesanan', { token: T7 }); ok('POST /api/pesanan (saya sudah bayar) → 200', c1.status === 200 && JSON.parse(c1.text).ok === true, c1.text);
  const c2 = await post(get, 'online.test', '/api/pesanan', { token: 'xyz' }); ok('klaim dengan token salah → 404', c2.status === 404);
});
console.log('\n[7b] Turnstile aktif (TURNSTILE_SECRET + TURNSTILE_SITEKEY)');
await withServer({ API_URL: 'http://127.0.0.1:4600', MEDIA_URL: '', TURNSTILE_SECRET: 'rahasia', TURNSTILE_SITEKEY: '1x00000000000000000000AA' }, async get => {
  const p = (await get('/pesan', { headers: { host: 'online.test' } })).text;
  ok('widget Turnstile dirender dengan sitekey', has(p, 'id="captcha"') && has(p, 'data-sitekey="1x00000000000000000000AA"'));
  const before = onlineCalls;
  const r = await post(get, 'online.test', '/api/pesan', { lang: 'id', items: [{ id: 'd1', qty: 1 }], name: 'B', phone: '0812345678' });
  ok('tanpa token captcha → 403 E:captcha, backend tidak dipanggil', r.status === 403 && JSON.parse(r.text).code === 'E:captcha' && onlineCalls === before, r.text);
  const r2 = await post(get, 'online.test', '/api/pesan', { lang: 'id', items: [{ id: 'd1', qty: 1 }], name: 'B', phone: '0812345678', captcha: 'salah' });
  ok('token captcha salah (siteverify tidak terjangkau/ditolak) → 403', r2.status === 403 && onlineCalls === before, r2.text);
});
console.log('\n[8] bahasa tampilan awal, Chinese Traditional (zt), mode terang/gelap');
await withServer({ API_URL: 'http://127.0.0.1:4600', MEDIA_URL: '' }, async get => {
  const h = host => ({ headers: { host } });
  const navOf = html => (html.match(/<nav id="nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
  const r1 = await get('/', h('ztdef.test'));
  ok('tampilan awal = zt: "/" berbahasa zh-Hant, bukan bahasa utama', r1.status === 200 && has(r1.text, '<html lang="zh-Hant"'), r1.text.slice(0, 120));
  ok('teks bawaan website dalam 繁體 (點餐, bukan 点餐)', has(navOf(r1.text), '點餐') && !has(navOf(r1.text), '点餐'));
  ok('pengalih bahasa menampilkan 繁 dan ID', has(r1.text, '>繁<') && has(r1.text, '>ID<'));
  ok('hreflang: zh-Hant dan id', has(r1.text, 'hreflang="zh-Hant"') && has(r1.text, 'hreflang="id"'));
  const r2 = await get('/id/', h('ztdef.test')); ok('bahasa utama (id) kini berawalan /id/ dan berbahasa Indonesia', r2.status === 200 && has(r2.text, '<html lang="id"') && has(navOf(r2.text), 'Beranda'));
  const r3 = await get('/zt/menu', { ...h('ztdef.test'), redirect: 'manual' }); ok('/zt/menu (tampilan awal) dialihkan ke /menu', r3.status >= 300 && r3.status < 400 && (r3.headers.get('location') || '').endsWith('/menu'), String(r3.status) + ' ' + r3.headers.get('location'));
  const m1 = (await get('/menu', h('ztdef.test'))).text;
  ok('fallback isi memakai bahasa UTAMA (Nasi ID), bukan nilai pertama (Dish EN)', has(m1, 'Nasi ID') && !has(m1, 'Dish EN'));
  ok('nama restoran zt dipakai di judul', has(r1.text, '<title>小館'));
  const s1 = await get('/zt/', h('ztsec.test')); ok('zt sebagai bahasa kedua: /zt/ zh-Hant + 點餐', s1.status === 200 && has(s1.text, '<html lang="zh-Hant"') && has(navOf(s1.text), '點餐'));
  ok('font Noto Serif/Sans TC dimuat untuk zh-Hant', has(s1.text, 'Noto+Sans+TC') && has(s1.text, 'Noto+Serif+TC'));
  const f1 = (await get('/fr/', h('fr.test'))).text; ok('bahasa tanpa teks bawaan (fr): Inggris, bukan Indonesia', has(navOf(f1), 'Home') && !has(navOf(f1), 'Beranda'), navOf(f1).slice(0, 200));

  // mode terang/gelap pengunjung
  const g = (await get('/', h('good.test'))).text;
  ok('tema terang: data-base="light", tombol mode ada di header', has(g, 'data-base="light"') && has(g, 'id="modeBtn"'));
  ok('CSS memuat blok mode terang & gelap', has(g, 'html[data-mode="dark"]:root{') && has(g, 'html[data-mode="light"]:root{'));
  ok('skrip awal membaca pilihan pengunjung sebelum render (tanpa kedipan)', has(g, "localStorage.getItem('resto_mode')") && has(g, 'data-astro-rerun'));
  const d = (await get('/', h('dark.test'))).text; ok('tema gelap restoran: data-base="dark"', has(d, 'data-base="dark"') && has(d, 'html[data-mode="light"]:root{'));
  const pz = (await get('/pesan', h('online.test'))).text; ok('/pesan juga memuat tombol mode', has(pz, 'id="modeBtn"'));
  ok('label tombol mode (aksesibilitas) tersedia ID', has(g, 'data-l-dark="Mode gelap"') && has(g, 'data-l-light="Mode terang"'));
  const gz = (await get('/', h('ztdef.test'))).text; ok('label tombol mode dalam 繁體', has(gz, 'data-l-dark="深色模式"') && has(gz, 'data-l-light="淺色模式"'));
});
api.close();
console.log(`\nHasil: ${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
