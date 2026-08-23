import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { generateSessionJson } from '../utils/exportHelper';

export default function QRExporter({ session, exportedUrls }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!session) return;

    const json = generateSessionJson(
      exportedUrls ?? session.screens ?? [],
      session.app ?? 'My App',
      session.tagline ?? '',
      session.store ?? 'play',
    );

    QRCode.toDataURL(json, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [session, exportedUrls]);

  const handleCopyJson = () => {
    const json = generateSessionJson(
      exportedUrls ?? session?.screens ?? [],
      session?.app ?? 'My App',
      session?.tagline ?? '',
      session?.store ?? 'play',
    );
    navigator.clipboard.writeText(json);
    alert('Session JSON copied to clipboard');
  };

  if (!session) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-glint-text-secondary">Preview QR</h3>
      <p className="text-xs text-glint-text-tertiary">Scan with Glint View to preview on device</p>
      {qrDataUrl && (
        <div className="flex justify-center">
          <img src={qrDataUrl} alt="Session QR Code" className="rounded border border-glint-border" />
        </div>
      )}
      <button
        onClick={handleCopyJson}
        className="w-full px-4 py-2 border border-glint-border-strong rounded-lg hover:bg-glint-surface-2 text-sm text-glint-text-secondary"
      >
        Copy session.json
      </button>
    </div>
  );
}
