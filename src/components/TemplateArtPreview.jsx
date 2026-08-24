/** CSS stand-in for template artwork - used in galleries so cards look like the real layout. */
export default function TemplateArtPreview({ template }) {
  const preview = template?.preview || {};
  const bg = preview.bg || '#1C1C1E';
  const textColor = preview.textColor || '#FFFFFF';
  const dual = preview.dual;
  const tablet = preview.tablet;
  const art = preview.art || [];
  const headline =
    template?.layers?.find((l) => l.type === 'headline')?.placeholder || template?.name || '';

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: bg }}>
      {art.map((piece, i) => (
        <ArtShape key={i} piece={piece} />
      ))}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center px-2 font-bold leading-tight z-10"
        style={{ top: '7%', color: textColor, fontSize: tablet ? '7px' : '8px', maxWidth: '90%' }}
      >
        {headline}
      </div>
      {dual ? (
        <div className="absolute inset-x-0 bottom-[8%] flex justify-center gap-1.5 items-end px-2 z-10">
          <PhoneSilhouette tall className="w-[28%]" />
          <PhoneSilhouette className="w-[28%] mb-1 opacity-90" />
        </div>
      ) : tablet ? (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[70%] z-10">
          <TabletSilhouette />
        </div>
      ) : (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[7%] w-[38%] z-10">
          <PhoneSilhouette tall />
        </div>
      )}
    </div>
  );
}

function ArtShape({ piece }) {
  const style = {
    position: 'absolute',
    left: piece.x,
    top: piece.y,
    width: piece.w,
    height: piece.h,
    background: piece.color,
    opacity: piece.opacity ?? 1,
    pointerEvents: 'none',
  };

  if (piece.kind === 'circle' || piece.kind === 'orb') {
    return <div style={{ ...style, borderRadius: '50%' }} />;
  }
  if (piece.kind === 'ring') {
    return (
      <div
        style={{
          ...style,
          borderRadius: '50%',
          background: 'transparent',
          border: `6px solid ${piece.color}`,
        }}
      />
    );
  }
  if (piece.kind === 'wave') {
    return <div style={{ ...style, borderRadius: '40% 40% 0 0' }} />;
  }
  if (piece.kind === 'arch') {
    return <div style={{ ...style, borderRadius: '50% 50% 0 0' }} />;
  }
  if (piece.kind === 'bar') {
    return <div style={{ ...style, transform: 'rotate(-12deg)', borderRadius: 12 }} />;
  }
  return <div style={{ ...style, borderRadius: '45% 55% 50% 50%' }} />;
}

function PhoneSilhouette({ tall, className = '' }) {
  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{
        aspectRatio: tall ? '9/19.5' : '9/17',
        borderRadius: '18%',
        background: 'rgba(0,0,0,0.38)',
        border: '1.5px solid rgba(255,255,255,0.3)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: '3%', width: '34%', height: '3.5%', borderRadius: 999, background: 'rgba(0,0,0,0.55)' }}
      />
      <div className="absolute" style={{ inset: '5%', borderRadius: '14%', background: 'rgba(255,255,255,0.12)' }} />
    </div>
  );
}

function TabletSilhouette() {
  return (
    <div
      className="relative mx-auto"
      style={{
        aspectRatio: '3/4',
        borderRadius: '6%',
        background: 'rgba(0,0,0,0.28)',
        border: '1.5px solid rgba(255,255,255,0.22)',
        boxShadow: '0 14px 32px rgba(0,0,0,0.35)',
      }}
    >
      <div className="absolute" style={{ inset: '3.5%', borderRadius: '3%', background: 'rgba(255,255,255,0.12)' }} />
    </div>
  );
}
