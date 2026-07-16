import { BlockEntity } from '../Block';
import { ParsedBlock } from '@shared/types';

export class ParagraphBlock extends BlockEntity {
  constructor(data: ParsedBlock) {
    super(data);
  }

  public serialize(): string {
    return `${this.text}\n`;
  }

  public static create(text: string): ParagraphBlock {
    const data = BlockEntity.createBasePayload('p', text);
    return new ParagraphBlock(data);
  }
}
