import { useCallback, useRef } from 'react';
import { Image } from 'lucide-react';

export default function UploadZone({ onUpload, compact = false }) {
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (files.length) onUpload(files);
  }, [onUpload]);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) onUpload(files);
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={handleClick}
      className={`border-2 border-dashed border-glint-border-strong rounded-xl text-center cursor-pointer hover:border-glint-accent transition-colors bg-glint-surface-2 ${
        compact ? 'p-4' : 'p-12'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <Image size={compact ? 22 : 32} className="mx-auto mb-2 text-glint-text-tertiary" />
      <p className={`text-glint-text-secondary font-medium ${compact ? 'text-xs' : ''}`}>
        Drop screenshots here
      </p>
      <p className={`text-glint-text-tertiary mt-1 ${compact ? 'text-[10px]' : 'text-sm'}`}>
        or click to browse
      </p>
    </div>
  );
}
