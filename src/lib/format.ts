// Display formatting only: every figure shown comes from the backend engines.

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const trimZeros = (text: string) => text.replace(/\.0+$|(\.\d*?)0+$/, "$1");

/** ₹12,34,567 */
export function formatINR(value: number): string {
  return `${value < 0 ? "-" : ""}₹${inr.format(Math.abs(Math.round(value)))}`;
}

/** ₹1.2 Cr, ₹75L, ₹80k, ₹950 */
export function formatCompactINR(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${trimZeros((abs / 1e7).toFixed(2))} Cr`;
  if (abs >= 1e5) return `${sign}₹${trimZeros((abs / 1e5).toFixed(1))}L`;
  if (abs >= 1e3) return `${sign}₹${trimZeros((abs / 1e3).toFixed(1))}k`;
  return formatINR(value);
}

/** 0.0855 -> "8.55%" */
export function formatRate(fraction: number, digits = 2): string {
  return `${trimZeros((fraction * 100).toFixed(digits))}%`;
}

/** Already a percentage: 12.19 -> "12.2%" */
export function formatPercent(percent: number, digits = 1): string {
  return `${trimZeros(percent.toFixed(digits))}%`;
}
