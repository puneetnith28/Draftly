import { FolderEntity } from '../../domain/entities/Folder';
import { FolderRepository } from '../../domain/repositories/FolderRepository';
import { IEventBus } from '../../domain/events/IEventBus';
import { generateId } from '../../shared/utils/idGenerator';

export class FolderService {
  constructor(
    private repository: FolderRepository,
    private eventBus: IEventBus
  ) {}

  public async createFolder(name: string, color: string, parentId: string | null = null): Promise<FolderEntity> {
    const folder = FolderEntity.create({
      name,
      color,
      parentId,
    });

    await this.repository.save(folder);
    this.eventBus.publish('FOLDER_CREATED', { folder });
    return folder;
  }

  public async getFolder(id: string): Promise<FolderEntity | null> {
    return this.repository.findById(id);
  }

  public async getAllFolders(): Promise<FolderEntity[]> {
    return this.repository.findAll();
  }

  public async updateFolder(folder: FolderEntity): Promise<void> {
    folder.updatedAt = Date.now();
    await this.repository.save(folder);
    this.eventBus.publish('FOLDER_UPDATED', { folder });
  }

  public async deleteFolder(id: string): Promise<void> {
    await this.repository.delete(id);
    this.eventBus.publish('FOLDER_DELETED', { id });
  }
}
