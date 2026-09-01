import { describe, expect, it } from 'vitest';
import {
  computeBoardFitZoom,
  computeBoardZoomBounds,
  clampBoardScale,
  stepBoardScale,
  boardFrameGap,
  BOARD_FIT_MIN,
  BOARD_FIT_MAX,
} from '../boardZoom.js';

const board = {
  boardWidth: 1400,
  boardHeight: 900,
  canvasWidth: 1080,
  canvasHeight: 1920,
};

describe('boardZoom', () => {
  it('falls back when canvas size is missing', () => {
    expect(computeBoardFitZoom({ boardWidth: 1200, boardHeight: 800 })).toBe(20);
  });

  it('fits a single frame into the board', () => {
    const z = computeBoardFitZoom({ ...board, frameCount: 1 });
    expect(z).toBeGreaterThanOrEqual(BOARD_FIT_MIN);
    expect(z).toBeLessThanOrEqual(BOARD_FIT_MAX);
  });

  it('shrinks scale when more frames are on the board', () => {
    const one = computeBoardFitZoom({ ...board, frameCount: 1 });
    const many = computeBoardFitZoom({ ...board, frameCount: 5 });
    expect(many).toBeLessThan(one);
  });

  it('zoom bounds: max zoom in (~2.5 frames) > fit all when many frames', () => {
    const { minScale, maxScale } = computeBoardZoomBounds({ ...board, frameCount: 5 });
    expect(maxScale).toBeGreaterThan(minScale);
    expect(minScale).toBe(computeBoardFitZoom({ ...board, frameCount: 5 }));
  });

  it('zoom bounds collapse when fewer than 3 frames', () => {
    const two = computeBoardZoomBounds({ ...board, frameCount: 2 });
    expect(two.minScale).toBe(two.maxScale);
  });

  it('clampBoardScale and stepBoardScale stay in range', () => {
    const { minScale, maxScale } = computeBoardZoomBounds({ ...board, frameCount: 8 });
    expect(clampBoardScale(2, minScale, maxScale)).toBe(minScale);
    expect(clampBoardScale(99, minScale, maxScale)).toBe(maxScale);
    const up = stepBoardScale(minScale, 1.1, minScale, maxScale);
    expect(up).toBeGreaterThan(minScale);
    expect(up).toBeLessThanOrEqual(maxScale);
  });

  it('boardFrameGap scales with displayed frame width', () => {
    expect(boardFrameGap(80)).toBe(4);
    expect(boardFrameGap(200)).toBe(7);
    expect(boardFrameGap(600)).toBe(20);
  });
});
