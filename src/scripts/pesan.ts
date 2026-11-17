import { rupiah } from '../lib/format';

/** Formulir pesanan online (/pesan). Harga hanya untuk tampilan; total akhir dihitung backend. */
const MAX_QTY = 20;

function clientId(): string {
  const KEY = 'resto_client';
  try {
    const v = localStorage.getItem(KEY);
    if (v && /^[0-9a-f]{32}$/.test(v)) return v;
    const id = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(KEY, id); return id;
  } catch { return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''); }
}

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } } }
let tsReady: Promise<void> | null = null;
const loadTurnstile = () => (tsReady ??= new Promise<void>(res => {
  if (window.turnstile) return res();
  const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true;
  s.onload = () => res(); s.onerror = () => res(); document.head.append(s);
}));

function init() {
  const form = document.querySelector<HTMLFormElement>('#pesanForm');
  if (!form) return;
  const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const rows = [...form.querySelectorAll<HTMLElement>('.oi')];
  const lines = q('#lines'), total = q('#total'), err = q('#orderErr'), btn = q<HTMLButtonElement>('#orderBtn');
  const errs: Record<string, string> = JSON.parse(form.dataset.errs || '{}');
  const qty = new Map<string, number>();
  const client = clientId();
  const val = (n: string) => form.querySelector<HTMLInputElement>(`[name=${n}]`)!.value;
  const radio = (n: string) => form.querySelector<HTMLInputElement>(`[name=${n}]:checked`)?.value || '';

  // Turnstile (hanya bila TURNSTILE_SITEKEY diisi di server)
  let captchaToken = '', widget: string | undefined;
  const sitekey = form.dataset.sitekey || '', box = document.querySelector<HTMLElement>('#captcha');
  if (sitekey && box) loadTurnstile().then(() => { if (window.turnstile) widget = window.turnstile.render(box, { sitekey, callback: (t: string) => { captchaToken = t; }, 'expired-callback': () => { captchaToken = ''; }, 'error-callback': () => { captchaToken = ''; } }); });

  const render = () => {
    let sum = 0;
    lines.replaceChildren();
    for (const r of rows) {
      const n = qty.get(r.dataset.id!) || 0, price = Number(r.dataset.price);
      r.querySelector('output')!.textContent = String(n);
      r.classList.toggle('on', n > 0);
      if (!n) continue;
      sum += n * price;
      const li = document.createElement('li'); li.className = 'row';
      const a = document.createElement('span'), b = document.createElement('span');
      a.textContent = `${n} × ${r.dataset.name}`; b.textContent = rupiah(n * price);
      li.append(a, b); lines.append(li);
    }
    if (!sum) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = form.dataset.empty || ''; lines.append(li); }
    total.textContent = rupiah(sum);
  };
  rows.forEach(r => r.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b || b.disabled) return;
    const id = r.dataset.id!;
    qty.set(id, Math.max(0, Math.min(MAX_QTY, (qty.get(id) || 0) + (b.dataset.d === '+' ? 1 : -1))));
    err.textContent = ''; render();
  }));
  render();

  form.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    const items = [...qty].filter(([, n]) => n > 0).map(([id, n]) => ({ id, qty: n }));
    if (!items.length) { err.textContent = errs['E:empty']; return; }
    if (!val('name').trim()) { err.textContent = errs['E:name_required']; return; }
    if (!val('phone').trim()) { err.textContent = errs['E:phone_invalid']; return; }
    btn.disabled = true;
    try {
      const res = await fetch('/api/pesan', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lang: form.dataset.lang, items, client, name: val('name'), phone: val('phone'), note: val('note'), pickup_by: radio('pickup_by'), pay_plan: radio('pay_plan'), captcha: captchaToken }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { err.textContent = errs[d.code] || errs['E:unavailable']; if (widget && window.turnstile) { window.turnstile.reset(widget); captchaToken = ''; } return; }
      try { sessionStorage.setItem('resto_last_order', d.token); } catch { /* abaikan */ }
      // halaman status = rumah pesanan ini (bisa dibuka ulang dari tautan); bahasa mengikuti halaman pesan
      const secondary = location.pathname.match(/^\/([a-z]{2})\//)?.[1];
      location.assign((secondary ? `/${secondary}` : '') + '/pesanan/' + d.token);
    } catch { err.textContent = errs['E:unavailable']; }
    finally { btn.disabled = false; }
  });
}

document.addEventListener('astro:page-load', init);
