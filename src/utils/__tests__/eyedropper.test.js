import { describe, expect, it, vi } from 'vitest';
import { rgbToHex, sampleFabricAtClient } from '../eyedropper.js';

describe('eyedropper', () => {
  it('converts rgb to uppercase hex', () => {
    expect(rgbToHex(245, 208, 111)).toBe('#F5D06F');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
  });

  it('samples fabric lower canvas at client coords', () => {
    const el = document.createElement('canvas');
    el.width = 10;
    el.height = 10;
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left: 100, top: 50, right: 200, bottom: 150, width: 100, height: 100 }),
    });
    el.getContext = vi.fn(() => ({
      getImageData: () => ({ data: [245, 208, 111, 255] }),
    }));

    const canvas = { lowerCanvasEl: el };
    expect(sampleFabricAtClient(canvas, 150, 100)).toBe('#F5D06F');
    expect(sampleFabricAtClient(canvas, 10, 10)).toBeNull();
  });
});
