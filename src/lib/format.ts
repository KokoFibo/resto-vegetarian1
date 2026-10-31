/** IDR penuh → "IDR 238k". */
export const idr = (price: number): string => `IDR ${Math.round(price / 1000)}k`;
