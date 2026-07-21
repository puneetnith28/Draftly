import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { FolderRepository } from '@domain/repositories/FolderRepository';
import { LocalStorageDocumentRepository } from '@infrastructure/repositories/LocalStorageDocumentRepository';
import { LocalStorageFolderRepository } from '@infrastructure/repositories/LocalStorageFolderRepository';
import { LocalStorageAdapter } from '@infrastructure/storage/LocalStorageAdapter';

import { GlobalEventBus } from '@application/events/GlobalEventBus';
import { DocumentService } from '@application/services/DocumentService';
import { FolderService } from '@application/services/FolderService';
import { EditorService } from '@application/services/EditorService';
import { SearchService } from '@application/services/SearchService';
import { PreferenceService } from '@application/services/PreferenceService';
import { ExportService } from '@application/services/ExportService';
import { DraftlyEngine } from '@application/facades/DraftlyEngine';
import { AutoSaveObserver } from '@application/observers/AutoSaveObserver';
import { SearchIndexerObserver } from '@application/observers/SearchIndexerObserver';
import { PluginManager } from '../../lib/plugins/PluginManager';
import { KanbanPlugin } from '../../plugins/kanban/KanbanPlugin';

export interface DIContainer {
  documentRepository: DocumentRepository;
  folderRepository: FolderRepository;
  engine: DraftlyEngine;
}

class Container implements DIContainer {
  public documentRepository: DocumentRepository;
  public folderRepository: FolderRepository;
  public engine: DraftlyEngine;

  constructor() {
    const storageAdapter = new LocalStorageAdapter();
    this.documentRepository = new LocalStorageDocumentRepository(storageAdapter);
    this.folderRepository = new LocalStorageFolderRepository(storageAdapter);

    const eventBus = GlobalEventBus.getInstance();

    const documentService = new DocumentService(this.documentRepository, eventBus);
    const folderService = new FolderService(this.folderRepository, eventBus);
    const editorService = new EditorService(eventBus);
    const searchService = new SearchService();
    
    PreferenceService.initialize(storageAdapter, eventBus);
    const preferenceService = PreferenceService.getInstance();
    
    const exportService = new ExportService();

    this.engine = new DraftlyEngine(
      documentService,
      folderService,
      editorService,
      searchService,
      preferenceService,
      exportService,
      eventBus
    );

    const autoSaveObserver = new AutoSaveObserver(eventBus, this.documentRepository);
    autoSaveObserver.startListening();

    const searchIndexerObserver = new SearchIndexerObserver(eventBus, searchService);
    searchIndexerObserver.startListening();

    // Initialize plugins
    PluginManager.registerPlugin(new KanbanPlugin());

    // Fire initial initialization
    this.engine.initialize();
  }
}

export const diContainer = new Container();
export const engine = diContainer.engine;
