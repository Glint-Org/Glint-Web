import { PLATFORMS, devicesForPlatform } from '../utils/storeCatalog';

/**
 * Two-level store browse: platform (Play / App Store) → device (Phone, iPad, TV…).
 */
export default function StoreBrowseFilters({
  platform,
  device,
  onPlatformChange,
  onDeviceChange,
  size = 'md',
}) {
  const devices = platform && platform !== 'all' ? devicesForPlatform(platform) : [];
  const chip =
    size === 'sm'
      ? 'px-2 py-1 rounded-md text-[10px] font-medium'
      : 'px-4 py-2 rounded-full text-sm font-medium';
  const active = size === 'sm'
    ? 'bg-glint-accent text-glint-text-on-accent'
    : 'bg-glint-accent text-glint-text-on-accent shadow-md';
  const idle = size === 'sm'
    ? 'bg-glint-surface-2 text-glint-text-secondary hover:text-glint-text'
    : 'bg-glint-surface/80 text-glint-text-secondary hover:bg-glint-surface border border-glint-border';

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          type="button"
          onClick={() => {
            onPlatformChange('all');
            onDeviceChange('all');
          }}
          className={`${chip} transition-all ${platform === 'all' ? active : idle}`}
        >
          All
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              onPlatformChange(p.id);
              onDeviceChange('all');
            }}
            className={`${chip} transition-all ${platform === p.id ? active : idle}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {devices.length > 0 && (
        <div className="flex gap-1.5 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => onDeviceChange('all')}
            className={`${chip} transition-all ${device === 'all' ? active : idle}`}
          >
            All sizes
          </button>
          {devices.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onDeviceChange(d.id)}
              className={`${chip} transition-all ${device === d.id ? active : idle}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
