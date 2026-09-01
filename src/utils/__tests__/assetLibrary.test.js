import { describe, expect, it } from 'vitest';
import { mergeAssetItems, isUserScreenshot } from '../assetLibrary.js';

describe('assetLibrary', () => {
  it('skips duplicate urls when merging', () => {
    const existing = [{ id: 'a', url: 'blob:one', name: 'One' }];
    const next = mergeAssetItems(existing, [
      { url: 'blob:one', name: 'Dup' },
      { url: 'blob:two', name: 'Two' },
    ]);
    expect(next).toHaveLength(2);
    expect(next[1].url).toBe('blob:two');
  });

  it('rejects empty urls', () => {
    expect(isUserScreenshot('')).toBe(false);
    expect(isUserScreenshot(null)).toBe(false);
  });
});
