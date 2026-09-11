#!/usr/bin/env node
/**
 * render.mjs - Headless PNG renderer for Glint.
 *
 * Reads design.json + screenshots → composites via @napi-rs/canvas → ZIP.
 * No browser, no Playwright, no Fabric. Pure Node.js.
 *
 * Usage:
 *   node scripts/render.mjs --design design.json --screenshots ./shots --out out.zip
 *
 * design.json format:
 *   {
 *     "template": "blink-play",
 *     "screenshots": ["home.png", "profile.png"],
 *     "overrides": {
 *       "slides": {
 *         "0": { "headline": "Your Best Day", "subheadline": "Every moment captured" }
 *       }
 *     },
 *     "store": "play/phone"
 *   }
 */
import { readFile, writeFile, readdir, access, mkdir } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { compose, framePngPath, STORES, FRAMES } from '../lib/compose.js';

// ─── ZIP (inline minimal impl - avoids JSZip dependency for CLI) ────────────
// We'll use JSZip since it's already a dependency of Glint-Web.
async function buildZip(entries) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const { name, data } of entries) {
    zip.file(name, data);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

// ─── Arg parsing ────────────────────────────────────────────────────────────
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1] ?? fallback;
}

// ─── SVG → PNG via data URL + loadImage ─────────────────────────────────────
async function loadSvgAsImage(svgPath, fills = {}) {
  let svg = await readFile(svgPath, 'utf8');
  // Recolor the 3-slot system: #A10000 → fill, #B10000 → fill2, #C10000 → fill3
  if (fills.fill)  svg = svg.replaceAll('#A10000', fills.fill);
  if (fills.fill2) svg = svg.replaceAll('#B10000', fills.fill2);
  if (fills.fill3) svg = svg.replaceAll('#C10000', fills.fill3);
  const buf = Buffer.from(svg);
  return loadImage(buf);
}

// ─── Drawing helpers ────────────────────────────────────────────────────────

