import { Injectable } from '@angular/core';
import { TRouteCoordinates, TRouteProfile } from '../interfaces/route-config.interface';

@Injectable({
  providedIn: 'root'
})
export class RouteCacheService {
  private cache = new Map<string, any>();

  private generateCacheKey(coordinates: TRouteCoordinates[], profile: TRouteProfile): string {
    return JSON.stringify({ coordinates, profile });
  }

  constructor() {
    this.loadCacheFromLocalStorage();
  }


  private async saveToIndexedDB(key: object, value: object): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("RouteCacheDB", 1);
  
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("routes")) {
          db.createObjectStore("routes", { keyPath: "key" });
        }
      };
  
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction("routes", "readwrite");
        const store = transaction.objectStore("routes");
  
        const cacheEntry = { key: JSON.stringify(key), value };
        const putRequest = store.put(cacheEntry);
  
        putRequest.onsuccess = () => {
          console.log("Маршрут успешно сохранен в IndexedDB:", cacheEntry);
          resolve();
        };
  
        putRequest.onerror = () => {
          console.error("Ошибка при сохранении в IndexedDB:", putRequest.error);
          reject(putRequest.error);
        };
      };
  
      request.onerror = () => {
        console.error("Ошибка при открытии IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }
  


  private async loadFromIndexedDB(key: object): Promise<any | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("RouteCacheDB", 1);
  
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction("routes", "readonly");
        const store = transaction.objectStore("routes");
  
        const getRequest = store.get(JSON.stringify(key));
  
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            console.log("Маршрут найден в IndexedDB:", getRequest.result.value);
            resolve(getRequest.result.value);
          } else {
            console.log("Маршрут не найден в IndexedDB.");
            resolve(null);
          }
        };
  
        getRequest.onerror = () => {
          console.error("Ошибка при загрузке из IndexedDB:", getRequest.error);
          reject(getRequest.error);
        };
      };
  
      request.onerror = () => {
        console.error("Ошибка при открытии IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }
  

  private loadCacheFromLocalStorage(): void {
    const savedCache = localStorage.getItem('routeCache');
    if (savedCache) {
      try {
        const parsedCache = JSON.parse(savedCache);
  
        // Преобразуем ключи обратно в объекты
        this.cache = new Map(
          parsedCache.map(([key, value]: [string, any]) => [JSON.parse(key), value])
        );
  
        console.log('Кеш загружен из localStorage:', this.cache);
      } catch (error) {
        console.error('Ошибка при загрузке кеша:', error);
      }
    }
  }
  

  private saveCacheToLocalStorage(): void {
    const cacheArray = Array.from(this.cache.entries());
  
    // Гарантируем, что ключи хранятся корректно
    const formattedCache = cacheArray.map(([key, value]) => [
      JSON.stringify(key), // Убедимся, что ключи всегда строковые
      value
    ]);
  
    localStorage.setItem('routeCache', JSON.stringify(formattedCache));
    console.log('Кеш успешно сохранен в localStorage:', formattedCache);
  }
  

  public cacheRoute(coordinates: TRouteCoordinates[], profile: TRouteProfile, routeData: any): void {
    const key = this.generateCacheKey(coordinates, profile);
    console.log(`Сохраняем маршрут в кеш (${key}):`, routeData);
    this.cache.set(key, routeData);
    this.saveCacheToLocalStorage();
  }
  
  public getCachedRoute(coordinates: TRouteCoordinates[], profile: TRouteProfile): any | null {
    const key = this.generateCacheKey(coordinates, profile);
    console.log(`Ищем маршрут в кеше (${key}):`, this.cache.get(key));
    return this.cache.get(key) || null;
  }
  
}