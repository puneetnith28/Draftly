import { BlockEntity } from '../Block';
import { ParsedBlock } from '@shared/types';

export class DividerBlock extends BlockEntity {
  constructor(data: ParsedBlock) {
    super(data);
  }

  public serialize(): string {
    return `---\n`;
  }

  public static create(): DividerBlock {
    const data = BlockEntity.createBasePayload('hr', '');
    return new DividerBlock(data);
  }
}
