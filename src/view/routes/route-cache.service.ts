import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { IRouteCache } from '@core';
import { TRouteProfile } from '../routes/interfaces/route-config.interface';

// Определение схемы базы данных
interface RoutesDBSchema extends DBSchema {
  routes: {
    key: string;
    value: any;
  };
  routeCache: {
    key: [string, TRouteProfile];
    value: IRouteCache;
    indexes: {
      byRoute: string;
      byProfile: TRouteProfile;
      byLastAccessed: Date;
    };
  };
  geoobjectCache: {
    key: string;
    value: any;
    indexes: {
      byLastAccessed: Date;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private db: Promise<IDBPDatabase<RoutesDBSchema>>;
  private readonly DB_NAME = 'RoutesDB';
  private readonly DB_VERSION = 4;
  private readonly MAX_CACHE_AGE_DAYS = 7;
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.db = this.initDatabase();
  }

  private initDatabase(): Promise<IDBPDatabase<RoutesDBSchema>> {
    return openDB<RoutesDBSchema>(this.DB_NAME, this.DB_VERSION, {
      upgrade: (db, oldVersion) => {
        // Создаем хранилища, если их еще нет
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }

        // Обновление или создание хранилища для кеша маршрутов
        if (oldVersion < 3 || !db.objectStoreNames.contains('routeCache')) {
          const routeCacheStore = db.createObjectStore('routeCache', { 
            keyPath: ['routeId', 'profile'] 
          });
          routeCacheStore.createIndex('byRoute', 'routeId');
          
          // Добавляем новые индексы в версии 3
          if (oldVersion < 3) {
            routeCacheStore.createIndex('byProfile', 'profile');
            routeCacheStore.createIndex('byLastAccessed', 'lastAccessed');
          }
        }

        // Добавляем новое хранилище для кеширования геообъектов в версии 4
        if (oldVersion < 4 && !db.objectStoreNames.contains('geoobjectCache')) {
          const geoObjectStore = db.createObjectStore('geoobjectCache', { keyPath: 'id' });
          geoObjectStore.createIndex('byLastAccessed', 'lastAccessed');
        }
      },
      terminated: () => console.error('Database connection terminated unexpectedly')
    });
  }

  // Метод для получения кеша маршрута
  async getRouteCache(routeId: string, profile: TRouteProfile): Promise<IRouteCache | undefined> {
    try {
      const db = await this.db;
      const cache = await db.get('routeCache', [routeId, profile]);
      
      if (cache) {
        // Обновляем время последнего доступа
        cache.lastAccessed = new Date();
        await db.put('routeCache', cache);
        return cache;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting route cache:', error);
      return undefined;
    }
  }

  // Метод для сохранения кеша маршрута
  async saveRouteCache(cacheData: IRouteCache): Promise<void> {
    try {
      const db = await this.db;
      
      // Добавляем информацию о времени кеширования
      const enhancedCache = {
        ...cacheData,
        lastAccessed: new Date(),
        cachedAt: new Date()
      };
      
      await db.put('routeCache', enhancedCache);
      await this.cleanupCache();
    } catch (error) {
      console.error('Error saving route cache:', error);
    }
  }

  // Метод для кеширования геообъекта
  async cacheGeoobject(geoobject: any): Promise<void> {
    try {
      const db = await this.db;
      await db.put('geoobjectCache', {
        ...geoobject,
        lastAccessed: new Date(),
        cachedAt: new Date()
      });
    } catch (error) {
      console.error('Error caching geoobject:', error);
    }
  }

  // Метод для получения кешированного геообъекта
  async getGeoobject(id: string): Promise<any | undefined> {
    try {
      const db = await this.db;
      const geoobject = await db.get('geoobjectCache', id);
      
      if (geoobject) {
        // Обновляем время последнего доступа
        geoobject.lastAccessed = new Date();
        await db.put('geoobjectCache', geoobject);
        return geoobject;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting geoobject from cache:', error);
      return undefined;
    }
  }

  // Метод для удаления устаревших данных из кеша
  private async cleanupCache(): Promise<void> {
    try {
      const db = await this.db;
      
      // Очистка кеша маршрутов
      await this.cleanupStore(db, 'routeCache', 'byLastAccessed');
      
      // Очистка кеша геообъектов
      await this.cleanupStore(db, 'geoobjectCache', 'byLastAccessed');
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  private async cleanupStore(
    db: IDBPDatabase<RoutesDBSchema>, 
    storeName: 'routeCache' | 'geoobjectCache', 
    indexName: 'byLastAccessed'
  ): Promise<void> {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);

    // Удаляем устаревшие записи
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - this.MAX_CACHE_AGE_DAYS);
    
    let cursor = await index.openCursor();
    
    // Удаляем записи старше MAX_CACHE_AGE_DAYS
    while (cursor) {
      const record = cursor.value;
      if (record.lastAccessed && new Date(record.lastAccessed) < expirationDate) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    
    // Ограничиваем размер кеша
    const allRecords = await index.getAll();
    if (allRecords.length > this.MAX_CACHE_SIZE) {
      // Сортируем по времени последнего доступа (от старых к новым)
      allRecords.sort((a, b) => 
        new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
      );
      
      // Удаляем лишние записи
      const recordsToDelete = allRecords.slice(0, allRecords.length - this.MAX_CACHE_SIZE);
      for (const record of recordsToDelete) {
        if (storeName === 'routeCache') {
          await store.delete([record.routeId, record.profile]);
        } else {
          await store.delete(record.id);
        }
      }
    }
    
    await tx.done;
  }

  // Метод для полной очистки кеша
  async clearAllCache(): Promise<void> {
    try {
      const db = await this.db;
      await db.clear('routeCache');
      await db.clear('geoobjectCache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}