import { useCallback, useRef } from 'react';
import { Image } from 'lucide-react';

export default function UploadZone({ onUpload }) {
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
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={handleClick}
      className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <Image size={32} className="mx-auto mb-2 text-glint-text-tertiary" />
      <p className="text-gray-600 font-medium">Drop screenshots here</p>
      <p className="text-gray-400 text-sm mt-1">or click to browse</p>
    </div>
  );
}
