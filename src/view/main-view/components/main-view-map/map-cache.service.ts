import { Injectable } from '@angular/core';
import { openDB } from 'idb';

const DB_NAME = 'GeoMapCache';
const STORE_NAME = 'MapState';

@Injectable({
  providedIn: 'root'
})
export class MapCacheService {
  private dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, value, key);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_NAME, key);
  }

  async delete(key: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, key);
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}