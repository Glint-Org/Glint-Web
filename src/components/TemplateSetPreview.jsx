import { useEffect, useRef, useState } from 'react';
import { getTemplateSlides } from '../utils/templateEngine';
import { renderTemplateStrip } from '../utils/templatePreview';

/**
 * Real template strip — same slides as the frames board (Fabric-rendered).
 */
export default function TemplateSetPreview({ template, compact = false }) {
  const slides = getTemplateSlides(template);
  const rootRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [urls, setUrls] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: '120px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  const count = Math.max(slides.length, 1);
  const accent = template?.preview?.bg || '#2A2A2E';

  return (
    <div
      ref={rootRef}
      className={`flex w-full h-full items-stretch ${compact ? 'gap-0.5 p-1' : 'gap-1.5 p-2'} bg-glint-bg`}
      style={{ minHeight: 0 }}
    >
      {Array.from({ length: count }, (_, i) => {
        const src = urls[i];
        return (
          <div
            key={slides[i]?.id || i}
            className="relative flex-1 h-full min-w-0 overflow-hidden rounded-md border border-black/10 shadow-sm"
            style={{ background: accent }}
          >
            {src ? (
              <img
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                draggable={false}
              />
            ) : (
              <div
                className={`absolute inset-0 ${ready ? '' : 'animate-pulse'}`}
                style={{ background: accent, opacity: 0.85 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
