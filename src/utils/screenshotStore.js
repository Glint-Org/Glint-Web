/**
 * Temporary local screenshot cache (IndexedDB).
 * Blobs survive refresh; revoke object URLs when replaced.
 */

const DB_NAME = 'glint-temp';
const DB_VERSION = 1;
const STORE = 'screenshots';
const META_KEY = 'glint.tempShotIds';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function rememberId(id) {
  try {
    const ids = JSON.parse(localStorage.getItem(META_KEY) || '[]');
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(META_KEY, JSON.stringify(ids.slice(-40)));
    }
  } catch {
    /* ignore */
  }
}

function forgetId(id) {
  try {
    const ids = JSON.parse(localStorage.getItem(META_KEY) || '[]').filter((x) => x !== id);
    localStorage.setItem(META_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** Read a File with progress 0–100 (local read, not network). */
export function readFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };
    reader.onload = () => {
      onProgress?.(100);
      resolve(new Blob([reader.result], { type: file.type || 'image/png' }));
    };
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsArrayBuffer(file);
  });
}

export async function putScreenshotBlob(id, blob) {
  const db = await openDb();
  try {
    await idbReq(db.transaction(STORE, 'readwrite').objectStore(STORE).put({
      id,
      blob,
      updatedAt: Date.now(),
    }));
    rememberId(id);
  } finally {
    db.close();
  }
}

export async function getScreenshotBlob(id) {
  const db = await openDb();
  try {
    const row = await idbReq(db.transaction(STORE, 'readonly').objectStore(STORE).get(id));
    return row?.blob || null;
  } finally {
    db.close();
  }
}

export async function deleteScreenshotBlob(id) {
  const db = await openDb();
  try {
    await idbReq(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id));
    forgetId(id);
  } finally {
    db.close();
  }
}

export async function listCachedScreenshotIds() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Ingest files → IndexedDB + object URLs.
 * onItemProgress(index, pct) for UI.
 */
export async function ingestScreenshotFiles(files, onItemProgress) {
  const out = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const id = `shot-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
    const blob = await readFileWithProgress(file, (pct) => onItemProgress?.(i, pct));
    await putScreenshotBlob(id, blob);
    onItemProgress?.(i, 100);
    out.push({ id, url: URL.createObjectURL(blob), name: file.name });
  }
  return out;
}

/** Restore cached blobs as object URLs (newest first, capped). */
export async function restoreCachedScreenshots(limit = 10) {
  const ids = await listCachedScreenshotIds();
  const urls = [];
  for (const id of ids.slice(-limit)) {
    const blob = await getScreenshotBlob(id);
    if (blob) urls.push({ id, url: URL.createObjectURL(blob) });
  }
  return urls;
}
