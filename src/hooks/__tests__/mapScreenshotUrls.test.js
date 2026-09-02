import { describe, expect, it } from 'vitest';
import { mapScreenshotUrls } from '../useFrames.js';

describe('mapScreenshotUrls', () => {
  const template = {
    id: 'demo',
    store: 'play/phone',
    canvas: { width: 1080, height: 1920 },
    slides: [
      { name: 'A', layers: [{ type: 'background', color: '#111' }, { type: 'device', slot: 0 }] },
    ],
    extraSlide: {
      name: 'Extra',
      layers: [{ type: 'background', color: '#eee' }, { type: 'device', slot: 0 }],
    },
  };

  it('overwrites screenshots on existing frames when bulk importing', () => {
    const frames = Array.from({ length: 5 }, (_, i) => ({
      id: `frame-${i}`,
      design: { id: `slide-${i}` },
      screenshotUrl: `placeholder-${i}`,
    }));
    const urls = Array.from({ length: 10 }, (_, i) => `blob:import-${i}`);
    const next = mapScreenshotUrls(frames, urls, template);
    expect(next).toHaveLength(10);
    expect(next[0].screenshotUrl).toBe('blob:import-0');
    expect(next[4].screenshotUrl).toBe('blob:import-4');
    expect(next[5].screenshotUrl).toBe('blob:import-5');
    expect(next[0].fabricRestoreKey).toMatch(/^import-/);
    expect(next[0].design?.id).toBe('slide-0');
    expect(next[5].design?.layers?.[0]?.color).toBe('#eee');
  });

  it('keeps prior screenshot when import list is shorter than frame index', () => {
    const frames = [{ id: 'a', design: null, screenshotUrl: 'blob:old' }];
    const next = mapScreenshotUrls(frames, ['blob:new'], null);
    expect(next[0].screenshotUrl).toBe('blob:new');
  });
});
