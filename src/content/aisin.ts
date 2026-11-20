import type { Txt } from '../i18n';

/**
 * Teks halaman Beranda, Filosofi, dan Kontak untuk Aisin.
 * Dipisah dari tampilan supaya nanti mudah diganti per restoran (lihat content/index.ts).
 * `image` = kunci R2 gambar bawaan (restaurant/defaults/aisin/…); alamat akhirnya dibuat lib/media.ts.
 */
const t = (id: string, en: string, zh: string, zt?: string): Txt => ({ id, en, zh, ...(zt ? { zt } : {}) });

export const home = {
  eyebrow: t('爱心 · Aisin Vegetarian', '爱心 · Aisin Vegetarian', '爱心 素食', '愛心 素食'),
  title: t('Kembali ke kemurnian,', 'Back to purity,', '回归本真，', '迴歸本真，'),
  titleEm: t('nikmati keindahan hidangan nabati', 'savour the beauty of plant-based dining', '品味天地素食之美', '品味天地素食之美'),
  lead: t(
    'Dengan welas asih dan warisan teh Zen Jingshan: tahu garam-cair buatan tangan, jamur gunung Yunnan, dan sayur musiman yang dipetik saat embun.',
    'With compassion and the Zen tea heritage of Jingshan: handmade brine tofu, Yunnan mountain mushrooms and seasonal greens picked at dawn.',
    '以慈悲为念，承径山禅茶风韵。严选云贵高山净植、天台古法手作盐卤豆腐与四时晨露时蔬。', '以慈悲為念，承徑山禪茶風韻。嚴選雲貴高山淨植、天台古法手作鹽滷豆腐與四時晨露時蔬。'),
  chips: [
    { text: t('100% vegetarian', '100% vegetarian', '100% 素食', '100% 素食'), gold: false },
    { text: t('Bahan gunung pilihan', 'Select mountain ingredients', '高山林泉有机溯源', '高山林泉有機溯源'), gold: false },
    { text: t('Pu-erh pohon tua', 'Old-tree pu-erh', '古树普洱 · 禅茶佐宴', '古樹普洱 · 禪茶佐宴'), gold: true },
  ],
  hero: {
    image: 'restaurant/defaults/aisin/jamur-gunung.webp',
    alt: t('Kuali jamur gunung', 'Mountain mushroom pot', '山珍菌菇煲', '山珍菌菇煲'),
    stamp: '禅素合一',
    kicker: t('Hidangan andalan', 'Signature dish', '招牌菜', '招牌菜'),
    dish: t('Kuali jamur gunung', 'Mountain mushroom pot', '山珍菌菇煲', '山珍菌菇煲'),
    price: 508000,
  },
  stats: [
    { value: '2.400 m', label: t('Zona matsutake liar Shangri-La', 'Wild matsutake zone of Shangri-La', '香格里拉野生松茸产区', '香格里拉野生松茸產區') },
    { value: '100%', label: t('Bahan nabati alami', 'Natural plant-based ingredients', '纯天然植物原料', '純天然植物原料') },
    { value: '0', label: t('MSG, pewarna, dan lemak hewani', 'MSG, colourings and animal fat', '零味精 · 零色素 · 零动物油脂', '零味精 · 零色素 · 零動物油脂') },
    { value: '24', label: t('Menu berganti tiap musim', 'Menu changes with every season', '节气更迭私房菜牌', '節氣更迭私房菜牌') },
  ],
  featured: t('Hidangan pilihan', 'Featured dishes', '经典名席', '經典名席'),
  categories: t('Kategori menu', 'Menu categories', '菜单分类', '選單分類'),
  cta: {
    title: t('Pesan langsung dari meja Anda', 'Order right from your table', '在座位上扫码点餐', '在座位上掃碼點餐'),
    body: t('Scan QR code di meja, pilih hidangan, lalu kirim pesanan. Kami siapkan dengan hati.', 'Scan the QR code on your table, choose your dishes and send your order. We prepare it with care.', '扫描餐桌二维码，选择菜品并提交订单，我们用心为您备餐。', '掃描餐桌二維碼，選擇菜品並提交訂單，我們用心為您備餐。'),
    button: t('Mulai pesan', 'Start ordering', '开始点餐', '開始點餐'),
  },
};

