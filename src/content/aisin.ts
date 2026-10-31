import type { Txt } from '../i18n';

/**
 * Teks halaman Beranda, Filosofi, dan Kontak untuk Aisin.
 * Dipisah dari tampilan supaya nanti mudah diganti per restoran (dari backend atau berkas lain).
 */
const t = (id: string, en: string, zh: string): Txt => ({ id, en, zh });

export const home = {
  eyebrow: t('爱心 · Aisin Vegetarian', '爱心 · Aisin Vegetarian', '爱心 素食'),
  title: t('Kembali ke kemurnian,', 'Back to purity,', '回归本真，'),
  titleEm: t('nikmati keindahan hidangan nabati', 'savour the beauty of plant-based dining', '品味天地素食之美'),
  lead: t(
    'Dengan welas asih dan warisan teh Zen Jingshan: tahu garam-cair buatan tangan, jamur gunung Yunnan, dan sayur musiman yang dipetik saat embun.',
    'With compassion and the Zen tea heritage of Jingshan: handmade brine tofu, Yunnan mountain mushrooms and seasonal greens picked at dawn.',
    '以慈悲为念，承径山禅茶风韵。严选云贵高山净植、天台古法手作盐卤豆腐与四时晨露时蔬。'),
  chips: [
    { text: t('100% vegetarian', '100% vegetarian', '100% 素食'), gold: false },
    { text: t('Bahan gunung pilihan', 'Select mountain ingredients', '高山林泉有机溯源'), gold: false },
    { text: t('Pu-erh pohon tua', 'Old-tree pu-erh', '古树普洱 · 禅茶佐宴'), gold: true },
  ],
  hero: {
    image: '/images/jamur-gunung.webp',
    alt: t('Kuali jamur gunung', 'Mountain mushroom pot', '山珍菌菇煲'),
    stamp: '禅素合一',
    kicker: t('Hidangan andalan', 'Signature dish', '招牌菜'),
    dish: t('Kuali jamur gunung', 'Mountain mushroom pot', '山珍菌菇煲'),
    price: 508000,
  },
  stats: [
    { value: '2.400 m', label: t('Zona matsutake liar Shangri-La', 'Wild matsutake zone of Shangri-La', '香格里拉野生松茸产区') },
    { value: '100%', label: t('Bahan nabati alami', 'Natural plant-based ingredients', '纯天然植物原料') },
    { value: '0', label: t('MSG, pewarna, dan lemak hewani', 'MSG, colourings and animal fat', '零味精 · 零色素 · 零动物油脂') },
    { value: '24', label: t('Menu berganti tiap musim', 'Menu changes with every season', '节气更迭私房菜牌') },
  ],
  featured: t('Hidangan pilihan', 'Featured dishes', '经典名席'),
  categories: t('Kategori menu', 'Menu categories', '菜单分类'),
  cta: {
    title: t('Pesan langsung dari meja Anda', 'Order right from your table', '在座位上扫码点餐'),
    body: t('Scan QR code di meja, pilih hidangan, lalu kirim pesanan. Kami siapkan dengan hati.', 'Scan the QR code on your table, choose your dishes and send your order. We prepare it with care.', '扫描餐桌二维码，选择菜品并提交订单，我们用心为您备餐。'),
    button: t('Mulai pesan', 'Start ordering', '开始点餐'),
  },
};

