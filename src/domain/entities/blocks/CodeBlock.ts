import { BlockEntity } from '../Block';
import { ParsedBlock } from '@shared/types';

export class CodeBlock extends BlockEntity {
  constructor(data: ParsedBlock) {
    super(data);
  }

  public serialize(): string {
    const lang = this.language ? this.language : '';
    return `\`\`\`${lang}\n${this.text}\n\`\`\`\n`;
  }

  public static create(text: string, language?: string): CodeBlock {
    const data = BlockEntity.createBasePayload('code', text, language);
    return new CodeBlock(data);
  }
}
