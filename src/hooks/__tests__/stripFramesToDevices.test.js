import { describe, expect, it } from 'vitest';
import { stripFramesToDevices } from '../useFrames.js';

describe('stripFramesToDevices', () => {
  const template = {
    id: 'demo',
    store: 'play/phone',
    canvas: { width: 1080, height: 1920 },
    slides: [
      { name: 'A', layers: [{ type: 'background', color: '#111111' }, { type: 'device', slot: 0 }] },
    ],
    extraSlide: {
      name: 'Extra',
      layers: [{ type: 'background', color: '#eeeeee' }, { type: 'device', slot: 0 }],
    },
  };

  it('applies extra slide and white screenshots to every frame', () => {
    const frames = [
      { id: 'a', design: { layers: [{ type: 'headline' }] }, screenshotUrl: 'blob:1', fabricJson: {} },
      { id: 'b', design: null, screenshotUrl: 'blob:2', fabricRestoreKey: 'old' },
    ];
    const out = stripFramesToDevices(frames, template, 'white.png', 123);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('a');
    expect(out[0].screenshotUrl).toBe('white.png');
    expect(out[0].fabricJson).toBeNull();
    expect(out[0].design?.layers?.[0]?.color).toBe('#eeeeee');
    expect(out[0].fabricRestoreKey).toBe('devices-123-0');
    expect(out[1].fabricRestoreKey).toBe('devices-123-1');
    expect(out[1].design).toEqual(out[0].design);
  });

  it('clears design when no template is loaded', () => {
    const frames = [{ id: 'a', design: { layers: [] }, screenshotUrl: 'blob:1' }];
    const out = stripFramesToDevices(frames, null, 'white.png', 1);
    expect(out[0].design).toBeNull();
    expect(out[0].screenshotUrl).toBe('white.png');
  });
});
