import { describe, expect, it } from 'vitest';
import { GLINT_CLONE_PROPS } from '../glintCloneProps.js';

describe('glintCloneProps', () => {
  it('lists Fabric custom metadata keys needed for pack restore', () => {
    expect(GLINT_CLONE_PROPS).toContain('glintRole');
    expect(GLINT_CLONE_PROPS).toContain('glintScreenshotUrl');
    expect(GLINT_CLONE_PROPS).toContain('glintFrameId');
    expect(new Set(GLINT_CLONE_PROPS).size).toBe(GLINT_CLONE_PROPS.length);
  });
});
