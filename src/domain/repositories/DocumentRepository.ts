import { DocumentEntity } from '@domain/entities/Document';

export interface DocumentRepository {
  /**
   * Retrieves a document by its unique identifier.
   */
  findById(id: string): Promise<DocumentEntity | null>;

  /**
   * Retrieves all documents.
   */
  findAll(): Promise<DocumentEntity[]>;

  /**
   * Persists a document to the storage mechanism.
   * If the document already exists, it updates it.
   */
  save(document: DocumentEntity): Promise<void>;

  /**
   * Removes a document from the storage mechanism.
   */
  delete(id: string): Promise<void>;
}
