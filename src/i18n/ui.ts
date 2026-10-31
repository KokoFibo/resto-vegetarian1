import type { Txt } from './index';

/** Teks antarmuka yang dipakai berulang (navigasi, tombol, label, pesan galat). Teks halaman ada di content/. */
const t = (id: string, en: string, zh: string): Txt => ({ id, en, zh });

export const ui = {
  nav: {
    home: t('Beranda', 'Home', '首页'),
    menu: t('Menu', 'Menu', '时令美馔'),
    philosophy: t('Filosofi', 'Philosophy', '素心之道'),
    order: t('Order', 'Order', '点餐'),
    contact: t('Kontak', 'Contact', '访客指南'),
  },
  orderNow: t('Pesan sekarang', 'Order now', '立即点餐'),
  viewMenu: t('Lihat menu', 'View menu', '阅览菜单'),
  dishes: t('hidangan', 'dishes', '道'),
  menuLabel: t('Menu', 'Menu', '菜单'),
  skip: t('Lewati ke isi', 'Skip to content', '跳到正文'),
  hours: {
    title: t('Jam buka', 'Opening hours', '堂食席候'),
    lunch: t('Makan siang', 'Lunch', '午膳'),
    tea: t('Teh sore', 'Afternoon tea', '禅茶'),
    dinner: t('Makan malam', 'Dinner', '晚宴'),
  },
  footer: {
    contact: t('Kontak', 'Contact', '联系我们'),
    tel: t('Telp', 'Tel', '电话'),
  },
  tags: {
    egg: t('Mengandung telur', 'Contains egg', '含蛋'),
    onion: t('Mengandung bawang', 'Contains onion', '含葱蒜'),
    nonHalal: t('Non halal', 'Non-halal', '非清真'),
    spicy: t('Pedas', 'Spicy', '辣'),
    soldOut: t('Habis', 'Sold out', '售罄'),
  },
  menuIntro: {
    vegan: t('Semua hidangan vegan. Hidangan yang mengandung bawang atau pedas diberi tanda khusus.', 'All dishes are vegan. Dishes containing onion or spice are specially marked.', '全单纯素。含葱蒜或辛辣的菜品均已特别标注。'),
    vegetarian: t('Semua hidangan vegetarian. Hidangan yang mengandung telur, bawang, atau pedas diberi tanda khusus.', 'All dishes are vegetarian. Dishes containing egg, onion or spice are specially marked.', '全单素食。含蛋、含葱蒜或辛辣的菜品均已特别标注。'),
    umum: t('Hidangan non halal dan pedas diberi tanda khusus.', 'Non-halal and spicy dishes are specially marked.', '非清真与辛辣菜品均已特别标注。'),
  },
  order: {
    title: t('Pesan makanan', 'Order food', '在线点餐'),
    table: t('Meja', 'Table', '桌号'),
    payAtCashier: t('Pembayaran dilakukan di kasir.', 'Payment is made at the cashier.', '请在收银台付款。'),
    scanHint: t('Pemesanan dilakukan lewat QR code di meja Anda.', 'Ordering is done through the QR code on your table.', '请扫描餐桌上的二维码点餐。'),
    scanTitle: t('Scan QR code di meja Anda', 'Scan the QR code on your table', '请扫描餐桌上的二维码'),
    scanBody: t('Untuk memesan, silakan scan QR code yang ada di meja, lalu pilih hidangan Anda di halaman ini.', 'To order, please scan the QR code on your table, then choose your dishes on this page.', '点餐请扫描餐桌上的二维码，然后在此页面选择菜品。'),
    yourOrder: t('Pesanan Anda', 'Your order', '您的订单'),
    total: t('Total', 'Total', '合计'),
    name: t('Nama (opsional)', 'Name (optional)', '姓名（选填）'),
    note: t('Catatan (opsional)', 'Notes (optional)', '备注（选填）'),
    send: t('Kirim pesanan', 'Send order', '提交订单'),
    nothing: t('Belum ada hidangan dipilih.', 'No dishes selected yet.', '尚未选择菜品。'),
    received: t('Pesanan diterima. Terima kasih!', 'Order received. Thank you!', '订单已收到，谢谢！'),
    number: t('Nomor pesanan', 'Order number', '订单号'),
    waitAtTable: t('Silakan menunggu di meja Anda. Pembayaran dilakukan di kasir.', 'Please wait at your table. Payment is made at the cashier.', '请在座位等候，付款请至收银台。'),
    again: t('Pesan lagi', 'Order again', '再点一单'),
  },
  /** Pesan galat dari backend, berdasarkan kode. */
  errors: {
    'E:invalid_table': t('QR code tidak valid atau meja tidak aktif. Silakan hubungi staf.', 'This QR code is invalid or the table is inactive. Please ask our staff.', '二维码无效或餐桌已停用，请联系服务员。'),
    'E:rate_limited': t('Pesanan sebelumnya baru saja dikirim. Tunggu sebentar sebelum memesan lagi.', 'Your previous order was just sent. Please wait a moment before ordering again.', '上一单刚刚提交，请稍候再试。'),
    'E:too_many_active': t('Terlalu banyak pesanan yang sedang diproses di meja ini. Silakan hubungi staf.', 'Too many orders are in progress at this table. Please ask our staff.', '本桌进行中的订单过多，请联系服务员。'),
    'E:item_unavailable': t('Ada hidangan yang tidak tersedia lagi. Muat ulang halaman lalu pilih kembali.', 'Some dishes are no longer available. Reload the page and choose again.', '部分菜品已无法供应，请刷新页面后重新选择。'),
    'E:empty': t('Pilih minimal satu hidangan.', 'Please choose at least one dish.', '请至少选择一道菜。'),
    'E:unavailable': t('Pemesanan belum tersedia saat ini.', 'Ordering is not available right now.', '暂时无法下单。'),
  },
  notFound: {
    title: t('Halaman tidak ditemukan', 'Page not found', '页面不存在'),
    body: t('Alamat yang Anda buka tidak ada. Mulai dari beranda atau lihat menu kami.', 'This address does not exist. Start from the home page or browse our menu.', '您访问的页面不存在。请返回首页或查看菜单。'),
    home: t('Ke beranda', 'Go to home', '返回首页'),
  },
  unavailable: { id: 'Layanan sementara tidak tersedia.', en: 'Service temporarily unavailable.', zh: '服务暂时不可用。' } as Txt,
  suspended: { id: 'Layanan website ini sedang dinonaktifkan.', en: 'This website is currently disabled.', zh: '本网站服务暂停。' } as Txt,
  siteMissing: { id: 'Website tidak ditemukan.', en: 'Website not found.', zh: '未找到该网站。' } as Txt,
};
