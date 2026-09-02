import { describe, expect, it } from 'vitest';
import { resolveFrameDesign } from '../templateEngine.js';

describe('resolveFrameDesign', () => {
  const pack = {
    id: 'demo',
    store: 'play/phone',
    canvas: { width: 1080, height: 1920 },
    slides: [
      { name: 'A', layers: [{ type: 'background', color: '#111111' }, { type: 'device', slot: 0 }] },
      { name: 'B', layers: [{ type: 'background', color: '#222222' }, { type: 'device', slot: 1 }] },
    ],
  };

  it('returns the matching slide for in-range indices', () => {
    expect(resolveFrameDesign(pack, 0)?.layers?.[0]?.color).toBe('#111111');
    expect(resolveFrameDesign(pack, 1)?.layers?.[0]?.color).toBe('#222222');
  });

  it('reuses the last slide for extra frames', () => {
    const extra = resolveFrameDesign(pack, 4);
    expect(extra?.layers?.[0]?.color).toBe('#222222');
    expect(extra?.layers?.find((l) => l.type === 'device')?.slot).toBe(0);
  });

  it('prefers template.defaultSlide when set', () => {
    const withDefault = {
      ...pack,
      defaultSlide: {
        name: 'Extra',
        layers: [{ type: 'background', color: '#abcdef' }, { type: 'device', slot: 2 }],
      },
    };
    expect(resolveFrameDesign(withDefault, 9)?.layers?.[0]?.color).toBe('#abcdef');
  });
});
