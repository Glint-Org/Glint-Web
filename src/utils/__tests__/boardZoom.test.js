import { describe, expect, it } from 'vitest';
import { clampBoardZoom, computeBoardFitZoom } from '../boardZoom.js';

describe('boardZoom', () => {
  it('clamps zoom into bounds', () => {
    expect(clampBoardZoom(2)).toBe(8);
    expect(clampBoardZoom(99)).toBe(48);
    expect(clampBoardZoom(24)).toBe(24);
  });

  it('falls back when canvas size is missing', () => {
    expect(computeBoardFitZoom({ boardWidth: 1200, boardHeight: 800 })).toBe(16);
  });

  it('fits a single frame into the board', () => {
    const z = computeBoardFitZoom({
      boardWidth: 1400,
      boardHeight: 900,
      canvasWidth: 1080,
      canvasHeight: 1920,
      frameCount: 1,
    });
    expect(z).toBeGreaterThanOrEqual(8);
    expect(z).toBeLessThanOrEqual(48);
  });

  it('shrinks zoom when more frames are on the board', () => {
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
});
