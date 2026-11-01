import { env } from '../lib/env';
import { mediaUrl } from '../lib/media';
import type { Banner, Category, Dish, Menu, Site, ThemeColors } from './types';

/**
 * Data contoh: dipakai bila API_URL belum diisi, supaya frontend bisa dijalankan sendiri.
 * DEMO_SCENARIO (env, hanya mode contoh) mengaktifkan keadaan dari admin untuk uji visual; boleh beberapa, dipisah koma:
 *   closed | banners | theme-<id> (giok|teh|samudra|bata|anggur|zaitun|arang) | theme-custom | theme-dark | hero-custom | featured
 */
const DEMO_BASE: Site = {
  id: 'demo', slug: 'aisin', status: 'active', restaurant_type: 'vegetarian', languages: ['id', 'zh'],
  translations: {
    id: { brand_name: 'Aisin Vegetarian', tagline: 'Gastronomi Nabati Zen' },
    zh: { brand_name: '爱心素食', tagline: '禅意植物料理' },
  },
  phone: '+86 (021) 8829-1088', whatsapp: null, email: null, maps_url: null,
  address: "Jl. Fumin 188, Distrik Jing'an, Shanghai · Gedung A, Taman Zen",
  opening_hours: { lunch: '11:30-14:30', tea: '14:30-17:00', dinner: '17:30-21:30' },
  primary_color: null, theme: null, orders_open: true, hero: { texts: {}, image: null }, banners: [],
};

/** Hanya untuk mode contoh: salinan warna preset admin (di produksi warna datang dari backend). */
const PRESET: Record<string, ThemeColors> = {
  teh: { primary: '#7A4A21', secondary: '#96623A', accent: '#A8402A', bg: '#FBF7F0', bg2: '#F3EADB', ink: '#1E2621', ink2: '#404944', line: 'rgba(122,74,33,.12)' },
  samudra: { primary: '#1F4E6B', secondary: '#2F6F94', accent: '#B45F14', bg: '#F6F9FB', bg2: '#E8EFF4', ink: '#1E2621', ink2: '#404944', line: 'rgba(31,78,107,.12)' },
  bata: { primary: '#8E2A2A', secondary: '#A84545', accent: '#8A6414', bg: '#FCF8F4', bg2: '#F5EBE1', ink: '#1E2621', ink2: '#404944', line: 'rgba(142,42,42,.12)' },
  anggur: { primary: '#5B3A66', secondary: '#75507F', accent: '#A5561B', bg: '#FAF7FA', bg2: '#EFE8F1', ink: '#1E2621', ink2: '#404944', line: 'rgba(91,58,102,.12)' },
  zaitun: { primary: '#4F5D2F', secondary: '#6B7B45', accent: '#B0532E', bg: '#FAF9F3', bg2: '#EFEDDC', ink: '#1E2621', ink2: '#404944', line: 'rgba(79,93,47,.12)' },
  arang: { primary: '#2E3A3F', secondary: '#46565C', accent: '#C4481F', bg: '#F8F8F6', bg2: '#ECECE8', ink: '#1E2621', ink2: '#404944', line: 'rgba(46,58,63,.12)' },
  giok: { primary: '#2B5B47', secondary: '#3D735B', accent: '#C35B3B', bg: '#FBF8F2', bg2: '#F4EEE2', ink: '#1E2621', ink2: '#404944', line: 'rgba(43,91,71,.12)' },
  custom: { primary: '#6B2D5C', secondary: '#8A4D79', accent: '#B4531A', bg: '#FFFFFF', bg2: '#F3EEF2', ink: '#1E2621', ink2: '#404944', line: 'rgba(107,45,92,.12)' },
  dark: { primary: '#E8D9A8', secondary: '#EEE2BC', accent: '#B45F14', bg: '#14201A', bg2: '#1C2C24', ink: '#F2EFE9', ink2: '#C9C5BC', line: 'rgba(232,217,168,.14)' },
};

const scenario = (locals: unknown) => new Set((env(locals, 'DEMO_SCENARIO') || '').split(',').map(x => x.trim()).filter(Boolean));

