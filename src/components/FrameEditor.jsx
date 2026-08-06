import { useEffect, useRef } from 'react';
import { createCanvas, addImageToCanvas, setBackground, addTextOverlay, applyFrame, clearCanvas } from '../utils/canvasEngine';

export default function FrameEditor({ screenshots, background, textOverlay, frame: frameId, onCanvasReady, templateMode = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const frameObjRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const c = createCanvas(containerRef.current);
    canvasRef.current = c;
    onCanvasReady?.(c);
    return () => {
      onCanvasReady?.(null);
      c.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || templateMode) return;
    clearCanvas(canvas);
    if (background) setBackground(canvas, background.type, background.value);
    if (!screenshots.length) return;
    Promise.all(screenshots.map((url, i) =>
      addImageToCanvas(canvas, url, {
        top: 100 + i * (canvas.height / Math.max(screenshots.length, 1)),
      }),
    ));
  }, [screenshots, background, templateMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !textOverlay?.text) return;
    canvas.getObjects().filter((o) => o.type === 'text').forEach((t) => canvas.remove(t));
    addTextOverlay(canvas, textOverlay.text, textOverlay.style);
  }, [textOverlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (frameObjRef.current) {
      canvas.remove(frameObjRef.current);
      frameObjRef.current = null;
    }
    if (!frameId) return;
    fetch(`/frames/${frameId}.svg`)
      .then((r) => r.text())
      .then((svg) => applyFrame(canvas, svg))
      .then((obj) => { frameObjRef.current = obj; });
  }, [frameId]);

  return (
    <div className="flex justify-center">
      <canvas ref={containerRef} className="border rounded-lg shadow-lg max-w-full" />
    </div>
  );
}
