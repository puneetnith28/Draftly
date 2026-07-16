import { ParsedBlock } from '@shared/types';

export interface IEditorReceiver {
  insertBlock(index: number, block: ParsedBlock): void;
  deleteBlock(id: string): void;
  updateBlock(id: string, newText: string): void;
  moveBlock(id: string, newIndex: number): void;
}
