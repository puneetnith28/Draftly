import { DocumentService } from '../DocumentService';
import { DocumentRepository } from '../../../domain/repositories/DocumentRepository';
import { IEventBus } from '../../../domain/events/IEventBus';
import { DocumentEntity } from '../../../domain/entities/Document';

describe('DocumentService', () => {
  let documentService: DocumentService;
  let mockRepository: jest.Mocked<DocumentRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    documentService = new DocumentService(mockRepository, mockEventBus);
  });

  describe('createDocument', () => {
    it('should create a new document and publish an event', async () => {
      const doc = await documentService.createDocument('Test Doc', null);
      
      expect(doc).toBeInstanceOf(DocumentEntity);
      expect(doc.title).toBe('Test Doc');
      expect(mockRepository.save).toHaveBeenCalledWith(doc);
      expect(mockEventBus.publish).toHaveBeenCalledWith('DOCUMENT_CREATED', { document: doc });
    });
  });

  describe('updateDocument', () => {
    it('should save the updated document and publish an event', async () => {
      const doc = DocumentEntity.create('Old Title', null);
      doc.updateTitle('New Title');
      
      await documentService.updateDocument(doc);
      
      expect(mockRepository.save).toHaveBeenCalledWith(doc);
      expect(mockEventBus.publish).toHaveBeenCalledWith('DOCUMENT_UPDATED', { document: doc });
    });
  });

  describe('deleteDocument', () => {
    it('should delete the document and publish an event', async () => {
      await documentService.deleteDocument('doc-123');
      
      expect(mockRepository.delete).toHaveBeenCalledWith('doc-123');
      expect(mockEventBus.publish).toHaveBeenCalledWith('DOCUMENT_DELETED', { id: 'doc-123' });
    });
  });
});
