import { describe, expect, it } from 'vitest';
import { unlockCanvasPointerEvents, setCanvasPaintVisibility } from '../canvasPointerUnlock';

function fakeEl(className = '', pointerEvents = 'none') {
  const classes = new Set(className.split(/\s+/).filter(Boolean));
  return {
    style: { pointerEvents, opacity: '0' },
    classList: {
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      _set: classes,
    },
  };
}

describe('canvasPointerUnlock', () => {
  it('clears pointer-events-none from upper canvas (Fabric copies lower class)', () => {
    const lower = fakeEl('block opacity-0 pointer-events-none');
    const upper = fakeEl('block opacity-0 pointer-events-none');
    unlockCanvasPointerEvents({ lowerCanvasEl: lower, upperCanvasEl: upper });
    expect(upper.classList.contains('pointer-events-none')).toBe(false);
    expect(upper.style.pointerEvents).toBe('');
    expect(lower.classList.contains('pointer-events-none')).toBe(false);
  });

  it('reveal restores pointer events after paint hide', () => {
    const lower = fakeEl('pointer-events-none');
    const upper = fakeEl('pointer-events-none');
    const canvas = { lowerCanvasEl: lower, upperCanvasEl: upper };
    setCanvasPaintVisibility(canvas, false);
    expect(upper.style.opacity).toBe('0');
    setCanvasPaintVisibility(canvas, true);
    expect(upper.style.opacity).toBe('');
    expect(upper.style.pointerEvents).toBe('');
    expect(upper.classList.contains('pointer-events-none')).toBe(false);
  });
});
