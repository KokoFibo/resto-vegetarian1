/** Perilaku antarmuka umum. Dijalankan ulang tiap perpindahan halaman (astro:page-load). */
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

let reveal: IntersectionObserver | undefined;

function setupReveal() {
  reveal?.disconnect();
  reveal = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    reveal!.unobserve(e.target);
  }), { threshold: 0.12 });
  $$('.rv').forEach(el => reveal!.observe(el));
}

function setupNav() {
  const nav = $('#nav'), burger = $('#burger');
  if (!nav || !burger) return;
  const set = (open: boolean) => { nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); };
  burger.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if ((e.target as HTMLElement).closest('a')) set(false); });
}

/**
 * Kartu menu dengan detail: ketukan MANA SAJA membuka/menutup. Saat terbuka, ketukan di mana pun (di dalam deskripsi, di kartu, atau di luar)
 * menutupnya; mengetuk kartu lain menutup yang lama dan membuka yang baru. Satu pendengar di dokumen (tidak ikut ter-render ulang).
 * Hover hanya berlaku di perangkat dengan kursor (CSS), jadi di layar sentuh tidak ada hover yang "menempel".
 */
let detailsBound = false;
function setupDetails() {
  if (detailsBound) return; detailsBound = true;
  const closeAll = (except?: Element | null) => $$('.card.hasd.open').forEach(c => { if (c !== except) c.classList.remove('open'); });
  document.addEventListener('click', e => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.card.hasd');
    closeAll(card);
    if (card) { card.classList.toggle('open'); if (!card.classList.contains('open')) card.blur(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAll(); return; }
    const el = e.target as HTMLElement;
    if ((e.key === 'Enter' || e.key === ' ') && el?.classList?.contains('hasd')) { e.preventDefault(); closeAll(el); el.classList.toggle('open'); }
  });
}

/** Mode terang/gelap pengunjung: dipilih lewat tombol di header, diingat di perangkat (localStorage), diterapkan ke <html data-mode>. */
const MODE_KEY = 'resto_mode';
const readMode = (): 'light' | 'dark' | null => { try { const m = localStorage.getItem(MODE_KEY); return m === 'light' || m === 'dark' ? m : null; } catch { return null; } };
function effectiveMode(): 'light' | 'dark' { return (document.documentElement.dataset.mode as 'light' | 'dark' | undefined) ?? (document.documentElement.dataset.base === 'dark' ? 'dark' : 'light'); }
function syncModeBtn() {
  const b = document.querySelector<HTMLButtonElement>('#modeBtn'); if (!b) return;
  const dark = effectiveMode() === 'dark', label = dark ? b.dataset.lLight! : b.dataset.lDark!;   // label = tujuan klik
  b.setAttribute('aria-pressed', String(dark)); b.setAttribute('aria-label', label); b.title = label;
}
let modeBound = false;
function setupMode() {
  const m = readMode(); if (m) document.documentElement.dataset.mode = m; else delete document.documentElement.dataset.mode;
  syncModeBtn();
  if (modeBound) return; modeBound = true;
  document.addEventListener('click', e => {
    if (!(e.target as HTMLElement).closest('#modeBtn')) return;
    const next = effectiveMode() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.mode = next; try { localStorage.setItem(MODE_KEY, next); } catch { /* penyimpanan dinonaktifkan */ }
    syncModeBtn();
  });
  document.addEventListener('astro:after-swap', () => { const v = readMode(); if (v) document.documentElement.dataset.mode = v; else delete document.documentElement.dataset.mode; });
}

/**
 * Token meja dari QR disimpan sementara supaya menu "Order" (dan pilihan bahasa di halaman Order)
 * tetap membawa meja saat pengunjung berpindah halaman.
 */
function setupTable() {
  try {
    const fromUrl = new URLSearchParams(location.search).get('meja');
    if (fromUrl && /^[0-9a-f]{32}$/.test(fromUrl)) sessionStorage.setItem('meja', fromUrl);
    const saved = sessionStorage.getItem('meja');
    if (!saved) return;
    $$<HTMLAnchorElement>('a[data-meja]').forEach(a => {
      const u = new URL(a.href, location.origin);
      if (!u.searchParams.has('meja')) { u.searchParams.set('meja', saved); a.href = u.pathname + u.search; }
    });
  } catch { /* sessionStorage tidak tersedia */ }
}

/** Banner: tombol × menutup dan mengingatnya di perangkat ini (kunci berisi rev, jadi banner yang diubah muncul lagi). */
function setupBanners() {
  $$('.bn .bn-x').forEach(btn => btn.addEventListener('click', () => {
    const bn = btn.closest<HTMLElement>('.bn');
    if (!bn) return;
    try { localStorage.setItem('bn:' + bn.dataset.bn, '1'); } catch { /* penyimpanan tidak tersedia */ }
    bn.hidden = true;
    if (!$$('.bn').some(el => !el.hidden)) document.body.classList.remove('has-bn');
  }));
}

const onScroll = () => $('#site-header')?.classList.toggle('sm', scrollY > 40);

document.addEventListener('astro:after-swap', () => document.documentElement.classList.add('js'));
document.addEventListener('astro:page-load', () => { setupReveal(); setupNav(); setupDetails(); setupMode(); setupTable(); setupBanners(); onScroll(); });
addEventListener('scroll', onScroll, { passive: true });
