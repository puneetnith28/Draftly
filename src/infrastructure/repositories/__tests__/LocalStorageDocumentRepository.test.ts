import { LocalStorageDocumentRepository } from '../LocalStorageDocumentRepository';
import { StorageAdapter } from '../../storage/StorageAdapter';
import { DocumentEntity } from '../../../domain/entities/Document';
import { DocumentMapper } from '../../mappers/DocumentMapper';

describe('LocalStorageDocumentRepository', () => {
  let repository: LocalStorageDocumentRepository;
  let mockStorage: jest.Mocked<StorageAdapter>;

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    repository = new LocalStorageDocumentRepository(mockStorage);
  });

  describe('findAll', () => {
    it('should return an empty array if storage is empty', async () => {
      mockStorage.getItem.mockReturnValue(null);
      const docs = await repository.findAll();
      expect(docs).toEqual([]);
    });

    it('should properly map valid stored data to DocumentEntities', async () => {
      const mockData = [{
        id: 'doc-1',
        title: 'Test',
        content: '',
        folderId: null,
        sortOrder: 0,
        createdAt: 1000,
        updatedAt: 1000
      }];
      mockStorage.getItem.mockReturnValue(mockData as any);

      const docs = await repository.findAll();
      expect(docs.length).toBe(1);
      expect(docs[0]).toBeInstanceOf(DocumentEntity);
      expect(docs[0].title).toBe('Test');
    });
  });

  describe('save', () => {
    it('should serialize and save a DocumentEntity', async () => {
      mockStorage.getItem.mockReturnValue([]);
      const doc = DocumentEntity.create({ title: 'New Doc' });
      doc.updateTitle('New Doc');
      
      await repository.save(doc);
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'notes_documents',
        expect.arrayContaining([
          expect.objectContaining({ title: 'New Doc' })
        ])
      );
    });
  });

  describe('delete', () => {
    it('should remove the document from storage array', async () => {
      const mockData = [{ id: 'doc-1' }, { id: 'doc-2' }];
      mockStorage.getItem.mockReturnValue(mockData as any);
      
      await repository.delete('doc-1');
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'notes_documents',
        expect.not.arrayContaining([
          expect.objectContaining({ id: 'doc-1' })
        ])
      );
    });
  });
});
