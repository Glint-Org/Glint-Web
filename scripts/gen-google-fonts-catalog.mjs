#!/usr/bin/env node
/** Regenerate public/fonts/google-fonts-catalog.json from Google metadata. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/fonts/google-fonts-catalog.json');
const URL = 'https://fonts.google.com/metadata/fonts';

const res = await fetch(URL);
if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
const list = JSON.parse((await res.text()).replace(/^\)\]\}'\n?/, ''))
  .familyMetadataList.map((f) => ({ name: f.family }));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(list));
console.log(`Wrote ${list.length} fonts → ${OUT}`);
