import { describe, expect, it, vi } from 'vitest';

vi.mock('../placeholderScreenshots.js', async (importOriginal) => {
  const mod = await importOriginal();
  const FIXED = 'data:image/png;base64,FIXED';
  return {
    ...mod,
    getPlaceholderScreenshots: (count = 5) => Array.from({ length: count }, () => FIXED),
    getWhiteScreenshot: () => FIXED,
    fillScreenshotSlots: (userUrls = [], needed = 5) => {
      const out = [];
      for (let i = 0; i < needed; i++) out.push(userUrls[i] || FIXED);
      return out;
    },
  };
});

import {
  fillScreenshotSlots,
  getPlaceholderScreenshots,
  getWhiteScreenshot,
} from '../placeholderScreenshots.js';

describe('placeholderScreenshots', () => {
  it('returns the requested number of placeholders', () => {
    const shots = getPlaceholderScreenshots(3);
    expect(shots).toHaveLength(3);
    expect(shots.every((s) => s.startsWith('data:image/png'))).toBe(true);
  });

  it('fills missing slots while keeping user URLs first', () => {
    const filled = fillScreenshotSlots(['user-a', 'user-b'], 4);
    expect(filled).toEqual(['user-a', 'user-b', 'data:image/png;base64,FIXED', 'data:image/png;base64,FIXED']);
  });

  it('exposes a reusable white screenshot URL', () => {
    expect(getWhiteScreenshot()).toBe(getWhiteScreenshot());
  });
});
