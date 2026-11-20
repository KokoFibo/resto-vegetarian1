// Uji palet mode terang/gelap pengunjung (src/lib/mode.ts): jaminan kontras WCAG AA di kedua arah untuk preset, tema gelap, dan warna acak.
import { build } from 'esbuild';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
let pass = 0, fail = 0; const ok = (n, c, x = '') => { c ? pass++ : fail++; if (!c) console.log('  ✘', n, x); };
const dir = mkdtempSync(join(tmpdir(), 'mode-')), out = join(dir, 'mode.mjs');
writeFileSync(out, (await build({ entryPoints: ['src/lib/mode.ts'], bundle: true, format: 'esm', write: false, target: 'es2022' })).outputFiles[0].text);
const { derivePalette, modeCss, contrast, baseMode, DEFAULT_COLORS } = await import(pathToFileURL(out).href);

function check(name, p, a, dark) {
  const q = derivePalette(p, a, dark), bgs = [q.bg, q.bg2];
  const min = (c, o = bgs) => Math.min(...o.map(b => contrast(c, b)));
  ok(`${name} → ${dark ? 'gelap' : 'terang'}: teks merek (primary) ≥ 4,5 (${min(q.primary).toFixed(2)})`, min(q.primary) >= 4.5, `${p}→${q.primary}`);
  ok(`${name} → ${dark ? 'gelap' : 'terang'}: secondary ≥ 4,5`, min(q.secondary) >= 4.5, `${p}→${q.secondary}`);
  ok(`${name} → ${dark ? 'gelap' : 'terang'}: aksen ≥ 4,5`, min(q.accent) >= 4.5, `${a}→${q.accent} ${min(q.accent).toFixed(2)}`);
  ok(`${name} → ${dark ? 'gelap' : 'terang'}: teks di atas aksen ≥ 4,5`, contrast(q.onAccent, q.accent) >= 4.5, `${q.onAccent} on ${q.accent} = ${contrast(q.onAccent, q.accent).toFixed(2)}`);
  ok(`${name} → ${dark ? 'gelap' : 'terang'}: teks utama ≥ 7`, min(q.ink) >= 7, String(min(q.ink)));
  ok(`${name} → ${dark ? 'gelap' : 'terang'}: teks kedua ≥ 4,5`, min(q.ink2) >= 4.5, String(min(q.ink2)));
  ok(`${name}: latar benar-benar ${dark ? 'gelap' : 'terang'}`, dark ? contrast(q.bg, '#000000') < 3 : contrast(q.bg, '#FFFFFF') < 1.2, q.bg);
}
const PRESETS = { teh: ['#7A4A21', '#A8402A'], samudra: ['#1F4E6B', '#B45F14'], bata: ['#8E2A2A', '#8A6414'], anggur: ['#5B3A66', '#A5561B'], zaitun: ['#4F5D2F', '#B0532E'], arang: ['#2E3A3F', '#C4481F'], giok: ['#2B5B47', '#C35B3B'], custom: ['#6B2D5C', '#B4531A'], bawaan: [DEFAULT_COLORS.primary, DEFAULT_COLORS.accent] };
for (const [n, [p, a]] of Object.entries(PRESETS)) check(n, p, a, true);                 // tema terang → pengunjung memilih gelap
check('tema gelap (emas)', '#E8D9A8', '#B45F14', false);                                // tema gelap → pengunjung memilih terang
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const rc = () => '#' + [0, 0, 0].map(() => Math.floor(rnd() * 256).toString(16).padStart(2, '0')).join('').toUpperCase();
for (let i = 0; i < 300; i++) { const p = rc(), a = rc(); check('acak' + i, p, a, true); check('acak' + i, p, a, false); }

// CSS yang dihasilkan
const light = { id: 'giok', dark: false, colors: { primary: '#2B5B47', secondary: '#3D735B', accent: '#C35B3B', bg: '#FBF8F2', bg2: '#F4EEE2', ink: '#1E2621', ink2: '#404944', line: 'rgba(43,91,71,.12)' } };
const css = modeCss(light);
ok('CSS memuat dua blok mode', css.includes('html[data-mode="light"]:root{') && css.includes('html[data-mode="dark"]:root{'));
ok('mode = tema restoran: warna restoran persis (tampilan merek tidak berubah)', css.match(/html\[data-mode="light"\]:root\{([^}]*)\}/)[1].includes('--jade:#2B5B47') && css.match(/html\[data-mode="light"\]:root\{([^}]*)\}/)[1].includes('--bg:#FBF8F2'));
ok('mode lawan: latar gelap + color-scheme:dark', /html\[data-mode="dark"\]:root\{[^}]*color-scheme:dark/.test(css) && !/--bg:#FBF8F2[^}]*\}html\[data-mode="dark"\]/.test('x'));
const dflt = modeCss(null);
ok('tanpa tema (bawaan): blok terang = nilai base.css persis', dflt.match(/html\[data-mode="light"\]:root\{([^}]*)\}/)[1].includes('--cta-p:#9ed1b7') && dflt.includes('--on-accent:#FBF8F2'));
ok('baseMode', baseMode(light) === 'light' && baseMode({ ...light, dark: true }) === 'dark' && baseMode(null) === 'light');
ok('CSS aman (tanpa karakter berbahaya)', !/[<>"]{1}(?!\]:root)/.test(css.replace(/\[data-mode="(light|dark)"\]/g, '')));
console.log(`Hasil mode: ${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
