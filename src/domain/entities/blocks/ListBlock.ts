import { BlockEntity } from '../Block';
import { ParsedBlock } from '@shared/types';

export class ListBlock extends BlockEntity {
  constructor(data: ParsedBlock) {
    super(data);
  }

  public serialize(): string {
    return this.type === 'ul' ? `- ${this.text}\n` : `1. ${this.text}\n`;
  }

  public static create(text: string, type: 'ul' | 'ol' = 'ul'): ListBlock {
    const data = BlockEntity.createBasePayload(type, text);
    return new ListBlock(data);
  }
}
