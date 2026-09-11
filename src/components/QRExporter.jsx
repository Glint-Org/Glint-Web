import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { generateSessionJson } from '../utils/exportHelper';

/**
 * Handoff to Glint View.
 * Session JSON = ordered screenshot list (1 → 2 → 3…). QR is metadata only.
 */
export default function QRExporter({ session, exportedUrls }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const hasFrames = Array.isArray(exportedUrls) && exportedUrls.length > 0
    && exportedUrls.every((u) => typeof u === 'string' && u.startsWith('data:'));

  const buildFullSession = () => generateSessionJson(
    hasFrames ? exportedUrls : (session?.screens ?? []),
    session?.store ?? 'play/phone',
  );

  const buildCompactSession = () => JSON.stringify({
    store: session?.store ?? 'play/phone',
    version: '1.0',
    screens: [],
  });

  useEffect(() => {
    if (!session) return;
    QRCode.toDataURL(buildCompactSession(), { width: 220, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [session?.store]);

  const handleCopyJson = async () => {
    if (!hasFrames) {
      alert('Preview or export first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(buildFullSession());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy to clipboard');
    }
  };

  if (!session) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
        Session JSON
      </h3>
      <p className="text-[10px] text-glint-text-tertiary leading-relaxed">
        Ordered screenshots for Glint View - which shot comes after which.
      </p>
      {qrDataUrl && (
        <div className="flex justify-center">
          <img src={qrDataUrl} alt="Session QR" className="rounded border border-glint-border w-40 h-40" />
        </div>
      )}
      <button
        type="button"
        onClick={handleCopyJson}
        disabled={!hasFrames}
        className="w-full px-4 py-2 border border-glint-border-strong rounded-lg hover:bg-glint-surface-2 text-sm text-glint-text-secondary disabled:opacity-40"
      >
        {copied ? 'Copied!' : hasFrames ? 'Copy session JSON' : 'Preview first'}
      </button>
    </div>
  );
}
