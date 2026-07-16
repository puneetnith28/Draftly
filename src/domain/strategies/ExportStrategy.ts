import { DocumentEntity } from '../entities/Document';

export interface ExportStrategy {
  export(document: DocumentEntity): Promise<Blob>;
}
