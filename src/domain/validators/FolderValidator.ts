import { FolderEntity } from '@domain/entities/Folder';

export class FolderValidator {
  
  public static validateNoCyclicDependency(
    targetFolder: FolderEntity,
    newParentId: string | null,
    allFolders: FolderEntity[]
  ): void {
    if (newParentId === null) {
      return; 
    }

    if (targetFolder.id === newParentId) {
      throw new Error('Cyclic Dependency: A folder cannot be its own parent.');
    }

    let currentParentId: string | null = newParentId;
    
    while (currentParentId !== null) {
      if (currentParentId === targetFolder.id) {
        throw new Error('Cyclic Dependency: Cannot move a folder into its own subfolder.');
      }
      
      const parentFolder = allFolders.find(f => f.id === currentParentId);
      if (!parentFolder) {
        break; 
      }
      
      currentParentId = parentFolder.parentId;
    }
  }
}
