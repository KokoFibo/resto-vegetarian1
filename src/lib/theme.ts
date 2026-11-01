import type { Theme, ThemeColors } from '../data/types';

/**
 * Tema dari backend → variabel CSS. Warna SUDAH dihitung backend (lihat API-CONTRACT.md); di sini hanya
 * divalidasi ketat (cegah injeksi CSS) lalu dipetakan: --jade=primary, --sage=secondary, --vm=accent,
 * --bg=bg, --bg2=bg2, --ink=ink, --ink2=ink2, --line=line. Nilai tak valid → seluruh tema diabaikan (tampilan bawaan).
 */
const HEX = /^#[0-9a-fA-F]{6}$/;
const RGBA = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|1\.0|0?\.\d{1,3})\s*)?\)$/;
const KEYS: (keyof ThemeColors)[] = ['primary', 'secondary', 'accent', 'bg', 'bg2', 'ink', 'ink2', 'line'];

export function cleanTheme(raw: unknown): Theme | null {
  const r = raw as { id?: unknown; dark?: unknown; colors?: Record<string, unknown> } | null;
  if (!r || typeof r !== 'object' || !r.colors || typeof r.colors !== 'object') return null;
  const colors = {} as ThemeColors;
  for (const k of KEYS) {
    const v = r.colors[k];
    if (typeof v !== 'string' || !(HEX.test(v.trim()) || RGBA.test(v.trim()))) return null;
    colors[k] = v.trim();
  }
  if (![colors.primary, colors.accent, colors.bg].every(v => HEX.test(v))) return null;   // dasar perhitungan turunan
  return { id: typeof r.id === 'string' ? r.id.replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || 'custom' : 'custom', dark: r.dark === true, colors };
}

const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v * (1 - t) + y[i] * t)); };

/** CSS untuk <style> di <head>. '' = pakai CSS bawaan (tema kosong atau preset "giok" yang identik dengan bawaan). */
export function themeCss(t: Theme | null): string {
  if (!t || (t.id === 'giok' && !t.dark)) return '';
  const c = t.colors, [r, g, b] = rgb(c.bg), a = (x: number) => `rgba(${r},${g},${b},${x})`;
  const d = [
    `--jade:${c.primary}`, `--sage:${c.secondary}`, `--vm:${c.accent}`, `--bg:${c.bg}`, `--bg2:${c.bg2}`, `--ink:${c.ink}`, `--ink2:${c.ink2}`, `--line:${c.line}`,
    `--bg-a90:${a(0.9)}`, `--bg-a92:${a(0.92)}`, `--bg-a97:${a(0.97)}`,
    `--vm-dark:${mix(c.accent, '#000000', 0.14)}`, '--on-accent:#FFFFFF',   // backend menjamin putih di atas aksen berkontras ≥ 4,5:1
    `--cta-p:${mix(c.bg, c.primary, t.dark ? 0.1 : 0.25)}`,
    t.dark ? '--gold-ink:#E6C65A' : '', t.dark ? 'color-scheme:dark' : '',
  ].filter(Boolean).join(';');
  return `html:root{${d}}`;   // html:root > :root bawaan: menang walau CSS bawaan dimuat belakangan
}
