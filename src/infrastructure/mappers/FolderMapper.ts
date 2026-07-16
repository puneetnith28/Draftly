import { FolderEntity } from '@domain/entities/Folder';
import { DocumentFolder } from '@shared/types';

export class FolderMapper {
  
  public static toDomain(raw: DocumentFolder): FolderEntity {
    return FolderEntity.reconstitute(raw);
  }

  public static toPersistence(entity: FolderEntity): DocumentFolder {
    return {
      id: entity.id,
      name: entity.name,
      color: entity.color,
      parentId: entity.parentId,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
}
