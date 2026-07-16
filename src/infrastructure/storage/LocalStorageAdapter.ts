import { StorageAdapter } from './StorageAdapter';

export class LocalStorageAdapter implements StorageAdapter {
  
  public getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      return null; 
    }
    
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading key "${key}" from localStorage:`, error);
      return null;
    }
  }

  public setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      
      console.error(`Error saving key "${key}" to localStorage:`, error);
    }
  }

  public removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing key "${key}" from localStorage:`, error);
    }
  }
}
