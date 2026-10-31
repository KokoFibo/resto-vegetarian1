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

/** Di layar sentuh, kartu menu dengan detail dibuka/ditutup dengan ketukan. */
function setupDetails() {
  $$('.card.hasd').forEach(c => c.addEventListener('click', () => c.classList.toggle('open')));
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

const onScroll = () => $('#site-header')?.classList.toggle('sm', scrollY > 40);

document.addEventListener('astro:after-swap', () => document.documentElement.classList.add('js'));
document.addEventListener('astro:page-load', () => { setupReveal(); setupNav(); setupDetails(); setupTable(); onScroll(); });
addEventListener('scroll', onScroll, { passive: true });
