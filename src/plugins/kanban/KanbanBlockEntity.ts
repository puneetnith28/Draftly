import { BlockEntity } from '../../domain/entities/Block';
import { ParsedBlock } from '@shared/types';
import { generateId } from '../../shared/utils/idGenerator';

export interface KanbanBoardData {
  columns: {
    id: string;
    title: string;
    cards: { id: string; content: string }[];
  }[];
}

export class KanbanBlockEntity extends BlockEntity {
  public boardData: KanbanBoardData;

  constructor(data: ParsedBlock) {
    super(data);
    if (data.metadata?.boardData) {
      this.boardData = data.metadata.boardData;
    } else {
      this.boardData = {
        columns: [
          { id: 'col-1', title: 'To Do', cards: [{ id: 'card-1', content: 'New Task' }] },
          { id: 'col-2', title: 'In Progress', cards: [] },
          { id: 'col-3', title: 'Done', cards: [] }
        ]
      };
    }
  }

  public serialize(): string {
    let output = `## Kanban Board\n\n`;
    for (const col of this.boardData.columns) {
      output += `### ${col.title}\n`;
      for (const card of col.cards) {
        output += `- [ ] ${card.content}\n`;
      }
      output += '\n';
    }
    return output;
  }

  public toJSON(): ParsedBlock {
    return {
      id: this.id,
      type: this.type,
      text: this.text,
      raw: this.raw,
      language: this.language,
      metadata: { boardData: this.boardData }
    };
  }

  public static create(): KanbanBlockEntity {
    const data = BlockEntity.createBasePayload('kanban', '');
    return new KanbanBlockEntity(data);
  }
}
