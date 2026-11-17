/** IDR penuh → "IDR 238k". */
export const idr = (price: number): string => `IDR ${Math.round(price / 1000)}k`;

/** Rupiah EKSAK ("Rp 69.300"), tanpa pembulatan. Dipakai untuk nominal yang harus dibayar pelanggan (pesanan online / QRIS). */
export const rupiah = (n: number): string => 'Rp ' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
