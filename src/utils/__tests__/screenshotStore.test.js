import { describe, expect, it, vi } from 'vitest';
import { readFileWithProgress } from '../screenshotStore.js';

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
