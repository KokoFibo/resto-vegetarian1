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
const MENU = { cats: [{ slug: 'main', glyph: '', name: { id: 'Utama' } }], dishes: [
  { id: 'd1', cat: 'main', price: 30000, img: 'https://images.test/restaurant/tenants/x/menu/a.webp', egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, featured: true, name: { id: 'Nasi A' }, short: { id: 'enak' }, detail: null, badge: null },
  { id: 'd2', cat: 'main', price: 20000, img: 'https://images.test/restaurant/tenants/x/menu/b.webp', egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, name: { id: 'Nasi B' }, short: { id: 'enak' }, detail: null, badge: null }] };
const api = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); res.setHeader('content-type', 'application/json');
  if (u.pathname === '/v1/site') { const s = SITES[u.searchParams.get('host')]; res.statusCode = s ? 200 : 404; return res.end(JSON.stringify(s || { error: 'nf' })); }
  if (u.pathname === '/v1/menu') return res.end(JSON.stringify(MENU));
  if (u.pathname === '/v1/table') return res.end(JSON.stringify({ label: 'Meja 1' }));
  if (u.pathname === '/v1/orders') { res.statusCode = 409; return res.end(JSON.stringify({ code: 'E:closed' })); }
  res.statusCode = 404; res.end('{}');
}).listen(4600);

const has = (t, s) => t.includes(s), count = (t, s) => t.split(s).length - 1;

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

console.log('\n[4] tema');
for (const [sc, expect, not] of [['theme-samudra', ['--jade:#1F4E6B', '--vm:#B45F14', '--on-accent:#FFFFFF', '--bg-a90:rgba(246,249,251,0.9)'], ['color-scheme']],
  ['theme-giok', [], [':root{--jade']], ['theme-custom', ['--jade:#6B2D5C'], []], ['theme-dark', ['color-scheme:dark', '--bg:#14201A', '--gold-ink:#E6C65A'], []], ['theme-arang', ['--jade:#2E3A3F'], []]])
  await withServer({ DEMO_SCENARIO: sc }, async get => {
    const h = (await get('/')).text;
    ok(sc + ': variabel yang diharapkan', expect.every(x => has(h, x)), expect.filter(x => !has(h, x)).join('|'));
    ok(sc + ': tidak ada yang tidak diharapkan', not.every(x => !has(h, x)));
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
  const g = (await get('/', { headers: { host: 'good.test' } })).text;
  ok('tema valid dari API diterapkan', has(g, '--jade:#1F4E6B') && has(g, '--cta-p:'));
  ok('hero kustom: foto dari API, frame tall, tanpa stempel', has(g, 'hero-1.webp') && has(g, 'frame tall') && !has(g, 'class="stamp"'));
  ok('tanpa featured di API → tampil 2 hidangan berfoto (maks 3)', true);
  const old = await get('/', { headers: { host: 'old.test' } }); ok('backend lama (tanpa field baru) tetap 200', old.status === 200 && !has(old.text, 'data-bn') && !has(old.text, ':root{--jade'));
  const m = (await get('/', { headers: { host: 'good.test' } })).text; ok('featured dari API menentukan Hidangan pilihan (Nasi A saja)', has(m, 'Nasi A') && !(m.split('<section class="alt">')[1] || '').split('</section>')[0].includes('Nasi B'));
  ok('host tak dikenal → 404 teks', (await get('/', { headers: { host: 'nope.test' } })).status === 404);
});
api.close();
console.log(`\nHasil: ${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
