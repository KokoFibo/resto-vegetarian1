// API tiruan lokal untuk mencoba frontend dalam mode API tanpa backend sungguhan:
//   node tools/mock-api.mjs            (port 4600; ubah dengan PORT=…)
//   API_URL=http://127.0.0.1:4600 npm run dev
// Restoran contoh "Bistro Hijau" (non-Aisin): tema samudra, hero & banner kustom, satu hidangan ★, pemesanan DITUTUP bila MOCK_CLOSED=1.
import http from 'node:http';
const closed = process.env.MOCK_CLOSED === '1';
const site = {
  id: 'mock-1', slug: 'bistro', status: 'active', restaurant_type: 'vegan', languages: ['id', 'en'],
  translations: { id: { brand_name: 'Bistro Hijau', tagline: 'Makan sehat setiap hari' }, en: { brand_name: 'Green Bistro', tagline: 'Healthy every day' } },
  phone: '+62 811 0000 000', whatsapp: null, email: null, maps_url: null, address: 'Jl. Mawar No. 1, Jakarta',
  opening_hours: { lunch: '10:00-15:00', dinner: '17:00-21:00' }, primary_color: null,
  theme: { id: 'samudra', dark: false, colors: { primary: '#1F4E6B', secondary: '#2F6F94', accent: '#B45F14', bg: '#F6F9FB', bg2: '#E8EFF4', ink: '#1E2621', ink2: '#404944', line: 'rgba(31,78,107,.12)' } },
  orders_open: !closed,
  hero: { image: null, texts: { eyebrow: { id: 'Dapur rumahan sejak 2010', en: 'Home kitchen since 2010' }, title: { id: 'Sederhana, hangat,', en: 'Simple, warm,' }, title_em: { id: 'selalu dari hati', en: 'always from the heart' } } },
  banners: [{ id: 'promo-1', kind: 'promo', scope: 'home', link_url: '/menu', blocks_orders: false, rev: 1, text: { id: 'Promo minggu ini: gratis es teh untuk semua menu utama', en: 'This week: free iced tea with every main dish' }, link_label: { id: 'Lihat menu', en: 'View menu' } }],
};
const dish = (id, price, img, name, featured = false) => ({ id, cat: 'main', price, img, egg: false, onion: false, nonHalal: false, spicy: 0, soldOut: false, featured, name: { id: name }, short: { id: 'Dimasak segar setiap hari.' }, detail: null, badge: null });
const menu = { cats: [{ slug: 'main', glyph: '', name: { id: 'Menu utama', en: 'Main dishes' } }], dishes: [
  dish('m1', 38000, '/images/tahu-tiantai-morel.webp', 'Tahu Jamur', true), dish('m2', 42000, '/images/gulung-asparagus-jade.webp', 'Gulung Asparagus'), dish('m3', 36000, null, 'Sayur Lodeh')] };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); res.setHeader('content-type', 'application/json');
  const send = (code, o) => { res.statusCode = code; res.end(JSON.stringify(o)); };
  if (u.pathname === '/v1/site') return send(200, site);
  if (u.pathname === '/v1/menu') return send(200, menu);
  if (u.pathname === '/v1/table') return /^[0-9a-f]{32}$/.test(u.searchParams.get('token') || '') ? send(200, { label: 'Meja 1' }) : send(404, {});
  if (u.pathname === '/v1/orders' && req.method === 'POST') return closed ? send(409, { code: 'E:closed' }) : send(200, { order_no: 1, table_label: 'Meja 1', total_idr: 38000 });
  send(404, {});
}).listen(Number(process.env.PORT) || 4600, () => console.log('API tiruan di http://127.0.0.1:' + (process.env.PORT || 4600)));
