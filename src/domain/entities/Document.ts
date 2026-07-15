import { Document as IDocument } from '@shared/types';
import { generateId } from '@shared/utils/idGenerator';

export class DocumentEntity implements IDocument {
  public id: string;
  public title: string;
  public content: string;
  public folderId: string | null;
  public sortOrder: number;
  public createdAt: number;
  public updatedAt: number;

  private constructor(data: IDocument) {
    this.id = data.id;
    this.title = data.title;
    this.content = data.content;
    this.folderId = data.folderId;
    this.sortOrder = data.sortOrder;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public static create(data: Partial<Omit<IDocument, 'id' | 'createdAt' | 'updatedAt'>>): DocumentEntity {
    const now = Date.now();
    return new DocumentEntity({
      id: generateId('doc'),
      title: data.title || 'Untitled',
      content: data.content || '',
      folderId: data.folderId || null,
      sortOrder: data.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(data: IDocument): DocumentEntity {
    return new DocumentEntity(data);
  }

  public updateTitle(newTitle: string): void {
    if (newTitle.trim().length === 0) {
      throw new Error('Document title cannot be empty.');
    }
    this.title = newTitle;
    this.updatedAt = Date.now();
  }

  public updateContent(newContent: string): void {
    this.content = newContent;
    this.updatedAt = Date.now();
  }

  public moveToFolder(folderId: string | null): void {
    if (this.id === folderId) {
      throw new Error('Document cannot be moved inside itself.');
    }
    this.folderId = folderId;
    this.updatedAt = Date.now();
  }
}
