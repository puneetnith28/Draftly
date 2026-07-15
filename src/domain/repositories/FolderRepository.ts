import { FolderEntity } from '@domain/entities/Folder';

export interface FolderRepository {
  /**
   * Retrieves a folder by its unique identifier.
   */
  findById(id: string): Promise<FolderEntity | null>;

  /**
   * Retrieves all folders.
   */
  findAll(): Promise<FolderEntity[]>;

  /**
   * Persists a folder to the storage mechanism.
   * If the folder already exists, it updates it.
   */
  save(folder: FolderEntity): Promise<void>;

  /**
   * Removes a folder from the storage mechanism.
   */
  delete(id: string): Promise<void>;
}
