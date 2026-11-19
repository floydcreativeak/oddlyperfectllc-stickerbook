#!/usr/bin/env node
/**
 * Content lint. Runs before every build in CI.
 *
 *   npm run lint:content           -> fails on unfinished-text markers and emoji in text.
 *                                     Lists placeholders as warnings.
 *   npm run lint:content:strict    -> ALSO fails if any placeholder remains.
 *                                     Production deploys use this.
 *
 * Checks content/** and src/** (not scripts/ or docs, which talk about the rules).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const strict = process.argv.includes('--strict');
const ROOTS = ['content', 'src'];
const TEXT_EXT = /\.(ya?ml|md|mdx|astro|tsx?|jsx?|css|json|html)$/i;

// Unfinished-work markers. Built from pieces so this file doesn't flag itself.
const MARKERS = [
  ['TO', 'DO'], ['FIX', 'ME'], ['T', 'BD'], ['X', 'XX'], ['lorem', ' ipsum'],
  ['your text', ' here'], ['insert', ' text'], ['coming', ' soon'], ['placeholder', ' text'],
].map(([a, b]) => a + b);
const markerRe = new RegExp(`\\b(${MARKERS.map((m) => m.replace(/ /g, '\\s+')).join('|')})\\b`, 'i');

// Emoji glyphs are never allowed in text: sticker emoji are bundled SVG files.
// (c), (r) and TM symbols are technically "pictographic" but are fine.
const emojiRe = /(?![©®™])[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;

const placeholderFlag = /^\s*placeholder:\s*true\b/;
const placeholderImg = /placeholder-[\w-]+\.(jpe?g|png|webp|avif)/i;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const errors = [];
const placeholders = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (!TEXT_EXT.test(file)) continue;
    const rel = relative('.', file);
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const at = `${rel}:${i + 1}`;
        const m = line.match(markerRe);
        if (m) errors.push(`${at}  unfinished-text marker "${m[0]}"`);
        if (emojiRe.test(line)) errors.push(`${at}  emoji character in text (use a sticker from content/stickers.yml instead)`);
        if (root === 'content') {
          if (placeholderFlag.test(line)) placeholders.push(`${at}  placeholder: true`);
          else if (placeholderImg.test(line)) placeholders.push(`${at}  uses a placeholder photo`);
        }
      });
  }
}

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

if (placeholders.length) {
  const head = strict
    ? red(`\n${placeholders.length} placeholder(s) must be replaced before the site can go live:`)
    : yellow(`\n${placeholders.length} placeholder(s) still waiting for real content (allowed in preview builds):`);
  console.log(head);
  for (const p of placeholders) console.log('  ' + p);
}
if (errors.length) {
  console.log(red(`\n${errors.length} content problem(s):`));
  for (const e of errors) console.log('  ' + e);
}

if (errors.length || (strict && placeholders.length)) {
  console.log(red('\nContent lint failed. See README.md, "If something breaks".\n'));
  process.exit(1);
}
console.log(green(`\nContent lint passed${strict ? ' (strict)' : ''}.\n`));
