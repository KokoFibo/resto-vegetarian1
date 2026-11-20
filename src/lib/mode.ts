import type { Theme, ThemeColors } from '../data/types';

/**
 * Mode terang/gelap pilihan PENGUNJUNG. Tema restoran (dari backend) tetap menjadi mode bawaan; palet mode lawannya dihitung di sini dari
 * warna merek (primary, accent) dengan jaminan kontras WCAG AA: teks/ikon merek >= 4,5:1 terhadap latar dan latar-kedua, teks di atas aksen >= 4,5:1.
 * Tes: tools/mode.test.mjs (7 preset, tema gelap, dan 600 warna acak, kedua arah).
 */
export type Mode = 'light' | 'dark';
export type Palette = { primary: string; secondary: string; accent: string; bg: string; bg2: string; ink: string; ink2: string; line: string; onAccent: string; vmDark: string; ctaP: string; goldInk: string };

const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export const mix = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v * (1 - t) + y[i] * t)); };
const lum = (h: string) => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const rgba = (h: string, a: number) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Tampilan bawaan (giok klasik, terang) = nilai di base.css. */
export const DEFAULT_COLORS: ThemeColors = { primary: '#2B5B47', secondary: '#3D735B', accent: '#C35B3B', bg: '#FBF8F2', bg2: '#F4EEE2', ink: '#1E2621', ink2: '#404944', line: 'rgba(43,91,71,.12)' };

/** Geser warna `c` ke arah `toward` selangkah-selangkah sampai kontras >= min terhadap SEMUA latar. */
function fit(c: string, toward: string, bgs: string[], min: number): string {
  let x = c;
  for (let t = 0; t <= 1.0001; t += 0.04) { x = mix(c, toward, Math.min(1, t)); if (bgs.every(b => contrast(x, b) >= min)) return x; }
  return toward;
}

/** Palet mode lawan dari warna merek. dark=true: hasilkan palet GELAP; false: palet TERANG. */
export function derivePalette(primary: string, accent: string, dark: boolean): Palette {
  if (dark) {
    const bg = mix('#0D1210', primary, 0.14), bg2 = mix(bg, primary, 0.1), bgs = [bg, bg2], ink = '#F2EFE9';
    const p = fit(primary, '#FFFFFF', bgs, 4.5), a = fit(accent, '#FFFFFF', bgs, 4.5);
    return { primary: p, secondary: fit(mix(p, '#FFFFFF', 0.15), '#FFFFFF', bgs, 4.5), accent: a, bg, bg2, ink, ink2: '#C9C5BC', line: rgba(ink, 0.14),
      onAccent: contrast('#FFFFFF', a) >= contrast('#0D1210', a) ? '#FFFFFF' : '#0D1210', vmDark: mix(a, '#000000', 0.14), ctaP: mix(bg, p, 0.1), goldInk: '#E6C65A' };
  }
  const bg = mix('#FFFFFF', primary, 0.04), bg2 = mix(bg, primary, 0.06), bgs = [bg, bg2];
  const p = fit(primary, '#000000', bgs, 4.5), a = fit(accent, '#000000', bgs, 4.5);
  return { primary: p, secondary: fit(mix(p, '#FFFFFF', 0.15), '#000000', bgs, 4.5), accent: a, bg, bg2, ink: '#1E2621', ink2: '#404944', line: 'rgba(30,38,33,.12)',
    onAccent: contrast('#FFFFFF', a) >= contrast('#1E2621', a) ? '#FFFFFF' : '#1E2621', vmDark: mix(a, '#000000', 0.14), ctaP: mix(bg, p, 0.25), goldInk: '#735C00' };
}

const vars = (p: Palette, dark: boolean) => {
  const [r, g, b] = rgb(p.bg), a = (x: number) => `rgba(${r},${g},${b},${x})`;
  return [`--jade:${p.primary}`, `--sage:${p.secondary}`, `--vm:${p.accent}`, `--bg:${p.bg}`, `--bg2:${p.bg2}`, `--ink:${p.ink}`, `--ink2:${p.ink2}`, `--line:${p.line}`,
    `--bg-a90:${a(0.9)}`, `--bg-a92:${a(0.92)}`, `--bg-a97:${a(0.97)}`, `--vm-dark:${p.vmDark}`, `--on-accent:${p.onAccent}`, `--cta-p:${p.ctaP}`, `--gold-ink:${p.goldInk}`, `color-scheme:${dark ? 'dark' : 'light'}`].join(';');
};

/** Mode bawaan tema ini. */
export const baseMode = (t: Theme | null): Mode => (t?.dark ? 'dark' : 'light');

/**
 * CSS pilihan pengunjung: html[data-mode=...]:root menimpa tema dasar. Mode yang sama dengan tema restoran memakai warna restoran persis
 * (tampilan merek tidak berubah); mode lawan memakai palet turunan. Tanpa data-mode (belum memilih) = tema restoran.
 */
export function modeCss(t: Theme | null): string {
  const own = baseMode(t), c = t?.colors ?? DEFAULT_COLORS;
  const ownPal: Palette = {
    primary: c.primary, secondary: c.secondary, accent: c.accent, bg: c.bg, bg2: c.bg2, ink: c.ink, ink2: c.ink2, line: c.line,
    onAccent: t ? '#FFFFFF' : '#FBF8F2', vmDark: t ? mix(c.accent, '#000000', 0.14) : '#a84c30',
    ctaP: t ? mix(c.bg, c.primary, own === 'dark' ? 0.1 : 0.25) : '#9ed1b7', goldInk: own === 'dark' ? '#E6C65A' : '#735c00',
  };
  const other = derivePalette(c.primary, c.accent, own === 'light');
  const pal = (m: Mode) => (m === own ? ownPal : other);
  return (['light', 'dark'] as Mode[]).map(m => `html[data-mode="${m}"]:root{${vars(pal(m), m === 'dark')}}`).join('');
}
export const isHex = (h: string) => HEX.test(h);
