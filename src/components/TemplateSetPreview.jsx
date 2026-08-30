import { useEffect, useRef, useState } from 'react';
import { getTemplateSlides } from '../utils/templateEngine';
import { renderTemplateStrip } from '../utils/templatePreview';
import { getStaticPreviewUrl } from '../utils/templatePreviewSrc';

/**
 * Template strip: directly renders static `/templates/previews/{id}.png` for 0-latency display.
 * Falls back to live rendering only if static asset fails to load.
 */
export default function TemplateSetPreview({ template, compact = false }) {
  const slides = getTemplateSlides(template);
  const rootRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [fallbackUrls, setFallbackUrls] = useState(null);
  const [frameH, setFrameH] = useState(compact ? 140 : 260);

  const canvasW = template?.canvas?.width || 1080;
  const canvasH = template?.canvas?.height || 1920;
  const aspect = canvasW / Math.max(1, canvasH);
  const count = Math.max(slides.length, 1);
  const gap = compact ? 4 : 8;
  const padX = compact ? 12 : 24;
  const maxH = compact ? 148 : 280;
  const accent = template?.preview?.bg || '#2A2A2E';
  const staticUrl = getStaticPreviewUrl(template?.id);

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

  const handleImgError = async () => {
    if (!fallbackUrls && template) {
      try {
        const urls = await renderTemplateStrip(template);
        setFallbackUrls(urls);
      } catch {
        // keep static URL
      }
    }
  };

  const stripH = frameH + (compact ? 16 : 24);

  // Live rendered fallback if static PNG was missing
  if (fallbackUrls) {
    return (
      <div
        ref={rootRef}
        className={`flex w-full items-center justify-center overflow-hidden transition-all duration-300 ${compact ? 'px-1.5 py-2' : 'px-3 py-3'}`}
        style={{ background: accent, minHeight: stripH, gap }}
      >
        {Array.from({ length: count }, (_, i) => {
          const src = fallbackUrls[i];
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
                  className="absolute inset-0 animate-pulse"
                  style={{ background: 'rgba(0,0,0,0.12)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative flex w-full items-center justify-center overflow-hidden transition-all duration-300 ${compact ? 'px-1.5 py-2' : 'px-3 py-3'}`}
      style={{ background: accent, minHeight: stripH }}
    >
      {staticUrl && (
        <img
          src={staticUrl}
          alt={template?.name || 'Template preview'}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={handleImgError}
          className={`max-h-full w-auto max-w-full object-contain pointer-events-none transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ height: frameH }}
          draggable={false}
        />
      )}
      {!imgLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ minHeight: stripH }}
        >
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}
    </div>
  );
}
