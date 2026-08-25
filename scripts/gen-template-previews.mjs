#!/usr/bin/env node
/**
 * Generate static template strip JPEGs into public/templates/previews/.
 * Requires: npm run build, then a preview server OR --base URL, plus Playwright.
 *
 *   npm run build && npx serve dist -p 4173 &
 *   npm run generate:previews
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public/templates/previews');
const base = process.env.GLINT_PREVIEW_BASE || 'http://127.0.0.1:4173';

const TEMPLATE_IDS = [
  'blink-play', 'blink-ios', 'blink-tablet',
  'warm-glow-play', 'warm-glow-ios', 'warm-glow-tablet',
  'mint-tags-play', 'mint-tags-ios', 'mint-tags-tablet',
  'play-hero', 'play-pop', 'play-feature', 'play-dual', 'play-minimal',
  'ios-clean', 'ios-wave', 'ios-dark', 'ios-dual',
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Install Playwright: npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Home page lists templates — screenshot each card strip if data-template-id exists.
  // Fallback: open editor with ?template= id is not available; use gallery on /.
  await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 60000 });

  for (const id of TEMPLATE_IDS) {
    const handle = await page.$(`[data-template-id="${id}"]`);
    if (!handle) {
      console.warn(`skip ${id}: no [data-template-id] on home`);
      continue;
    }
    const buf = await handle.screenshot({ type: 'jpeg', quality: 85 });
    const dest = path.join(outDir, `${id}.jpg`);
    await writeFile(dest, buf);
    console.log('wrote', dest);
  }

  await browser.close();
  console.log('Done. Commit public/templates/previews/*.jpg or replace with Figma WebPs.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
