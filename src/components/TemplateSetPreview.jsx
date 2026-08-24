import { getTemplateSlides } from '../utils/templateEngine';

/**
 * Blink-style strip: 5 store screenshots side by side for a template set.
 */
export default function TemplateSetPreview({ template, compact = false }) {
  const slides = getTemplateSlides(template);
  const accent = template?.preview?.bg || '#611AB4';
  const tablet = template?.preview?.tablet;

  return (
    <div
      className={`flex w-full h-full ${compact ? 'gap-0.5 p-1' : 'gap-1.5 p-2'} bg-glint-bg`}
      style={{ minHeight: 0 }}
    >
      {slides.map((slide, i) => {
        const preview = slide.preview || {};
        const bg = preview.bg || accent;
        const textColor = preview.textColor || '#FFFFFF';
        const headline = preview.headline || template?.name || '';
        const band = preview.band;
        const headlineBottom = preview.headlineBottom;

        return (
          <div
            key={slide.id || i}
            className="relative flex-1 h-full overflow-hidden rounded-md border border-black/10 shadow-sm"
            style={{ background: bg, minWidth: 0 }}
          >
            {band && (
              <div
                className="absolute left-[-20%] right-[-20%] h-[40%]"
                style={{
                  bottom: '-5%',
                  background: band,
                  transform: 'rotate(-12deg)',
                }}
              />
            )}
            {!headlineBottom && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-center px-0.5 font-bold leading-tight z-10"
                style={{
                  top: '5%',
                  color: textColor,
                  fontSize: compact ? 5 : 7,
                  maxWidth: '92%',
                }}
              >
                {headline}
              </div>
            )}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-10"
              style={{
                top: headlineBottom ? '6%' : '22%',
                width: tablet ? '72%' : '58%',
                bottom: headlineBottom ? '28%' : '8%',
              }}
            >
              {tablet ? <TabletSilhouette /> : <PhoneSilhouette />}
            </div>
            {headlineBottom && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-center px-0.5 font-bold leading-tight z-20"
                style={{
                  bottom: '8%',
                  color: textColor,
                  fontSize: compact ? 5 : 7,
                  maxWidth: '90%',
                }}
              >
                {headline}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PhoneSilhouette() {
  return (
    <div
      className="relative mx-auto h-full"
      style={{
        aspectRatio: '9/19.5',
        maxWidth: '100%',
        borderRadius: '18%',
        background: 'rgba(0,0,0,0.35)',
        border: '1.5px solid rgba(40,40,40,0.55)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
      }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: '3%', width: '34%', height: '3%', borderRadius: 999, background: 'rgba(0,0,0,0.5)' }}
      />
      <div
        className="absolute"
        style={{
          inset: '5%',
          borderRadius: '14%',
          background: 'linear-gradient(160deg, #E8E0F5 0%, #C4B5E8 45%, #8A2BE2 100%)',
        }}
      />
    </div>
  );
}

function TabletSilhouette() {
  return (
    <div
      className="relative mx-auto h-full"
      style={{
        aspectRatio: '3/4',
        maxWidth: '100%',
        borderRadius: '6%',
        background: 'rgba(0,0,0,0.28)',
        border: '1.5px solid rgba(40,40,40,0.4)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="absolute"
        style={{
          inset: '3.5%',
          borderRadius: '3%',
          background: 'linear-gradient(160deg, #D6E8F5 0%, #7EB6D9 100%)',
        }}
      />
    </div>
  );
}
