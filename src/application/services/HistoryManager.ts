import { ICommand } from '../../domain/commands/ICommand';

export class HistoryManager {
  private static instance: HistoryManager;
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxHistory: number;

  private constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  public static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager();
    }
    return HistoryManager.instance;
  }

  public execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  public undo(): void {
    if (!this.canUndo()) return;
    
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  public redo(): void {
    if (!this.canRedo()) return;
    
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
