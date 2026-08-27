import { describe, expect, it } from 'vitest';
import {
  buildExportFilenames,
  buildZipBlob,
  generateSessionJson,
  zipFileName,
  EXPORT_PRESETS,
} from '../exportHelper.js';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('exportHelper', () => {
  it('slugs ZIP names from app titles', () => {
    expect(zipFileName('My Cool App!')).toBe('My-Cool-App.zip');
    expect(zipFileName('')).toBe('glint.zip');
    expect(zipFileName('   ')).toBe('glint.zip');
    expect(zipFileName('Demo', 'png')).toBe('Demo-png.zip');
    expect(zipFileName('Demo', 'svg')).toBe('Demo-svg.zip');
    expect(zipFileName('', 'svg')).toBe('glint-svg.zip');
  });

  it('builds flat store filenames', () => {
    expect(buildExportFilenames(3, { exportPreset: 'play/phone' })).toEqual([
      'screen_1.png',
      'screen_2.png',
      'screen_3.png',
    ]);
  });

  it('builds SVG filenames', () => {
    expect(
      buildExportFilenames(2, { exportPreset: 'play/phone', format: 'svg' }),
    ).toEqual(['screen_1.svg', 'screen_2.svg']);
  });

  it('builds Fastlane layout paths with locale', () => {
    expect(
      buildExportFilenames(2, {
        exportPreset: 'ios/iphone',
        layout: 'fastlane',
        locale: 'en-US',
      }),
    ).toEqual([
      'phoneScreenshots/en-US/ios_screen_1.png',
      'phoneScreenshots/en-US/ios_screen_2.png',
    ]);
  });

  it('resolves legacy export presets', () => {
    expect(buildExportFilenames(1, { exportPreset: 'ios-tablet' })[0]).toBe(
      'ipad_screen_1.png',
    );
    expect(EXPORT_PRESETS.play.width).toBe(1080);
    expect(EXPORT_PRESETS['ios-tablet'].filename).toBe('ipad_screen');
  });

  it('generates session JSON with canonical store key', () => {
    const raw = generateSessionJson(
      ['a.png', 'b.png'],
      'Demo',
      'Ship it',
      'ios-tablet',
    );
    const session = JSON.parse(raw);
    expect(session.app).toBe('Demo');
    expect(session.tagline).toBe('Ship it');
    expect(session.store).toBe('ios/ipad');
    expect(session.version).toBe('1.0');
    expect(session.screens).toEqual(['a.png', 'b.png']);
    expect(session.locales).toEqual(['en-US']);
    expect(session.exportedAt).toMatch(/^\d{4}-/);
  });

  it('packs data-URL PNGs into a ZIP blob', async () => {
    const blob = await buildZipBlob(
      [TINY_PNG, TINY_PNG],
      ['screen_1.png', 'nested/screen_2.png'],
    );
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(20);
  });

  it('packs SVG markup into a ZIP blob', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>';
    const blob = await buildZipBlob([svg], ['screen_1.svg']);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(10);
  });
});