export const philosophy = {
  title: t('Murni karena hormat, rasa karena alam', 'Pure out of respect, flavour from nature', '以爱为心 · 以素养真', '以愛為心 · 以素養真'),
  lead: t(
    'Bukan meniru daging, tetapi mengembalikan rasa asli bahan: air mata air, jamur hutan, dan kedelai gunung dengan api yang tenang.',
    'Not imitating meat, but restoring the true taste of ingredients: spring water, forest mushrooms and mountain soybeans over a calm flame.',
    '不以仿荤博眼，独以至味动心。取清泉、采灵蕈、研山豆，在静穆火候中重遇食物原本的高洁与温润。', '不以仿葷博眼，獨以至味動心。取清泉、採靈蕈、研山豆，在靜穆火候中重遇食物原本的高潔與溫潤。'),
  pillars: [
    { title: t('Kasih sayang', 'Compassion', '爱心慈食 · 心安意净', '愛心慈食 · 心安意淨'),
      body: t('Kami berdiri di atas rasa hormat pada semua makhluk hidup. Setiap piring murni vegetarian, agar tubuh dan batin terasa dibasuh.', 'We stand on respect for all living beings. Every plate is purely vegetarian, so that body and mind feel cleansed.', '「爱心」立馆本愿，始于爱敬有情众生。每一盘料理均严守素食底线，让每一次举箸皆是对身心的沐洗。', '「愛心」立館本願，始於愛敬有情眾生。每一盤料理均嚴守素食底線，讓每一次舉箸皆是對身心的沐洗。') },
    { title: t('Asal gunung', 'From the mountains', '自然之味 · 寻踪深山', '自然之味 · 尋蹤深山'),
      body: t('Matsutake dan morel liar dari hutan Yunnan 2.400 m, kedelai digiling dengan air mata air Tiantai, rebung dari mata air dingin Wuling.', 'Wild matsutake and morels from 2,400 m Yunnan forests, soybeans stone-ground with Tiantai spring water, bamboo shoots from the cold springs of Wuling.', '云贵2400米高山林地的松茸与野生羊肚菌，天台山百年泉水磨制的黄豆醇膏，武陵源冷泉里的清爽山笋。', '雲貴2400米高山林地的松茸與野生羊肚菌，天台山百年泉水磨製的黃豆醇膏，武陵源冷泉裡的清爽山筍。') },
    { title: t('Seni memasak', 'Culinary art', '素艺新诠 · 传承', '素藝新詮 · 傳承'),
      body: t('Perjamuan teh para sastrawan Dinasti Song bertemu resep vegetarian istana: kaldu direbus pelan, dikukus dalam bambu, tanpa minyak berat.', 'The tea banquets of Song-dynasty scholars meet imperial vegetarian recipes: slow-simmered broth, bamboo-steamed, never heavy with oil.', '融合宋代文人茶席宴与宫廷素馔秘法，摒弃厚重油脂，辅以山泉缓煨、慢火萃汤、竹屉微蒸。', '融合宋代文人茶席宴與宮廷素饌秘法，摒棄厚重油脂，輔以山泉緩煨、慢火萃湯、竹屜微蒸。') },
  ],
  chef: {
    image: 'restaurant/defaults/aisin/koki-gu.webp',
    alt: t('Koki Gu', 'Chef Gu', '主厨顾师傅', '主廚顧師傅'),
    title: t('Koki Gu, 25 tahun dalam diam', 'Chef Gu, 25 quiet years', '主厨顾师傅 · 二十五载匠造', '主廚顧師傅 · 二十五載匠造'),
    body: t('Dari memilih jamur hingga menyeduh kaldu enam jam, setiap langkah dikerjakan tanpa tergesa. Teh bukan pendamping, melainkan bagian dari masakan.', 'From choosing mushrooms to six hours of simmering broth, every step is done unhurried. Tea is not a side note, but part of the cooking.', '从择菇到煨煮六小时的高汤，每一步都不疾不徐。茶不是配角，而是菜的一部分。', '從擇菇到煨煮六小時的高湯，每一步都不疾不徐。茶不是配角，而是菜的一部分。'),
    button: t('Cicipi hasilnya', 'Taste the result', '品尝雅叙', '品嚐雅敘'),
  },
  promise: {
    image: 'restaurant/defaults/aisin/sup-labu-emas-matsutake.webp',
    alt: t('Sup labu emas matsutake', 'Golden pumpkin matsutake soup', '金汤松茸猴头菇', '金湯松茸猴頭菇'),
    title: t('Janji kemurnian', 'Our purity promise', '纯净承诺', '純淨承諾'),
    body: t('Tanpa MSG, tanpa pewarna, tanpa lemak hewani. Hidangan yang mengandung telur atau bawang ditandai dengan jelas di menu.', 'No MSG, no colourings, no animal fat. Dishes containing egg or onion are clearly marked on the menu.', '零味精、零人工色素、零动物油脂。含蛋或含葱蒜的菜品均在菜单中清楚标注。', '零味精、零人工色素、零動物油脂。含蛋或含蔥蒜的菜品均在選單中清楚標註。'),
  },
};

export const contact = {
  title: t('Kunjungi kami', 'Visit us', '访客指南 · 临轩恭候', '訪客指南 · 臨軒恭候'),
  lead: t('Datang langsung, hubungi kami, atau pesan lewat halaman Order.', 'Drop by, call us, or order through the Order page.', '欢迎光临，来电咨询，或通过点餐页面下单。', '歡迎光臨，來電諮詢，或透過點餐頁面下單。'),
  address: t('Alamat', 'Address', '餐厅地址', '餐廳地址'),
  hours: t('Jam buka', 'Opening hours', '营业时段', '營業時段'),
  phone: t('Telepon', 'Phone', '咨询专线', '諮詢專線'),
  directions: t('Buka petunjuk arah', 'Get directions', '一键导航至爱心素食', '一鍵導航至愛心素食'),
  directionsHint: t('Google Maps · Amap · Apple Maps', 'Google Maps · Amap · Apple Maps', '高德地图 / 腾讯地图 / 苹果地图', '高德地圖 / 騰訊地圖 / 蘋果地圖'),
};
