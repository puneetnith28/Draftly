import { FolderEntity } from '@domain/entities/Folder';

export interface FolderRepository {
  
  findById(id: string): Promise<FolderEntity | null>;

  findAll(): Promise<FolderEntity[]>;

  save(folder: FolderEntity): Promise<void>;

  delete(id: string): Promise<void>;
}
