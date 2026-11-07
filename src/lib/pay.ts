/** Splits a stipend across milestones in the same proportions used everywhere (25/37.5/37.5 for three). */
export function splitPay(total: number, n: number): number[] {
  const weights = n === 2 ? [0.4, 0.6] : n === 3 ? [0.25, 0.375, 0.375] : n === 4 ? [0.2, 0.2, 0.3, 0.3] : Array.from({ length: n }, () => 1 / n);
  const parts = weights.map((w) => Math.round((total * w) / 5) * 5);
  parts[n - 1] += total - parts.reduce((a, b) => a + b, 0);
  return parts;
}

export function money(n: number): string {
  return `$${n.toLocaleString("en-CA")}`;
}
