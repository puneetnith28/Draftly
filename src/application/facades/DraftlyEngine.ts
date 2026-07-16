import { DocumentService } from '../services/DocumentService';
import { FolderService } from '../services/FolderService';
import { EditorService } from '../services/EditorService';
import { SearchService } from '../services/SearchService';
import { PreferenceService } from '../services/PreferenceService';
import { ExportService } from '../services/ExportService';
import { IEventBus } from '../../domain/events/IEventBus';

export class DraftlyEngine {
  constructor(
    public readonly documents: DocumentService,
    public readonly folders: FolderService,
    public readonly editor: EditorService,
    public readonly search: SearchService,
    public readonly preferences: PreferenceService,
    public readonly exports: ExportService,
    public readonly events: IEventBus
  ) {}

  public async initialize(): Promise<void> {
    this.events.publish('ENGINE_INITIALIZED', { timestamp: Date.now() });
  }
}
