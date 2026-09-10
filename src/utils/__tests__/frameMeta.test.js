import { describe, expect, it } from 'vitest';
import {
  framesForStore,
  getFrameSrc,
  isFrameAllowedForStore,
  resolveDeviceScale,
  resolveFrameForStore,
  scaleToMatchDisplayBox,
  getFrameMeta,
  MIN_DEVICE_COVERAGE,
} from '../frameMeta.js';

describe('frameMeta', () => {
  it('allows phone bezels for play/phone and always includes None', () => {
    const frames = framesForStore('play/phone');
    expect(frames.some((f) => f.id == null)).toBe(true);
    expect(frames.some((f) => f.id === 'pixel9')).toBe(true);
  });

  it('restricts TV to TV + None', () => {
    const frames = framesForStore('play/tv');
    const ids = frames.map((f) => f.id);
    expect(ids).toContain(null);
    expect(ids).toContain('tv');
    expect(ids).not.toContain('pixel9');
  });

  it('offers None for Wear OS listings (no frame available)', () => {
    expect(framesForStore('play/wear').map((f) => f.id)).toEqual([null]);
  });

  it('offers tablet bezels for Play tablets', () => {
    const ids = framesForStore('play/tablet-7').map((f) => f.id);
    expect(ids).toContain(null);
    expect(ids).toContain('ipad-pro');
  });

  it('validates and resolves frames for a store', () => {
    expect(isFrameAllowedForStore('pixel9', 'play/phone')).toBe(true);
    expect(isFrameAllowedForStore('pixel9', 'play/tv')).toBe(false);
    expect(resolveFrameForStore('pixel9', 'play/tv')).toBeNull();
    expect(resolveFrameForStore('bad', 'play/phone', 'pixel9')).toBe('pixel9');
  });

  it('builds public frame asset URLs', () => {
    expect(getFrameSrc('pixel9')).toMatch(/^\/frames\/pixel9\./);
  });

  it('computes device scale from coverage', () => {
    const scale = resolveDeviceScale('pixel9', 1080, 1920, MIN_DEVICE_COVERAGE);
    expect(scale).toBeGreaterThan(0);
    const tighter = resolveDeviceScale('pixel9', 1080, 1920, 0.9);
    expect(tighter).toBeGreaterThan(scale);
  });

  it('matches display box when swapping bezels so size stays stable', () => {
    const pixel = getFrameMeta('pixel9');
    const displayW = pixel.width * 0.5;
    const displayH = pixel.height * 0.5;
    const nextScale = scaleToMatchDisplayBox('iphone16-pro', displayW, displayH);
    expect(nextScale).toBeGreaterThan(0);
    const iphone = getFrameMeta('iphone16-pro');
    const nextW = iphone.width * nextScale;
    const nextH = iphone.height * nextScale;
    // Contained in previous box; at least one axis touches.
    expect(nextW).toBeLessThanOrEqual(displayW + 0.5);
    expect(nextH).toBeLessThanOrEqual(displayH + 0.5);
    expect(Math.min(displayW - nextW, displayH - nextH)).toBeLessThan(1);
  });
});
