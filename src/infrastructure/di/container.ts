import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { FolderRepository } from '@domain/repositories/FolderRepository';
import { LocalStorageDocumentRepository } from '@infrastructure/repositories/LocalStorageDocumentRepository';
import { LocalStorageFolderRepository } from '@infrastructure/repositories/LocalStorageFolderRepository';
import { LocalStorageAdapter } from '@infrastructure/storage/LocalStorageAdapter';

export interface DIContainer {
  documentRepository: DocumentRepository;
  folderRepository: FolderRepository;
}

class Container implements DIContainer {
  public documentRepository: DocumentRepository;
  public folderRepository: FolderRepository;

  constructor() {

    const storageAdapter = new LocalStorageAdapter();
    this.documentRepository = new LocalStorageDocumentRepository(storageAdapter);
    this.folderRepository = new LocalStorageFolderRepository(storageAdapter);
  }
}

export const diContainer = new Container();
