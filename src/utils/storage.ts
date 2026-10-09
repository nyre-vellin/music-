import { Track, Playlist, EqPreset } from '../types/audio';

const DB_NAME = 'decibel_flac_db';
const DB_VERSION = 1;
const TRACKS_STORE = 'tracks';
const PLAYLISTS_STORE = 'playlists';
const SETTINGS_STORE = 'settings';

interface StoredTrack extends Omit<Track, 'url'> {
  audioBlob?: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
        db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTrackToDb(track: Track, audioBlob?: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(TRACKS_STORE, 'readwrite');
    const store = tx.objectStore(TRACKS_STORE);

    const stored: StoredTrack = {
      ...track,
      audioBlob: audioBlob || undefined,
    };

    store.put(stored);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save track to IndexedDB:', err);
  }
}

export async function loadCustomTracksFromDb(): Promise<Track[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(TRACKS_STORE, 'readonly');
    const store = tx.objectStore(TRACKS_STORE);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const storedTracks: StoredTrack[] = request.result || [];
        const reconstructed: Track[] = storedTracks.map((item) => {
          let url = '';
          if (item.audioBlob) {
            url = URL.createObjectURL(item.audioBlob);
          }
          return {
            ...item,
            url,
            isCustom: true,
          };
        });
        resolve(reconstructed);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to load tracks from IndexedDB:', err);
    return [];
  }
}

export async function deleteTrackFromDb(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(TRACKS_STORE, 'readwrite');
    tx.objectStore(TRACKS_STORE).delete(id);
  } catch (err) {
    console.warn('Failed to delete track from IndexedDB:', err);
  }
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).put({ key, value });
  } catch (err) {
    console.warn('Failed to save setting:', err);
  }
}

export async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const req = tx.objectStore(SETTINGS_STORE).get(key);
    return new Promise((resolve) => {
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}
