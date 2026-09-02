import { describe, expect, it } from 'vitest';
import { resolveFrameDesign, resolveExtraFrameDesign } from '../templateEngine.js';

describe('resolveFrameDesign', () => {
  const pack = {
    id: 'demo',
    store: 'play/phone',
    canvas: { width: 1080, height: 1920 },
    slides: [
      { name: 'A', layers: [{ type: 'background', color: '#111111' }, { type: 'device', slot: 0 }] },
      { name: 'B', layers: [{ type: 'background', color: '#222222' }, { type: 'device', slot: 1 }] },
    ],
    extraSlide: {
      name: 'Extra',
      layers: [{ type: 'background', color: '#eeeeee' }, { type: 'device', slot: 0 }],
    },
  };

  it('returns the matching slide for in-range indices', () => {
    expect(resolveFrameDesign(pack, 0)?.layers?.[0]?.color).toBe('#111111');
    expect(resolveFrameDesign(pack, 1)?.layers?.[0]?.color).toBe('#222222');
  });

  it('uses extraSlide for overflow frames, not the last pack slide', () => {
    const extra = resolveFrameDesign(pack, 5);
    expect(extra?.layers?.[0]?.color).toBe('#eeeeee');
    expect(extra?.layers?.find((l) => l.type === 'device')?.slot).toBe(0);
    expect(extra?.layers?.[0]?.color).not.toBe('#222222');
  });

  it('resolveExtraFrameDesign generates a simple device slide when extraSlide is missing', () => {
    const bare = {
      id: 'solo',
      store: 'play/phone',
      canvas: { width: 1080, height: 1920 },
      palette: [{ id: 'background', color: '#abcdef' }],
      slides: [{ name: 'One', layers: [{ type: 'background', color: '#111111' }] }],
    };
    const extra = resolveExtraFrameDesign(bare);
    expect(extra?.layers?.[0]?.color).toBe('#abcdef');
    expect(extra?.layers?.some((l) => l.type === 'device')).toBe(true);
  });
});
