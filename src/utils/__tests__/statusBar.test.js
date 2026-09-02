import { describe, expect, it } from 'vitest';
import {
  statusBarHeight,
  statusBarChromeChanged,
  screenshotFitChanged,
  screenContentRect,
  coverFitRect,
  statusBarKindForFrame,
  statusBarHasIsland,
} from '../statusBar.js';
import { statusBarHeightForFrame, getStatusBarMeta } from '../frameMeta.js';

describe('statusBar', () => {
  it('maps frames to platform status-bar kinds', () => {
    expect(statusBarKindForFrame('iphone16-pro')).toBe('ios');
    expect(statusBarKindForFrame('ipad-pro-13')).toBe('ipados');
    expect(statusBarKindForFrame('pixel9')).toBe('android');
    expect(statusBarKindForFrame('galaxy-s24')).toBe('android');
  });

  it('assigns a unique SVG profile per device frame', () => {
    expect(getStatusBarMeta('iphone16-pro')?.profile).toBe('ios-island');
    expect(getStatusBarMeta('iphone13-pro')?.profile).toBe('ios-notch');
    expect(getStatusBarMeta('pixel9')?.profile).toBe('android-pixel');
    expect(getStatusBarMeta('galaxy-s24')?.profile).toBe('android-samsung');
    expect(getStatusBarMeta('tv')).toBeNull();
  });

  it('enables Dynamic Island only on iPhone 16 frames', () => {
    expect(statusBarHasIsland('iphone16-pro-max')).toBe(true);
    expect(statusBarHasIsland('iphone13-pro')).toBe(false);
  });

  it('scales height from official SVG viewBox ratios', () => {
    expect(statusBarHeightForFrame(393, 'iphone16-pro')).toBe(59);
    expect(statusBarHeightForFrame(1024, 'ipad-pro-13')).toBe(24);
    expect(statusBarHeight(1080, 'iphone16-pro')).toBe(statusBarHeightForFrame(1080, 'iphone16-pro'));
  });

  it('uses frame hole height when screenH is provided', () => {
    expect(statusBarHeightForFrame(1206, 'iphone16-pro', 2622)).toBe(182);
    expect(statusBarHeightForFrame(1280, 'pixel9', 2856)).toBe(112);
  });

  it('detects enable / theme / profile chrome changes', () => {
    expect(statusBarChromeChanged({}, { statusBarEnabled: true })).toBe(true);
    expect(
      statusBarChromeChanged(
        { statusBarEnabled: true, statusBarTheme: 'dark' },
        { statusBarEnabled: true, statusBarTheme: 'light' },
      ),
    ).toBe(true);
    expect(
      statusBarChromeChanged(
        { statusBarEnabled: true },
        { statusBarEnabled: true },
        'iphone16-pro',
        'iphone13-pro',
      ),
    ).toBe(true);
  });

  it('detects screenshot fit mode and offset changes', () => {
    expect(screenshotFitChanged({ fitMode: 'cover' }, { fitMode: 'contain' })).toBe(true);
    expect(screenshotFitChanged({ fitOffsetX: 0 }, { fitOffsetX: 0.5 })).toBe(true);
    expect(screenshotFitChanged({ fitMode: 'cover' }, { fitMode: 'cover' })).toBe(false);
  });

  it('reserves full hole when status bar is off', () => {
    const r = screenContentRect(400, 800, { statusBarEnabled: false });
    expect(r.y).toBe(0);
    expect(r.h).toBe(800);
    expect(r.barH).toBe(0);
  });

  it('reserves content below per-frame status bar when on', () => {
    const barH = statusBarHeightForFrame(400, 'iphone16-pro', 800);
    const r = screenContentRect(400, 800, { statusBarEnabled: true }, 'iphone16-pro');
    expect(r.profile).toBe('ios-island');
    expect(r.y).toBe(barH);
    expect(r.h).toBe(800 - barH);
  });

  it('cover-fits into the content rect without leaving gaps on either axis', () => {
    const fit = coverFitRect(900, 1600, 400, 700, 0, 50);
    expect(fit.dw).toBeCloseTo(400, 5);
    expect(fit.dx).toBeCloseTo(0, 5);
    expect(fit.dh).toBeGreaterThan(700);
  });
});
