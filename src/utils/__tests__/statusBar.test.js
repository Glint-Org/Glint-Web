import { describe, expect, it } from 'vitest';
import {
  statusBarHeight,
  statusBarChromeChanged,
  drawStatusBar,
  screenContentRect,
  coverFitRect,
  statusBarKindForFrame,
  statusBarHasIsland,
} from '../statusBar.js';

describe('statusBar', () => {
  it('maps frames to platform status-bar kinds', () => {
    expect(statusBarKindForFrame('iphone16-pro')).toBe('ios');
    expect(statusBarKindForFrame('ipad-pro-13')).toBe('ipados');
    expect(statusBarKindForFrame('pixel9')).toBe('android');
  });

  it('enables Dynamic Island only on modern iPhone frames', () => {
    expect(statusBarHasIsland('iphone16-pro-max')).toBe(true);
    expect(statusBarHasIsland('pixel9')).toBe(false);
  });

  it('scales height with screen width and kind', () => {
    expect(statusBarHeight(1080, 'ios')).toBeGreaterThan(statusBarHeight(400, 'ios'));
    expect(statusBarHeight(100, 'android')).toBe(26);
    expect(statusBarHeight(800, 'ios')).not.toBe(statusBarHeight(800, 'android'));
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

  it('reserves full hole when status bar is off', () => {
    const r = screenContentRect(400, 800, { statusBarEnabled: false });
    expect(r).toEqual({ x: 0, y: 0, w: 400, h: 800, barH: 0, kind: 'android' });
  });

  it('reserves content below status bar when on', () => {
    const barH = statusBarHeight(400, 'ios');
    const r = screenContentRect(400, 800, { statusBarEnabled: true }, 'iphone16-pro');
    expect(r.kind).toBe('ios');
    expect(r.y).toBe(barH);
    expect(r.h).toBe(800 - barH);
    expect(r.w).toBe(400);
    expect(r.barH).toBe(barH);
  });

  it('cover-fits into the content rect without leaving gaps on either axis', () => {
    const fit = coverFitRect(900, 1600, 400, 700, 0, 50);
    expect(fit.dw).toBeCloseTo(400, 5);
    expect(fit.dx).toBeCloseTo(0, 5);
    expect(fit.dh).toBeGreaterThan(700);
    expect(fit.dy).toBeLessThan(50);
  });

  it('draws each platform bar without throwing', () => {
    const ctx = {
      save() {},
      restore() {},
      fillText() {},
      strokeRect() {},
      fillRect() {},
      beginPath() {},
      arc() {},
      arcTo() {},
      moveTo() {},
      stroke() {},
      fill() {},
      roundRect() {},
      rect() {},
      measureText() { return { width: 28 }; },
      fillStyle: '',
      strokeStyle: '',
      font: '',
      textBaseline: '',
      textAlign: '',
      lineWidth: 0,
      lineCap: '',
    };
    drawStatusBar(ctx, 400, 'dark', 'ios', 'iphone16-pro');
    drawStatusBar(ctx, 400, 'light', 'android');
    drawStatusBar(ctx, 800, 'dark', 'ipados');
  });
});
