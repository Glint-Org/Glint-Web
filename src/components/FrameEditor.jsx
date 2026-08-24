import { useEffect, useRef } from 'react';
import {
  createCanvas,
  setBackground,
  addTextOverlay,
  addFramedScreenshot,
  addStyledScreenshot,
  clearCanvas,
  computeCenteredFramePlacement,
} from '../utils/canvasEngine';
import { DEFAULT_SCREENSHOT_STYLE } from '../utils/frameMeta';

export default function FrameEditor({
  screenshots,
  background,
  textOverlay,
  frame: frameId,
  screenshotStyle,
  onCanvasReady,
  templateMode = false,
  canvasWidth = 1080,
  canvasHeight = 1920,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const c = createCanvas(containerRef.current, canvasWidth, canvasHeight);
    canvasRef.current = c;
    onCanvasReady?.(c);
    return () => {
      onCanvasReady?.(null);
      c.dispose();
      canvasRef.current = null;
    };
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || templateMode) return;

    let cancelled = false;

    const paint = async () => {
      clearCanvas(canvas);
      canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
      if (background) setBackground(canvas, background.type, background.value);
      else setBackground(canvas, 'solid', '#1C1C1E');

      if (!screenshots.length) return;

      const style = { ...DEFAULT_SCREENSHOT_STYLE, ...screenshotStyle };

      if (frameId && screenshots[0]) {
        const { scale, left, top } = computeCenteredFramePlacement(frameId, canvasWidth, canvasHeight);
        if (cancelled) return;
        await addFramedScreenshot(canvas, screenshots[0], frameId, { scale, left, top });
      } else if (screenshots[0]) {
        if (cancelled) return;
        await addStyledScreenshot(canvas, screenshots[0], {
          ...style,
          left: (canvasWidth - canvasWidth * style.scale) / 2,
          top: canvasHeight * 0.18,
        });
      }

      if (textOverlay?.text && !cancelled) {
        addTextOverlay(canvas, textOverlay.text, textOverlay.style);
      }
    };

    paint();
    return () => { cancelled = true; };
  }, [screenshots, background, frameId, screenshotStyle, templateMode, canvasWidth, canvasHeight, textOverlay]);

  return <canvas ref={containerRef} className="shadow-2xl rounded-sm" />;
}
