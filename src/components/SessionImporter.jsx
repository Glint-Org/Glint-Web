import { useCallback, useRef } from 'react';
import { isGlintPackFile, parseGlintPack } from '../utils/projectPack';

/** Prefer one platform/device prefix so frames map to a coherent screen sequence. */
function preferPrimaryDeviceScreens(screens) {
  if (!Array.isArray(screens) || screens.length === 0) return screens;
  const first = screens.find((s) => typeof s === 'string' && s.includes('/'));
  if (!first) return screens;
  const parts = first.split('/');
  if (parts.length < 3) return screens;
  const prefix = `${parts[0]}/${parts[1]}/`;
  const filtered = screens.filter((s) => typeof s === 'string' && s.startsWith(prefix));
  return filtered.length ? filtered : screens;
}

/**
 * Import Capture/Bridge folders, or editable .glintpack projects.
 */
export default function SessionImporter({ onImport, onProjectImport }) {
  const inputRef = useRef(null);
  const packRef = useRef(null);

  const parseSession = useCallback(async (files) => {
    const fileList = Array.from(files);
    let sessionData = null;
    const pngFiles = [];

    for (const file of fileList) {
      const base = file.name.toLowerCase();
      if (base.endsWith('.json') && base.includes('session')) {
        const text = await file.text();
        sessionData = JSON.parse(text);
      } else if (file.name.toLowerCase().endsWith('.png')) {
        pngFiles.push(file);
      }
    }

    if (!sessionData && pngFiles.length === 0) {
      throw new Error('No session.json or PNG files found in folder');
    }

    const screenOrder = preferPrimaryDeviceScreens(
      sessionData?.screens ?? pngFiles.map((f) => f.name).sort(),
    );
    const urlMap = new Map();
    for (const f of pngFiles) {
      const rel = (f.webkitRelativePath || f.name).replace(/^[^/]+\//, '');
      urlMap.set(f.name, URL.createObjectURL(f));
      urlMap.set(rel, urlMap.get(f.name));
      urlMap.set(rel.split('/').pop(), urlMap.get(f.name));
    }

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

  const handlePackSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (!isGlintPackFile(file) && !file.name.toLowerCase().endsWith('.zip')) {
        // Still try parse — zip may be renamed
      }
      const pack = await parseGlintPack(file);
      if (onProjectImport) onProjectImport(pack);
      else {
        onImport({
          screenshots: pack.screenshots,
          session: pack.session,
        });
      }
    } catch (err) {
      alert(err.message || String(err));
    }
  };

  const handleJsonPaste = async () => {
    const json = prompt('Paste session.json contents:');
    if (!json) return;
    try {
      const session = JSON.parse(json);
      const screens = session.screens ?? [];
      const isLoadable = (s) =>
        typeof s === 'string' &&
        (s.startsWith('blob:') ||
          s.startsWith('data:') ||
          s.startsWith('http://') ||
          s.startsWith('https://'));
      const loadable = screens.filter(isLoadable);
      if (screens.length > 0 && loadable.length === 0) {
        alert(
          'Pasted session has filenames only, not image data.\n\nUse Import Folder, .glintpack, or paste Copy for Glint View (data: URLs).',
        );
        return;
      }
      onImport({ screenshots: loadable.length ? loadable : screens, session });
    } catch {
      alert('Invalid JSON');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-glint-text-secondary">Import</h3>
      <input
        ref={inputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />
      <input
        ref={packRef}
        type="file"
        accept=".glintpack,.zip,application/zip"
        onChange={handlePackSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => packRef.current?.click()}
        className="w-full px-4 py-2 glint-btn-primary rounded-lg text-sm"
      >
        Open .glintpack (editable)
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full px-4 py-2 border border-glint-border-strong rounded-lg hover:bg-glint-surface-2 text-sm text-glint-text-secondary"
      >
        Import Folder (session.json + PNGs)
      </button>
      <button
        type="button"
        onClick={handleJsonPaste}
        className="w-full px-4 py-2 border border-glint-border-strong rounded-lg hover:bg-glint-surface-2 text-sm text-glint-text-secondary"
      >
        Paste session.json
      </button>
    </div>
  );
}
