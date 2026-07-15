import { FolderEntity } from '@domain/entities/Folder';

export class FolderValidator {
  /**
   * Validates if moving a folder to a new parent introduces a cyclic dependency.
   * (e.g., moving Folder A into Folder B, when Folder B is already inside Folder A).
   * 
   * @param targetFolder The folder being moved
   * @param newParentId The ID of the new parent folder
   * @param allFolders An array of all folders to trace the parent chain
   * @throws Error if a cycle is detected
   */
  public static validateNoCyclicDependency(
    targetFolder: FolderEntity,
    newParentId: string | null,
    allFolders: FolderEntity[]
  ): void {
    if (newParentId === null) {
      return; // Moving to root is always safe
    }

    if (targetFolder.id === newParentId) {
      throw new Error('Cyclic Dependency: A folder cannot be its own parent.');
    }

    // Trace up the parent chain of the new parent to see if it eventually hits the target folder
    let currentParentId: string | null = newParentId;
    
    while (currentParentId !== null) {
      if (currentParentId === targetFolder.id) {
        throw new Error('Cyclic Dependency: Cannot move a folder into its own subfolder.');
      }
      
      const parentFolder = allFolders.find(f => f.id === currentParentId);
      if (!parentFolder) {
        break; // Reached an unknown parent (or root)
      }
      
      currentParentId = parentFolder.parentId;
    }
  }
}
