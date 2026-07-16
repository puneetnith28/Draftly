import { InsertBlockCommand } from '../InsertBlockCommand';
import { DeleteBlockCommand } from '../DeleteBlockCommand';
import { BlockFactory } from '../../factories/BlockFactory';
import { IEditorReceiver } from '../IEditorReceiver';

describe('BlockCommands', () => {
  let receiver: jest.Mocked<IEditorReceiver>;
  const mockBlock = BlockFactory.createNew('p', 'Test block');

  beforeEach(() => {
    receiver = {
      insertBlock: jest.fn(),
      deleteBlock: jest.fn(),
      updateBlock: jest.fn(),
      moveBlock: jest.fn(),
    } as any;
  });

  describe('InsertBlockCommand', () => {
    it('should execute insertBlock on the receiver', () => {
      const command = new InsertBlockCommand(receiver, 0, mockBlock);
      command.execute();
      expect(receiver.insertBlock).toHaveBeenCalledWith(0, mockBlock);
    });

    it('should undo by deleting the block', () => {
      const command = new InsertBlockCommand(receiver, 0, mockBlock);
      command.undo();
      expect(receiver.deleteBlock).toHaveBeenCalledWith(mockBlock.id);
    });

    it('should redo by inserting the block again', () => {
      const command = new InsertBlockCommand(receiver, 0, mockBlock);
      command.redo();
      expect(receiver.insertBlock).toHaveBeenCalledWith(0, mockBlock);
    });
  });

  describe('DeleteBlockCommand', () => {
    it('should execute deleteBlock on the receiver', () => {
      const command = new DeleteBlockCommand(receiver, 0, mockBlock);
      command.execute();
      expect(receiver.deleteBlock).toHaveBeenCalledWith(mockBlock.id);
    });

    it('should undo by inserting the block back', () => {
      const command = new DeleteBlockCommand(receiver, 0, mockBlock);
      command.undo();
      expect(receiver.insertBlock).toHaveBeenCalledWith(0, mockBlock);
    });

    it('should redo by deleting the block again', () => {
      const command = new DeleteBlockCommand(receiver, 0, mockBlock);
      command.redo();
      expect(receiver.deleteBlock).toHaveBeenCalledWith(mockBlock.id);
    });
  });
});
