import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GLINT_EXT,
  GLINT_FORMAT,
  GLINT_VERSION,
  GLINT_MAGIC,
  buildGlintBlob,
  glintFileName,
  isGlintFile,
  isGlintMagic,
  parseGlint,
} from '../projectPack.js';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

describe('projectPack helpers', () => {
  it('builds safe .glint filenames', () => {
    expect(glintFileName()).toBe(`Glint-ss${GLINT_EXT}`);
  });

  it('detects .glint file extensions', () => {
    expect(isGlintFile({ name: 'demo.glint' })).toBe(true);
    expect(isGlintFile({ name: 'demo.glint.zip' })).toBe(true);
    expect(isGlintFile({ name: 'demo.zip' })).toBe(false);
    expect(isGlintFile(null)).toBe(false);
  });

  it('detects GLINT magic header', () => {
    expect(isGlintMagic(GLINT_MAGIC)).toBe(true);
    expect(isGlintMagic(new Uint8Array([0x47, 0x4C, 0x49, 0x4E, 0x54, 0x01]))).toBe(true);
    expect(isGlintMagic(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))).toBe(false);
    expect(isGlintMagic(null)).toBe(false);
    expect(isGlintMagic(new Uint8Array([0x47, 0x4C]))).toBe(false);
  });
});

describe('projectPack round-trip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds and parses a .glint file with magic header', async () => {
    const objectUrls = [];
    globalThis.URL.createObjectURL = (blob) => {
      const url = `blob:mock-${objectUrls.length}`;
      objectUrls.push({ url, blob });
      return url;
    };
    globalThis.URL.revokeObjectURL = vi.fn();

    const mockCanvas = {
      toJSON: () => ({
        version: '7.0.0',
        objects: [
          {
            type: 'image',
            glintRole: 'framed-screenshot',
            src: TINY_PNG,
            glintScreenshotUrl: TINY_PNG,
          },
          {
            type: 'group',
            objects: [
              {
                type: 'image',
                src: TINY_PNG,
              },
            ],
          },
        ],
      }),
      toDataURL: () => TINY_PNG,
    };

    const blob = await buildGlintBlob({
      frames: [
        {
          id: 'frame-home',
          screenshotUrl: TINY_PNG,
          design: { headline: 'Hello' },
        },
      ],
      liveCanvases: [mockCanvas],
      store: 'play/phone',
      template: { id: 't1', name: 'Template', store: 'play/phone', canvas: { w: 1080, h: 1920 } },
      background: { type: 'solid', value: '#0B0D10' },
      previewDataUrls: [TINY_PNG],
    });

    expect(blob).toBeInstanceOf(Blob);

    // Verify magic header
    const buffer = await blobToArrayBuffer(blob);
    const bytes = new Uint8Array(buffer);
    expect(isGlintMagic(bytes)).toBe(true);
    expect(bytes[5]).toBe(GLINT_VERSION);

    // Parse the .glint file (skip 6-byte header)
    const zipBuffer = buffer.slice(6);
    const zip = await JSZip.loadAsync(zipBuffer);
    expect(zip.file('project.json')).toBeTruthy();
    expect(zip.file('assets/screenshots/frame-0.png')).toBeTruthy();
    expect(zip.file('assets/previews/frame-0.png')).toBeTruthy();
    expect(zip.file('canvas/frame-0.json')).toBeTruthy();

    const project = JSON.parse(await zip.file('project.json').async('string'));
    expect(project.format).toBe(GLINT_FORMAT);
    expect(project.schemaVersion).toBe(GLINT_VERSION);
    expect(project.store).toBe('play/phone');
    expect(project.frames).toHaveLength(1);
    expect(project.frames[0].screenshot).toBe('assets/screenshots/frame-0.png');
    expect(project.frames[0].preview).toBe('assets/previews/frame-0.png');
    expect(project.template.id).toBe('t1');

    // Parse with parseGlint
    const parsed = await parseGlint(blob);
    expect(parsed.kind).toBe(GLINT_FORMAT);
    expect(parsed.frames).toHaveLength(1);
    expect(parsed.frames[0].id).toBe('frame-home');
    expect(parsed.frames[0].design).toEqual({ headline: 'Hello' });
    expect(parsed.frames[0].screenshotUrl).toMatch(/^blob:/);
    expect(parsed.session.store).toBe('play/phone');
    expect(parsed.session.screens).toHaveLength(1);
    expect(parsed.editor.background).toEqual({ type: 'solid', value: '#0B0D10' });
  });

  it('rejects raw ZIPs without GLINT header', async () => {
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify({
      format: 'glint',
      schemaVersion: 1,
      store: 'play/phone',
      frames: [],
    }));
    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    await expect(parseGlint(arrayBuffer)).rejects.toThrow(/missing GLINT header/i);
  });

  it('rejects archives without project.json', async () => {
    const zip = new JSZip();
    zip.file('readme.txt', 'nope');
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    // Prepend GLINT header
    const header = new Uint8Array([0x47, 0x4C, 0x49, 0x4E, 0x54, 0x01]);
    const arrayBuffer = new Uint8Array(header.length + zipBuffer.byteLength);
    arrayBuffer.set(header);
    arrayBuffer.set(new Uint8Array(zipBuffer), header.length);

    await expect(parseGlint(arrayBuffer)).rejects.toThrow(/missing project.json/i);
  });

  it('rejects unsupported formats', async () => {
    const zip = new JSZip();
    zip.file(
      'project.json',
      JSON.stringify({ format: 'other', frames: [] }),
    );
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    // Prepend GLINT header
    const header = new Uint8Array([0x47, 0x4C, 0x49, 0x4E, 0x54, 0x01]);
    const arrayBuffer = new Uint8Array(header.length + zipBuffer.byteLength);
    arrayBuffer.set(header);
    arrayBuffer.set(new Uint8Array(zipBuffer), header.length);

    await expect(parseGlint(arrayBuffer)).rejects.toThrow(/Unsupported format/);
  });
});
