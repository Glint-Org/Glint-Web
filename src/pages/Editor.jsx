import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FrameEditor from '../components/FrameEditor';
import FrameSelector from '../components/FrameSelector';
import ThemeSelector from '../components/ThemeSelector';
import ExportManager from '../components/ExportManager';
import AdSlot from '../components/AdSlot';
import { useTelorBridge } from '../hooks/useTelorBridge';

export default function Editor() {
  const location = useLocation();
  const [screenshots, setScreenshots] = useState(location.state?.screenshots || []);
  const [background, setBackground] = useState(null);
  const [frame, setFrame] = useState(null);
  const [textOverlay, setTextOverlay] = useState({ text: '', style: {} });
  const [canvas, setCanvas] = useState(null);
  const bridge = useTelorBridge();

  useEffect(() => {
    if (bridge.screenshots.length > 0) {
      setScreenshots((prev) => [...prev, ...bridge.screenshots]);
    }
  }, [bridge.screenshots]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Telor Editor</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          bridge.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {bridge.connected ? 'Bridge Connected' : 'Bridge Disconnected'}
        </span>
      </header>

      <AdSlot slot="editor-banner" />

      <div className="flex flex-1">
        <aside className="w-72 bg-white border-r p-4 space-y-6 overflow-y-auto">
          {bridge.connected && (
            <button
              onClick={() => bridge.captureSingle()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Capture from Device
            </button>
          )}

          <FrameSelector selected={frame} onChange={setFrame} />
          <ThemeSelector selected={background} onChange={setBackground} />

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Text Overlay</h3>
            <input
              type="text"
              placeholder="App name"
              value={textOverlay.text}
              onChange={(e) => setTextOverlay((p) => ({ ...p, text: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <ExportManager canvas={canvas} screenshots={screenshots} />
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {screenshots.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Upload screenshots or connect to Telor Bridge to get started</p>
            </div>
          ) : (
            <FrameEditor
              screenshots={screenshots}
              background={background}
              textOverlay={textOverlay}
              frame={frame}
              onCanvasReady={setCanvas}
            />
          )}
        </main>
      </div>
    </div>
  );
}
