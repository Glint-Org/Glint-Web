import { useCallback, useRef } from 'react';

/**
 * Import session.json + PNG files from a folder (glint_capture or Bridge output).
 */
export default function SessionImporter({ onImport }) {
  const inputRef = useRef(null);

  const parseSession = useCallback(async (files) => {
    const fileList = Array.from(files);
    let sessionData = null;
    const pngFiles = [];

    for (const file of fileList) {
      if (file.name === 'session.json') {
        const text = await file.text();
        sessionData = JSON.parse(text);
      } else if (file.name.toLowerCase().endsWith('.png')) {
        pngFiles.push(file);
      }
    }

    if (!sessionData && pngFiles.length === 0) {
      throw new Error('No session.json or PNG files found in folder');
    }

    const screenOrder = sessionData?.screens ?? pngFiles.map((f) => f.name).sort();
    const urlMap = new Map(pngFiles.map((f) => [f.name, URL.createObjectURL(f)]));

    const screenshots = screenOrder
      .map((name) => urlMap.get(name) || urlMap.get(name.split('/').pop()))
      .filter(Boolean);

    if (screenshots.length === 0) {
      pngFiles.sort((a, b) => a.name.localeCompare(b.name));
      for (const f of pngFiles) {
        screenshots.push(URL.createObjectURL(f));
      }
    }

    return {
      screenshots,
      session: sessionData ?? {
        app: 'Imported App',
        screens: pngFiles.map((f) => f.name),
        version: '1.0',
        exportedAt: new Date().toISOString(),
      },
    };
  }, []);

  const handleFolderSelect = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const result = await parseSession(files);
      onImport(result);
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };

  const handleJsonPaste = async () => {
    const json = prompt('Paste session.json contents:');
    if (!json) return;
    try {
      const session = JSON.parse(json);
      onImport({ screenshots: session.screens ?? [], session });
    } catch {
      alert('Invalid JSON');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">Import Session</h3>
      <input
        ref={inputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
      >
        Import Folder (session.json + PNGs)
      </button>
      <button
        onClick={handleJsonPaste}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
      >
        Paste session.json
      </button>
    </div>
  );
}
