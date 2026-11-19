// Quick WCAG contrast calculator used while tuning tokens.
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
if (process.argv[2]) {
  const pairs = process.argv.slice(2);
  for (let i = 0; i < pairs.length; i += 2) console.log(pairs[i], pairs[i + 1], ratio(pairs[i], pairs[i + 1]).toFixed(2));
}
