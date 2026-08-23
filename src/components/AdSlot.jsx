import { useEffect, useRef } from 'react';

export default function AdSlot({ slot, format = 'banner' }) {
  const adRef = useRef(null);

  useEffect(() => {
    if (window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // silent fail — ad blocker may be active
      }
    }
  }, []);

  return (
    <div className="my-4 flex justify-center">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-xxxxxxxxxxxxxx"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