export const philosophy = {
  title: t('Murni karena hormat, rasa karena alam', 'Pure out of respect, flavour from nature', '以爱为心 · 以素养真'),
  lead: t(
    'Bukan meniru daging, tetapi mengembalikan rasa asli bahan: air mata air, jamur hutan, dan kedelai gunung dengan api yang tenang.',
    'Not imitating meat, but restoring the true taste of ingredients: spring water, forest mushrooms and mountain soybeans over a calm flame.',
    '不以仿荤博眼，独以至味动心。取清泉、采灵蕈、研山豆，在静穆火候中重遇食物原本的高洁与温润。'),
  pillars: [
    { title: t('Kasih sayang', 'Compassion', '爱心慈食 · 心安意净'),
      body: t('Kami berdiri di atas rasa hormat pada semua makhluk hidup. Setiap piring murni vegetarian, agar tubuh dan batin terasa dibasuh.', 'We stand on respect for all living beings. Every plate is purely vegetarian, so that body and mind feel cleansed.', '「爱心」立馆本愿，始于爱敬有情众生。每一盘料理均严守素食底线，让每一次举箸皆是对身心的沐洗。') },
    { title: t('Asal gunung', 'From the mountains', '自然之味 · 寻踪深山'),
      body: t('Matsutake dan morel liar dari hutan Yunnan 2.400 m, kedelai digiling dengan air mata air Tiantai, rebung dari mata air dingin Wuling.', 'Wild matsutake and morels from 2,400 m Yunnan forests, soybeans stone-ground with Tiantai spring water, bamboo shoots from the cold springs of Wuling.', '云贵2400米高山林地的松茸与野生羊肚菌，天台山百年泉水磨制的黄豆醇膏，武陵源冷泉里的清爽山笋。') },
    { title: t('Seni memasak', 'Culinary art', '素艺新诠 · 传承'),
      body: t('Perjamuan teh para sastrawan Dinasti Song bertemu resep vegetarian istana: kaldu direbus pelan, dikukus dalam bambu, tanpa minyak berat.', 'The tea banquets of Song-dynasty scholars meet imperial vegetarian recipes: slow-simmered broth, bamboo-steamed, never heavy with oil.', '融合宋代文人茶席宴与宫廷素馔秘法，摒弃厚重油脂，辅以山泉缓煨、慢火萃汤、竹屉微蒸。') },
  ],
  chef: {
    image: '/images/koki-gu.webp',
    alt: t('Koki Gu', 'Chef Gu', '主厨顾师傅'),
    title: t('Koki Gu, 25 tahun dalam diam', 'Chef Gu, 25 quiet years', '主厨顾师傅 · 二十五载匠造'),
    body: t('Dari memilih jamur hingga menyeduh kaldu enam jam, setiap langkah dikerjakan tanpa tergesa. Teh bukan pendamping, melainkan bagian dari masakan.', 'From choosing mushrooms to six hours of simmering broth, every step is done unhurried. Tea is not a side note, but part of the cooking.', '从择菇到煨煮六小时的高汤，每一步都不疾不徐。茶不是配角，而是菜的一部分。'),
    button: t('Cicipi hasilnya', 'Taste the result', '品尝雅叙'),
  },
  promise: {
    image: '/images/sup-labu-emas-matsutake.webp',
    alt: t('Sup labu emas matsutake', 'Golden pumpkin matsutake soup', '金汤松茸猴头菇'),
    title: t('Janji kemurnian', 'Our purity promise', '纯净承诺'),
    body: t('Tanpa MSG, tanpa pewarna, tanpa lemak hewani. Hidangan yang mengandung telur atau bawang ditandai dengan jelas di menu.', 'No MSG, no colourings, no animal fat. Dishes containing egg or onion are clearly marked on the menu.', '零味精、零人工色素、零动物油脂。含蛋或含葱蒜的菜品均在菜单中清楚标注。'),
  },
};

export const contact = {
  title: t('Kunjungi kami', 'Visit us', '访客指南 · 临轩恭候'),
  lead: t('Datang langsung, hubungi kami, atau pesan lewat halaman Order.', 'Drop by, call us, or order through the Order page.', '欢迎光临，来电咨询，或通过点餐页面下单。'),
  address: t('Alamat', 'Address', '餐厅地址'),
  hours: t('Jam buka', 'Opening hours', '营业时段'),
  phone: t('Telepon', 'Phone', '咨询专线'),
  directions: t('Buka petunjuk arah', 'Get directions', '一键导航至爱心素食'),
  directionsHint: t('Google Maps · Amap · Apple Maps', 'Google Maps · Amap · Apple Maps', '高德地图 / 腾讯地图 / 苹果地图'),
};