function drawBackground(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

function drawText(ctx, c) {
  const { text, x, y, w, fontSize, fontWeight, color, align, fontFamily, lineHeight, charSpacing, shadow } = c;
  if (!text) return;

  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'top';

  // Shadow
  if (shadow) {
    ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = shadow.blur || 5;
    ctx.shadowOffsetX = shadow.offsetX || 8;
    ctx.shadowOffsetY = shadow.offsetY || 8;
  }

  // Word wrap
  const lines = wrapText(ctx, text, w);
  const lh = fontSize * (lineHeight || 1.14);
  const startX = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;

  for (let i = 0; i < lines.length; i++) {
    const ly = y + i * lh;
    if (charSpacing) {
      drawSpacedText(ctx, lines[i], startX, ly, charSpacing);
    } else {
      ctx.fillText(lines[i], startX, ly);
    }
  }

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawSpacedText(ctx, text, x, y, spacing) {
  ctx.textAlign = 'left';
  let cx = x;
  // Center the spaced text
  const totalW = text.length * (ctx.measureText('A').width + spacing) - spacing;
  const align = ctx.textAlign;
  if (align === 'center' || ctx.textAlign === 'center') {
    cx = x - totalW / 2;
  }
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = 'center';
}

function wrapText(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

async function drawDevice(ctx, c, screenshots, publicDir) {
  const { x, y, w, h, frameId, screenshotIndex } = c;
  const framePath = framePngPath(frameId);

  try {
    const frameImg = await loadImage(await readFile(framePath));
    // Draw frame
    ctx.drawImage(frameImg, x, y, w, h);

    // Draw screenshot inside frame's screen hole
    const meta = FRAMES[frameId] || FRAMES.pixel9;
    const scaleX = w / meta.w;
    const scaleY = h / meta.h;
    const screenX = x + meta.inset.l * scaleX;
    const screenY = y + meta.inset.t * scaleY;
    const screenW = (meta.w - meta.inset.l - meta.inset.r) * scaleX;
    const screenH = (meta.h - meta.inset.t - meta.inset.b) * scaleY;

    // Load screenshot
    const shotPath = screenshots[screenshotIndex] || screenshots[0];
    if (shotPath) {
      try {
        const shotImg = await loadImage(await readFile(shotPath));
        // Cover-fit: fill the screen hole, crop overflow
        const imgRatio = shotImg.width / shotImg.height;
        const holeRatio = screenW / screenH;
        let sw, sh, sx, sy;
        if (imgRatio > holeRatio) {
          sh = screenH;
          sw = sh * imgRatio;
          sx = screenX - (sw - screenW) / 2;
          sy = screenY;
        } else {
          sw = screenW;
          sh = sw / imgRatio;
          sx = screenX;
          sy = screenY - (sh - screenH) / 2;
        }

        // Clip to screen hole with rounded corners
        ctx.save();
        roundRect(ctx, screenX, screenY, screenW, screenH, 28);
        ctx.clip();
        ctx.drawImage(shotImg, sx, sy, sw, sh);
        ctx.restore();
      } catch {
        // Screenshot not found - draw gray placeholder
        ctx.fillStyle = '#E5E7EB';
        ctx.fillRect(screenX, screenY, screenW, screenH);
      }
    }
  } catch {
    // Frame not found - draw a simple rounded rect
    ctx.fillStyle = '#1a1a1a';
    roundRect(ctx, x, y, w, h, 40);
    ctx.fill();
  }
}

async function drawGraphic(ctx, c, publicDir) {
  const { src, x, y, w, h, fill, fill2, fill3, angle } = c;
  try {
    const svgPath = join(publicDir, 'graphics', src);
    const img = await loadSvgAsImage(svgPath, { fill, fill2, fill3 });
    ctx.save();
    if (angle) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.restore();
  } catch {
    // Graphic not found - skip silently
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Main render pipeline ───────────────────────────────────────────────────

async function renderSlide(slide, screenshots, publicDir) {
  const { composables, background } = slide;
  // Find canvas size from first background or default
  let canvasW = 1080, canvasH = 1920;
  const bgLayer = composables.find(c => c.type === 'background');
  // Canvas size comes from the compose result, passed via slide
  if (slide.canvas) {
    canvasW = slide.canvas.w;
    canvasH = slide.canvas.h;
  }

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d');

  // Draw layers bottom-to-top
  for (const c of composables) {
    switch (c.type) {
      case 'background':
        drawBackground(ctx, canvasW, canvasH, c.color);
        break;
      case 'text':
        drawText(ctx, c);
        break;
      case 'device':
        await drawDevice(ctx, c, screenshots, publicDir);
        break;
      case 'graphic':
        await drawGraphic(ctx, c, publicDir);
        break;
    }
  }

  return canvas.toBuffer('image/png');
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main() {
  const designPath = arg('design');
  const screenshotsDir = arg('screenshots', '.');
  const outPath = arg('out', 'glint.zip');
  const jsonFlag = process.argv.includes('--json');

  if (!designPath) {
    console.error('Usage: node scripts/render.mjs --design design.json --screenshots ./shots --out out.zip');
    process.exit(1);
  }

  const design = JSON.parse(await readFile(resolve(designPath), 'utf8'));
  const publicDir = join(import.meta.dirname, '..', 'public');

  // Collect screenshots
  let screenshots = [];
  if (design.screenshots && design.screenshots.length) {
    for (const s of design.screenshots) {
      const abs = resolve(screenshotsDir, s);
      try {
        await access(abs);
        screenshots.push(abs);
      } catch {
        // Try basename in screenshotsDir
        const alt = join(resolve(screenshotsDir), basename(s));
        try {
          await access(alt);
          screenshots.push(alt);
        } catch {
          screenshots.push(null);
        }
      }
    }
  } else {
    // Auto-discover PNGs in screenshots dir
    try {
      const files = (await readdir(resolve(screenshotsDir))).filter(f => /\.png$/i.test(f)).sort();
      screenshots = files.map(f => join(resolve(screenshotsDir), f));
    } catch {
      // No screenshots dir
    }
  }

  // Compose geometry
  const result = compose({
    templateId: design.template,
    screenshots,
    overrides: design.overrides || {},
    store: design.store,
  });

  // Render each slide
  const entries = [];
  for (let i = 0; i < result.slides.length; i++) {
    const slide = result.slides[i];
    slide.canvas = result.canvas;
    const png = await renderSlide(slide, screenshots, publicDir);
    const name = `Frame_${i + 1}.png`;
    entries.push({ name, data: png });
    console.log(`  rendered ${name} (${result.canvas.w}x${result.canvas.h})`);
  }

  // Write ZIP
  if (entries.length === 0) {
    console.error('No slides to render');
    process.exit(1);
  }

  const zipBuf = await buildZip(entries);
  await writeFile(resolve(outPath), zipBuf);
  console.log(`Wrote ${outPath} (${entries.length} files, template=${design.template})`);

  if (jsonFlag) {
    console.log(JSON.stringify({
      ok: true,
      out: resolve(outPath),
      count: entries.length,
      template: design.template,
      canvas: result.canvas,
      slides: result.slides.map(s => s.name),
    }, null, 2));
  }
}

main().catch(err => {
  console.error('Render failed:', err.message || err);
  process.exit(1);
});
