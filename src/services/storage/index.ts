import type { TransferHistoryItem } from '../../types';
import { STORAGE_KEYS } from '../../constants';

const DB_NAME = 'QuickDropDB';
const DB_VERSION = 1;
const STORE_NAME = 'transfer_history';

class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private initDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            console.warn('IndexedDB failed to open, falling back to localStorage');
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      });
    }

    return this.dbPromise;
  }

  async getHistory(): Promise<TransferHistoryItem[]> {
    const db = await this.initDB();
    if (!db) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.getAll();

        request.onsuccess = () => {
          const items: TransferHistoryItem[] = request.result || [];
          items.sort((a, b) => b.timestamp - a.timestamp);
          resolve(items);
        };

        request.onerror = () => {
          resolve([]);
        };
      } catch {
        resolve([]);
      }
    });
  }

  async addHistoryItem(item: TransferHistoryItem): Promise<void> {
    const db = await this.initDB();
    if (!db) {
      try {
        const current = await this.getHistory();
        const updated = [item, ...current].slice(0, 100);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async clearHistory(): Promise<void> {
    const db = await this.initDB();
    if (!db) {
      try {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
      } catch {}
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const storageService = new StorageService();
