import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileWithProgress, removeCachedScreenshot, listCachedScreenshotIds } from '../screenshotStore.js';

const META_KEY = 'glint.tempShotIds';

describe('removeCachedScreenshot', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('indexedDB', {
      open: () => {
        const req = {};
        queueMicrotask(() => req.onerror?.({ error: new Error('no idb in test') }));
        return req;
      },
    });
  });

  it('drops id from localStorage meta even when IndexedDB is unavailable', async () => {
    localStorage.setItem(META_KEY, JSON.stringify(['shot-a', 'shot-b']));
    const revoke = vi.fn();
    vi.stubGlobal('URL', { ...URL, revokeObjectURL: revoke });

    await removeCachedScreenshot('shot-a', 'blob:fake');
    expect(revoke).toHaveBeenCalledWith('blob:fake');
    expect(await listCachedScreenshotIds()).toEqual(['shot-b']);
  });
});

describe('readFileWithProgress', () => {
  it('reports progress and returns a blob', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const file = new File([bytes], 'a.png', { type: 'image/png' });
    const ticks = [];
    const blob = await readFileWithProgress(file, (p) => ticks.push(p));
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(5);
    expect(ticks.at(-1)).toBe(100);
  });
});
