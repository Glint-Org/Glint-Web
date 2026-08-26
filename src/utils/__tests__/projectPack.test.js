import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GLINTPACK_EXT,
  GLINTPACK_FORMAT,
  GLINTPACK_VERSION,
  buildGlintPackBlob,
  glintPackFileName,
  isGlintPackFile,
  parseGlintPack,
} from '../projectPack.js';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('projectPack helpers', () => {
  it('builds safe .glintpack filenames', () => {
    expect(glintPackFileName('Cool App!!')).toBe(`Cool-App${GLINTPACK_EXT}`);
    expect(glintPackFileName('')).toBe(`glint-project${GLINTPACK_EXT}`);
  });

  it('detects pack file extensions', () => {
    expect(isGlintPackFile({ name: 'demo.glintpack' })).toBe(true);
    expect(isGlintPackFile({ name: 'demo.glint.zip' })).toBe(true);
    expect(isGlintPackFile({ name: 'demo.zip' })).toBe(false);
    expect(isGlintPackFile(null)).toBe(false);
  });
});

describe('projectPack round-trip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds and parses a pack with shots, previews, and fabric assets', async () => {
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

    const blob = await buildGlintPackBlob({
      frames: [
        {
          id: 'frame-home',
          screenshotUrl: TINY_PNG,
          design: { headline: 'Hello' },
        },
      ],
      liveCanvases: [mockCanvas],
      appName: 'Pack Demo',
      tagline: 'Round trip',
      store: 'play/phone',
      template: { id: 't1', name: 'Template', store: 'play/phone', canvas: { w: 1080, h: 1920 } },
      background: { type: 'solid', value: '#0B0D10' },
      previewDataUrls: [TINY_PNG],
    });

    expect(blob).toBeInstanceOf(Blob);

    const zip = await JSZip.loadAsync(blob);
    expect(zip.file('project.json')).toBeTruthy();
    expect(zip.file('assets/shots/frame-0.png')).toBeTruthy();
    expect(zip.file('assets/previews/frame-0.png')).toBeTruthy();

    const project = JSON.parse(await zip.file('project.json').async('string'));
    expect(project.format).toBe(GLINTPACK_FORMAT);
    expect(project.schemaVersion).toBe(GLINTPACK_VERSION);
    expect(project.app).toBe('Pack Demo');
    expect(project.store).toBe('play/phone');
    expect(project.frames).toHaveLength(1);
    expect(project.frames[0].screenshot).toBe('assets/shots/frame-0.png');
    expect(project.frames[0].preview).toBe('assets/previews/frame-0.png');
    expect(project.frames[0].fabric.objects[0].src).toMatch(/^assets\/fabric\/frame-0\//);
    expect(project.frames[0].fabric.objects[0].glintScreenshotUrl).toBe(
      'assets/shots/frame-0.png',
    );
    expect(project.template.id).toBe('t1');

    const parsed = await parseGlintPack(blob);
    expect(parsed.kind).toBe('glintpack');
    expect(parsed.project.app).toBe('Pack Demo');
    expect(parsed.frames).toHaveLength(1);
    expect(parsed.frames[0].id).toBe('frame-home');
    expect(parsed.frames[0].design).toEqual({ headline: 'Hello' });
    expect(parsed.frames[0].screenshotUrl).toMatch(/^blob:/);
    expect(parsed.frames[0].fabricJson.objects[0].src).toMatch(/^blob:/);
    expect(parsed.session.store).toBe('play/phone');
    expect(parsed.session.screens).toHaveLength(1);
    expect(parsed.editor.background).toEqual({ type: 'solid', value: '#0B0D10' });
  });

  it('rejects archives without project.json', async () => {
    const zip = new JSZip();
    zip.file('readme.txt', 'nope');
    const blob = await zip.generateAsync({ type: 'blob' });
    await expect(parseGlintPack(blob)).rejects.toThrow(/missing project.json/i);
  });

  it('rejects unsupported pack formats', async () => {
    const zip = new JSZip();
    zip.file(
      'project.json',
      JSON.stringify({ format: 'other', frames: [] }),
    );
    const blob = await zip.generateAsync({ type: 'blob' });
    await expect(parseGlintPack(blob)).rejects.toThrow(/Unsupported pack format/);
  });
});
