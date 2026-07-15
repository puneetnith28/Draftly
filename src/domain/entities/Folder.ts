import { DocumentFolder } from '@shared/types';
import { generateId } from '@shared/utils/idGenerator';

export class FolderEntity implements DocumentFolder {
  public id: string;
  public name: string;
  public color: string;
  public parentId: string | null;
  public sortOrder: number;
  public createdAt: number;
  public updatedAt: number;

  private constructor(data: DocumentFolder) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this.parentId = data.parentId;
    this.sortOrder = data.sortOrder;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public static create(data: Partial<Omit<DocumentFolder, 'id' | 'createdAt' | 'updatedAt'>>): FolderEntity {
    const now = Date.now();
    return new FolderEntity({
      id: generateId('folder'),
      name: data.name || 'New Folder',
      color: data.color || '#7c8cff',
      parentId: data.parentId || null,
      sortOrder: data.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(data: DocumentFolder): FolderEntity {
    return new FolderEntity(data);
  }

  public rename(newName: string): void {
    if (newName.trim().length === 0) {
      throw new Error('Folder name cannot be empty.');
    }
    this.name = newName;
    this.updatedAt = Date.now();
  }

  public changeColor(newColor: string): void {
    this.color = newColor;
    this.updatedAt = Date.now();
  }

  public moveToParent(parentId: string | null): void {
    if (this.id === parentId) {
      throw new Error('Folder cannot be moved inside itself.');
    }
    this.parentId = parentId;
    this.updatedAt = Date.now();
  }
}
