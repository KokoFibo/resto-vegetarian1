import { idr } from '../lib/format';

/** Formulir pesanan di halaman Order. Harga hanya untuk tampilan; total yang sah dihitung backend. */
const MAX_QTY = 20;

function init() {
  const form = document.querySelector<HTMLFormElement>('#orderForm');
  if (!form) return;
  const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const rows = [...form.querySelectorAll<HTMLElement>('.oi')];
  const lines = q('#lines'), total = q('#total'), err = q('#orderErr'), btn = q<HTMLButtonElement>('#orderBtn'), done = q('#orderDone');
  const errs: Record<string, string> = JSON.parse(form.dataset.errs || '{}');
  const qty = new Map<string, number>();

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
      a.textContent = `${n} × ${r.dataset.name}`; b.textContent = idr(n * price);
      li.append(a, b); lines.append(li);
    }
    if (!sum) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = form.dataset.empty || ''; lines.append(li); }
    total.textContent = idr(sum);
  };

  rows.forEach(r => r.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b || b.disabled) return;
    const id = r.dataset.id!;
    qty.set(id, Math.max(0, Math.min(MAX_QTY, (qty.get(id) || 0) + (b.dataset.d === '+' ? 1 : -1))));
    err.textContent = '';
    render();
  }));
  render();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.textContent = '';
    const items = [...qty].filter(([, n]) => n > 0).map(([id, n]) => ({ id, qty: n }));
    if (!items.length) { err.textContent = errs['E:empty']; return; }
    btn.disabled = true;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: form.dataset.token, lang: form.dataset.lang, items,
          name: form.querySelector<HTMLInputElement>('[name=name]')!.value,
          note: form.querySelector<HTMLInputElement>('[name=note]')!.value,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { err.textContent = errs[d.code] || errs['E:unavailable']; return; }
      q('#doneTitle').textContent = form.dataset.ok || '';
      q('#doneNo').textContent = '#' + d.order_no;
      q('#doneInfo').textContent = `${d.table_label} · ${idr(d.total_idr)}`;
      form.hidden = true; done.hidden = false;
      qty.clear(); render();
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch { err.textContent = errs['E:unavailable']; }
    finally { btn.disabled = false; }
  });

  document.querySelector('#again')?.addEventListener('click', () => {
    done.hidden = true; form.hidden = false;
    form.querySelector<HTMLInputElement>('[name=note]')!.value = '';
  });
}

document.addEventListener('astro:page-load', init);
