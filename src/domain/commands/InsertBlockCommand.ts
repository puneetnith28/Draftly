import { ICommand } from './ICommand';
import { IEditorReceiver } from './IEditorReceiver';
import { ParsedBlock } from '@shared/types';

export class InsertBlockCommand implements ICommand {
  constructor(
    private receiver: IEditorReceiver,
    private index: number,
    private block: ParsedBlock
  ) {}

  public execute(): void {
    this.receiver.insertBlock(this.index, this.block);
  }

  public undo(): void {
    this.receiver.deleteBlock(this.block.id);
  }

  public redo(): void {
    this.execute();
  }
}
