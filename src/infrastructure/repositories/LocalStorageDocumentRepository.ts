import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { DocumentEntity } from '@domain/entities/Document';
import { DocumentMapper } from '@infrastructure/mappers/DocumentMapper';
import { StorageAdapter } from '@infrastructure/storage/StorageAdapter';
import { Document as IDocument } from '@shared/types';

const STORAGE_KEY = 'notes_documents';

export class LocalStorageDocumentRepository implements DocumentRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  public async findById(id: string): Promise<DocumentEntity | null> {
    const documents = this.getAllRaw();
    const doc = documents.find(d => d.id === id);
    if (!doc) return null;
    return DocumentMapper.toDomain(doc);
  }

  public async findAll(): Promise<DocumentEntity[]> {
    const documents = this.getAllRaw();
    return documents.map(doc => DocumentMapper.toDomain(doc));
  }

  public async save(document: DocumentEntity): Promise<void> {
    const documents = this.getAllRaw();
    const index = documents.findIndex(d => d.id === document.id);
    
    const docData = DocumentMapper.toPersistence(document);

    if (index >= 0) {
      documents[index] = docData;
    } else {
      documents.push(docData);
    }
    
    this.storage.setItem(STORAGE_KEY, documents);
  }

  public async delete(id: string): Promise<void> {
    let documents = this.getAllRaw();
    documents = documents.filter(d => d.id !== id);
    this.storage.setItem(STORAGE_KEY, documents);
  }

  private getAllRaw(): IDocument[] {
    const data = this.storage.getItem<any>(STORAGE_KEY);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    
    // Legacy format support: { documents: [...], folders: [...] }
    if (data.documents && Array.isArray(data.documents)) {
      // Safely migrate folders if they exist to the new key to prevent data loss
      if (data.folders && Array.isArray(data.folders)) {
         const existingFolders = this.storage.getItem<any>('notes_folders');
         if (!existingFolders) {
            this.storage.setItem('notes_folders', data.folders);
         }
      }
      
      // Migrate documents to be an array natively
      this.storage.setItem(STORAGE_KEY, data.documents);
      
      return data.documents;
    }
    return [];
  }
}
