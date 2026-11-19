// Verifies every key used in /content has a matching field in .pages.yml,
// so saving from Pages CMS never silently drops data. Run: node scripts/check-cms-config.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';

const cfg = yaml.load(readFileSync('.pages.yml', 'utf8'));
const problems = [];
const load = (file) => {
  const raw = readFileSync(file, 'utf8');
  if (file.endsWith('.md')) return yaml.load(raw.split(/^---$/m)[1]);
  return yaml.load(raw);
};
const compare = (data, fields, where) => {
  if (Array.isArray(data)) return data.forEach((d, i) => compare(d, fields, `${where}[${i}]`));
  if (!data || typeof data !== 'object' || data instanceof Date) return;
  const byName = new Map(fields.map((f) => [f.name, f]));
  for (const [k, v] of Object.entries(data)) {
    const f = byName.get(k);
    if (!f) { problems.push(`${where}.${k} has no field in .pages.yml`); continue; }
    if (f.fields) compare(v, f.fields, `${where}.${k}`);
  }
};
for (const entry of cfg.content) {
  const files = entry.type === 'file' ? [entry.path] : readdirSync(entry.path).map((f) => join(entry.path, f));
  for (const file of files) compare(load(file), entry.fields, file);
}
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
console.log('Pages CMS config covers every content field.');
