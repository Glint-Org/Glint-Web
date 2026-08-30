import { useCallback, useRef } from 'react';

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
 * Import Capture/Bridge folders (session.json + PNGs) or .glint project files.
 */
export default function SessionImporter({ onImport, onProjectImport }) {
  const folderRef = useRef(null);

  const parseFolder = useCallback(async (files) => {
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

    if (pngFiles.length === 0) {
      throw new Error('No PNG files found. Drop a folder with screenshots.');
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
      const result = await parseFolder(files);
      onImport(result);
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <input
        ref={folderRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => folderRef.current?.click()}
        className="w-full px-4 py-3 rounded-xl border border-glint-border-strong bg-glint-surface-2 text-sm font-semibold text-glint-text hover:border-glint-accent/60 hover:bg-glint-accent/5 transition-all duration-200"
      >
        Import Folder (session.json + PNGs)
      </button>
      <p className="text-xs text-glint-text-tertiary text-center">From Capture or Bridge</p>
    </div>
  );
}
