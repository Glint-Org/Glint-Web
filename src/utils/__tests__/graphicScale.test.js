import { describe, expect, it } from 'vitest';
import { graphicScale } from '../graphicLayers.js';

describe('graphicScale', () => {
  it('scales uniformly from width when height omitted', () => {
    expect(graphicScale({ width: 540 }, 1080, 2400)).toEqual({
      scaleX: 0.5,
      scaleY: 0.5,
    });
  });

  it('allows non-uniform scale for Blink 1080×2400 → Play 1080×1920', () => {
    expect(graphicScale({ width: 1080, height: 1920 }, 1080, 2400)).toEqual({
      scaleX: 1,
      scaleY: 0.8,
    });
  });
});
