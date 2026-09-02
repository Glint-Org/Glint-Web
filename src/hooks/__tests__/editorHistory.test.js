import { describe, expect, it } from 'vitest';
import { captureEditorSnapshot, createEditorHistory } from '../editorHistory.js';

describe('editorHistory', () => {
  it('undo restores prior snapshot', () => {
    const h = createEditorHistory();
    const a = { frames: [{ id: '1', design: null, screenshotUrl: 'a' }], template: null };
    const b = { frames: [{ id: '1', design: null, screenshotUrl: 'b' }], template: null };
    h.push(a);
    const prev = h.undo(b);
    expect(prev).toEqual(a);
    expect(h.canRedo()).toBe(true);
  });

  it('captures frame ids and fabric keys', () => {
    const snap = captureEditorSnapshot({
      frames: [{ id: 'f1', design: { layers: [] }, screenshotUrl: 'x' }],
      template: { id: 't1' },
      canvasMap: {},
    });
    expect(snap.frames[0].id).toBe('f1');
    expect(snap.template.id).toBe('t1');
    expect(snap.frames[0].fabricRestoreKey).toBeTruthy();
  });
});
