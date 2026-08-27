import { describe, expect, it } from 'vitest';
import { statusBarHeight, statusBarChromeChanged, drawStatusBar } from '../statusBar.js';

describe('statusBar', () => {
  it('scales height with screen width', () => {
    expect(statusBarHeight(1080)).toBeGreaterThan(statusBarHeight(400));
    expect(statusBarHeight(100)).toBe(28);
  });

  it('detects enable / theme chrome changes', () => {
    expect(statusBarChromeChanged({}, { statusBarEnabled: true })).toBe(true);
    expect(
      statusBarChromeChanged(
        { statusBarEnabled: true, statusBarTheme: 'dark' },
        { statusBarEnabled: true, statusBarTheme: 'light' },
      ),
    ).toBe(true);
    expect(
      statusBarChromeChanged(
        { statusBarEnabled: true, statusBarTheme: 'dark' },
        { statusBarEnabled: true, statusBarTheme: 'dark' },
      ),
    ).toBe(false);
  });

  it('draws without throwing', () => {
    const calls = [];
    const ctx = {
      save() { calls.push('save'); },
      restore() { calls.push('restore'); },
      fillText() {},
      strokeRect() {},
      fillRect() {},
      beginPath() {},
      arc() {},
      stroke() {},
      fill() {},
      fillStyle: '',
      strokeStyle: '',
      font: '',
      textBaseline: '',
      textAlign: '',
      lineWidth: 0,
    };
    drawStatusBar(ctx, 400, 'dark');
    expect(calls).toEqual(['save', 'restore']);
  });
});
