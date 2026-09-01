import { describe, expect, it } from 'vitest';
import { computeBoardFitZoom, boardFrameGap, BOARD_FIT_MIN, BOARD_FIT_MAX } from '../boardZoom.js';

describe('boardZoom', () => {
  it('falls back when canvas size is missing', () => {
    expect(computeBoardFitZoom({ boardWidth: 1200, boardHeight: 800 })).toBe(20);
  });

  it('fits a single frame into the board', () => {
    const z = computeBoardFitZoom({
      boardWidth: 1400,
      boardHeight: 900,
      canvasWidth: 1080,
      canvasHeight: 1920,
      frameCount: 1,
    });
    expect(z).toBeGreaterThanOrEqual(BOARD_FIT_MIN);
    expect(z).toBeLessThanOrEqual(BOARD_FIT_MAX);
  });

  it('shrinks scale when more frames are on the board', () => {
    const one = computeBoardFitZoom({
      boardWidth: 1400,
      boardHeight: 900,
      canvasWidth: 1080,
      canvasHeight: 1920,
      frameCount: 1,
    });
    const many = computeBoardFitZoom({
      boardWidth: 1400,
      boardHeight: 900,
      canvasWidth: 1080,
      canvasHeight: 1920,
      frameCount: 5,
    });
    expect(many).toBeLessThanOrEqual(one);
  });

  it('boardFrameGap scales with displayed frame width', () => {
    expect(boardFrameGap(80)).toBe(4);
    expect(boardFrameGap(200)).toBe(7);
    expect(boardFrameGap(600)).toBe(20);
  });
});
