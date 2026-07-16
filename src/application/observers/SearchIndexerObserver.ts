import { IEventBus } from '../../domain/events/IEventBus';
import { DocumentEntity } from '../../domain/entities/Document';
import { ISearchIndexer } from '../../domain/services/ISearchIndexer';

export class SearchIndexerObserver {
  constructor(
    private eventBus: IEventBus,
    private searchIndexer: ISearchIndexer
  ) {}

  public startListening(): void {
    this.eventBus.subscribe('DOCUMENT_SAVED', this.handleDocumentSaved.bind(this));
    this.eventBus.subscribe('DOCUMENT_DELETED', this.handleDocumentDeleted.bind(this));
  }

  public stopListening(): void {
    this.eventBus.unsubscribe('DOCUMENT_SAVED', this.handleDocumentSaved.bind(this));
    this.eventBus.unsubscribe('DOCUMENT_DELETED', this.handleDocumentDeleted.bind(this));
  }

  private async handleDocumentSaved(payload: any): Promise<void> {
    if (payload && payload.document instanceof DocumentEntity) {
      try {
        await this.searchIndexer.indexDocument(payload.document);
      } catch (error) {
        console.error('Search Indexing failed for saved document:', error);
      }
    }
  }

  private async handleDocumentDeleted(payload: any): Promise<void> {
    if (payload && typeof payload.id === 'string') {
      try {
        await this.searchIndexer.removeDocument(payload.id);
      } catch (error) {
        console.error('Search Indexing failed for deleted document:', error);
      }
    }
  }
}
