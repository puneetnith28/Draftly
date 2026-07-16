import { BlockEntity } from '../Block';
import { ParsedBlock } from '@shared/types';

export class TableBlock extends BlockEntity {
  constructor(data: ParsedBlock) {
    super(data);
  }

  public serialize(): string {
    return `${this.text}\n`;
  }

  public static create(text: string): TableBlock {
    const data = BlockEntity.createBasePayload('table', text);
    return new TableBlock(data);
  }
}
