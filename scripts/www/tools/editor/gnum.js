/* ═══════════════ GNum: { m, e } = m × 10^e ═══════════════ */
function gnParse(input) {
  const n = Number(String(input).trim());
  if (!Number.isFinite(n) || n === 0) return { m: 0, e: 0 };
  const neg = n < 0, abs = Math.abs(n);
  const e = Math.floor(Math.log10(abs));
  let m = abs / Math.pow(10, e);
  if (m >= 10) { m /= 10; }
  return { m: neg ? -m : m, e };
}
function gnText(g) {
  if (!g || g.m === 0) return '0';
  const m = g.m.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return `${m}×10^${g.e}`;
}