export function demoSite(locals: unknown): Site {
  const sc = scenario(locals), site: Site = { ...DEMO_BASE };
  const preset = [...sc].find(x => x.startsWith('theme-'))?.slice(6);
  if (preset && PRESET[preset === 'dark' ? 'dark' : preset]) site.theme = { id: preset === 'dark' ? 'custom' : preset, dark: preset === 'dark', colors: PRESET[preset] };
  if (sc.has('closed')) site.orders_open = false;
  if (sc.has('hero-custom')) site.hero = {
    image: mediaUrl(locals, 'restaurant/defaults/aisin/tahu-tiantai-morel.webp'),
    texts: {
      eyebrow: { id: 'Dapur rumahan sejak 2010', zh: '家常厨房 · 始于2010' },
      title: { id: 'Sederhana, hangat,', zh: '简单而温暖，' }, title_em: { id: 'selalu dari hati', zh: '始终出于真心' },
      lead: { id: 'Masakan nabati yang dimasak pelan setiap pagi dari bahan lokal pilihan.', zh: '每天清晨以当地精选食材慢火烹制的植物料理。' },
      chip1: { id: 'Bahan lokal', zh: '本地食材' }, chip3: { id: 'Dimasak pagi ini', zh: '今晨现做' },
      cta_order: { id: 'Pesan dari meja', zh: '扫码点餐' },
    },
  };
  if (sc.has('banners')) {
    const b = (id: string, kind: Banner['kind'], scope: Banner['scope'], id_: string, zh: string, extra: Partial<Banner> = {}): Banner =>
      ({ id, kind, scope, link_url: null, blocks_orders: false, rev: 1, text: { id: id_, zh }, link_label: null, ...extra });
    site.banners = [
      b('b-holiday', 'holiday', 'all', 'Kami libur selama Lebaran, 1–5 Januari. Selamat berhari raya!', '我们将在1月1日至5日休息，祝节日快乐！'),
      b('b-promo', 'promo', 'home', 'Promo Imlek: gratis teh pu-erh untuk pemesanan di atas Rp 300.000', '春节优惠：消费满30万印尼盾赠普洱茶', { link_url: '/menu', link_label: { id: 'Lihat menu', zh: '查看菜单' } }),
      b('b-info', 'info', 'order', 'Pembayaran dilakukan di kasir setelah Anda selesai makan.', '请在用餐后于收银台付款。'),
    ];
    if (sc.has('closed')) site.banners[0].blocks_orders = true;
  }
  return site;
}

const cats: Category[] = [
  { slug: 'main', glyph: '馔', name: { id: 'Hidangan Utama', en: 'Main dishes', zh: '主菜' } },
  { slug: 'soup', glyph: '汤', name: { id: 'Sup & Kukus', en: 'Soups & steamed', zh: '汤羹' } },
  { slug: 'dimsum', glyph: '点', name: { id: 'Dim Sum & Camilan', en: 'Dim sum & snacks', zh: '点心' } },
  { slug: 'dessert', glyph: '甜', name: { id: 'Penutup', en: 'Desserts', zh: '甜品' } },
  { slug: 'drink', glyph: '茶', name: { id: 'Minuman & Teh', en: 'Drinks & tea', zh: '茶饮' } },
];

type Seed = { cat: string; img?: string; egg?: boolean; price: number; badge?: [string, string]; name: [string, string]; short: [string, string] };
const L = ([id, zh]: [string, string]) => ({ id, zh });
const IDR_PER_YUAN = 2700;

