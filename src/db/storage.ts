// Offline-first storage adapter for learning-loop

const DB_NAME = 'learning-loop';
const DB_VERSION = 2;
const PHOTO_STORE = 'bucket_photos';
const MUSIC_STORE = 'music_tracks';

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE);
      }
      if (!db.objectStoreNames.contains(MUSIC_STORE)) {
        db.createObjectStore(MUSIC_STORE);
      }
    };
  });
};

// IndexedDB Operations for Photos
export const photoStorage = {
  async save(key: string, base64Data: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, 'readwrite');
        const store = transaction.objectStore(PHOTO_STORE);
        const request = store.put(base64Data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save photo to IndexedDB:', error);
    }
  },

  async get(key: string): Promise<string | undefined> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, 'readonly');
        const store = transaction.objectStore(PHOTO_STORE);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get photo from IndexedDB:', error);
      return undefined;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, 'readwrite');
        const store = transaction.objectStore(PHOTO_STORE);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete photo from IndexedDB:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, 'readwrite');
        const store = transaction.objectStore(PHOTO_STORE);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to clear photo store:', error);
    }
  }
};

// LocalStorage Helpers for State
export const stateStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`learning-loop_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse localstorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`learning-loop_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set localstorage key "${key}":`, error);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(`learning-loop_${key}`);
  }
};

// IndexedDB Operations for Custom Music
export const musicStorage = {
  async save(key: string, audioBlob: Blob, name: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MUSIC_STORE, 'readwrite');
        const store = transaction.objectStore(MUSIC_STORE);
        const request = store.put({ blob: audioBlob, name }, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save music to IndexedDB:', error);
    }
  },

  async get(key: string): Promise<{ blob: Blob; name: string } | undefined> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MUSIC_STORE, 'readonly');
        const store = transaction.objectStore(MUSIC_STORE);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get music from IndexedDB:', error);
      return undefined;
    }
  },

  async list(): Promise<{ id: string; name: string }[]> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MUSIC_STORE, 'readonly');
        const store = transaction.objectStore(MUSIC_STORE);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          const keys = request.result as string[];
          const getRequest = store.getAll();
          getRequest.onsuccess = () => {
            const results = getRequest.result as { blob: Blob; name: string }[];
            const list = keys.map((key, idx) => ({
              id: key,
              name: results[idx]?.name || 'Unknown Track'
            }));
            resolve(list);
          };
          getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to list music from IndexedDB:', error);
      return [];
    }
  },

  async delete(key: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MUSIC_STORE, 'readwrite');
        const store = transaction.objectStore(MUSIC_STORE);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete music from IndexedDB:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MUSIC_STORE, 'readwrite');
        const store = transaction.objectStore(MUSIC_STORE);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to clear music store:', error);
    }
  }
};

