import { ICommand } from './ICommand';
import { IEditorReceiver } from './IEditorReceiver';

export class MoveBlockCommand implements ICommand {
  constructor(
    private receiver: IEditorReceiver,
    private id: string,
    private oldIndex: number,
    private newIndex: number
  ) {}

  public execute(): void {
    this.receiver.moveBlock(this.id, this.newIndex);
  }

  public undo(): void {
    this.receiver.moveBlock(this.id, this.oldIndex);
  }

  public redo(): void {
    this.execute();
  }
}
