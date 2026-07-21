import { DocumentEntity } from '@domain/entities/Document';
import { Document as IDocument } from '@shared/types';

export class DocumentMapper {
  
  public static toDomain(raw: any): DocumentEntity {
    return DocumentEntity.reconstitute({
      id: raw.id,
      title: raw.title,
      folderId: raw.folder_id,
      createdAt: new Date(raw.created_at).getTime(),
      updatedAt: new Date(raw.updated_at).getTime(),
      content: (raw.blocks && raw.blocks[0] && raw.blocks[0].raw) ? raw.blocks[0].raw : '',
      sortOrder: raw.sortOrder || 0, // Fallback if missing
    });
  }

  public static toPersistence(entity: DocumentEntity, userId: string): any {
    return {
      id: entity.id,
      title: entity.title,
      folder_id: entity.folderId,
      user_id: userId,
      blocks: [{ raw: entity.content }],
      created_at: new Date(entity.createdAt).toISOString(),
      updated_at: new Date(entity.updatedAt).toISOString()
    };
  }
}
