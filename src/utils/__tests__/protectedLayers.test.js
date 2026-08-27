import { describe, expect, it } from 'vitest';
import { isProtectedLayer } from '../layerGuards.js';

describe('protected layers', () => {
  it('locks device and bare screenshot roles', () => {
    expect(isProtectedLayer({ glintRole: 'framed-screenshot' })).toBe(true);
    expect(isProtectedLayer({ glintRole: 'screenshot' })).toBe(true);
    expect(isProtectedLayer({ glintRole: 'text' })).toBe(false);
    expect(isProtectedLayer({ glintRole: 'graphic' })).toBe(false);
    expect(isProtectedLayer(null)).toBe(false);
  });
});
