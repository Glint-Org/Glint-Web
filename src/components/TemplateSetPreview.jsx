import { useEffect, useRef, useState } from 'react';
import { getTemplateSlides } from '../utils/templateEngine';
import { renderTemplateStrip } from '../utils/templatePreview';

/**
 * Template strip: pack background color + exact-aspect frames (no stretch / crop / scroll).
 */
export default function TemplateSetPreview({ template, compact = false }) {
  const slides = getTemplateSlides(template);
  const rootRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [urls, setUrls] = useState([]);
  const [ready, setReady] = useState(false);
  const [frameH, setFrameH] = useState(compact ? 140 : 260);

  const canvasW = template?.canvas?.width || 1080;
  const canvasH = template?.canvas?.height || 1920;
  const aspect = canvasW / Math.max(1, canvasH);
  const count = Math.max(slides.length, 1);
  const gap = compact ? 4 : 8;
  const padX = compact ? 12 : 24;
  const maxH = compact ? 148 : 280;
  const accent = template?.preview?.bg || '#2A2A2E';

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: '160px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fit frame height so all slides sit side-by-side at true aspect — no overflow, no stretch.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;

    const fit = () => {
      const avail = Math.max(80, el.clientWidth - padX);
      const gaps = gap * Math.max(0, count - 1);
      const hFromWidth = (avail - gaps) / (count * aspect);
      setFrameH(Math.max(72, Math.min(maxH, Math.floor(hFromWidth))));
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect, count, gap, padX, maxH, compact]);

  useEffect(() => {
    let cancelled = false;
    if (!visible || !template?.id) return undefined;

    setReady(false);
    renderTemplateStrip(template).then((next) => {
      if (cancelled) return;
      setUrls(next);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, template?.id]);

  return (
    <div
      ref={rootRef}
      className={`flex w-full items-center justify-center overflow-hidden ${compact ? 'px-1.5 py-2' : 'px-3 py-3'}`}
      style={{
        background: accent,
        minHeight: frameH + (compact ? 16 : 24),
        gap,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const src = urls[i];
        const frameW = Math.round(frameH * aspect);
        return (
          <div
            key={slides[i]?.id || i}
            className="relative shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-black/10"
            style={{
              width: frameW,
              height: frameH,
              background: accent,
            }}
          >
            {src ? (
              <img
                src={src}
                alt=""
                width={frameW}
                height={frameH}
                className="block w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            ) : (
              <div
                className={`absolute inset-0 ${ready ? '' : 'animate-pulse'}`}
                style={{ background: 'rgba(0,0,0,0.12)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
