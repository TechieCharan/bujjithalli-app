// Offline-first storage adapter for Bujjithalli Productivity App

const DB_NAME = 'BujjithalliDB';
const DB_VERSION = 1;
const PHOTO_STORE = 'bucket_photos';

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
      const item = localStorage.getItem(`bujjithalli_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse localstorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`bujjithalli_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set localstorage key "${key}":`, error);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(`bujjithalli_${key}`);
  }
};
