import { describe, expect, it } from 'vitest';
import {
  DEVICE_SCALE_MAX,
  DEVICE_SCALE_MIN,
  getDeviceDisplaySize,
  pinnedTopLeft,
} from '../canvasEngine.js';

describe('device scale helpers', () => {
  it('reads layout size from framed device props', () => {
    const group = {
      glintRole: 'framed-screenshot',
      glintLayoutW: 400,
      glintLayoutH: 800,
      scaleX: 0.5,
      scaleY: 0.5,
      left: 100,
      top: 200,
    };
    const size = getDeviceDisplaySize(group);
    expect(size.width).toBe(200);
    expect(size.height).toBe(400);
    expect(size.scalePct).toBe(50);
  });

  it('exports sane scale bounds', () => {
    expect(DEVICE_SCALE_MIN).toBeLessThan(DEVICE_SCALE_MAX);
  });

  it('pins top-left from geometric center without drifting to the corner', () => {
    const pose = pinnedTopLeft(540, 960, 400, 800, 1, 1);
    expect(pose.left).toBe(340);
    expect(pose.top).toBe(560);
    const scaled = pinnedTopLeft(540, 960, 400, 800, 0.5, 0.5);
    expect(scaled.left).toBe(440);
    expect(scaled.top).toBe(760);
  });
});
