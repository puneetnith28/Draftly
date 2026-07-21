import { FolderEntity } from '@domain/entities/Folder';
import { DocumentFolder } from '@shared/types';

export class FolderMapper {
  
  public static toDomain(raw: any): FolderEntity {
    return FolderEntity.reconstitute({
      id: raw.id,
      name: raw.name,
      parentId: raw.parent_id,
      createdAt: new Date(raw.created_at).getTime(),
      updatedAt: new Date(raw.updated_at).getTime(),
      color: raw.color || undefined,
      sortOrder: raw.sortOrder || 0
    });
  }

  public static toPersistence(entity: FolderEntity, userId: string): any {
    return {
      id: entity.id,
      name: entity.name,
      parent_id: entity.parentId,
      user_id: userId,
      created_at: new Date(entity.createdAt).toISOString(),
      updated_at: new Date(entity.updatedAt).toISOString()
    };
  }
}
