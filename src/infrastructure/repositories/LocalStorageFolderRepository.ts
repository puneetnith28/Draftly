import { FolderRepository } from '@domain/repositories/FolderRepository';
import { FolderEntity } from '@domain/entities/Folder';
import { FolderMapper } from '@infrastructure/mappers/FolderMapper';
import { StorageAdapter } from '@infrastructure/storage/StorageAdapter';
import { DocumentFolder } from '@shared/types';

const STORAGE_KEY = 'notes_folders';

export class LocalStorageFolderRepository implements FolderRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  public async findById(id: string): Promise<FolderEntity | null> {
    const folders = this.getAllRaw();
    const folder = folders.find(f => f.id === id);
    if (!folder) return null;
    return FolderMapper.toDomain(folder);
  }

  public async findAll(): Promise<FolderEntity[]> {
    const folders = this.getAllRaw();
    return folders.map(f => FolderMapper.toDomain(f));
  }

  public async save(folder: FolderEntity): Promise<void> {
    const folders = this.getAllRaw();
    const index = folders.findIndex(f => f.id === folder.id);
    
    const folderData = FolderMapper.toPersistence(folder);

    if (index >= 0) {
      folders[index] = folderData;
    } else {
      folders.push(folderData);
    }
    
    this.storage.setItem(STORAGE_KEY, folders);
  }

  public async delete(id: string): Promise<void> {
    let folders = this.getAllRaw();
    folders = folders.filter(f => f.id !== id);
    this.storage.setItem(STORAGE_KEY, folders);
  }

  private getAllRaw(): DocumentFolder[] {
    const data = this.storage.getItem<any>(STORAGE_KEY);
    if (data && Array.isArray(data)) return data;
    
    // Legacy format check from old notes_documents key
    const legacyData = this.storage.getItem<any>('notes_documents');
    if (legacyData && legacyData.folders && Array.isArray(legacyData.folders)) {
      // Migrate immediately to prevent data loss
      this.storage.setItem(STORAGE_KEY, legacyData.folders);
      return legacyData.folders;
    }
    
    return [];
  }
}
