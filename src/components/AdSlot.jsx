import { useEffect, useRef } from 'react';

/**
 * AdSense slot — only renders when VITE_ADSENSE_CLIENT is set (soft launch: leave unset).
 */
export default function AdSlot({ slot, format = 'banner' }) {
  const adRef = useRef(null);
  const client = import.meta.env.VITE_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !window.adsbygoogle) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ad blocker / network
    }
  }, [client]);

  if (!client) return null;

  return (
    <div className="my-4 flex justify-center" data-glint-ad>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
