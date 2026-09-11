import { describe, expect, it } from 'vitest';
import { cursorForTarget } from '../canvasEngine.js';

describe('cursorForTarget', () => {
  it('points at inactive artboards so frames feel clickable', () => {
    expect(cursorForTarget(null, { editable: false })).toBe('pointer');
    expect(cursorForTarget({ glintRole: 'text' }, { editable: false })).toBe('pointer');
  });

  it('uses default on empty editable canvas', () => {
    expect(cursorForTarget(null, { editable: true })).toBe('default');
  });

  it('uses pointer then grab for device layers', () => {
    const device = { glintRole: 'framed-screenshot' };
    expect(cursorForTarget(device, { editable: true, selected: false })).toBe('pointer');
    expect(cursorForTarget(device, { editable: true, selected: true })).toBe('grab');
  });

  it('uses text cursor for copy layers', () => {
    expect(cursorForTarget({ glintRole: 'text' }, { editable: true })).toBe('text');
    expect(cursorForTarget({ type: 'i-text' }, { editable: true })).toBe('text');
  });
});
