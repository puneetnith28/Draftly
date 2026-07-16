import { IEventBus } from '../../domain/events/IEventBus';
import { DocumentRepository } from '../../domain/repositories/DocumentRepository';
import { DocumentEntity } from '../../domain/entities/Document';

export class AutoSaveObserver {
  constructor(
    private eventBus: IEventBus,
    private documentRepository: DocumentRepository
  ) {}

  public startListening(): void {
    this.eventBus.subscribe('DOCUMENT_CHANGED', this.handleDocumentChanged.bind(this));
  }

  public stopListening(): void {
    this.eventBus.unsubscribe('DOCUMENT_CHANGED', this.handleDocumentChanged.bind(this));
  }

  private async handleDocumentChanged(payload: any): Promise<void> {
    if (payload && payload.document instanceof DocumentEntity) {
      try {
        await this.documentRepository.save(payload.document);
        this.eventBus.publish('DOCUMENT_SAVED', { id: payload.document.id, timestamp: Date.now() });
      } catch (error) {
        console.error('AutoSave failed:', error);
      }
    }
  }
}
