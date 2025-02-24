import { Injectable } from '@angular/core';
import { openDB } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class MapCacheService {
  private dbPromise = openDB('map-tile-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tiles')) {
        db.createObjectStore('tiles');
      }
    },
  });

  async getTile(url: string): Promise<Blob | undefined> {
    return (await this.dbPromise).get('tiles', url);
  }

  async saveTile(url: string, blob: Blob): Promise<void> {
    (await this.dbPromise).put('tiles', blob, url);
  }
}