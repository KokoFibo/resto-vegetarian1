import { rupiah } from '../lib/format';

/** Halaman status pesanan online (/pesanan/<token>): memuat status, diperbarui otomatis, dan tombol "Saya sudah bayar" (jalur QRIS). */
type I18n = {
  status: Record<string, string>; errs: Record<string, string>;
  number: string; for: string; pickupBy: string; byCustomer: string; byCourier: string; items: string; subtotal: string; service: string; tax: string; toPay: string; pending: string;
  payAtPickup: string; qrisTitle: string; qrisBody: string; iPaid: string; claimed: string; paidOk: string; refund: string; reason: string; notFound: string; wa: string; pickupInfo: string;
};
const FINAL = new Set(['done', 'cancelled', 'rejected', 'expired']);
let timer: ReturnType<typeof setInterval> | undefined;

function init() {
  clearInterval(timer);
  const found = document.querySelector<HTMLElement>('#statusBox');
  if (!found) return;
  const box: HTMLElement = found;
  const T: I18n = JSON.parse(box.dataset.i18n || '{}'), token = box.dataset.token || '', qris = box.dataset.qris || '', pickup = box.dataset.pickup || '';
  let claimed = false, claimMsg = '', busy = false, last = '';

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const row = (a: string, b: string, cls = 'row') => { const r = el('div', cls); r.append(el('span', '', a), el('b', '', b)); return r; };

  function draw(d: any) {
    const st: string = d.status, fin = FINAL.has(st), nodes: HTMLElement[] = [];
    nodes.push(el('p', 'muted', T.number), el('p', 'price huge', '#' + d.order_no));
    const head = el('h3', 'st-' + st, T.status[st] || st); head.setAttribute('role', 'status'); nodes.push(head);
    if (st === 'pending') nodes.push(el('p', 'muted', T.pending));
    if (st === 'rejected' && d.reject_reason) nodes.push(el('p', '', `${T.reason}: ${d.reject_reason}`));
    if ((st === 'rejected' || st === 'cancelled' || st === 'expired') && (d.pay_plan === 'prepay_qris' && (d.paid || d.pay_claimed))) nodes.push(el('p', 'err', T.refund));

    // jalur B: QRIS + "Saya sudah bayar" selama menunggu konfirmasi
    if (d.pay_plan === 'prepay_qris' && st === 'pending' && !d.paid) {
      const q = el('div', 'qrisbox'); q.append(el('h4', '', T.qrisTitle), el('p', '', T.qrisBody));
      if (qris) { const img = new Image(); img.src = qris; img.alt = 'QRIS'; img.className = 'qrisimg'; q.append(img); }
      q.append(el('p', 'price huge', rupiah(d.figures.total)));
      if (d.pay_claimed || claimed) q.append(el('p', 'jade', claimMsg || T.claimed));
      else { const b = el('button', 'btn vm', T.iPaid); b.type = 'button'; b.addEventListener('click', claim); q.append(b); }
      nodes.push(q);
    }
    if (d.paid) nodes.push(el('p', 'jade', T.paidOk));
    else if (d.pay_plan === 'at_pickup' && !fin) nodes.push(el('p', '', T.payAtPickup));
    if (!fin && pickup) { const p = el('div', 'pickbox'); p.append(el('b', '', T.pickupInfo), el('p', '', pickup)); nodes.push(p); }
    if (!fin) nodes.push(el('p', 'muted small', T.wa));

    const info = el('div', 'stinfo');
    if (d.name) info.append(row(T.for, d.name));
    info.append(row(T.pickupBy, d.pickup_by === 'courier' ? T.byCourier : T.byCustomer));
    nodes.push(info);
    const ul = el('ul', 'stlines'); for (const i of d.items || []) { const li = el('li', 'row'); li.append(el('span', '', `${i.qty} × ${i.name}`), el('span', '', rupiah(i.line_total))); ul.append(li); }
    nodes.push(el('b', '', T.items), ul);
    const f = d.figures || {};
    const sum = el('div', 'stsum'); sum.append(row(T.subtotal, rupiah(f.subtotal)));
    if (Number(f.service) > 0) sum.append(row(T.service, rupiah(f.service))); if (Number(f.tax) > 0) sum.append(row(T.tax, rupiah(f.tax)));
    sum.append(row(T.toPay, rupiah(f.total), 'row total')); nodes.push(sum);
    box.replaceChildren(...nodes);
  }

  async function claim() {
    try {
      const res = await fetch('/api/pesanan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
      const d = await res.json().catch(() => ({}));
      claimMsg = res.ok ? T.claimed : (T.errs[d.code] || T.errs['E:unavailable']); claimed = res.ok; last = ''; load();
    } catch { claimMsg = T.errs['E:unavailable']; last = ''; load(); }
  }
  async function load() {
    if (busy || document.visibilityState !== 'visible') return; busy = true;
    try {
      const res = await fetch('/api/pesanan?token=' + encodeURIComponent(token), { headers: { accept: 'application/json' } });
      const d = await res.json().catch(() => ({}));
      if (res.status === 404 || d.code === 'E:invalid_order') { clearInterval(timer); box.replaceChildren(el('p', 'err', T.notFound)); return; }
      if (!res.ok) { return; }                      // gangguan sementara: tampilan terakhir dipertahankan
      const key = JSON.stringify(d) + claimed; if (key !== last) { last = key; draw(d); }
      if (FINAL.has(d.status)) clearInterval(timer);
    } catch { /* abaikan; coba lagi pada putaran berikut */ } finally { busy = false; }
  }
  load(); timer = setInterval(load, 8000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && load());
}

document.addEventListener('astro:page-load', init);
