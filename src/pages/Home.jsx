import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import AdSlot from '../components/AdSlot';

export default function Home() {
  const [screenshots, setScreenshots] = useState([]);
  const navigate = useNavigate();

  const handleUpload = (files) => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setScreenshots(urls);
  };

  const handleStartEditing = () => {
    navigate('/editor', { state: { screenshots } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Telor Web</h1>
          <p className="text-gray-500 mt-1">Turn screenshots into Play Store–ready visuals</p>
        </div>
      </header>

      <AdSlot slot="home-banner" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <UploadZone onUpload={handleUpload} />

        {screenshots.length > 0 && (
          <div className="text-center space-y-4">
            <p className="text-green-600 font-medium">
              {screenshots.length} screenshot{screenshots.length > 1 ? 's' : ''} uploaded
            </p>
            <button
              onClick={handleStartEditing}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Editing
            </button>
          </div>
        )}
      </main>

      <AdSlot slot="home-footer" />
    </div>
  );
}
