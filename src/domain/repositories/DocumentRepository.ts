import { DocumentEntity } from '@domain/entities/Document';

export interface DocumentRepository {
  
  findById(id: string): Promise<DocumentEntity | null>;

  findAll(): Promise<DocumentEntity[]>;

  save(document: DocumentEntity): Promise<void>;

  delete(id: string): Promise<void>;
}
