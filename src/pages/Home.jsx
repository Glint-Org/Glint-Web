import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import SessionImporter from '../components/SessionImporter';
import AdSlot from '../components/AdSlot';

export default function Home() {
  const [screenshots, setScreenshots] = useState([]);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  const handleUpload = (files) => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setScreenshots(urls);
  };

  const handleSessionImport = ({ screenshots: imported, session: importedSession }) => {
    setScreenshots(imported);
    setSession(importedSession);
  };

  const handleStartEditing = () => {
    navigate('/editor', { state: { screenshots, session } });
  };

  return (
    <div className="min-h-screen telor-gradient-bg">
      <header className="border-b border-violet-100/60 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Telor Web</h1>
            <p className="text-sm text-gray-500">Store-ready screenshots in minutes</p>
          </div>
        </div>
      </header>

      <AdSlot slot="home-banner" />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <section className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            From code to publish-ready
          </h2>
          <p className="mt-3 text-gray-600 text-lg">
            Import screenshots from telor_capture or Bridge, apply viral templates, export for Play Store & App Store.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="telor-card rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold">1</span>
              Upload Screenshots
            </h3>
            <UploadZone onUpload={handleUpload} />
          </div>
          <div className="telor-card rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold">2</span>
              Import telor_capture Session
            </h3>
            <SessionImporter onImport={handleSessionImport} />
            <p className="text-xs text-gray-400 mt-3">
              Folder with session.json + PNGs from build/telor_screenshots/
            </p>
          </div>
        </div>

        {screenshots.length > 0 && (
          <div className="telor-card rounded-2xl p-8 text-center space-y-4">
            <p className="text-emerald-600 font-semibold text-lg">
              {screenshots.length} screenshot{screenshots.length > 1 ? 's' : ''} ready
              {session?.app && <span className="text-gray-600"> — {session.app}</span>}
            </p>
            <button
              onClick={handleStartEditing}
              className="px-8 py-3.5 telor-btn-primary rounded-xl text-lg"
            >
              Apply Templates & Export →
            </button>
          </div>
        )}
      </main>

      <AdSlot slot="home-footer" />
    </div>
  );
}
