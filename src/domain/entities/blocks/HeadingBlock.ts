import { BlockEntity } from '../Block';
import { ParsedBlock, BlockType } from '@shared/types';

export class HeadingBlock extends BlockEntity {
  constructor(data: ParsedBlock) {
    super(data);
  }

  public serialize(): string {
    const level = parseInt(this.type.charAt(1), 10) || 1;
    const hashes = '#'.repeat(level);
    return `${hashes} ${this.text}\n`;
  }

  public static create(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1): HeadingBlock {
    const type = `h${level}` as BlockType;
    const data = BlockEntity.createBasePayload(type, text);
    return new HeadingBlock(data);
  }
}
