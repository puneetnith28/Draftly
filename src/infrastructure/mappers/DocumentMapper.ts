import { DocumentEntity } from '@domain/entities/Document';
import { Document as IDocument } from '@shared/types';

export class DocumentMapper {
  
  public static toDomain(raw: IDocument): DocumentEntity {
    return DocumentEntity.reconstitute(raw);
  }

  public static toPersistence(entity: DocumentEntity): IDocument {
    return {
      id: entity.id,
      title: entity.title,
      content: entity.content,
      folderId: entity.folderId,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
}
