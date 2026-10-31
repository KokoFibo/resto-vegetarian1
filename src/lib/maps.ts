/** Tautan peta dari isian restoran: koordinat "lat,lng", URL lengkap, URL tanpa https://, atau teks pencarian. */
export function mapLinks(raw: string | null | undefined, address: string | null, brand: string): { open: string; dir: string } {
  const v = (raw || '').trim();
  const c = v.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (c) return {
    open: `https://www.google.com/maps/search/?api=1&query=${c[1]},${c[2]}`,
    dir: `https://www.google.com/maps/dir/?api=1&destination=${c[1]},${c[2]}`,
  };
  if (/^https?:\/\//i.test(v)) return { open: v, dir: v };
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return { open: 'https://' + v, dir: 'https://' + v };
  const q = encodeURIComponent(v || address || brand);
  return { open: `https://www.google.com/maps/search/?api=1&query=${q}`, dir: `https://www.google.com/maps/dir/?api=1&destination=${q}` };
}
