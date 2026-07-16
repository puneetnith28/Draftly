import { BlockEntity } from '../Block';
import { ParsedBlock } from '@shared/types';

export class QuoteBlock extends BlockEntity {
  constructor(data: ParsedBlock) {
    super(data);
  }

  public serialize(): string {
    return `> ${this.text}\n`;
  }

  public static create(text: string): QuoteBlock {
    const data = BlockEntity.createBasePayload('quote', text);
    return new QuoteBlock(data);
  }
}
