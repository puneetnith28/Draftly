import { DocumentEntity } from '../entities/Document';

export interface ISearchIndexer {
  indexDocument(document: DocumentEntity): Promise<void>;
  removeDocument(documentId: string): Promise<void>;
}
