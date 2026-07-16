import { DocumentEntity } from '../../domain/entities/Document';
import { DocumentRepository } from '../../domain/repositories/DocumentRepository';
import { IEventBus } from '../../domain/events/IEventBus';
import { generateId } from '../../shared/utils/idGenerator';

export class DocumentService {
  constructor(
    private repository: DocumentRepository,
    private eventBus: IEventBus
  ) {}

  public async createDocument(title: string, folderId: string | null = null): Promise<DocumentEntity> {
    const document = DocumentEntity.create({
      title,
      folderId,
    });

    await this.repository.save(document);
    this.eventBus.publish('DOCUMENT_CREATED', { document });
    return document;
  }

  public async getDocument(id: string): Promise<DocumentEntity | null> {
    return this.repository.findById(id);
  }

  public async getAllDocuments(): Promise<DocumentEntity[]> {
    return this.repository.findAll();
  }

  public async updateDocument(document: DocumentEntity): Promise<void> {
    document.updatedAt = Date.now();
    await this.repository.save(document);
    this.eventBus.publish('DOCUMENT_UPDATED', { document });
  }

  public async deleteDocument(id: string): Promise<void> {
    await this.repository.delete(id);
    this.eventBus.publish('DOCUMENT_DELETED', { id });
  }
}