const seeds: Seed[] = [
  { cat: 'dimsum', img: 'pangsit-kuah-truffle', price: 88, badge: ['Pilihan Chef', '主厨推荐'], name: ['Pangsit Kuah Truffle & Matsutake', '松露松茸灌汤包'], short: ['Kaldu bening matsutake Yunnan dan truffle hitam dalam kulit setipis sayap jangkrik; sekali gigit, kuahnya melimpah.', '云南鲜松茸与黑松露文火萃出澄澈菌汤，面皮薄如蝉翼，轻咬汤汁丰盈，山林香气直沁心脾。'] },
  { cat: 'main', img: 'gulung-asparagus-jade', price: 128, badge: ['Musiman', '时令清欢'], name: ['Gulung Asparagus Jade & Truffle', '黑松露碧玉翡翠卷'], short: ['Asparagus muda dibalut kulit tahu buatan tangan, disiram saus truffle hitam dan minyak camelia tekan dingin.', '初夏嫩芦笋裹以手工头层鲜腐皮，浇淋特调黑松露甘露与低温冷压山茶油，脆嫩清甘，层次迭起。'] },
  { cat: 'main', img: 'tahu-tiantai-morel', price: 148, badge: ['Andalan Restoran', '镇店招牌'], name: ['Tahu Tiantai & Jamur Morel Kuali Tanah', '瓦煲羊肚菌煨天台山豆腐'], short: ['Tahu gilingan batu dari kuil Tiantai, jamur morel utuh dan kastanye, dimasak pelan di kuali tanah liat hingga meresap.', '天台古刹柴火手工石磨豆腐，辅以整颗云南深山羊肚菌与板栗，于紫砂瓦煲中文火慢焗，香浓入骨。'] },
  { cat: 'dessert', img: 'getah-persik-pu-erh', price: 78, badge: ['Manis Menenangkan', '甜润养心'], name: ['Getah Persik Pu-erh Matang', '禅茶一味 · 普洱素燕窝'], short: ['Biji teratai salju dan getah persik liar direbus dua belas jam dalam kaldu pu-erh matang, manis lembut dengan jejak gaharu.', '高山天然雪莲子、野生桃胶以古树熟普清汤煨煮十二时辰，润泽清甜，回味泛起淡淡沉香茶韵。'] },
  { cat: 'dimsum', img: 'gulung-renyah-lima-harta', price: 68, badge: ['Cita rasa Jiangnan', '江南风物'], name: ['Gulung Renyah Lima Harta Gunung', '春水碧波 · 五色金丝脆卷'], short: ['Rebung muda, malantou, dan jamur shiitake digulung tangan, digoreng pelan hingga keemasan dan renyah.', '初生春笋丝、马兰头与香菇金丝手工细卷，文火轻炸至色如暖金，外壳酥脆轻薄，内馅满溢山野草木之鲜。'] },
  { cat: 'soup', img: 'sup-labu-emas-matsutake', price: 168, badge: ['Pilihan Chef', '主厨推荐'], name: ['Sup Labu Emas Matsutake & Jamur Surai Singa', '金汤松茸猴头菇'], short: ['Labu dan kastanye dilebur menjadi kuah emas, dengan matsutake Yunnan dan jamur surai singa liar yang gemuk dan harum.', '板栗南瓜融作金汤，吸饱云南头刀松茸与野生猴头菇的饱满丰腴。'] },
  { cat: 'soup', img: 'jamur-gunung', price: 188, badge: ['Hidangan andalan', '招牌菜'], name: ['Kuali Jamur Gunung Matsutake & Morel', '山珍菌菇煲'], short: ['Matsutake, morel, jamur kuping hitam, kulit tahu, dan tahu lembut direbus pelan dalam kaldu bening dengan jahe dan goji.', '松茸、羊肚菌、黑木耳、腐竹与嫩豆腐于清汤中文火慢煲，佐以姜片与枸杞，鲜醇清润。'] },
  { cat: 'main', egg: true, price: 108, name: ['Tahu Pasir Emas Telur Asin', '金沙蛋黄豆腐'], short: ['Tahu lembut berselimut pasir kuning telur asin, renyah di luar dan lembut di dalam.', '嫩豆腐裹金沙咸蛋黄，外酥内嫩，咸香回甘。'] },
  { cat: 'main', price: 72, name: ['Buncis Tumis Kering ala Sichuan', '干煸四季豆'], short: ['Buncis ditumis kering dengan lada Sichuan dan sayur acar; aromanya tajam dan segar.', '四季豆干煸，花椒与榨菜提香，镬气十足。'] },
  { cat: 'soup', egg: true, price: 58, name: ['Telur Kukus Sutra dengan Jamur', '菌菇蒸蛋羹'], short: ['Telur kukus selembut sutra dengan shiitake dan enoki dalam kaldu bening.', '蒸蛋滑嫩如丝，铺以香菇与金针菇，清鲜暖胃。'] },
  { cat: 'dessert', egg: true, price: 48, name: ['Puding Susu Kukus Dua Lapis', '双皮奶'], short: ['Puding susu dua lapis yang lembut, manis tipis, dengan kacang merah.', '双层奶皮滑嫩，微甜，佐以红豆。'] },
  { cat: 'drink', price: 58, name: ['Teh Pu-erh Mentah Yiwu (satu teko)', '易武古树生普（一壶）'], short: ['Teh pohon tua, pahit-manis yang naik pelan.', '古树生普，先苦后甘，回甘悠长。'] },
  { cat: 'drink', price: 68, name: ['Teh Putih Anji Mingqian (satu teko)', '安吉白茶明前（一壶）'], short: ['Segar, lembut, dengan seduhan yang jernih.', '清鲜柔润，汤色清亮。'] },
  { cat: 'drink', price: 28, name: ['Sirup Plum Asam Dingin', '冰镇酸梅汤'], short: ['Plum asam, hawthorn, dan osmanthus; dingin dan menyegarkan.', '乌梅山楂桂花熬制，冰镇酸甜解腻。'] },
];

export function demoMenu(locals: unknown): Menu {
  const sc = scenario(locals), featured = new Set(sc.has('featured') ? ['demo-0', 'demo-2', 'demo-4', 'demo-6', 'demo-5'] : []);
  const dishes: Dish[] = seeds.map((s, n): Dish => ({
    id: `demo-${n}`, cat: s.cat, price: Math.round((s.price * IDR_PER_YUAN) / 1000) * 1000,
    img: s.img ? mediaUrl(locals, `restaurant/defaults/aisin/${s.img}.webp`) : null,
    egg: !!s.egg, onion: false, nonHalal: false, spicy: 0, soldOut: false, featured: featured.has(`demo-${n}`),
    name: L(s.name), short: L(s.short), detail: null, badge: s.badge ? L(s.badge) : null,
  }));
  return { cats, dishes };
}
