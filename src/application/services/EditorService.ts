import { ParsedBlock } from '@shared/types';
import { IEditorReceiver } from '@domain/commands/IEditorReceiver';
import { HistoryManager } from './HistoryManager';
import { InsertBlockCommand } from '@domain/commands/InsertBlockCommand';
import { DeleteBlockCommand } from '@domain/commands/DeleteBlockCommand';
import { UpdateBlockCommand } from '@domain/commands/UpdateBlockCommand';
import { MoveBlockCommand } from '@domain/commands/MoveBlockCommand';
import { IEventBus } from '@domain/events/IEventBus';
import { blocksToMarkdown, parseMarkdownToBlocks } from '@/lib/markdownTransform';
import { DocumentEntity } from '@domain/entities/Document';

export class EditorService implements IEditorReceiver {
  private blocks: ParsedBlock[] = [];
  private activeDocument: DocumentEntity | null = null;
  private historyManager = HistoryManager.getInstance();

  constructor(private eventBus: IEventBus) {}

  public loadDocument(document: DocumentEntity): void {
    this.activeDocument = document;
    this.blocks = parseMarkdownToBlocks(document.content);
    this.historyManager.clear();
    this.eventBus.publish('EDITOR_LOADED', { documentId: document.id });
  }

  public getBlocks(): ParsedBlock[] {
    return this.blocks;
  }

  public executeInsertBlock(index: number, block: ParsedBlock): void {
    const cmd = new InsertBlockCommand(this, index, block);
    this.historyManager.execute(cmd);
  }

  public executeDeleteBlock(index: number, block: ParsedBlock): void {
    const cmd = new DeleteBlockCommand(this, index, block);
    this.historyManager.execute(cmd);
  }

  public executeUpdateBlock(id: string, oldText: string, newText: string): void {
    const cmd = new UpdateBlockCommand(this, id, oldText, newText);
    this.historyManager.execute(cmd);
  }

  public executeMoveBlock(id: string, oldIndex: number, newIndex: number): void {
    const cmd = new MoveBlockCommand(this, id, oldIndex, newIndex);
    this.historyManager.execute(cmd);
  }

  public undo(): void {
    this.historyManager.undo();
  }

  public redo(): void {
    this.historyManager.redo();
  }

  public insertBlock(index: number, block: ParsedBlock): void {
    this.blocks.splice(index, 0, block);
    this.notifyStateChanged();
  }

  public deleteBlock(id: string): void {
    this.blocks = this.blocks.filter((b) => b.id !== id);
    this.notifyStateChanged();
  }

  public updateBlock(id: string, newText: string): void {
    const block = this.blocks.find((b) => b.id === id);
    if (block) {
      block.text = newText;
      this.notifyStateChanged();
    }
  }

  public moveBlock(id: string, newIndex: number): void {
    const oldIndex = this.blocks.findIndex((b) => b.id === id);
    if (oldIndex !== -1) {
      const [block] = this.blocks.splice(oldIndex, 1);
      this.blocks.splice(newIndex, 0, block);
      this.notifyStateChanged();
    }
  }

  private notifyStateChanged(): void {
    if (this.activeDocument) {
      this.activeDocument.updateContent(blocksToMarkdown(this.blocks));
      this.eventBus.publish('DOCUMENT_CHANGED', { document: this.activeDocument });
      this.eventBus.publish('EDITOR_STATE_CHANGED', { blocks: [...this.blocks] });
    }
  }
}
