import { LocalStorageAdapter } from '@infrastructure/storage/LocalStorageAdapter';
import { Document as IDocument, DocumentFolder } from '@shared/types';

const V2_MIGRATION_KEY = 'draftly_v2_migrated';
const DOCS_KEY = 'notes_documents';
const FOLDERS_KEY = 'notes_folders';

export class MigrationRunner {
  
  public static migrateV1toV2(): void {
    if (typeof window === 'undefined') return;

    const storage = new LocalStorageAdapter();
    const isMigrated = storage.getItem<boolean>(V2_MIGRATION_KEY);
    if (isMigrated) {
      return;
    }

    try {
      console.log('Starting Draftly v1 to v2 data migration...');
      const now = Date.now();

      const folders = storage.getItem<any[]>(FOLDERS_KEY) || [];
      const migratedFolders: DocumentFolder[] = folders.map(folder => ({
        id: folder.id,
        name: folder.name || 'Untitled Folder',
        color: folder.color || '#7c8cff', 
        parentId: folder.parentId || null,
        sortOrder: typeof folder.sortOrder === 'number' ? folder.sortOrder : 0,
        createdAt: folder.createdAt || now,
        updatedAt: folder.updatedAt || now
      }));

      const docs = storage.getItem<any[]>(DOCS_KEY) || [];
      const migratedDocs: IDocument[] = docs.map(doc => ({
        id: doc.id,
        title: doc.title || 'Untitled',
        content: doc.content || '',
        folderId: doc.folderId || null,
        sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : 0,
        createdAt: doc.createdAt || now,
        updatedAt: doc.updatedAt || now
      }));

      storage.setItem(FOLDERS_KEY, migratedFolders);
      storage.setItem(DOCS_KEY, migratedDocs);

      storage.setItem(V2_MIGRATION_KEY, true);
      console.log('Migration to v2 completed successfully.');
      
    } catch (error) {
      console.error('Failed to migrate data to v2:', error);

    }
  }
}
