import { ICommand } from './ICommand';
import { IEditorReceiver } from './IEditorReceiver';

export class UpdateBlockCommand implements ICommand {
  constructor(
    private receiver: IEditorReceiver,
    private id: string,
    private oldText: string,
    private newText: string
  ) {}

  public execute(): void {
    this.receiver.updateBlock(this.id, this.newText);
  }

  public undo(): void {
    this.receiver.updateBlock(this.id, this.oldText);
  }

  public redo(): void {
    this.execute();
  }
}
